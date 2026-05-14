from __future__ import annotations

import json
from typing import Any
from urllib.request import urlopen

from ..db.anomaly_repository import insert_anomaly_log
from ..db.report_repository import get_reports_in_bbox
from ..db.tower_repository import get_towers_in_bbox
from .cache_service import (
    get_cached_result,
    make_point_cache_key,
    make_route_cache_key,
    set_cached_result,
)
from .recommendation_service import build_response_payload
from .scoring_service import calculate_provider_scores
from .tower_matching_service import (
    build_bbox_around_point,
    build_bbox_around_route,
    find_closest_towers,
    haversine_distance_m,
)


def build_single_point_route(
    latitude: float,
    longitude: float,
    location_name: str = "Selected Location",
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    # wraps point as single-point route so same scoring pipeline works

    route_context = {
        "analysis_type": "single_point",
        "origin_name": location_name,
        "origin_lat": latitude,
        "origin_lon": longitude,
        "destination_name": location_name,
        "destination_lat": latitude,
        "destination_lon": longitude,
        "total_distance_m": 0,
        "estimated_duration_s": 0,
    }

    route_points = [
        {
            "point_order": 1,
            "latitude": latitude,
            "longitude": longitude,
            "distance_from_origin_m": 0,
        }
    ]

    return route_context, route_points


def get_route_from_osrm(
    origin_lat: float,
    origin_lon: float,
    destination_lat: float,
    destination_lon: float,
) -> list[dict[str, float]]:
    # OSRM returns [lon, lat] - swap to {lat, lon}

    request_url = (
        "https://router.project-osrm.org/route/v1/driving/"
        f"{origin_lon},{origin_lat};{destination_lon},{destination_lat}"
        "?overview=full&geometries=geojson"
    )

    try:
        with urlopen(request_url, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))

        coordinates = payload["routes"][0]["geometry"]["coordinates"]

        return [
            {
                "latitude": latitude,
                "longitude": longitude,
            }
            for longitude, latitude in coordinates
        ]

    except Exception:
        # osrm down? just return origin/dest points
        return [
            {
                "latitude": origin_lat,
                "longitude": origin_lon,
            },
            {
                "latitude": destination_lat,
                "longitude": destination_lon,
            },
        ]


def normalize_route_points(
    route_points: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    # add order and cumulative distance to each point

    normalized_points: list[dict[str, Any]] = []
    cumulative_distance_m = 0.0

    for index, point in enumerate(route_points, start=1):
        latitude = float(point["latitude"])
        longitude = float(point["longitude"])

        if normalized_points:
            previous_point = normalized_points[-1]

            cumulative_distance_m += haversine_distance_m(
                previous_point["latitude"],
                previous_point["longitude"],
                latitude,
                longitude,
            )

        normalized_points.append(
            {
                "point_order": index,
                "latitude": latitude,
                "longitude": longitude,
                "distance_from_origin_m": round(cumulative_distance_m, 2),
            }
        )

    return normalized_points


def get_route_bbox(
    route_points: list[dict[str, float]],
    buffer_degrees: float = 0.05,
) -> tuple[float, float, float, float]:
    # legacy bbox calc - use build_bbox_around_route instead

    latitudes = [point["latitude"] for point in route_points]
    longitudes = [point["longitude"] for point in route_points]

    return (
        min(latitudes) - buffer_degrees,
        min(longitudes) - buffer_degrees,
        max(latitudes) + buffer_degrees,
        max(longitudes) + buffer_degrees,
    )


def maybe_log_anomaly(
    latitude: float,
    longitude: float,
    scores: dict[str, Any],
    reports: list[dict[str, Any]],
) -> bool:
    provider_scores = list(scores.get("provider_scores", {}).items())
    weak_segments = scores.get("weak_segments", [])

    if not provider_scores:
        return False

    best_provider, best_score_payload = provider_scores[0]
    best_score = float(best_score_payload.get("score", 0.0))

    # Do not log anomalies for strong clean results.
    if best_score >= 70 and not reports and not weak_segments:
        return False

    # Log report conflict only when reports are actually negative.
    negative_words = ["poor", "bad", "slow", "unstable", "no signal", "no_signal", "dropped"]
    has_negative_report = any(
        any(word in " ".join(str(report.get(field, "")).lower() for field in [
            "signal_feedback",
            "speed_feedback",
            "issue_type",
            "user_notes",
        ]) for word in negative_words)
        for report in reports
    )

    if reports and has_negative_report:
        explanation = "Nearby crowdsourced reports suggest service quality may conflict with the computed signal result."
        anomaly_type = "report_conflict"
    elif best_score < 35:
        explanation = "Computed provider score is low-confidence."
        anomaly_type = "low_confidence"
    elif weak_segments:
        explanation = "Weak-signal segments were detected."
        anomaly_type = "weak_segment_detected"
    else:
        return False

    insert_anomaly_log(
        {
            "latitude": latitude,
            "longitude": longitude,
            "provider_name": best_provider,
            "predicted_score": best_score,
            "reported_feedback": reports[0].get("signal_feedback") if reports else None,
            "anomaly_type": anomaly_type,
            "explanation": explanation,
        }
    )

    return True


def analyze_point(
    latitude: float,
    longitude: float,
    radius_km: float = 5.0,
) -> dict[str, Any]:
    # point → single-point route → normal flow: towers → scoring → recommendation

    try:
        cache_key = make_point_cache_key(latitude, longitude, radius_km)
    except TypeError:
        cache_key = f"{make_point_cache_key(latitude, longitude)}:{round(radius_km, 2)}"

    cached_value = get_cached_result(cache_key)

    if cached_value is not None:
        return cached_value

    route_context, route_points = build_single_point_route(
        latitude=latitude,
        longitude=longitude,
    )

    min_latitude, min_longitude, max_latitude, max_longitude = build_bbox_around_point(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
    )

    towers = get_towers_in_bbox(
        min_latitude,
        min_longitude,
        max_latitude,
        max_longitude,
    )

    reports = get_reports_in_bbox(
        min_latitude,
        min_longitude,
        max_latitude,
        max_longitude,
    )

    closest_towers = find_closest_towers(
        route_points=route_points,
        candidate_towers=towers,
        max_distance_km=radius_km,
    )

    scores = calculate_provider_scores(
        closest_towers=closest_towers,
        nearby_reports=reports,
        route_points=route_points,
    )

    anomaly_logged = maybe_log_anomaly(
        latitude=latitude,
        longitude=longitude,
        scores=scores,
        reports=reports,
    )

    result = build_response_payload(
        provider_scores=scores.get("provider_scores", {}),
        closest_towers=closest_towers,
        nearby_reports=reports,
        weak_segments=scores.get("weak_segments", []),
    )

    result.update(
        {
            "analysis_type": "point",
            "route_context": route_context,
            "route_points": route_points,
            "candidate_tower_count": len(towers),
            "closest_towers": closest_towers,
            "reports_considered": reports,
            "anomaly_logged": anomaly_logged,
        }
    )

    set_cached_result(cache_key, result)

    return result


def analyze_route(
    origin: dict[str, float],
    destination: dict[str, float],
    route_points: list[dict[str, float]] | None = None,
    radius_km: float = 10.0,   # raised to match find_closest_towers 10km default
) -> dict[str, Any]:
    # evaluates EVERY route point, not just start/end

    raw_route_points = route_points or get_route_from_osrm(
        origin["latitude"],
        origin["longitude"],
        destination["latitude"],
        destination["longitude"],
    )

    resolved_route_points = normalize_route_points(raw_route_points)
    try:
        cache_key = make_route_cache_key(origin, destination, radius_km)
    except TypeError:
        cache_key = f"{make_route_cache_key(origin, destination)}:{round(radius_km, 2)}:{len(resolved_route_points)}"

    cached_value = get_cached_result(cache_key)

    if cached_value is not None:
        return cached_value

    min_latitude, min_longitude, max_latitude, max_longitude = build_bbox_around_route(
        resolved_route_points,
        radius_km,
    )

    towers = get_towers_in_bbox(
        min_latitude,
        min_longitude,
        max_latitude,
        max_longitude,
    )

    reports = get_reports_in_bbox(
        min_latitude,
        min_longitude,
        max_latitude,
        max_longitude,
    )

    closest_towers = find_closest_towers(
        route_points=resolved_route_points,
        candidate_towers=towers,
        max_distance_km=radius_km,
    )

    scores = calculate_provider_scores(
        closest_towers=closest_towers,
        nearby_reports=reports,
        route_points=resolved_route_points,
    )

    route_length_meters = (
        resolved_route_points[-1]["distance_from_origin_m"]
        if resolved_route_points
        else 0.0
    )

    result = build_response_payload(
        provider_scores=scores.get("provider_scores", {}),
        closest_towers=closest_towers,
        nearby_reports=reports,
        weak_segments=scores.get("weak_segments", []),
    )

    result.update(
        {
            "analysis_type": "route",
            "route_context": {
                "analysis_type": "route",
                "origin_name": origin.get("name", "Origin"),
                "origin_lat": origin["latitude"],
                "origin_lon": origin["longitude"],
                "destination_name": destination.get("name", "Destination"),
                "destination_lat": destination["latitude"],
                "destination_lon": destination["longitude"],
                "total_distance_m": round(route_length_meters, 2),
                "estimated_duration_s": None,
            },
            "route_points": resolved_route_points,
            "route_length_meters": round(route_length_meters, 2),
            "candidate_tower_count": len(towers),
            "closest_towers": closest_towers,
            "reports_considered": reports,
            "anomaly_logged": False,
        }
    )

    set_cached_result(cache_key, result)

    return result