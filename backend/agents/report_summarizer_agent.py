"""
Report Summarizer Agent
Summarizes recent crowdsourced signal reports for a location or area.
"""
from __future__ import annotations

from typing import Any
from collections import Counter

from ..services.recommendation_service import summarize_reports


class ReportSummarizerAgent:
    """Summarizes community signal reports — by provider, issue type, recency."""

    def run(self, analysis_result: dict[str, Any]) -> dict[str, Any]:
        nearby_reports = analysis_result.get("nearby_reports", [])
        reports_considered = analysis_result.get("reports_considered", nearby_reports)

        if not reports_considered:
            return {
                "total_reports": 0,
                "summary": "No community reports are available for this area.",
                "top_issues": [],
                "provider_breakdown": {},
                "signal_feedback_breakdown": {},
                "has_reports": False,
            }

        # Aggregate issue types
        issue_counter: Counter = Counter()
        provider_counter: Counter = Counter()
        signal_counter: Counter = Counter()

        for report in reports_considered:
            issue = report.get("issue_type") or "unknown"
            provider = report.get("provider_name") or "Unknown"
            signal = report.get("signal_feedback") or "unknown"

            issue_counter[issue] += 1
            provider_counter[provider] += 1
            signal_counter[signal] += 1

        top_issues = [
            {"issue": issue, "count": count}
            for issue, count in issue_counter.most_common(5)
            if issue != "unknown"
        ]

        provider_breakdown = dict(provider_counter.most_common())
        signal_breakdown = dict(signal_counter.most_common())

        # Build summary text
        total = len(reports_considered)
        most_reported_provider = provider_counter.most_common(1)[0][0] if provider_counter else "Unknown"
        most_common_issue = issue_counter.most_common(1)[0][0] if issue_counter else "none"

        if most_common_issue == "unknown" or not issue_counter:
            summary = (
                f"{total} report(s) available. "
                f"{most_reported_provider} is the most-reported provider in this area."
            )
        else:
            summary = (
                f"{total} report(s) available. "
                f"Most common issue: '{most_common_issue}'. "
                f"{most_reported_provider} is the most-reported provider."
            )

        return {
            "total_reports": total,
            "summary": summary,
            "top_issues": top_issues,
            "provider_breakdown": provider_breakdown,
            "signal_feedback_breakdown": signal_breakdown,
            "most_reported_provider": most_reported_provider,
            "has_reports": total > 0,
        }
