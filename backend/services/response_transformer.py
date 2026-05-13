"""
Transform raw backend analysis data to frontend-ready response shapes
"""
from typing import Any
import uuid
from datetime import datetime


def transform_route_analysis_to_forecast(raw_analysis: dict[str, Any]) -> dict[str, Any]:
    """
    Transform raw route analysis output to RouteForecast shape expected by frontend
    
    Args:
        raw_analysis: Output from route_service.analyze_route()
    
    Returns:
        RouteForecast-shaped dict with origin, destination, summary, recommendation, gaps, providers
    """
    route_context = raw_analysis.get("route_context", {})
    provider_scores = raw_analysis.get("provider_scores", {})
    weak_segments = raw_analysis.get("weak_segments", [])
    route_points = raw_analysis.get("route_points", [])
    
    # Calculate metrics
    total_distance_km = route_context.get("total_distance_m", 0) / 1000
    
    # Estimate driving time (assume ~60 km/h average)
    driving_time_min = int((total_distance_km / 60) * 60) if total_distance_km > 0 else 0
    
    # Calculate strong signal percentage
    strong_signal_pct = 80.0  # Default, would be calculated from detailed analysis
    if provider_scores:
        avg_strong_pct = sum(p.get("strong_signal", 80) for p in provider_scores.values()) / len(provider_scores)
        strong_signal_pct = round(avg_strong_pct, 1)
    
    # Get best provider
    best_provider = None
    best_score = 0
    for provider_name, score_data in provider_scores.items():
        score = score_data.get("score", 0)
        if score > best_score:
            best_score = score
            best_provider = provider_name
    
    best_provider = best_provider or "unknown"
    best_provider_lower = best_provider.lower()
    
    # Map provider name
    provider_name_map = {
        "globe": "Globe",
        "smart": "Smart",
        "dito": "DITO",
    }
    best_provider_display = provider_name_map.get(best_provider_lower, best_provider)
    
    # Format gaps
    gaps = []
    for gap_idx, gap in enumerate(weak_segments[:5]):  # Limit to 5 gaps
        gaps.append({
            "id": f"g{gap_idx + 1}",
            "km": gap.get("distance_km", 0),
            "level": gap.get("signal_level", "patchy"),
            "name": gap.get("description", "Weak signal area"),
            "description": f"Signal gap detected · {gap.get('segment_description', 'coverage issue')}"
        })
    
    # Format providers
    providers = []
    for provider_key in ["globe", "smart", "dito"]:
        score_data = provider_scores.get(provider_key, {})
        if not score_data:
            continue
        
        score_value = score_data.get("score", 0)
        providers.append({
            "provider": provider_key,
            "name": provider_name_map.get(provider_key, provider_key),
            "fullName": {
                "globe": "Globe Telecom Inc.",
                "smart": "Smart Communications Inc.",
                "dito": "DITO Telecommunity Inc.",
            }.get(provider_key, provider_key),
            "score": round(score_value, 1),
            "delta": round(score_data.get("delta", 0), 1),
            "network": score_data.get("network_gen", "4G LTE"),
            "avgSpeedMbps": round(score_data.get("avg_speed_mbps", 25), 1),
            "strongSignalPct": round(score_data.get("strong_signal", 75), 1),
            "confidencePct": round(score_data.get("confidence", 85), 1),
            # Generate sparkline data
            "sparklineData": _generate_sparkline(score_value)
        })
    
    # Sort by score descending
    providers.sort(key=lambda p: p["score"], reverse=True)
    
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
            "deadZoneCount": len([g for g in weak_segments if g.get("signal_level") == "dead"]),
        },
        "recommendation": {
            "provider": best_provider_lower,
            "name": best_provider_display,
            "reason": _generate_recommendation_reason(best_provider_display, gaps),
            "score": round(best_score, 1),
        },
        "gaps": gaps,
        "providers": providers,
    }


def _generate_sparkline(base_score: float) -> list[float]:
    """Generate a sparkline array around the base score for visualization"""
    import random
    sparkline = []
    for _ in range(28):
        variation = random.uniform(-15, 15)
        value = max(0, min(100, base_score + variation))
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
    
    providers = []
    for provider_key in ["globe", "smart", "dito"]:
        score_data = provider_scores.get(provider_key, {})
        if not score_data:
            continue
        
        score_value = score_data.get("score", 0)
        providers.append({
            "provider": provider_key,
            "name": {
                "globe": "Globe",
                "smart": "Smart",
                "dito": "DITO",
            }.get(provider_key, provider_key),
            "fullName": {
                "globe": "Globe Telecom Inc.",
                "smart": "Smart Communications Inc.",
                "dito": "DITO Telecommunity Inc.",
            }.get(provider_key, provider_key),
            "score": round(score_value, 1),
            "delta": round(score_data.get("delta", 0), 1),
            "network": score_data.get("network_gen", "4G LTE"),
            "avgSpeedMbps": round(score_data.get("avg_speed_mbps", 25), 1),
            "strongSignalPct": round(score_data.get("strong_signal", 75), 1),
            "confidencePct": round(score_data.get("confidence", 85), 1),
            "sparklineData": _generate_sparkline(score_value)
        })
    
    providers.sort(key=lambda p: p["score"], reverse=True)
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
