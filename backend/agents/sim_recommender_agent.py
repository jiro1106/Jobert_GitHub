"""
SIM Recommender Agent
Picks the best provider and explains why.
Deterministic — no LLM required. Can be enhanced with LFM if available.
"""
from __future__ import annotations

from typing import Any

from ..services.recommendation_service import (
    choose_best_provider,
    generate_recommendation_text,
    summarize_reports,
)


class SimRecommenderAgent:
    """Recommends the best SIM/provider for the analyzed location or route."""

    def run(self, analysis_result: dict[str, Any]) -> dict[str, Any]:
        provider_scores = analysis_result.get("provider_scores", {})
        weak_segments = analysis_result.get("weak_segments", [])
        nearby_reports = analysis_result.get("nearby_reports", [])
        report_summary = summarize_reports(nearby_reports)

        best_provider = choose_best_provider(provider_scores)
        score_data = provider_scores.get(best_provider, {})
        score_value = score_data.get("score", 0) if isinstance(score_data, dict) else 0

        # Build ranked list
        ranked = sorted(
            [
                {
                    "provider": name,
                    "score": round(float(data.get("score", 0)), 1),
                    "coverage_pct": round(float(data.get("coverage_rate_percent", 0)), 1),
                }
                for name, data in provider_scores.items()
                if isinstance(data, dict)
            ],
            key=lambda x: x["score"],
            reverse=True,
        )

        # Determine confidence
        if score_value >= 80:
            confidence = "high"
        elif score_value >= 50:
            confidence = "medium"
        else:
            confidence = "low"

        # Build caveats
        caveats: list[str] = []
        if weak_segments:
            caveats.append(f"{len(weak_segments)} weak signal segment(s) detected along the route.")
        if report_summary.get("total_reports", 0) > 0:
            common = report_summary.get("common_issue")
            if common and common not in ("unknown", "other"):
                caveats.append(f"Community reports indicate '{common}' issues in this area.")
        if score_value < 50:
            caveats.append("Coverage data is sparse — treat recommendation with caution.")

        return {
            "recommended_provider": best_provider,
            "score": round(float(score_value), 1),
            "summary": generate_recommendation_text(provider_scores, weak_segments),
            "confidence": confidence,
            "ranked_providers": ranked,
            "caveats": caveats,
            "nearby_reports_summary": report_summary,
        }
