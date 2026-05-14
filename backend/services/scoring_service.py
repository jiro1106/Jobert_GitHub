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
    weak_threshold: float = 20.0,   # score <20 = truly no usable signal (calibrated for 10km max_distance)
    merge_gap_km: float = 2.0,
) -> list[dict[str, Any]]:
    """
    Identify contiguous signal-gap patches along the route.

    Gap boundary logic (radius-aware):
      - A tower "covers" a stretch of the route from (tower_km - range_km) to
        (tower_km + range_km), where tower_km is the cumulative km of the matched
        route point and range_km = tower_range_meters / 1000.
      - A route point is in a dead zone if its best-match signal_score < 12
        OR no tower is matched at all.
      - A route point is patchy if its best-match signal_score is in [12, weak_threshold).
      - The dead/patchy gap starts at the km where the last covering tower's
        radius ENDS, and stops where the next covering tower's radius BEGINS.
        If range_meters is unknown, the boundary is the route-point km itself.

    Consecutive weak positions within merge_gap_km are merged into one patch.
    Patches are sorted by size (largest gap first).
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

    # ── Tag each weak route position with RADIUS-AWARE km boundaries ─────────
    # Each entry: (km_start_of_gap, km_end_of_gap, lat, lng, score, reason, provider)
    tagged: list[tuple[float, float, float, float, float, str, str | None]] = []

    def _tag_position(
        route_km: float,
        t_lat: float,
        t_lng: float,
        score: float,
        reason: str,
        provider: str | None,
        range_m: float | None,
    ) -> None:
        """
        Calculate the gap boundary around this weak point.
        If the tower has a known range, the gap boundary starts where the
        tower's coverage circle ENDS relative to the route direction:
          gap_start_km = route_km - (range_m / 1000)   ← trailing edge
          gap_end_km   = route_km + (range_m / 1000)   ← leading edge of next
        For no-tower situations (range unknown) we fall back to a small padding.
        """
        if range_m and range_m > 0:
            r_km = range_m / 1000.0
            # The route is not covered from (route_km - r_km) to (route_km + r_km)?
            # No — the gap is the MISSING coverage. The gap STARTS at the edge
            # where the previous tower's range ran out (route_km - r_km at best),
            # and ENDS at the edge where the next tower's range begins.
            # Since we only know this single weak point, use ±r_km as the gap span.
            gap_start = max(0.0, route_km - r_km)
            gap_end   = route_km + r_km
        else:
            # No range data — use route_km as the centre with ±0.5 km padding
            gap_start = max(0.0, route_km - 0.5)
            gap_end   = route_km + 0.5
        tagged.append((gap_start, gap_end, t_lat, t_lng, score, reason, provider))

    if sparse_mode:
        # Sparse: use tower's own lat/lng and range to compute position from origin
        for pt, match in best_match_by_point.items():
            score = float(match.get("signal_score", 0.0))
            if score >= weak_threshold:
                continue
            t_lat = float(match.get("tower_latitude") or match.get("tower_lat") or origin_lat)
            t_lng = float(match.get("tower_longitude") or match.get("tower_lon") or origin_lng)
            route_km = haversine_distance_m(origin_lat, origin_lng, t_lat, t_lng) / 1000.0
            range_m  = match.get("tower_range_meters")
            no_tower = match.get("provider_name") is None
            reason = (
                "No nearby tower — this stretch has no coverage."
                if no_tower
                else "Tower signal is below usable threshold at this location."
            )
            _tag_position(route_km, t_lat, t_lng, score, reason,
                          match.get("provider_name"), range_m)

        # Route points with NO match at all
        for idx, point in enumerate(route_points, start=1):
            pt = int(point.get("point_order", idx))
            if pt not in best_match_by_point:
                p_lat = float(point.get("latitude", origin_lat))
                p_lng = float(point.get("longitude", origin_lng))
                route_km = haversine_distance_m(origin_lat, origin_lng, p_lat, p_lng) / 1000.0
                _tag_position(route_km, p_lat, p_lng, 0.0,
                               "No nearby tower — this stretch has no coverage.",
                               None, None)
    else:
        # Rich mode: route points have real accumulated distances
        for idx, point in enumerate(route_points, start=1):
            pt = int(point.get("point_order", idx))
            lat = float(point.get("latitude", 0))
            lng = float(point.get("longitude", 0))
            route_km = pt_km.get(pt, 0.0)
            match = best_match_by_point.get(pt)

            if match is None:
                _tag_position(route_km, lat, lng, 0.0,
                               "No nearby tower — this stretch has no coverage.",
                               None, None)
            elif float(match.get("signal_score", 0.0)) < weak_threshold:
                _tag_position(
                    route_km, lat, lng,
                    float(match.get("signal_score", 0.0)),
                    "Tower signal is below usable threshold at this location.",
                    match.get("provider_name"),
                    match.get("tower_range_meters"),
                )

    if not tagged:
        return []

    # Sort by gap_start km
    tagged.sort(key=lambda t: t[0])

    # ── Merge overlapping/adjacent gap windows into patches ───────────────────
    patches: list[dict[str, Any]] = []
    p_start, p_end, p_lats, p_lngs, p_scores, p_reason, p_provider = (
        tagged[0][0], tagged[0][1],
        [tagged[0][2]], [tagged[0][3]], [tagged[0][4]],
        tagged[0][5], tagged[0][6],
    )

    for i in range(1, len(tagged)):
        g_start, g_end, lat, lng, score, reason, provider = tagged[i]
        # Merge if windows overlap or are within merge_gap_km of each other
        if g_start <= p_end + merge_gap_km:
            p_end = max(p_end, g_end)
            p_lats.append(lat)
            p_lngs.append(lng)
            p_scores.append(score)
            if "No nearby tower" in reason:
                p_reason = reason
        else:
            _flush_patch(patches, p_start, p_end,
                         p_lats, p_lngs, p_scores, p_reason, p_provider)
            p_start, p_end, p_lats, p_lngs, p_scores, p_reason, p_provider = (
                g_start, g_end, [lat], [lng], [score], reason, provider,
            )

    _flush_patch(patches, p_start, p_end,
                 p_lats, p_lngs, p_scores, p_reason, p_provider)

    # Sort by patch size descending — largest gap first
    patches.sort(key=lambda p: p["km_end"] - p["km_start"], reverse=True)
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