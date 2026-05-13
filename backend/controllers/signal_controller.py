from typing import List, Optional
from fastapi import HTTPException

from ..models.schemas import (
    SignalReportCreate,
    SignalReportResponse,
    TowerResponse,
    SignalAnalysisRequest,
    SignalAnalysisResponse,
)
from ..db.tower_repository import get_towers_in_bbox
from ..db.report_repository import get_reports_in_bbox, insert_report
from ..services.tower_matching_service import find_closest_towers, build_bbox_around_point
from ..services.scoring_service import calculate_provider_scores
from ..services.recommendation_service import build_response_payload
from ..utils.helpers import success_response


class SignalController:
    """Controller for handling signal-related operations"""

    async def get_nearby_towers(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        limit: int = 50,
    ) -> dict:
        """
        Get cell towers near a specific location
        """
        try:
            # Build bounding box around point
            min_lat, min_lon, max_lat, max_lon = build_bbox_around_point(
                latitude=latitude,
                longitude=longitude,
                radius_km=radius_km,
            )

            # Get towers from database
            towers = get_towers_in_bbox(min_lat, min_lon, max_lat, max_lon)

            # Limit results
            towers = towers[:limit] if limit > 0 else towers

            # Convert to response format
            tower_responses = [
                TowerResponse(
                    tower_id=tower.get("tower_id"),
                    latitude=tower.get("latitude"),
                    longitude=tower.get("longitude"),
                    provider_name=tower.get("provider_name"),
                    cell_id=tower.get("cell"),
                    area=tower.get("area"),
                    range_meters=tower.get("range_meters"),
                    average_signal=tower.get("average_signal"),
                )
                for tower in towers
            ]

            return success_response(
                data=[t.model_dump() for t in tower_responses],
                message=f"Found {len(tower_responses)} towers within {radius_km}km",
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching towers: {str(e)}")

    async def submit_signal_report(
        self,
        report: SignalReportCreate,
    ) -> dict:
        """
        Submit a crowdsourced signal report
        """
        try:
            # Create the report in database
            report_data = {
                "latitude": report.latitude,
                "longitude": report.longitude,
                "provider_name": report.provider_name,
                "signal_feedback": report.signal_feedback,
                "speed_feedback": report.speed_feedback,
                "issue_type": report.issue_type,
                "user_notes": report.user_notes,
                "source_type": report.source_type or "user_report",
            }
            report_id = insert_report(report_data)

            return success_response(
                data={"report_id": report_id},
                message="Signal report submitted successfully",
            )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error submitting report: {str(e)}"
            )

    async def get_signal_reports(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 1.0,
        limit: int = 100,
    ) -> dict:
        """
        Get signal reports near a location
        """
        try:
            # Build bounding box around point
            min_lat, min_lon, max_lat, max_lon = build_bbox_around_point(
                latitude=latitude,
                longitude=longitude,
                radius_km=radius_km,
            )

            # Get reports from database
            reports = get_reports_in_bbox(min_lat, min_lon, max_lat, max_lon)

            # Limit results
            reports = reports[:limit] if limit > 0 else reports

            # Convert to response format
            report_responses = [
                SignalReportResponse(
                    report_id=report.get("report_id"),
                    latitude=report.get("latitude"),
                    longitude=report.get("longitude"),
                    provider_name=report.get("provider_name"),
                    signal_feedback=report.get("signal_feedback"),
                    speed_feedback=report.get("speed_feedback"),
                    issue_type=report.get("issue_type"),
                    user_notes=report.get("user_notes"),
                    created_at=report.get("created_at"),
                )
                for report in reports
            ]

            return success_response(
                data=[r.model_dump() for r in report_responses],
                message=f"Found {len(report_responses)} reports within {radius_km}km",
            )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error fetching reports: {str(e)}"
            )

    async def analyze_signal_location(
        self,
        request: SignalAnalysisRequest,
    ) -> dict:
        """
        Analyze signal quality at a specific location
        """
        try:
            # Build bounding box
            min_lat, min_lon, max_lat, max_lon = build_bbox_around_point(
                latitude=request.latitude,
                longitude=request.longitude,
                radius_km=request.radius_km or 5.0,
            )

            # Get nearby towers
            towers = get_towers_in_bbox(min_lat, min_lon, max_lat, max_lon)

            # Build route points (single point)
            route_points = [
                {
                    "point_order": 1,
                    "latitude": request.latitude,
                    "longitude": request.longitude,
                    "distance_from_origin_m": 0,
                }
            ]

            # Get signal reports in area
            report_min_lat, report_min_lon, report_max_lat, report_max_lon = (
                build_bbox_around_point(
                    latitude=request.latitude,
                    longitude=request.longitude,
                    radius_km=1.0,  # 1km for reports
                )
            )
            reports = get_reports_in_bbox(
                report_min_lat, report_min_lon, report_max_lat, report_max_lon
            )

            # Find closest towers
            closest_towers = find_closest_towers(
                route_points=route_points,
                candidate_towers=towers,
                max_distance_km=request.radius_km or 5.0,
            )

            # Calculate provider scores
            scores = calculate_provider_scores(
                closest_towers=closest_towers,
                nearby_reports=reports,
                route_points=route_points,
            )

            # Get best provider and recommendations
            best_provider = scores.get("best_provider", "Unknown")
            provider_scores = scores.get("provider_scores", {})
            weak_segments = scores.get("weak_segments", [])

            # Get recommendations
            recommendation_payload = build_response_payload(
                provider_scores=provider_scores,
                closest_towers=closest_towers,
                nearby_reports=reports,
                weak_segments=weak_segments,
            )

            # Calculate signal score
            signal_score = (
                provider_scores.get(best_provider, {}).get("score", 0.0)
                if best_provider != "Unknown"
                else 0.0
            )

            analysis_response = SignalAnalysisResponse(
                location_lat=request.latitude,
                location_lng=request.longitude,
                signal_score=signal_score,
                nearby_towers=len(towers),
                recent_reports=len(reports),
                recommendations=recommendation_payload.get("offline_readiness_alerts", []),
            )

            return success_response(
                data=analysis_response.model_dump(),
                message="Signal analysis completed",
            )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error analyzing signal: {str(e)}"
            )


# Create controller instance
signal_controller = SignalController()
