from __future__ import annotations

from typing import Any

KNOWN_PROVIDERS = ["Globe", "Smart", "DITO"]

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
    weak_threshold: float = 45.0,
) -> list[dict[str, Any]]:
    # find spots on route where best available tower score is below 45

    best_match_by_point: dict[int, dict[str, Any]] = {}

    for match in closest_towers:
        point_order = int(match.get("route_point_order", 0))
        current_best = best_match_by_point.get(point_order)

        if current_best is None or match.get("signal_score", 0.0) > current_best.get("signal_score", 0.0):
            best_match_by_point[point_order] = match

    weak_segments = []

    for index, point in enumerate(route_points, start=1):
        point_order = int(point.get("point_order", index))
        best_match = best_match_by_point.get(point_order)

        if best_match is None:
            weak_segments.append(
                {
                    "point_order": point_order,
                    "latitude": point.get("latitude"),
                    "longitude": point.get("longitude"),
                    "provider_name": None,
                    "signal_score": 0.0,
                    "reason": "No nearby tower found within the search radius.",
                }
            )
            continue

        if best_match.get("signal_score", 0.0) < weak_threshold:
            weak_segments.append(
                {
                    "point_order": point_order,
                    "latitude": point.get("latitude"),
                    "longitude": point.get("longitude"),
                    "provider_name": best_match.get("provider_name"),
                    "signal_score": best_match.get("signal_score"),
                    "reason": "Best available tower match is below the weak-signal threshold.",
                }
            )

    return weak_segments


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
        final_score = raw_score * confidence

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