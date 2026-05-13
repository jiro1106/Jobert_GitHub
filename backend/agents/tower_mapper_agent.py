"""
Tower Mapper Agent
Converts raw tower analysis data to map-ready GeoJSON-style layer objects.
"""
from __future__ import annotations

from typing import Any

_PROVIDER_COLORS = {
    "Globe": "#2563eb",
    "Smart": "#16a34a",
    "DITO": "#f97316",
    "Unknown": "#6b7280",
}


def _dedup_towers(towers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Deduplicate towers by tower_id, keeping closest."""
    unique: dict[int, dict[str, Any]] = {}
    for tower in towers:
        tid = tower.get("tower_id")
        if tid is None:
            continue
        existing = unique.get(tid)
        curr_dist = tower.get("distance_meters", float("inf"))
        if not existing or curr_dist < existing.get("distance_meters", float("inf")):
            unique[tid] = tower
    return list(unique.values())


class TowerMapperAgent:
    """Builds map layer data from the raw analysis result."""

    def run(self, analysis_result: dict[str, Any]) -> dict[str, Any]:
        closest_towers = analysis_result.get("closest_towers", [])
        route_points = analysis_result.get("route_points", [])
        weak_segments = analysis_result.get("weak_segments", [])
        route_context = analysis_result.get("route_context", {})

        unique_towers = _dedup_towers(closest_towers)

        # Build tower markers
        tower_markers = []
        for tower in unique_towers:
            provider = tower.get("provider_name", "Unknown")
            lat = tower.get("tower_latitude") or tower.get("latitude")
            lng = tower.get("tower_longitude") or tower.get("longitude")
            if lat is None or lng is None:
                continue
            tower_markers.append({
                "tower_id": tower.get("tower_id"),
                "provider_name": provider,
                "radio": tower.get("radio", ""),
                "net": tower.get("net"),
                "latitude": lat,
                "longitude": lng,
                "distance_meters": round(float(tower.get("distance_meters", 0)), 1),
                "signal_score": tower.get("signal_score"),
                "is_within_estimated_range": tower.get("is_within_estimated_range", False),
                "color": _PROVIDER_COLORS.get(provider, _PROVIDER_COLORS["Unknown"]),
            })

        # Build radius circles
        tower_radius_circles = []
        for tower in unique_towers:
            provider = tower.get("provider_name", "Unknown")
            lat = tower.get("tower_latitude") or tower.get("latitude")
            lng = tower.get("tower_longitude") or tower.get("longitude")
            if lat is None or lng is None:
                continue
            actual_range = tower.get("tower_range_meters") or tower.get("range_meters")
            tower_radius_circles.append({
                "tower_id": tower.get("tower_id"),
                "provider_name": provider,
                "latitude": lat,
                "longitude": lng,
                "radius_meters": actual_range or 1000,
                "range_source": "opencellid" if actual_range else "fallback_display_radius",
                "color": _PROVIDER_COLORS.get(provider, _PROVIDER_COLORS["Unknown"]),
            })

        # Format weak segments for map
        map_weak_segments = []
        for seg in weak_segments:
            map_weak_segments.append({
                "start_lat": seg.get("start_lat"),
                "start_lng": seg.get("start_lng") or seg.get("start_lon"),
                "end_lat": seg.get("end_lat"),
                "end_lng": seg.get("end_lng") or seg.get("end_lon"),
                "signal_level": seg.get("signal_level", "patchy"),
                "distance_km": round(float(seg.get("distance_km", 0)), 2),
                "description": seg.get("description", ""),
            })

        # Format route points
        map_route_points = [
            {
                "latitude": pt.get("latitude"),
                "longitude": pt.get("longitude"),
            }
            for pt in route_points
            if pt.get("latitude") is not None
        ]

        return {
            "map_layers": {
                "tower_markers": tower_markers,
                "tower_radius_circles": tower_radius_circles,
                "route_points": map_route_points,
                "weak_segments": map_weak_segments,
            },
            "stats": {
                "total_towers": len(tower_markers),
                "total_route_points": len(map_route_points),
                "total_weak_segments": len(map_weak_segments),
            },
        }
