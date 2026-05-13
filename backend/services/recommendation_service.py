from __future__ import annotations

from typing import Any


def choose_best_provider(provider_scores: dict[str, Any]) -> str:
    if not provider_scores:
        return "Unknown"
    return max(provider_scores.items(), key=lambda item: item[1]["score"])[0]


def summarize_reports(nearby_reports: list[dict[str, Any]]) -> dict[str, Any]:
    if not nearby_reports:
        return {
            "total_reports": 0,
            "common_issue": None,
            "most_reported_provider": None,
        }

    issue_counts: dict[str, int] = {}
    provider_counts: dict[str, int] = {}
    for report in nearby_reports:
        issue_key = report.get("issue_type") or "unknown"
        provider_key = report.get("provider_name") or "Unknown"
        issue_counts[issue_key] = issue_counts.get(issue_key, 0) + 1
        provider_counts[provider_key] = provider_counts.get(provider_key, 0) + 1

    common_issue = max(issue_counts.items(), key=lambda item: item[1])[0]
    most_reported_provider = max(provider_counts.items(), key=lambda item: item[1])[0]
    return {
        "total_reports": len(nearby_reports),
        "common_issue": common_issue,
        "most_reported_provider": most_reported_provider,
    }


def generate_recommendation_text(provider_scores: dict[str, Any], weak_segments: list[dict[str, Any]]) -> str:
    best_provider = choose_best_provider(provider_scores)
    if best_provider == "Unknown":
        return "No tower evidence was found for this location."
    if weak_segments:
        return f"{best_provider} is recommended, but a few weak segments were detected along the route."
    return f"{best_provider} is recommended for this route."


def generate_explanation_text(
    provider_scores: dict[str, Any],
    closest_towers: list[dict[str, Any]],
    nearby_reports: list[dict[str, Any]],
) -> str:
    best_provider = choose_best_provider(provider_scores)
    if best_provider == "Unknown":
        return "The backend could not find enough nearby towers or reports to rank providers reliably."

    best_score = provider_scores[best_provider]["score"]
    nearest_tower = min((tower.get("distance_meters", 0.0) for tower in closest_towers), default=0.0)
    report_summary = summarize_reports(nearby_reports)
    return (
        f"{best_provider} leads the provider ranking with a score of {best_score:.2f}. "
        f"Nearest matching tower is about {nearest_tower:.1f} m away. "
        f"Nearby reports counted: {report_summary['total_reports']}."
    )


def generate_offline_readiness_alerts(
    weak_segments: list[dict[str, Any]],
    provider_scores: dict[str, Any],
) -> list[str]:
    alerts = []
    if weak_segments:
        alerts.append("Download offline maps before travel.")
        alerts.append("Prepare a backup SIM if staying in weak-signal areas.")

    if choose_best_provider(provider_scores) == "Unknown":
        alerts.append("Signal conditions are uncertain, so plan for limited connectivity.")

    return alerts


def detect_possible_anomalies(provider_scores: dict[str, Any], nearby_reports: list[dict[str, Any]]) -> bool:
    if not provider_scores:
        return False

    best_provider = choose_best_provider(provider_scores)
    best_score = provider_scores[best_provider]["score"]
    report_summary = summarize_reports(nearby_reports)
    return best_score < 40 or (report_summary["total_reports"] > 0 and report_summary["common_issue"] in {"no_signal", "slow_data", "unstable"})


def build_response_payload(
    provider_scores: dict[str, Any],
    closest_towers: list[dict[str, Any]],
    nearby_reports: list[dict[str, Any]],
    weak_segments: list[dict[str, Any]],
) -> dict[str, Any]:
    best_provider = choose_best_provider(provider_scores)
    return {
        "best_provider": best_provider,
        "provider_scores": provider_scores,
        "closest_towers": closest_towers,
        "weak_segments": weak_segments,
        "nearby_reports_summary": summarize_reports(nearby_reports),
        "recommendation_text": generate_recommendation_text(provider_scores, weak_segments),
        "explanation_text": generate_explanation_text(provider_scores, closest_towers, nearby_reports),
        "offline_readiness_alerts": generate_offline_readiness_alerts(weak_segments, provider_scores),
    }


def build_recommendation(scores: dict[str, Any], analysis_kind: str) -> dict[str, str]:
    provider_scores = scores.get("provider_scores", {})
    weak_segments = scores.get("weak_segments", [])
    closest_towers = scores.get("closest_towers", [])
    nearby_reports = scores.get("nearby_reports", [])

    if not provider_scores:
        return {
            "best_provider": "Unknown",
            "recommendation_text": "No tower evidence was found for this location.",
            "explanation_text": "The backend could not find enough nearby towers or reports to rank providers reliably.",
        }

    best_provider = choose_best_provider(provider_scores)
    return {
        "best_provider": best_provider,
        "recommendation_text": generate_recommendation_text(provider_scores, weak_segments),
        "explanation_text": generate_explanation_text(provider_scores, closest_towers, nearby_reports),
    }