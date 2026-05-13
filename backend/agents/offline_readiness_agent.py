"""
Offline Readiness Agent
Assesses how prepared a traveler should be for offline/no-signal scenarios.
"""
from __future__ import annotations

from typing import Any

from ..services.recommendation_service import (
    choose_best_provider,
    generate_offline_readiness_alerts,
)


class OfflineReadinessAgent:
    """Determines offline readiness level and generates actionable alerts."""

    def run(self, analysis_result: dict[str, Any]) -> dict[str, Any]:
        provider_scores = analysis_result.get("provider_scores", {})
        weak_segments = analysis_result.get("weak_segments", [])
        route_context = analysis_result.get("route_context", {})

        alerts = generate_offline_readiness_alerts(weak_segments, provider_scores)

        # Determine readiness level
        dead_zone_count = sum(
            1 for seg in weak_segments
            if seg.get("signal_level") == "dead"
        )
        weak_count = len(weak_segments)

        best_provider = choose_best_provider(provider_scores)
        top_score = 0.0
        if provider_scores and best_provider != "Unknown":
            score_data = provider_scores.get(best_provider, {})
            top_score = float(score_data.get("score", 0)) if isinstance(score_data, dict) else 0.0

        if dead_zone_count > 0 or top_score < 30:
            readiness_level = "critical"
            summary = (
                f"⚠️ Critical: {dead_zone_count} dead zone(s) detected. "
                "Download offline maps and prepare emergency contacts."
            )
        elif weak_count > 2 or top_score < 60:
            readiness_level = "moderate"
            summary = (
                f"Moderate connectivity gaps detected ({weak_count} weak segment(s)). "
                "Consider downloading offline maps and having a backup SIM."
            )
        elif weak_count > 0:
            readiness_level = "low"
            summary = (
                f"Minor weak signal area(s) detected ({weak_count} segment(s)). "
                "Coverage is mostly good, but download offline maps just in case."
            )
        else:
            readiness_level = "minimal"
            summary = "Good coverage expected. No special offline preparation needed."

        # Extra tips based on distance
        total_distance_km = route_context.get("total_distance_m", 0) / 1000
        if total_distance_km > 100:
            alerts.append("Long-distance trip: fully charge devices before departure.")
        if total_distance_km > 300:
            alerts.append("Very long trip: consider a mobile power bank.")

        return {
            "readiness_level": readiness_level,
            "offline_alerts": alerts,
            "summary": summary,
            "dead_zone_count": dead_zone_count,
            "weak_segment_count": weak_count,
            "best_coverage_score": round(top_score, 1),
        }
