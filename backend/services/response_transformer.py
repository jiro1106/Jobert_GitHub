"""
Transform raw backend analysis data to frontend-ready response shapes
"""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime
from typing import Any


# Maps real provider keys (as stored in scoring_service) to frontend canonical form
_PROVIDER_KEY_MAP = {
    "Globe": "globe",
    "globe": "globe",
    "Smart": "smart",
    "smart": "smart",
    "DITO": "dito",
    "dito": "dito",
    "Dito": "dito",
}

_PROVIDER_DISPLAY = {
    "globe": "Globe",
    "smart": "Smart",
    "dito": "DITO",
}

_PROVIDER_FULL_NAME = {
    "globe": "Globe Telecom Inc.",
    "smart": "Smart Communications Inc.",
    "dito": "DITO Telecommunity Inc.",
}

_PROVIDER_NETWORK = {
    "globe": "5G",
    "smart": "4G LTE",
    "dito": "4G LTE",
}


def _km_from_point_order(route_points: list[dict[str, Any]], point_order: int) -> float:
    for index, point in enumerate(route_points, start=1):
        order = int(point.get("point_order", index))
        if order == point_order:
            return round(float(point.get("distance_from_origin_m", 0)) / 1000.0, 1)
    return 0.0


def transform_route_analysis_to_forecast(raw_analysis: dict[str, Any]) -> dict[str, Any]:
    """
    Transform raw route analysis output to RouteForecast shape expected by frontend.
    
    Handles capitalized provider keys (Globe, Smart, DITO) from scoring_service.
    """
    route_context = raw_analysis.get("route_context", {})
    provider_scores = raw_analysis.get("provider_scores", {})
    weak_segments = raw_analysis.get("weak_segments", [])
    route_points: list[dict[str, Any]] = raw_analysis.get("route_points", [])

    # Calculate metrics
    total_distance_km = route_context.get("total_distance_m", 0) / 1000

    # Driving time from distance (urban + highway blended ~55 km/h for ETA-style minutes)
    avg_speed_kmh = 55.0
    driving_time_min = (
        max(1, int(round(total_distance_km / avg_speed_kmh * 60))) if total_distance_km > 0 else 0
    )

    # Build normalized provider data (lowercase keys)
    normalized_providers: dict[str, dict[str, Any]] = {}
    for raw_key, score_data in provider_scores.items():
        canonical = _PROVIDER_KEY_MAP.get(raw_key, raw_key.lower())
        normalized_providers[canonical] = score_data

    # Best provider
    best_provider = "globe"
    best_score = -1.0
    for canonical, score_data in normalized_providers.items():
        score = float(score_data.get("score", 0))
        if score > best_score:
            best_score = score
            best_provider = canonical

    best_provider_display = _PROVIDER_DISPLAY.get(best_provider, best_provider.capitalize())

    # Strong signal pct — use coverage_rate_percent from best provider, averaged across all
    if normalized_providers:
        avg_coverage = sum(
            float(p.get("coverage_rate_percent", p.get("strong_signal", 80)))
            for p in normalized_providers.values()
        ) / len(normalized_providers)
        strong_signal_pct = round(avg_coverage, 1)
    else:
        strong_signal_pct = 80.0

    # ── Build frontend gap objects from merged patches ────────────────────────
    # weak_segments is already sorted by patch size (largest first) by scoring_service.
    # Each patch has: km_start, km_end, signal_score, reason, provider_name.
    gaps: list[dict[str, Any]] = []
    origin_name  = route_context.get("origin_name", "Origin")
    dest_name    = route_context.get("destination_name", "Destination")
    total_km     = max(total_distance_km, 1.0)

    for gap_idx, patch in enumerate(weak_segments):
        km_start = float(patch.get("km_start") or patch.get("distance_km") or 0.0)
        km_end   = float(patch.get("km_end")   or km_start + 1.0)
        # Ensure km_end > km_start by at least 0.05 km
        km_end   = max(km_end, km_start + 0.05)

        reason       = str(patch.get("reason", "") or "")
        signal_score = patch.get("signal_score")
        no_tower     = patch.get("provider_name") is None and "no nearby tower" in reason.lower()
        try:
            score_f = float(signal_score) if signal_score is not None else None
        except (TypeError, ValueError):
            score_f = None

        level = "dead" if (no_tower or (score_f is not None and score_f < 12.0)) else "patchy"

        # Position as fraction of total route (use midpoint of patch)
        pct = ((km_start + km_end) / 2.0) / total_km
        if pct < 0.15:
            area_name = f"Near {origin_name} departure stretch"
        elif pct < 0.40:
            area_name = f"Early segment — between {origin_name} and {dest_name}"
        elif pct < 0.60:
            area_name = f"Mid-route — between {origin_name} and {dest_name}"
        elif pct < 0.85:
            area_name = f"Approaching {dest_name}"
        else:
            area_name = f"Near {dest_name} arrival stretch"

        gap_size_km = round(km_end - km_start, 2)
        description = (
            f"{reason} "
            f"({'Dead zone' if level == 'dead' else 'Patchy signal'}, "
            f"{gap_size_km:.1f} km)"
        ).strip()

        gaps.append({
            "id":          f"g{gap_idx + 1}",
            "km":          round(km_start, 1),
            "km_end":      round(km_end, 1),
            "level":       level,
            "name":        area_name,
            "description": description,
        })


    # Format providers list in canonical display order
    providers = []
    for canonical in ["globe", "smart", "dito"]:
        score_data = normalized_providers.get(canonical)
        if not score_data:
            continue

        score_value = round(float(score_data.get("score", 0)), 1)
        coverage_pct = round(float(score_data.get("coverage_rate_percent", score_data.get("strong_signal", 75))), 1)

        # Estimate avg speed from coverage (no real speed data from towers alone)
        avg_speed = round(coverage_pct * 0.5, 1)  # rough proxy: 100% coverage ≈ 50 Mbps

        providers.append({
            "provider": canonical,
            "name": _PROVIDER_DISPLAY.get(canonical, canonical),
            "fullName": _PROVIDER_FULL_NAME.get(canonical, canonical),
            "score": score_value,
            "delta": 0.0,
            "network": score_data.get("network_gen", _PROVIDER_NETWORK.get(canonical, "4G LTE")),
            "avgSpeedMbps": avg_speed,
            "strongSignalPct": coverage_pct,
            "confidencePct": round(float(score_data.get("confidence", score_data.get("matched_rate_percent", 85))), 1),
            "sparklineData": _generate_sparkline(score_value, salt=canonical),
        })

    # Always return three providers so the frontend contract is stable
    present = {p["provider"] for p in providers}
    for canonical in ["globe", "smart", "dito"]:
        if canonical in present:
            continue
        providers.append({
            "provider": canonical,
            "name": _PROVIDER_DISPLAY.get(canonical, canonical),
            "fullName": _PROVIDER_FULL_NAME.get(canonical, canonical),
            "score": 20.0,
            "delta": 0.0,
            "network": _PROVIDER_NETWORK.get(canonical, "4G LTE"),
            "avgSpeedMbps": 10.0,
            "strongSignalPct": 20.0,
            "confidencePct": 40.0,
            "sparklineData": _generate_sparkline(20.0, salt=f"{canonical}-fallback"),
        })

    # Sort by score descending
    providers.sort(key=lambda p: p["score"], reverse=True)

    mean_score = (
        sum(p["score"] for p in providers) / len(providers) if providers else 0.0
    )
    for p in providers:
        p["delta"] = round(float(p["score"]) - mean_score, 1)

    if providers:
        top = max(providers, key=lambda p: p["score"])
        best_provider = str(top["provider"])
        best_provider_display = str(top["name"])
        best_score = float(top["score"])

    # Sort gaps: dead zones first, then by gap width (largest first); expose top 3
    gaps.sort(key=lambda g: (0 if g["level"] == "dead" else 1, -(g["km_end"] - g["km"])))
    top_gaps = gaps[:3]

    return {
        "origin": {
            "label": route_context.get("origin_name", "Origin"),
            "lat": route_context.get("origin_lat", 0),
            "lng": route_context.get("origin_lon", 0),
        },
        "destination": {
            "label": route_context.get("destination_name", "Destination"),
            "lat": route_context.get("destination_lat", 0),
            "lng": route_context.get("destination_lon", 0),
        },
        "summary": {
            "distanceKm": round(total_distance_km, 1),
            "drivingTimeMin": driving_time_min,
            "strongSignalPct": strong_signal_pct,
            "deadZoneCount": len([g for g in gaps if g.get("level") == "dead"]),
        },
        "recommendation": {
            "provider": best_provider,
            "name": best_provider_display,
            "reason": _generate_recommendation_reason(best_provider_display, gaps),
            "score": round(best_score, 1),
        },
        "gaps": top_gaps,
        "providers": providers,
    }


def _generate_sparkline(base_score: float, salt: str = "") -> list[float]:
    """Deterministic sparkline so the same route/provider always renders the same shape."""
    digest = hashlib.sha256(f"{salt}:{base_score:.4f}".encode()).digest()
    sparkline: list[float] = []
    for i in range(28):
        b = digest[i % len(digest)]
        variation = (b / 255.0 - 0.5) * 30.0
        value = max(0.0, min(100.0, base_score + variation))
        sparkline.append(round(value, 1))
    return sparkline


def _generate_recommendation_reason(provider_name: str, gaps: list[dict[str, Any]]) -> str:
    """Generate a human-readable recommendation reason"""
    if gaps:
        return f"{provider_name} leads coverage, but note weak signals in {len(gaps)} area(s)."
    return f"{provider_name} has the strongest signal coverage along this route."


def calculate_stats_aggregate() -> dict[str, Any]:
    """
    Calculate aggregate platform statistics
    This would query the database for real values, but returns hardcoded for now
    """
    # TODO: Implement real database queries for these stats
    return {
        "stats": [
            {
                "value": "81",
                "label": "Provinces",
                "sublabel": "with active coverage data"
            },
            {
                "value": "42K+",
                "label": "Daily reports",
                "sublabel": "from field & community"
            },
            {
                "value": "3",
                "label": "Major providers",
                "sublabel": "tracked nationwide"
            },
            {
                "value": "94%",
                "label": "Forecast accuracy",
                "sublabel": "vs. on-ground readings"
            },
        ]
    }


def get_provider_scores_for_route(raw_analysis: dict[str, Any]) -> dict[str, Any]:
    """Extract provider scores from route analysis"""
    provider_scores = raw_analysis.get("provider_scores", {})

    # Normalize keys to lowercase
    normalized: dict[str, Any] = {}
    for raw_key, score_data in provider_scores.items():
        canonical = _PROVIDER_KEY_MAP.get(raw_key, raw_key.lower())
        normalized[canonical] = score_data

    providers = []
    for canonical in ["globe", "smart", "dito"]:
        score_data = normalized.get(canonical)
        if not score_data:
            continue

        score_value = round(float(score_data.get("score", 0)), 1)
        coverage_pct = round(float(score_data.get("coverage_rate_percent", score_data.get("strong_signal", 75))), 1)
        avg_speed = round(coverage_pct * 0.5, 1)

        providers.append({
            "provider": canonical,
            "name": _PROVIDER_DISPLAY.get(canonical, canonical),
            "fullName": _PROVIDER_FULL_NAME.get(canonical, canonical),
            "score": score_value,
            "delta": 0.0,
            "network": score_data.get("network_gen", _PROVIDER_NETWORK.get(canonical, "4G LTE")),
            "avgSpeedMbps": avg_speed,
            "strongSignalPct": coverage_pct,
            "confidencePct": round(float(score_data.get("confidence", score_data.get("matched_rate_percent", 85))), 1),
            "sparklineData": _generate_sparkline(score_value, salt=canonical),
        })

    present = {p["provider"] for p in providers}
    for canonical in ["globe", "smart", "dito"]:
        if canonical in present:
            continue
        providers.append({
            "provider": canonical,
            "name": _PROVIDER_DISPLAY.get(canonical, canonical),
            "fullName": _PROVIDER_FULL_NAME.get(canonical, canonical),
            "score": 20.0,
            "delta": 0.0,
            "network": _PROVIDER_NETWORK.get(canonical, "4G LTE"),
            "avgSpeedMbps": 10.0,
            "strongSignalPct": 20.0,
            "confidencePct": 40.0,
            "sparklineData": _generate_sparkline(20.0, salt=f"{canonical}-fallback-scores"),
        })

    providers.sort(key=lambda p: p["score"], reverse=True)
    mean_score = sum(p["score"] for p in providers) / len(providers) if providers else 0.0
    for p in providers:
        p["delta"] = round(float(p["score"]) - mean_score, 1)
    return {"providers": providers}


def generate_chat_response(user_message: str, conversation_id: str = None) -> dict[str, Any]:
    """
    Generate a chat response from the AI agent
    This is a placeholder - would call the agent service in production
    """
    if conversation_id is None:
        conversation_id = str(uuid.uuid4())
    
    # Simple routing based on keywords
    message_lower = user_message.lower()
    
    if any(keyword in message_lower for keyword in ["best", "recommend", "coverage"]):
        response_text = "Globe typically has the most comprehensive 5G coverage nationwide, but Smart is competitive in many areas. DITO is expanding rapidly in Metro Manila and Cebu."
    elif any(keyword in message_lower for keyword in ["speed", "fast", "slow", "mbps"]):
        response_text = "Average speeds vary by location and network load. Globe 5G can reach 50+ Mbps, LTE typically 20-40 Mbps. Check your specific route for accurate predictions."
    elif any(keyword in message_lower for keyword in ["dead", "gap", "weak", "no signal"]):
        response_text = "Dead zones are common in rural areas and along certain routes. We map these from crowdsourced reports. Consider downloading offline maps for affected areas."
    else:
        response_text = "I can help you find the best provider for your route. Try asking about coverage recommendations, speed expectations, or dead zones along specific routes."
    
    return {
        "message": {
            "id": str(uuid.uuid4()),
            "role": "bot",
            "text": response_text,
            "citation": "Route Analysis Agent",
        },
        "conversation_id": conversation_id,
    }
