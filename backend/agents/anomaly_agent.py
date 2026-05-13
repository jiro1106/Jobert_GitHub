"""
Anomaly Detection Agent
Flags suspicious, low-confidence, or anomalous signal results.
"""
from __future__ import annotations

from typing import Any

from ..services.recommendation_service import (
    detect_possible_anomalies,
    summarize_reports,
    choose_best_provider,
)
from ..db.anomaly_repository import insert_anomaly_log


class AnomalyAgent:
    """Detects anomalies in signal analysis and logs them to the database."""

    def run(self, analysis_result: dict[str, Any], auto_log: bool = True) -> dict[str, Any]:
        provider_scores = analysis_result.get("provider_scores", {})
        weak_segments = analysis_result.get("weak_segments", [])
        nearby_reports = analysis_result.get("nearby_reports", [])
        route_context = analysis_result.get("route_context", {})

        is_anomalous = detect_possible_anomalies(provider_scores, nearby_reports)
        report_summary = summarize_reports(nearby_reports)

        # Determine anomaly type and explanation
        anomaly_type = "none"
        explanation = "No anomaly detected. Signal data looks consistent with expected patterns."
        anomaly_logged = False

        best_provider = choose_best_provider(provider_scores)
        top_score = 0.0
        if provider_scores and best_provider != "Unknown":
            score_data = provider_scores.get(best_provider, {})
            top_score = float(score_data.get("score", 0)) if isinstance(score_data, dict) else 0.0

        dead_zones = [s for s in weak_segments if s.get("signal_level") == "dead"]

        if not provider_scores:
            anomaly_type = "no_tower_data"
            explanation = (
                "No tower data found for this location. "
                "This may indicate a coverage gap in the OpenCelliD dataset."
            )
            is_anomalous = True
        elif top_score < 20:
            anomaly_type = "very_low_score"
            explanation = (
                f"Unusually low coverage score ({top_score:.0f}/100). "
                "Signal conditions are significantly below normal — this may indicate "
                "infrastructure issues or a data gap."
            )
            is_anomalous = True
        elif dead_zones:
            anomaly_type = "dead_zones"
            explanation = (
                f"{len(dead_zones)} complete dead zone(s) detected along the route. "
                "All providers report zero coverage in these segments."
            )
            is_anomalous = True
        elif report_summary.get("total_reports", 0) > 0:
            common_issue = report_summary.get("common_issue", "")
            if common_issue in ("no_signal", "dropped_call", "slow_data"):
                anomaly_type = "community_reports_conflict"
                explanation = (
                    f"Community reports indicate '{common_issue}' issues "
                    "despite moderate tower coverage — possible congestion or maintenance."
                )
                is_anomalous = True

        # Log the anomaly to Supabase if detected and auto_log is enabled
        if is_anomalous and auto_log and anomaly_type != "none":
            try:
                lat = route_context.get("origin_lat") or analysis_result.get("location", {}).get("latitude")
                lon = route_context.get("origin_lon") or analysis_result.get("location", {}).get("longitude")
                if lat and lon:
                    insert_anomaly_log({
                        "latitude": lat,
                        "longitude": lon,
                        "provider_name": best_provider,
                        "predicted_score": top_score,
                        "reported_feedback": report_summary.get("common_issue"),
                        "anomaly_type": anomaly_type,
                        "explanation": explanation,
                    })
                    anomaly_logged = True
            except Exception as log_err:
                print(f"[AnomalyAgent] Failed to log anomaly: {log_err}")

        return {
            "anomaly_status": "logged" if anomaly_logged else ("possible" if is_anomalous else "none"),
            "anomaly_type": anomaly_type,
            "explanation": explanation,
            "anomaly_logged": anomaly_logged,
            "dead_zone_count": len(dead_zones),
            "top_coverage_score": round(top_score, 1),
        }
