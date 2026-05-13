from __future__ import annotations

from math import asin, cos, radians, sin, sqrt
from typing import Any

# ============================================================
# PROVIDER MAPPING (MCC + MNC BASED - CORRECT STANDARD)
# ============================================================

MCC_MNC_TO_PROVIDER: dict[tuple[int, int], str] = {
    (515, 2): "Globe",   # Globe Telecom
    (515, 1): "Globe",   # TM (Globe MVNO)
    (515, 3): "Smart",   # Smart Communications
    (515, 5): "Smart",   # Sun Cellular (merged into Smart)
    (515, 66): "DITO",   # DITO Telecommunity
}

KNOWN_PROVIDERS = ["Globe", "Smart", "DITO"]


def _canonical_provider_from_name(provider_name: str) -> str:
    provider_lower = provider_name.strip().lower()

    if "globe" in provider_lower or "tm" in provider_lower:
        return "Globe"

    if (
        "smart" in provider_lower
        or "sun" in provider_lower
        or "talk n text" in provider_lower
        or "tnt" in provider_lower
    ):
        return "Smart"

    if "dito" in provider_lower:
        return "DITO"

    for known_provider in KNOWN_PROVIDERS:
        if known_provider.lower() in provider_lower:
            return known_provider

    return provider_name


def normalize_provider_name(
    mcc: int | None,
    mnc: int | None,
    provider_name: str | None = None
) -> str:
    """
    Primary: MCC + MNC lookup (accurate)
    Fallback: provider_name string parsing
    """

    # 1. MCC/MNC is the most reliable source
    if mcc is not None and mnc is not None:
        provider = MCC_MNC_TO_PROVIDER.get((int(mcc), int(mnc)))
        if provider:
            return provider

    # 2. fallback to string-based detection
    if provider_name:
        return _canonical_provider_from_name(provider_name)

    return "Unknown"


# ============================================================
# Haversine distance
# ============================================================

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_meters = 6371000.0

    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)

    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(delta_lon / 2) ** 2
    )

    return 2 * earth_radius_meters * asin(sqrt(a))


# ============================================================
# CORE SCORING (UNCHANGED LOGIC)
# ============================================================

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


# ============================================================
# RANGE NORMALIZATION
# ============================================================

def normalize_tower_range_meters(value: Any) -> float | None:
    if value is None:
        return None

    try:
        normalized = float(value)
    except (TypeError, ValueError):
        return None

    if normalized <= 0:
        return None

    return normalized


# ============================================================
# BUILD MATCH OBJECT
# ============================================================

def build_closest_tower_match(
    route_point: dict[str, Any],
    tower: dict[str, Any],
    route_point_order: int,
    distance_meters: float,
) -> dict[str, Any]:

    provider_name = normalize_provider_name(
        tower.get("mcc"),
        tower.get("mnc"),
        tower.get("provider_name"),
    )

    tower_range_meters = normalize_tower_range_meters(
        tower.get("range_meters")
    )

    return {
        "route_point_order": route_point_order,
        "route_distance_from_origin_m": route_point.get("distance_from_origin_m"),

        "tower_id": tower["tower_id"],
        "radio": tower.get("radio"),
        "mcc": tower.get("mcc"),
        "mnc": tower.get("mnc"),
        "provider_name": provider_name,

        "tower_latitude": tower["latitude"],
        "tower_longitude": tower["longitude"],

        "route_latitude": route_point["latitude"],
        "route_longitude": route_point["longitude"],

        "distance_meters": round(distance_meters, 2),
        "tower_range_meters": tower_range_meters,

        "is_within_estimated_range": (
            tower_range_meters is not None
            and distance_meters <= tower_range_meters
        ),

        "signal_score": score_tower_match(
            distance_meters=distance_meters,
            tower_range_meters=tower_range_meters,
            radio=tower.get("radio"),
            samples=tower.get("samples"),
        ),
    }


# ============================================================
# FIND CLOSEST TOWERS
# ============================================================

def find_closest_towers(
    route_points: list[dict[str, Any]],
    candidate_towers: list[dict[str, Any]],
    max_distance_km: float = 5.0,
    per_point_limit: int = 10,
) -> list[dict[str, Any]]:

    max_distance_meters = max_distance_km * 1000.0
    matches = []

    for index, route_point in enumerate(route_points, start=1):
        route_point_order = int(route_point.get("point_order", index))
        ranked_towers = []

        for tower in candidate_towers:
            distance_meters = haversine_distance_m(
                route_point["latitude"],
                route_point["longitude"],
                tower["latitude"],
                tower["longitude"],
            )

            if distance_meters > max_distance_meters:
                continue

            tower_range_meters = tower.get("range_meters")

            ranked_towers.append({
                "route_point_order": route_point_order,
                "route_distance_from_origin_m": route_point.get("distance_from_origin_m"),

                "tower_id": tower["tower_id"],
                "radio": tower.get("radio"),
                "mcc": tower.get("mcc"),
                "mnc": tower.get("mnc"),

                "provider_name": normalize_provider_name(
                    tower.get("mcc"),
                    tower.get("mnc"),
                    tower.get("provider_name"),
                ),

                "tower_latitude": tower["latitude"],
                "tower_longitude": tower["longitude"],

                "route_latitude": route_point["latitude"],
                "route_longitude": route_point["longitude"],

                "distance_meters": round(distance_meters, 2),
                "tower_range_meters": tower_range_meters,

                "is_within_estimated_range": bool(
                    tower_range_meters and distance_meters <= tower_range_meters
                ),

                "signal_score": score_tower_match(
                    distance_meters=distance_meters,
                    tower_range_meters=tower_range_meters,
                    radio=tower.get("radio"),
                    samples=tower.get("samples"),
                ),
            })

        ranked_towers.sort(key=lambda item: item["distance_meters"])
        matches.extend(ranked_towers[:per_point_limit])

    return matches


# ============================================================
# COMPATIBILITY WRAPPERS (DO NOT BREAK EXISTING CODE)
# ============================================================

def find_closest_towers_by_provider(
    route_points: list[dict[str, Any]],
    candidate_towers: list[dict[str, Any]],
    max_distance_km: float = 5.0,
) -> list[dict[str, Any]]:
    return find_closest_towers(
        route_points=route_points,
        candidate_towers=candidate_towers,
        max_distance_km=max_distance_km,
        per_point_limit=10,
    )


def bounding_box(latitude: float, longitude: float, radius_km: float):
    return build_bbox_around_point(latitude, longitude, radius_km)


def route_bounding_box(route_points, radius_km):
    return build_bbox_around_route(route_points, radius_km)