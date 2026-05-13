from fastapi import APIRouter, Depends, Query
from typing import Optional

from ..controllers.signal_controller import signal_controller
from ..models.schemas import SignalReportCreate, SignalAnalysisRequest

router = APIRouter()

# Signal Analysis Routes
@router.get("/signals/analyze")
async def analyze_signal_location(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location"),
    radiusKm: Optional[float] = Query(5.0, description="Search radius in kilometers")
):
    """Analyze signal quality at a specific location"""
    request = SignalAnalysisRequest(latitude=latitude, longitude=longitude, radius_km=radiusKm)
    return await signal_controller.analyze_signal_location(request)

# Tower Routes
@router.get("/towers/nearby")
async def get_nearby_towers(
    latitude: float = Query(..., description="Latitude of the center point"),
    longitude: float = Query(..., description="Longitude of the center point"),
    radiusKm: Optional[float] = Query(5.0, description="Search radius in kilometers"),
    limit: Optional[int] = Query(50, description="Maximum number of towers to return")
):
    """Get cell towers near a specific location"""
    return await signal_controller.get_nearby_towers(latitude, longitude, radiusKm, limit)

# Signal Report Routes
@router.post("/reports")
async def submit_signal_report(report: SignalReportCreate):
    """Submit a crowdsourced signal report"""
    return await signal_controller.submit_signal_report(report)

@router.get("/reports/nearby")
async def get_nearby_reports(
    latitude: float = Query(..., description="Latitude of the center point"),
    longitude: float = Query(..., description="Longitude of the center point"),
    radiusKm: Optional[float] = Query(1.0, description="Search radius in kilometers"),
    limit: Optional[int] = Query(100, description="Maximum number of reports to return")
):
    """Get signal reports near a specific location"""
    return await signal_controller.get_signal_reports(latitude, longitude, radiusKm, limit)
