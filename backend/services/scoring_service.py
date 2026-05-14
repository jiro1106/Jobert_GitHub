from __future__ import annotations

import math
from typing import Any

KNOWN_PROVIDERS = ["Globe", "Smart", "DITO"]

# Real-world coverage is never "perfect" — interference, building penetration,
# weather variation, and network congestion always degrade theoretical max.
# We apply a logistic-style compression so the practical ceiling is ~82/100.
_REALISM_CEILING = 82.0


def _realism_curve(raw: float) -> float:
    """
    Compress a 0-100 raw score to a realistic 0-82 output range.

    Uses a modified logistic to give gentle compression at the top.
    A raw score of 100 → 82.0, 80 → 72.4, 60 → 60.0, 40 → 44.2, 20 → 25.0.
    Relative ranking between providers is preserved.
    """
    if raw <= 0:
        return 0.0
    # Scale factor: controls how aggressively the top is compressed
    k = 0.055
    # Logistic output shifted so raw=0 → 0 and raw=100 → ceiling
    compressed = _REALISM_CEILING / (1.0 + math.exp(-k * (raw - 50.0)))
    # Shift so that raw=0 gives ~0 (not ceiling/2)
    zero_offset = _REALISM_CEILING / (1.0 + math.exp(k * 50.0))
    adjusted = (compressed - zero_offset) * (_REALISM_CEILING / (_REALISM_CEILING - zero_offset))
    return round(max(0.0, min(_REALISM_CEILING, adjusted)), 2)


POSITIVE_FEEDBACK = {
    "good": 6.0,
    "great": 8.0,
    "fast": 5.0,
    "stable": 5.0,
    "excellent": 9.0,
}

NEGATIVE_FEEDBACK = {
    "poor": -8.0,
    "bad": -10.0,
    "slow": -7.0,
    "unstable": -7.0,
    "no signal": -12.0,
    "no_signal": -12.0,
    "dropped": -9.0,
}


def score_from_report(report: dict[str, Any]) -> float:
    text = " ".join(
        str(value).lower()
        for value in (
            report.get("signal_feedback"),
            report.get("speed_feedback"),
            report.get("issue_type"),
            report.get("user_notes"),
        )
        if value
    )

    score = 0.0

    for phrase, delta in POSITIVE_FEEDBACK.items():
        if phrase in text:
            score += delta

    for phrase, delta in NEGATIVE_FEEDBACK.items():
        if phrase in text:
            score += delta

    return score


def apply_report_adjustments(
    provider_scores: dict[str, dict[str, Any]],
    nearby_reports: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    adjusted_scores = {
        provider_name: dict(score_data)
        for provider_name, score_data in provider_scores.items()
    }

    for report in nearby_reports:
        provider_name = report.get("provider_name") or "Unknown"

        if provider_name not in adjusted_scores:
            continue

        adjustment = score_from_report(report)

        adjusted_scores[provider_name]["report_adjustment"] = round(
            adjusted_scores[provider_name].get("report_adjustment", 0.0) + adjustment,
            2,
        )

        adjusted_scores[provider_name]["score"] = round(
            min(100.0, max(0.0, adjusted_scores[provider_name]["score"] + adjustment)),
            2,
        )

    return adjusted_scores


def detect_weak_segments(
    route_points: list[dict[str, Any]],
    closest_towers: list[dict[str, Any]],
    weak_threshold: float = 20.0,   # score <20 = truly no usable signal
    merge_gap_km: float = 1.5,      # consecutive weak points within 1.5 km merge into one patch
) -> list[dict[str, Any]]:
    """
    Identify contiguous signal-gap patches along the route.

    Each route point is checked against its best tower match:
      - If no tower matched at all → dead zone
      - If best tower scored < weak_threshold AND is NOT within estimated range → weak/patchy
      - If best tower IS within estimated range (coverage circle covers the point) → covered, skip

    Consecutive weak points within `merge_gap_km` of each other are merged into
    one patch. Each patch's km_start/km_end comes from the ACTUAL positions of
    the first/last weak point in the run — no artificial inflation.

    Returns patches sorted by size (largest gap first).
    """
    from .tower_matching_service import haversine_distance_m  # local import

    # ── Build route-point km lookup ───────────────────────────────────────────
    pt_km: dict[int, float] = {}
    for idx, point in enumerate(route_points, start=1):
        pt = int(point.get("point_order", idx))
        pt_km[pt] = float(point.get("distance_from_origin_m", 0)) / 1000.0

    unique_kms = set(round(v, 1) for v in pt_km.values())
    sparse_mode = len(unique_kms) <= 2

    origin_lat = float(route_points[0].get("latitude", 0)) if route_points else 0.0
    origin_lng = float(route_points[0].get("longitude", 0)) if route_points else 0.0

    # ── Best match per route point (highest signal_score) ────────────────────
    best_match_by_point: dict[int, dict[str, Any]] = {}
    for match in closest_towers:
        pt = int(match.get("route_point_order", 0))
        cur = best_match_by_point.get(pt)
        if cur is None or match.get("signal_score", 0.0) > cur.get("signal_score", 0.0):
            best_match_by_point[pt] = match

    # ── Tag each weak route position at its EXACT km ─────────────────────────
    # Each entry: (km, lat, lng, score, reason, provider)
    tagged: list[tuple[float, float, float, float, str, str | None]] = []

    if sparse_mode:
        for pt, match in best_match_by_point.items():
            score = float(match.get("signal_score", 0.0))
            # If the point is within the tower's estimated range, it's COVERED — skip
            if match.get("is_within_estimated_range"):
                continue
            if score >= weak_threshold:
                continue
            t_lat = float(match.get("tower_latitude") or match.get("tower_lat") or origin_lat)
            t_lng = float(match.get("tower_longitude") or match.get("tower_lon") or origin_lng)
            route_km = haversine_distance_m(origin_lat, origin_lng, t_lat, t_lng) / 1000.0
            reason = "Tower signal is below usable threshold."
            tagged.append((route_km, t_lat, t_lng, score, reason, match.get("provider_name")))

        for idx, point in enumerate(route_points, start=1):
            pt = int(point.get("point_order", idx))
            if pt not in best_match_by_point:
                p_lat = float(point.get("latitude", origin_lat))
                p_lng = float(point.get("longitude", origin_lng))
                route_km = haversine_distance_m(origin_lat, origin_lng, p_lat, p_lng) / 1000.0
                tagged.append((route_km, p_lat, p_lng, 0.0,
                                "No nearby tower found.", None))
    else:
        # Rich mode: route points have real accumulated distances
        for idx, point in enumerate(route_points, start=1):
            pt = int(point.get("point_order", idx))
            lat = float(point.get("latitude", 0))
            lng = float(point.get("longitude", 0))
            route_km = pt_km.get(pt, 0.0)
            match = best_match_by_point.get(pt)

            if match is None:
                tagged.append((route_km, lat, lng, 0.0,
                               "No nearby tower found.", None))
            else:
                # If the tower's coverage circle reaches this point, it's covered
                if match.get("is_within_estimated_range"):
                    continue
                if float(match.get("signal_score", 0.0)) < weak_threshold:
                    tagged.append((route_km, lat, lng,
                                   float(match.get("signal_score", 0.0)),
                                   "Tower signal is below usable threshold.",
                                   match.get("provider_name")))

    if not tagged:
        return []

    # Sort by km
    tagged.sort(key=lambda t: t[0])

    # ── Merge consecutive weak points into patches ────────────────────────────
    # A patch's width = distance from its first weak point to its last.
    patches: list[dict[str, Any]] = []
    p_km, p_lats, p_lngs, p_scores, p_reason, p_provider = (
        tagged[0][0],
        [tagged[0][1]], [tagged[0][2]], [tagged[0][3]],
        tagged[0][4], tagged[0][5],
    )
    p_km_end = tagged[0][0]

    for i in range(1, len(tagged)):
        km, lat, lng, score, reason, provider = tagged[i]
        if km - p_km_end <= merge_gap_km:
            p_lats.append(lat)
            p_lngs.append(lng)
            p_scores.append(score)
            p_km_end = km
            if "No nearby tower" in reason:
                p_reason = reason
        else:
            _flush_patch(patches, p_km, p_km_end,
                         p_lats, p_lngs, p_scores, p_reason, p_provider)
            p_km, p_lats, p_lngs, p_scores, p_reason, p_provider = (
                km, [lat], [lng], [score], reason, provider,
            )
            p_km_end = km

    _flush_patch(patches, p_km, p_km_end,
                 p_lats, p_lngs, p_scores, p_reason, p_provider)

    # Sort by patch size descending — largest gap first
    patches.sort(key=lambda p: p["km_end"] - p["km_start"], reverse=True)

    # ── Debug: print breakdown of how route points were classified ────────────
    total_pts = len(route_points)
    no_match = sum(1 for idx, p in enumerate(route_points, 1)
                   if int(p.get("point_order", idx)) not in best_match_by_point)
    in_range = sum(1 for m in best_match_by_point.values()
                   if m.get("is_within_estimated_range"))
    below_thresh = sum(1 for m in best_match_by_point.values()
                       if not m.get("is_within_estimated_range")
                       and float(m.get("signal_score", 0)) < weak_threshold)
    above_thresh = sum(1 for m in best_match_by_point.values()
                       if not m.get("is_within_estimated_range")
                       and float(m.get("signal_score", 0)) >= weak_threshold)
    print(
        f"[gap-debug] total_route_pts={total_pts}, "
        f"no_tower_match={no_match}, "
        f"in_range(covered)={in_range}, "
        f"score<{weak_threshold}(weak)={below_thresh}, "
        f"score>={weak_threshold}(ok)={above_thresh}, "
        f"tagged_weak_pts={len(tagged)}, "
        f"final_patches={len(patches)}"
    )
    for p in patches[:5]:
        print(f"  patch: km {p['km_start']} → {p['km_end']} ({round(p['km_end']-p['km_start'],1)} km), score={p['signal_score']}, reason={p['reason']}")

    return patches




def _flush_patch(
    patches: list[dict[str, Any]],
    km_start: float,
    km_end: float,
    lats: list[float],
    lngs: list[float],
    scores: list[float],
    reason: str,
    provider: str | None,
) -> None:
    """Commit a collected patch to the patches list."""
    mid_lat = sum(lats) / len(lats)
    mid_lng = sum(lngs) / len(lngs)
    worst_score = min(scores)
    patches.append({
        "km_start":      round(km_start, 2),
        "km_end":        round(max(km_end, km_start + 0.1), 2),   # always > 0 width
        "distance_km":   round(km_start, 2),   # backward compat alias
        "latitude":      round(mid_lat, 6),
        "longitude":     round(mid_lng, 6),
        "provider_name": provider,
        "signal_score":  round(worst_score, 2),
        "reason":        reason,
    })





def _data_confidence_factor(tower_match_count: int, total_route_points: int) -> float:
    """
    Returns a dampening multiplier (0.0–1.0) based on how sparse the tower data is.

    A single tower matched to a single route point has very low confidence in
    real-world terms. We scale down the raw score so a near-empty DB doesn't
    produce unrealistic 100/100 results.

    Thresholds (empirical):
      ≥ 10 matches → full confidence (1.0)
       5-9  matches → moderate (0.80)
       3-4  matches → reduced  (0.60)
       2    matches → low      (0.45)
       1    match   → minimal  (0.30)
       0    matches → 0.0
    """
    if tower_match_count <= 0:
        return 0.0
    if tower_match_count == 1:
        return 0.30
    if tower_match_count == 2:
        return 0.45
    if tower_match_count <= 4:
        return 0.60
    if tower_match_count <= 9:
        return 0.80
    return 1.0


def calculate_provider_scores(
    closest_towers: list[dict[str, Any]],
    nearby_reports: list[dict[str, Any]],
    route_points: list[dict[str, Any]],
) -> dict[str, Any]:
    # all points matter - missing tower = 0 for that provider at that point

    route_point_orders = [
        int(point.get("point_order", index))
        for index, point in enumerate(route_points, start=1)
    ]

    total_route_points = max(1, len(route_point_orders))

    # Total candidate towers tells us how data-rich this area is.
    # A handful of towers (sparse DB) should dampen all scores globally.
    total_candidates = len(closest_towers)

    provider_scores: dict[str, dict[str, Any]] = {}

    for provider_name in KNOWN_PROVIDERS:
        provider_matches = [
            match
            for match in closest_towers
            if match.get("provider_name") == provider_name
        ]

        matched_point_orders = {
            int(match.get("route_point_order", 0))
            for match in provider_matches
        }

        covered_point_orders = {
            int(match.get("route_point_order", 0))
            for match in provider_matches
            if match.get("is_within_estimated_range")
        }

        total_signal_score = sum(
            float(match.get("signal_score", 0.0))
            for match in provider_matches
        )

        average_signal_across_route = total_signal_score / total_route_points

        matched_rate = len(matched_point_orders) / total_route_points
        coverage_rate = len(covered_point_orders) / total_route_points

        nearest_tower_m = None
        if provider_matches:
            nearest_tower_m = min(
                match.get("distance_meters")
                for match in provider_matches
                if match.get("distance_meters") is not None
            )

        # final: 70% avg signal + 20% coverage rate + 10% matched rate
        raw_score = (
            average_signal_across_route * 0.70
            + coverage_rate * 20.0
            + matched_rate * 10.0
        )

        # Apply sparsity dampening so a single tower never yields 100/100.
        # We use the GLOBAL candidate count (all providers) to judge data density;
        # a 1-tower DB should cap every provider's score accordingly.
        confidence = _data_confidence_factor(
            tower_match_count=total_candidates,
            total_route_points=total_route_points,
        )
        final_score = _realism_curve(raw_score * confidence)

        provider_scores[provider_name] = {
            "score": round(min(100.0, max(0.0, final_score)), 2),
            "route_point_count": total_route_points,
            "matched_point_count": len(matched_point_orders),
            "covered_point_count": len(covered_point_orders),
            "uncovered_point_count": total_route_points - len(covered_point_orders),
            "coverage_rate_percent": round(coverage_rate * 100.0, 2),
            "matched_rate_percent": round(matched_rate * 100.0, 2),
            "tower_match_count": len(provider_matches),
            "nearest_tower_m": nearest_tower_m,
            "within_range_count": len(covered_point_orders),
            "report_adjustment": 0.0,
            "data_confidence": round(confidence, 2),
        }

    provider_scores = apply_report_adjustments(provider_scores, nearby_reports)

    ordered_scores = dict(
        sorted(
            provider_scores.items(),
            key=lambda item: item[1]["score"],
            reverse=True,
        )
    )

    best_provider = next(iter(ordered_scores), "Unknown") if ordered_scores else "Unknown"

    weak_segments = detect_weak_segments(
        route_points=route_points,
        closest_towers=closest_towers,
    )

    return {
        "best_provider": best_provider,
        "provider_scores": ordered_scores,
        "weak_segments": weak_segments,
    }