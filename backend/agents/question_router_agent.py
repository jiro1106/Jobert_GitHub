from __future__ import annotations

import re
from typing import Any

from ..db.anomaly_repository import get_recent_anomalies
from ..db.report_repository import get_recent_reports
from ..db.tower_repository import get_towers_near_point
from ..services.route_service import analyze_point, analyze_route


class QuestionRouterAgent:
    # parse user questions about signal coverage and route them to appropriate analysis tools

    def __init__(self):
        pass

    def answer_question(self, question: str, latitude: float | None = None, longitude: float | None = None, radius_km: float = 5.0) -> dict[str, Any]:
        # main entry point - takes question + optional location context
        question_lower = question.lower()

        # extract locations if provided in question (lat,lon format)
        extracted_locations = self._extract_coordinates(question)

        # determine intent
        intent = self._determine_intent(question_lower)

        # route to appropriate handler
        if intent == "route":
            return self._handle_route_question(question, extracted_locations)
        elif intent == "point":
            if latitude is not None and longitude is not None:
                return self._handle_point_question(question, latitude, longitude, radius_km)
            elif extracted_locations:
                lat, lon = extracted_locations[0]
                return self._handle_point_question(question, lat, lon, radius_km)
            else:
                return {"error": "Please provide a location (latitude/longitude) for point analysis"}
        elif intent == "recent":
            return self._handle_recent_reports_question(question)
        elif intent == "anomalies":
            return self._handle_anomalies_question(question)
        elif intent == "towers":
            if latitude is not None and longitude is not None:
                return self._handle_towers_question(question, latitude, longitude, radius_km)
            elif extracted_locations:
                lat, lon = extracted_locations[0]
                return self._handle_towers_question(question, lat, lon, radius_km)
            else:
                return {"error": "Please provide a location to search for towers"}
        else:
            return self._handle_generic_question(question, latitude, longitude, radius_km)

    def _extract_coordinates(self, text: str) -> list[tuple[float, float]]:
        # find lat,lon patterns in text
        # pattern: lat,lon or (lat, lon) or latitude:X longitude:Y etc
        results = []

        # try (lat, lon) pattern
        pattern = r'\(?\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)?'
        matches = re.findall(pattern, text)
        for lat_str, lon_str in matches:
            try:
                lat = float(lat_str)
                lon = float(lon_str)
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    results.append((lat, lon))
            except (ValueError, TypeError):
                pass

        return results

    def _determine_intent(self, question_lower: str) -> str:
        # categorize the user's intent based on keywords

        if any(word in question_lower for word in ["route", "path", "drive", "travel", "commute", "from", "to"]):
            return "route"

        if any(word in question_lower for word in ["tower", "infrastructure", "cell site", "base station", "equipment"]):
            return "towers"

        if any(word in question_lower for word in ["recent", "latest", "new", "latest reports", "user reports"]):
            return "recent"

        if any(word in question_lower for word in ["anomal", "issue", "problem", "conflict", "unreliable", "unexpected"]):
            return "anomalies"

        if any(word in question_lower for word in ["signal", "coverage", "strength", "provider", "which", "best", "here", "this location"]):
            return "point"

        return "generic"

    def _handle_point_question(self, question: str, latitude: float, longitude: float, radius_km: float) -> dict[str, Any]:
        # analyze a single point location
        result = analyze_point(latitude=latitude, longitude=longitude, radius_km=radius_km)
        result["context"] = {
            "query": question,
            "location": {"latitude": latitude, "longitude": longitude},
            "analysis_type": "point"
        }
        return result

    def _handle_route_question(self, question: str, locations: list[tuple[float, float]]) -> dict[str, Any]:
        # try to extract route endpoints from question or coordinates
        if len(locations) >= 2:
            origin = {"latitude": locations[0][0], "longitude": locations[0][1], "name": "Start"}
            destination = {"latitude": locations[1][0], "longitude": locations[1][1], "name": "End"}
            result = analyze_route(origin=origin, destination=destination)
            result["context"] = {
                "query": question,
                "analysis_type": "route"
            }
            return result
        else:
            return {"error": "Route analysis requires at least 2 coordinate pairs (start and end points)"}

    def _handle_recent_reports_question(self, question: str) -> dict[str, Any]:
        # fetch recent user reports
        limit = 20
        if "last" in question.lower():
            # try to extract number (e.g. "last 5 reports")
            match = re.search(r'last\s+(\d+)', question.lower())
            if match:
                limit = int(match.group(1))

        reports = get_recent_reports(limit=limit)
        return {
            "context": {"query": question, "analysis_type": "recent_reports"},
            "reports": reports,
            "total": len(reports)
        }

    def _handle_anomalies_question(self, question: str) -> dict[str, Any]:
        # fetch recent anomalies
        anomalies = get_recent_anomalies(limit=20)
        return {
            "context": {"query": question, "analysis_type": "anomalies"},
            "anomalies": anomalies,
            "total": len(anomalies)
        }

    def _handle_towers_question(self, question: str, latitude: float, longitude: float, radius_km: float) -> dict[str, Any]:
        # fetch towers near point
        towers = get_towers_near_point(latitude=latitude, longitude=longitude, radius_km=radius_km)
        return {
            "context": {"query": question, "location": {"latitude": latitude, "longitude": longitude}, "analysis_type": "towers"},
            "towers": towers,
            "total": len(towers),
            "search_radius_km": radius_km
        }

    def _handle_generic_question(self, question: str, latitude: float | None, longitude: float | None, radius_km: float) -> dict[str, Any]:
        # if we have location context, default to point analysis
        if latitude is not None and longitude is not None:
            return self._handle_point_question(question, latitude, longitude, radius_km)

        # otherwise return guidance
        return {
            "guidance": "I can help with signal coverage questions. Please provide:",
            "examples": [
                "Point analysis: 'What is signal strength at (10.5, 121.0)?'",
                "Route analysis: 'Analyze signal from (10.5, 121.0) to (10.7, 121.2)'",
                "Recent reports: 'Show recent user reports'",
                "Tower info: 'What towers are near (10.5, 121.0)?'",
                "Anomalies: 'Show recent analysis anomalies'"
            ]
        }
