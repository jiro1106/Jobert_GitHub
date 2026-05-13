from typing import List, Optional
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session

from ..db.connection import get_db
from ..models.schemas import (
    SignalReportCreate,
    SignalReportResponse,
    TowerResponse,
    SignalAnalysisRequest,
    SignalAnalysisResponse
)
from ..services.tower_matching_service import find_closest_towers
from ..services.scoring_service import calculate_signal_score
from ..services.recommendation_service import get_signal_recommendations
from ..db.tower_repository import get_towers_near_point
from ..db.report_repository import insert_report, get_reports_near_point
from ..utils.helpers import success_response, error_response


class SignalController:
    """Controller for handling signal-related operations"""

    async def get_nearby_towers(
        self,
        latitude: float,
        longitude: float,
        radiusKm: float = 5.0,
        limit: int = 50
    ) -> dict:
        """
        Get cell towers near a specific location
        """
        try:
            # Get towers from database
            towers = get_towers_near_point(latitude, longitude, radiusKm)

            # Limit results
            towers = towers[:limit] if limit > 0 else towers

            # Convert to response format
            towerResponses = [
                TowerResponse(
                    tower_id=tower.get('tower_id'),
                    latitude=tower.get('latitude'),
                    longitude=tower.get('longitude'),
                    provider_name=tower.get('provider_name'),
                    cell_id=tower.get('cell'),
                    area=tower.get('area'),
                    range_meters=tower.get('range_meters'),
                    average_signal=tower.get('average_signal')
                )
                for tower in towers
            ]

            return success_response(
                data=towerResponses,
                message=f"Found {len(towerResponses)} towers within {radiusKm}km"
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching towers: {str(e)}")

    async def submit_signal_report(
        self,
        report: SignalReportCreate
    ) -> dict:
        """
        Submit a crowdsourced signal report
        """
        try:
            # Create the report in database
            reportId = insert_report(
                {
                    "latitude": report.latitude,
                    "longitude": report.longitude,
                    "provider_name": report.provider_name,
                    "signal_feedback": report.signal_feedback,
                    "speed_feedback": report.speed_feedback,
                    "issue_type": report.issue_type,
                    "user_notes": report.user_notes,
                    "source_type": report.source_type or "user_report",
                }
            )

            return success_response(
                data={"report_id": reportId},
                message="Signal report submitted successfully"
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error submitting report: {str(e)}")

    async def get_signal_reports(
        self,
        latitude: float,
        longitude: float,
        radiusKm: float = 1.0,
        limit: int = 100
    ) -> dict:
        """
        Get signal reports near a location
        """
        try:
            reports = get_reports_near_point(latitude, longitude, radiusKm)

            # Limit results
            reports = reports[:limit] if limit > 0 else reports

            # Convert to response format
            reportResponses = [
                SignalReportResponse(
                    report_id=report.get('report_id'),
                    latitude=report.get('latitude'),
                    longitude=report.get('longitude'),
                    provider_name=report.get('provider_name'),
                    signal_feedback=report.get('signal_feedback'),
                    speed_feedback=report.get('speed_feedback'),
                    issue_type=report.get('issue_type'),
                    user_notes=report.get('user_notes'),
                    created_at=report.get('created_at')
                )
                for report in reports
            ]

            return success_response(
                data=reportResponses,
                message=f"Found {len(reportResponses)} reports within {radiusKm}km"
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

    async def analyze_signal_location(
        self,
        request: SignalAnalysisRequest
    ) -> dict:
        """
        Analyze signal quality at a specific location
        """
        try:
            # Get nearby towers
            towers = get_towers_near_point(
                request.latitude,
                request.longitude,
                request.radius_km or 5.0
            )

            # Get signal reports in area
            reports = get_reports_near_point(
                request.latitude,
                request.longitude,
                request.radius_km or 1.0
            )

            # Calculate signal score
            signalScore = calculate_signal_score(towers, reports)

            # Get recommendations
            recommendations = get_signal_recommendations(
                request.latitude,
                request.longitude,
                towers,
                reports
            )

            analysisResponse = SignalAnalysisResponse(
                location_lat=request.latitude,
                location_lng=request.longitude,
                signal_score=signalScore,
                nearby_towers=len(towers),
                recent_reports=len(reports),
                recommendations=recommendations
            )

            return success_response(
                data=analysisResponse,
                message="Signal analysis completed"
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error analyzing signal: {str(e)}")


# Create controller instance
signal_controller = SignalController()
