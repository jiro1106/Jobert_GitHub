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

    score_data = provider_scores.get(best_provider, {})
    score_val = float(score_data.get("score", 0)) if isinstance(score_data, dict) else 0.0
    confidence = float(score_data.get("data_confidence", 1.0)) if isinstance(score_data, dict) else 1.0

    # Build ranked list for comparison context
    ranked = sorted(
        [(name, float(d.get("score", 0))) for name, d in provider_scores.items() if isinstance(d, dict)],
        key=lambda x: x[1], reverse=True
    )

    if confidence < 0.5:
        caveat = " Note: coverage data in this area is sparse — this is a low-confidence estimate."
    elif confidence < 0.8:
        caveat = " Limited tower data was found nearby, so treat this as a rough estimate."
    else:
        caveat = ""

    if weak_segments:
        quality = f"{best_provider} is recommended, but {len(weak_segments)} weak-signal segment(s) were detected along the route."
    elif score_val >= 60:
        quality = f"{best_provider} is the best option for this area with solid coverage."
    elif score_val >= 35:
        quality = f"{best_provider} has moderate coverage here — usable but not outstanding."
    else:
        quality = f"{best_provider} edges out the competition, though all providers show limited signal here."

    # Add the runner-up if there is one
    if len(ranked) >= 2:
        runner_name, runner_score = ranked[1]
        if runner_score > 0:
            quality += f" {runner_name} is the next best alternative (score: {runner_score:.0f})."

    return quality + caveat


def generate_explanation_text(
    provider_scores: dict[str, Any],
    closest_towers: list[dict[str, Any]],
    nearby_reports: list[dict[str, Any]],
) -> str:
    best_provider = choose_best_provider(provider_scores)
    if best_provider == "Unknown":
        return "The backend could not find enough nearby towers or reports to rank providers reliably."

    score_data = provider_scores.get(best_provider, {})
    best_score = float(score_data.get("score", 0)) if isinstance(score_data, dict) else 0.0
    confidence = float(score_data.get("data_confidence", 1.0)) if isinstance(score_data, dict) else 1.0
    tower_count = len(closest_towers)

    nearest_tower = min(
        (tower.get("distance_meters", 0.0) for tower in closest_towers),
        default=None,
    )
    report_summary = summarize_reports(nearby_reports)
    report_count = report_summary.get("total_reports", 0)

    # Build a readable confidence note
    if confidence < 0.35:
        data_note = f"Only {tower_count} tower match(es) found — confidence is very low."
    elif confidence < 0.65:
        data_note = f"{tower_count} tower match(es) found nearby — limited coverage data, estimate may be rough."
    elif confidence < 0.85:
        data_note = f"{tower_count} tower match(es) used — moderate data density."
    else:
        data_note = f"{tower_count} tower match(es) — good data density."

    parts = [
        f"{best_provider} scores highest at {best_score:.0f}/100.",
        data_note,
    ]
    if nearest_tower is not None:
        parts.append(f"Nearest {best_provider} tower is ~{nearest_tower:.0f} m away.")
    if report_count > 0:
        most_rep = report_summary.get("most_reported_provider")
        parts.append(f"{report_count} community report(s) nearby; {most_rep} is most-reported.")
    else:
        parts.append("No community reports found in this area.")

    return " ".join(parts)


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