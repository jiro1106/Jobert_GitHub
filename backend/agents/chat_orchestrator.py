"""
Chat Orchestrator
Coordinates all backend agents to produce a rich, final chat response.
Matches the FinalChatbotResponse shape expected by the frontend.
"""
from __future__ import annotations

import uuid
from typing import Any

from ..services.route_service import analyze_point, analyze_route
from ..db.report_repository import get_recent_reports
from ..db.anomaly_repository import get_recent_anomalies
from ..db.tower_repository import get_towers_near_point

from .sim_recommender_agent import SimRecommenderAgent
from .coverage_explainer_agent import CoverageExplainerAgent
from .report_summarizer_agent import ReportSummarizerAgent
from .offline_readiness_agent import OfflineReadinessAgent
from .anomaly_agent import AnomalyAgent
from .tower_mapper_agent import TowerMapperAgent
from .question_router_agent import QuestionRouterAgent

# Approximate centers for common chat queries when the UI has not sent coordinates yet.
_PH_PLACE_HINTS: tuple[tuple[str, float, float, str], ...] = (
    ("cebu city", 10.2920, 123.9024, "Cebu City"),
    ("mactan", 10.3077, 123.9794, "Lapu-Lapu / Mactan"),
    ("cebu", 10.3157, 123.8854, "Cebu"),
    ("edsa", 14.5746, 121.0437, "EDSA (Metro Manila)"),
    ("metro manila", 14.5995, 120.9842, "Metro Manila"),
    ("manila", 14.5995, 120.9842, "Manila"),
    ("baguio", 16.4023, 120.5960, "Baguio"),
    ("tarlac", 15.4807, 120.5980, "Tarlac"),
    ("la union", 16.6159, 120.3166, "La Union"),
    ("davao", 7.1907, 125.4553, "Davao City"),
    ("iloilo", 10.7202, 122.5621, "Iloilo City"),
    ("gensan", 6.1164, 125.1716, "General Santos"),
    ("bicol", 13.6218, 123.1948, "Bicol region"),
)


class ChatOrchestrator:
    """
    Runs the full agent pipeline for a user chat message.

    Flow:
        1. QuestionRouterAgent determines intent
        2. Execute appropriate backend tool (analyze_point / analyze_route / etc.)
        3. Run all specialist agents on the analysis result
        4. Synthesize a FinalChatbotResponse-shaped payload
    """

    def __init__(self):
        self.router = QuestionRouterAgent()
        self.sim_recommender = SimRecommenderAgent()
        self.coverage_explainer = CoverageExplainerAgent()
        self.report_summarizer = ReportSummarizerAgent()
        self.offline_readiness = OfflineReadinessAgent()
        self.anomaly = AnomalyAgent()
        self.tower_mapper = TowerMapperAgent()

    @staticmethod
    def _infer_place_from_prompt(prompt: str) -> tuple[float, float, str] | None:
        p = prompt.lower()
        for key, lat, lon, label in sorted(_PH_PLACE_HINTS, key=lambda row: -len(row[0])):
            if key in p:
                return lat, lon, label
        return None

    def answer(
        self,
        prompt: str,
        latitude: float | None = None,
        longitude: float | None = None,
        radius_km: float = 5.0,
        origin: dict[str, Any] | None = None,
        destination: dict[str, Any] | None = None,
        route_points: list[dict[str, Any]] | None = None,
        current_analysis_result: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        trace_id = str(uuid.uuid4())
        tool_calls: list[dict[str, str]] = []

        res_lat, res_lon = latitude, longitude
        if res_lat is None or res_lon is None:
            inferred = self._infer_place_from_prompt(prompt)
            if inferred:
                res_lat, res_lon, _place_label = inferred

        # ── Step 1: Route the question ──
        intent = self._determine_intent(prompt, res_lat, res_lon, origin, destination)
        if intent == "explain_current_result" and res_lat is not None and res_lon is not None:
            intent = "analyze_point"

        # ── Step 2: Execute tool ──
        analysis_result: dict[str, Any] | None = current_analysis_result

        if intent == "analyze_route" and origin and destination:
            try:
                analysis_result = analyze_route(
                    origin=origin,
                    destination=destination,
                    route_points=route_points,
                    radius_km=radius_km,
                )
                tool_calls.append({"name": "analyze_route", "status": "success"})
            except Exception as err:
                tool_calls.append({"name": "analyze_route", "status": "error"})
                return self._error_response(trace_id, intent, str(err), tool_calls)

        elif intent == "analyze_point" and res_lat is not None and res_lon is not None:
            try:
                analysis_result = analyze_point(
                    latitude=res_lat,
                    longitude=res_lon,
                    radius_km=radius_km,
                )
                tool_calls.append({"name": "analyze_point", "status": "success"})
            except Exception as err:
                tool_calls.append({"name": "analyze_point", "status": "error"})
                return self._error_response(trace_id, intent, str(err), tool_calls)

        elif intent == "get_recent_reports":
            try:
                reports = get_recent_reports(limit=20)
                tool_calls.append({"name": "get_recent_reports", "status": "success"})
                return {
                    "intent": intent,
                    "answer": f"Here are the {len(reports)} most recent community signal reports.",
                    "recommended_provider": "Unknown",
                    "confidence": "high",
                    "analysis_result": {"reports": reports, "total": len(reports)},
                    "agent_outputs": {},
                    "map_layers": None,
                    "tool_calls": tool_calls,
                    "warnings": [],
                    "trace_id": trace_id,
                }
            except Exception as err:
                return self._error_response(trace_id, intent, str(err), tool_calls)

        elif intent == "get_anomalies":
            try:
                anomalies = get_recent_anomalies(limit=20)
                tool_calls.append({"name": "get_anomalies", "status": "success"})
                return {
                    "intent": intent,
                    "answer": f"Found {len(anomalies)} recent signal anomaly record(s) in the database.",
                    "recommended_provider": "Unknown",
                    "confidence": "high",
                    "analysis_result": {"anomalies": anomalies, "total": len(anomalies)},
                    "agent_outputs": {},
                    "map_layers": None,
                    "tool_calls": tool_calls,
                    "warnings": [],
                    "trace_id": trace_id,
                }
            except Exception as err:
                return self._error_response(trace_id, intent, str(err), tool_calls)

        elif intent == "get_towers" and res_lat is not None and res_lon is not None:
            try:
                towers = get_towers_near_point(
                    latitude=res_lat, longitude=res_lon, radius_km=radius_km
                )
                tool_calls.append({"name": "get_towers_near_point", "status": "success"})
                return {
                    "intent": intent,
                    "answer": f"Found {len(towers)} cell tower(s) within {radius_km} km of your location.",
                    "recommended_provider": "Unknown",
                    "confidence": "high",
                    "analysis_result": {"towers": towers[:100], "total": len(towers)},
                    "agent_outputs": {},
                    "map_layers": None,
                    "tool_calls": tool_calls,
                    "warnings": [],
                    "trace_id": trace_id,
                }
            except Exception as err:
                return self._error_response(trace_id, intent, str(err), tool_calls)

        # No analysis result and no data-only intent
        if analysis_result is None:
            return {
                "intent": intent,
                "answer": (
                    "I need a location or route to analyze. "
                    "Please provide coordinates or select a route on the map."
                ),
                "recommended_provider": "Unknown",
                "confidence": "low",
                "analysis_result": None,
                "agent_outputs": {},
                "map_layers": None,
                "tool_calls": tool_calls,
                "warnings": ["No location or analysis data available."],
                "trace_id": trace_id,
            }

        # ── Step 3: Run all specialist agents ──
        agent_outputs: dict[str, Any] = {}

        try:
            agent_outputs["sim_recommender"] = self.sim_recommender.run(analysis_result)
        except Exception as err:
            print(f"[ChatOrchestrator] sim_recommender error: {err}")

        try:
            agent_outputs["coverage_explainer"] = self.coverage_explainer.run(analysis_result)
        except Exception as err:
            print(f"[ChatOrchestrator] coverage_explainer error: {err}")

        try:
            agent_outputs["report_summarizer"] = self.report_summarizer.run(analysis_result)
        except Exception as err:
            print(f"[ChatOrchestrator] report_summarizer error: {err}")

        try:
            agent_outputs["offline_readiness"] = self.offline_readiness.run(analysis_result)
        except Exception as err:
            print(f"[ChatOrchestrator] offline_readiness error: {err}")

        try:
            agent_outputs["anomaly"] = self.anomaly.run(analysis_result)
        except Exception as err:
            print(f"[ChatOrchestrator] anomaly error: {err}")

        try:
            tower_map_output = self.tower_mapper.run(analysis_result)
            agent_outputs["tower_mapper"] = tower_map_output
            map_layers = tower_map_output.get("map_layers")
        except Exception as err:
            print(f"[ChatOrchestrator] tower_mapper error: {err}")
            map_layers = None

        # ── Step 4: Build final answer ──
        sim_rec = agent_outputs.get("sim_recommender", {})
        coverage = agent_outputs.get("coverage_explainer", {})
        offline = agent_outputs.get("offline_readiness", {})
        anomaly = agent_outputs.get("anomaly", {})

        recommended_provider = sim_rec.get("recommended_provider", "Unknown")
        confidence = sim_rec.get("confidence", "medium")
        warnings = offline.get("offline_alerts", [])

        # Build the answer text
        answer = self._build_answer_text(
            prompt=prompt,
            intent=intent,
            sim_rec=sim_rec,
            coverage=coverage,
            offline=offline,
            anomaly=anomaly,
        )

        return {
            "intent": intent,
            "answer": answer,
            "recommended_provider": recommended_provider,
            "confidence": confidence,
            "analysis_result": analysis_result,
            "agent_outputs": agent_outputs,
            "map_layers": map_layers,
            "tool_calls": tool_calls,
            "warnings": warnings,
            "trace_id": trace_id,
        }

    # ── Helpers ──

    def _determine_intent(
        self,
        prompt: str,
        latitude: float | None,
        longitude: float | None,
        origin: dict | None,
        destination: dict | None,
    ) -> str:
        p = prompt.lower()

        if origin and destination:
            return "analyze_route"
        if any(w in p for w in ["anomal", "unusual", "suspicious", "flagged"]):
            return "get_anomalies"
        if any(w in p for w in ["recent report", "user report", "community report", "latest report"]):
            return "get_recent_reports"
        if any(w in p for w in ["tower", "cell site", "base station", "infrastructure"]):
            return "get_towers" if latitude is not None else "explain_current_result"
        if any(w in p for w in ["route", "trip", "drive", "travel", "from", "to", "commute"]):
            if origin and destination:
                return "analyze_route"
            return "explain_current_result"
        if latitude is not None and longitude is not None:
            return "analyze_point"
        return "explain_current_result"

    def _build_answer_text(
        self,
        prompt: str,
        intent: str,
        sim_rec: dict[str, Any],
        coverage: dict[str, Any],
        offline: dict[str, Any],
        anomaly: dict[str, Any],
    ) -> str:
        parts = []

        # Lead with SIM recommendation
        rec_summary = sim_rec.get("summary", "")
        if rec_summary:
            parts.append(rec_summary)

        # Add coverage explanation
        cov_exp = coverage.get("coverage_explanation", "")
        if cov_exp and cov_exp != rec_summary:
            parts.append(cov_exp)

        # Add offline readiness if relevant
        offline_summary = offline.get("summary", "")
        if offline_summary and offline.get("readiness_level") not in ("minimal", None):
            parts.append(offline_summary)

        # Add anomaly note if detected
        if anomaly.get("anomaly_status") in ("possible", "logged"):
            parts.append(f"⚠️ Note: {anomaly.get('explanation', '')}")

        rep = agent_outputs.get("report_summarizer", {})
        if isinstance(rep, dict):
            rep_summary = str(rep.get("summary", "") or "").strip()
            if rep.get("has_reports") and rep_summary:
                blob = " ".join(parts)
                if rep_summary not in blob:
                    parts.append(rep_summary)

        if not parts:
            return (
                "Analysis complete. "
                f"Best provider for this area: {sim_rec.get('recommended_provider', 'Unknown')}."
            )

        return " ".join(parts)

    def _error_response(
        self,
        trace_id: str,
        intent: str,
        error_msg: str,
        tool_calls: list[dict],
    ) -> dict[str, Any]:
        return {
            "intent": intent,
            "answer": f"An error occurred while analyzing: {error_msg}",
            "recommended_provider": "Unknown",
            "confidence": "low",
            "analysis_result": None,
            "agent_outputs": {},
            "map_layers": None,
            "tool_calls": tool_calls,
            "warnings": [error_msg],
            "trace_id": trace_id,
        }
