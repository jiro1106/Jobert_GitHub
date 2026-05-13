from fastapi import APIRouter, Query
from typing import Optional

from ..controllers.signal_controller import signal_controller
from ..models.schemas import (
    SignalReportCreate,
    SignalAnalysisRequest,
    RouteAnalysisRequest,
    ChatRequest,
)
from ..services.route_service import analyze_route
from ..services.response_transformer import (
    transform_route_analysis_to_forecast,
    calculate_stats_aggregate,
    get_provider_scores_for_route,
    generate_chat_response,
)
from ..utils.helpers import success_response

router = APIRouter()


# ============= Signal Analysis Routes =============
@router.get("/signals/analyze")
async def analyze_signal_location(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location"),
    radius_km: Optional[float] = Query(5.0, description="Search radius in kilometers"),
):
    """Analyze signal quality at a specific location"""
    request = SignalAnalysisRequest(
        latitude=latitude, longitude=longitude, radius_km=radius_km
    )
    return await signal_controller.analyze_signal_location(request)


# ============= Tower Routes =============
@router.get("/towers/nearby")
async def get_nearby_towers(
    latitude: float = Query(..., description="Latitude of the center point"),
    longitude: float = Query(..., description="Longitude of the center point"),
    radius_km: Optional[float] = Query(5.0, description="Search radius in kilometers"),
    limit: Optional[int] = Query(50, description="Maximum number of towers to return"),
):
    """Get cell towers near a specific location"""
    return await signal_controller.get_nearby_towers(
        latitude, longitude, radius_km, limit
    )


# ============= Signal Report Routes =============
@router.post("/reports")
async def submit_signal_report(report: SignalReportCreate):
    """Submit a crowdsourced signal report"""
    return await signal_controller.submit_signal_report(report)


@router.get("/reports/nearby")
async def get_nearby_reports(
    latitude: float = Query(..., description="Latitude of the center point"),
    longitude: float = Query(..., description="Longitude of the center point"),
    radius_km: Optional[float] = Query(1.0, description="Search radius in kilometers"),
    limit: Optional[int] = Query(100, description="Maximum number of reports to return"),
):
    """Get signal reports near a specific location"""
    return await signal_controller.get_signal_reports(
        latitude, longitude, radius_km, limit
    )


# ============= Route Forecast Routes (Frontend Landing Page) =============
@router.post("/route/forecast")
async def get_route_forecast(request: RouteAnalysisRequest):
    """
    Get route forecast with provider recommendations and signal gaps
    
    This endpoint analyzes signal coverage along a route and returns:
    - Origin and destination endpoints
    - Trip summary (distance, time, signal strength)
    - Best provider recommendation
    - Signal gaps and dead zones
    - Per-provider scores and metrics
    """
    try:
        # Call the raw analysis service
        raw_analysis = analyze_route(
            origin={
                "latitude": request.origin.latitude,
                "longitude": request.origin.longitude,
                "name": request.origin.name or "Origin",
            },
            destination={
                "latitude": request.destination.latitude,
                "longitude": request.destination.longitude,
                "name": request.destination.name or "Destination",
            },
            route_points=[
                p.model_dump() for p in request.route_points
            ] if request.route_points else None,
            radius_km=request.radius_km,
        )
        
        # Transform to frontend RouteForecast shape
        forecast = transform_route_analysis_to_forecast(raw_analysis)
        
        return success_response(
            data=forecast,
            message="Route forecast generated successfully"
        )
    except Exception as e:
        return success_response(
            data={"error": str(e)},
            message="Error generating route forecast"
        )


@router.get("/providers/scores")
async def get_provider_scores(
    origin_lat: float = Query(...),
    origin_lon: float = Query(...),
    dest_lat: float = Query(...),
    dest_lon: float = Query(...),
    scope: Optional[str] = Query("route", description="'route', 'origin', or 'dest'"),
):
    """
    Get provider scores for a route or location
    
    Args:
        origin_lat, origin_lon: Origin coordinates
        dest_lat, dest_lon: Destination coordinates
        scope: 'route' (entire route), 'origin' (origin only), 'dest' (destination only)
    """
    try:
        # Analyze the route
        raw_analysis = analyze_route(
            origin={"latitude": origin_lat, "longitude": origin_lon, "name": "Origin"},
            destination={"latitude": dest_lat, "longitude": dest_lon, "name": "Destination"},
        )
        
        # Extract provider scores
        provider_data = get_provider_scores_for_route(raw_analysis)
        
        return success_response(
            data=provider_data,
            message="Provider scores retrieved successfully"
        )
    except Exception as e:
        return success_response(
            data={"error": str(e)},
            message="Error retrieving provider scores"
        )


@router.get("/stats")
async def get_platform_stats():
    """
    Get aggregate platform statistics
    
    Returns stats like number of provinces, daily reports, major providers, forecast accuracy
    """
    try:
        stats_data = calculate_stats_aggregate()
        
        return success_response(
            data=stats_data,
            message="Platform statistics retrieved successfully"
        )
    except Exception as e:
        return success_response(
            data={"error": str(e)},
            message="Error retrieving platform statistics"
        )


# ============= Chat/Agent Routes =============
@router.post("/chat")
async def post_chat_message(request: ChatRequest):
    """
    Submit a chat message and get AI agent response
    
    The agent can answer questions about:
    - Provider coverage recommendations
    - Route analysis
    - Signal quality expectations
    - Dead zones and weak areas
    """
    try:
        response = generate_chat_response(
            user_message=request.message,
            conversation_id=request.context.get("conversation_id") if request.context else None
        )
        
        return success_response(
            data=response,
            message="Chat response generated successfully"
        )
    except Exception as e:
        return success_response(
            data={"error": str(e)},
            message="Error generating chat response"
        )
