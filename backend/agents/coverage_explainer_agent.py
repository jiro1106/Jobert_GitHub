"""
Coverage Explainer Agent
Generates a human-readable explanation of signal coverage from tower + report data.
"""
from __future__ import annotations

from typing import Any

from ..services.recommendation_service import (
    choose_best_provider,
    generate_explanation_text,
    summarize_reports,
)

_PROVIDER_COLORS = {
    "Globe": "#2563eb",
    "Smart": "#16a34a",
    "DITO": "#f97316",
}


class CoverageExplainerAgent:
    """Explains coverage quality based on towers, scores, and reports."""

    def run(self, analysis_result: dict[str, Any]) -> dict[str, Any]:
        provider_scores = analysis_result.get("provider_scores", {})
        closest_towers = analysis_result.get("closest_towers", [])
        nearby_reports = analysis_result.get("nearby_reports", [])
        weak_segments = analysis_result.get("weak_segments", [])

        best_provider = choose_best_provider(provider_scores)
        explanation = generate_explanation_text(provider_scores, closest_towers, nearby_reports)

        # Build key evidence list
        key_evidence: list[str] = []

        # Top towers
        for tower in closest_towers[:5]:
            pname = tower.get("provider_name", "Unknown")
            radio = tower.get("radio", "")
            dist = tower.get("distance_meters", tower.get("nearest_tower_m", 0))
            if dist:
                key_evidence.append(
                    f"{pname} {radio} tower is {dist:.0f}m away."
                )

        # Report evidence
        report_summary = summarize_reports(nearby_reports)
        if report_summary.get("total_reports", 0) > 0:
            key_evidence.append(
                f"{report_summary['total_reports']} community report(s) nearby — "
                f"most common issue: {report_summary.get('common_issue', 'unknown')}."
            )

        # Weak segments
        if weak_segments:
            key_evidence.append(
                f"{len(weak_segments)} weak signal segment(s) detected along the route."
            )

        # Provider coverage breakdown
        for provider, data in provider_scores.items():
            if isinstance(data, dict):
                cov = data.get("coverage_rate_percent", 0)
                key_evidence.append(
                    f"{provider} covers {cov:.1f}% of the route/area."
                )

        # Signal quality assessment
        if provider_scores:
            top_score = max(
                (float(d.get("score", 0)) for d in provider_scores.values() if isinstance(d, dict)),
                default=0,
            )
            if top_score >= 80:
                quality = "strong"
            elif top_score >= 50:
                quality = "moderate"
            else:
                quality = "weak"
        else:
            quality = "unknown"

        return {
            "coverage_explanation": explanation,
            "key_evidence": key_evidence[:8],  # cap at 8 items
            "signal_quality": quality,
            "best_provider": best_provider,
            "provider_count": len(provider_scores),
        }
