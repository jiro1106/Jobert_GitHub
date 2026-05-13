from __future__ import annotations

from math import asin, cos, radians, sin, sqrt
from typing import Any

PROVIDER_BY_NET = {
    2: "Globe",
    3: "Smart",
    66: "DITO",
}

KNOWN_PROVIDERS = ["Globe", "Smart", "DITO"]


def normalize_provider_name(net: int | None, provider_name: str | None = None) -> str:
    if provider_name:
        return provider_name

    if net is None:
        return "Unknown"

    return PROVIDER_BY_NET.get(net, "Unknown")


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_meters = 6371000.0

    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)

    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(delta_lon / 2) ** 2
    )

    return 2 * earth_radius_meters * asin(sqrt(a))


def haversine_meters(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float:
    return haversine_distance_m(latitude_1, longitude_1, latitude_2, longitude_2)


def build_bbox_around_point(
    latitude: float,
    longitude: float,
    radius_km: float,
) -> tuple[float, float, float, float]:
    latitude_delta = radius_km / 111.0
    longitude_delta = radius_km / max(1e-6, 111.0 * cos(radians(latitude)))

    return (
        latitude - latitude_delta,
        longitude - longitude_delta,
        latitude + latitude_delta,
        longitude + longitude_delta,
    )


def build_bbox_around_route(
    route_points: list[dict[str, Any]],
    radius_km: float,
) -> tuple[float, float, float, float]:
    latitudes = [point["latitude"] for point in route_points]
    longitudes = [point["longitude"] for point in route_points]

    average_latitude = sum(latitudes) / len(latitudes)

    latitude_padding = radius_km / 111.0
    longitude_padding = radius_km / max(1e-6, 111.0 * cos(radians(average_latitude)))

    return (
        min(latitudes) - latitude_padding,
        min(longitudes) - longitude_padding,
        max(latitudes) + latitude_padding,
        max(longitudes) + longitude_padding,
    )


def radio_bonus_score(radio: str | None) -> float:
    if not radio:
        return 0.0

    radio_upper = radio.upper()

    if radio_upper == "NR" or "5G" in radio_upper:
        return 8.0

    if radio_upper == "LTE" or "4G" in radio_upper:
        return 5.0

    if radio_upper == "UMTS" or "3G" in radio_upper:
        return 2.0

    if radio_upper == "GSM":
        return 0.5

    return 0.0


def sample_bonus_score(samples: int | None) -> float:
    if samples is None:
        return 0.0

    return min(5.0, samples / 50.0)


def score_tower_match(
    distance_meters: float,
    tower_range_meters: float | None,
    radio: str | None = None,
    samples: int | None = None,
) -> float:
    # closer + within range + better radio/samples = higher score (0-100)

    max_distance_meters = 5000.0

    distance_component = max(
        0.0,
        1.0 - min(distance_meters, max_distance_meters) / max_distance_meters,
    )

    if tower_range_meters and tower_range_meters > 0:
        range_component = max(
            0.0,
            1.0 - distance_meters / max(tower_range_meters, 1.0),
        )
    else:
        range_component = 0.0

    proximity_factor = 1.0 / (1.0 + distance_meters / 1500.0)

    base_score = (
        distance_component * 45.0
        + range_component * 35.0
        + proximity_factor * 10.0
        + radio_bonus_score(radio)
        + sample_bonus_score(samples)
    )

    return round(min(100.0, max(0.0, base_score)), 2)


def find_closest_towers_by_provider(
    route_points: list[dict[str, Any]],
    candidate_towers: list[dict[str, Any]],
    max_distance_km: float = 5.0,
) -> list[dict[str, Any]]:
    # find closest tower per provider at each route point

    max_distance_meters = max_distance_km * 1000.0
    matches: list[dict[str, Any]] = []

    towers_by_provider: dict[str, list[dict[str, Any]]] = {
        provider: [] for provider in KNOWN_PROVIDERS
    }

    for tower in candidate_towers:
        provider_name = normalize_provider_name(
            tower.get("net"),
            tower.get("provider_name"),
        )

        if provider_name in towers_by_provider:
            towers_by_provider[provider_name].append(tower)

    for index, route_point in enumerate(route_points, start=1):
        route_point_order = int(route_point.get("point_order", index))

        for provider_name, provider_towers in towers_by_provider.items():
            closest_match = None

            for tower in provider_towers:
                distance_meters = haversine_distance_m(
                    route_point["latitude"],
                    route_point["longitude"],
                    tower["latitude"],
                    tower["longitude"],
                )

                if distance_meters > max_distance_meters:
                    continue

                if closest_match is None or distance_meters < closest_match["distance_meters"]:
                    tower_range_meters = tower.get("range_meters")
                    is_within_estimated_range = bool(
                        tower_range_meters and distance_meters <= tower_range_meters
                    )

                    closest_match = {
                        "route_point_order": route_point_order,
                        "route_distance_from_origin_m": route_point.get("distance_from_origin_m"),

                        "tower_id": tower["tower_id"],
                        "radio": tower.get("radio"),
                        "net": tower.get("net"),
                        "provider_name": provider_name,

                        "tower_latitude": tower["latitude"],
                        "tower_longitude": tower["longitude"],

                        "route_latitude": route_point["latitude"],
                        "route_longitude": route_point["longitude"],

                        "distance_meters": round(distance_meters, 2),
                        "tower_range_meters": tower_range_meters,

                        "is_within_estimated_range": is_within_estimated_range,
                        "signal_score": score_tower_match(
                            distance_meters=distance_meters,
                            tower_range_meters=tower_range_meters,
                            radio=tower.get("radio"),
                            samples=tower.get("samples"),
                        ),
                    }

            if closest_match is not None:
                matches.append(closest_match)

    return matches

# backward compat
def find_closest_towers(
    route_points: list[dict[str, Any]],
    candidate_towers: list[dict[str, Any]],
    max_distance_km: float = 5.0,
    per_point_limit: int = 5,
) -> list[dict[str, Any]]:
    return find_closest_towers_by_provider(
        route_points=route_points,
        candidate_towers=candidate_towers,
        max_distance_km=max_distance_km,
    )


def bounding_box(latitude: float, longitude: float, radius_km: float) -> tuple[float, float, float, float]:
    return build_bbox_around_point(latitude, longitude, radius_km)


def route_bounding_box(route_points: list[dict[str, Any]], radius_km: float) -> tuple[float, float, float, float]:
    return build_bbox_around_route(route_points, radius_km)


def select_closest_towers(
    route_points: list[dict[str, Any]],
    towers: list[dict[str, Any]],
    per_point_limit: int = 5,
) -> list[dict[str, Any]]:
    return find_closest_towers_by_provider(
        route_points=route_points,
        candidate_towers=towers,
        max_distance_km=5.0,
    )