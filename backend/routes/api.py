from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import traceback

from ..controllers.signal_controller import signal_controller
from ..models.schemas import (
    SignalReportCreate,
    SignalAnalysisRequest,
    RouteAnalysisRequest,
    ChatRequest,
)
from ..services.route_service import analyze_point, analyze_route
from ..services.response_transformer import (
    transform_route_analysis_to_forecast,
    calculate_stats_aggregate,
    get_provider_scores_for_route,
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
    except Exception as exc:
        print(f"[route/forecast] ERROR: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Route forecast failed: {str(exc)}")


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
        scope_norm = (scope or "route").lower()
        if scope_norm == "origin":
            raw_analysis = analyze_point(
                latitude=origin_lat,
                longitude=origin_lon,
                radius_km=5.0,
            )
        elif scope_norm in ("dest", "destination"):
            raw_analysis = analyze_point(
                latitude=dest_lat,
                longitude=dest_lon,
                radius_km=5.0,
            )
        elif scope_norm in ("route", "this_route"):
            raw_analysis = analyze_route(
                origin={"latitude": origin_lat, "longitude": origin_lon, "name": "Origin"},
                destination={"latitude": dest_lat, "longitude": dest_lon, "name": "Destination"},
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid scope. Use 'route', 'origin', or 'dest'.",
            )

        # Extract provider scores
        provider_data = get_provider_scores_for_route(raw_analysis)
        
        return success_response(
            data=provider_data,
            message="Provider scores retrieved successfully"
        )
    except Exception as exc:
        print(f"[providers/scores] ERROR: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Provider scores failed: {str(exc)}")


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
    except Exception as exc:
        print(f"[stats] ERROR: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(exc)}")


# ============= Chat/Agent Routes =============
@router.post("/chat")
async def post_chat_message(request: ChatRequest):
    """
    Submit a chat message and get AI agent response
    
    The agent uses ChatOrchestrator to run multiple specialist agents:
    - SIM Recommender
    - Coverage Explainer
    - Report Summarizer
    - Offline Readiness
    - Anomaly Detector
    - Tower Mapper
    """
    from ..agents.chat_orchestrator import ChatOrchestrator
    import uuid

    try:
        orchestrator = ChatOrchestrator()
        
        # Extract context if available
        context = request.context or {}
        lat = context.get("latitude")
        lon = context.get("longitude")
        radius = context.get("radius_km", 5.0)
        origin = context.get("origin")
        destination = context.get("destination")
        route_points = context.get("route_points")
        current_analysis = context.get("current_analysis_result")
        
        # Run orchestrator
        agent_response = orchestrator.answer(
            prompt=request.message,
            latitude=lat,
            longitude=lon,
            radius_km=radius,
            origin=origin,
            destination=destination,
            route_points=route_points,
            current_analysis_result=current_analysis
        )
        
        # Map to ChatResponse shape
        conversation_id = context.get("conversation_id") or str(uuid.uuid4())

        intent_key = str(agent_response.get("intent") or "signal")
        citation_labels = {
            "analyze_route": "Route Analysis Agent",
            "analyze_point": "Route Analysis Agent",
            "get_recent_reports": "Community Reports Agent",
            "get_anomalies": "Anomaly Watch Agent",
            "get_towers": "Tower Mapper Agent",
            "explain_current_result": "Signal Assistant",
        }
        citation = citation_labels.get(intent_key, f"{intent_key.replace('_', ' ').title()} Agent")

        return success_response(
            data={
                "message": {
                    "id": str(uuid.uuid4()),
                    "role": "bot",
                    "text": agent_response.get("answer", "Analysis complete."),
                    "citation": citation,
                    "agent_outputs": agent_response.get("agent_outputs"),
                    "analysis_result": agent_response.get("analysis_result"),
                    "map_layers": agent_response.get("map_layers"),
                },
                "conversation_id": conversation_id,
                "agent_raw": agent_response # Include full response for debugging/rich UI
            },
            message="Chat response generated successfully"
        )
    except Exception as exc:
        print(f"[chat] ERROR: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat response failed: {str(exc)}")
