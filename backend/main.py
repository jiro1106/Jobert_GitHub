"""Signal PH Backend API - Main Application"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .config.settings import get_settings
from .middleware.auth import error_handler_middleware
<<<<<<< HEAD
from .observability import setup_tracing
=======
from .routes.api import router as api_router
>>>>>>> a87032d (merged backend_develop, auth+middle, and nat branch)
from .services.route_service import analyze_point, analyze_route
from .utils.helpers import error_response, success_response
from pydantic import BaseModel, Field

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    yield


app = FastAPI(
    title="Signal PH API",
    description="Backend API for Signal PH - Crowdsourced cellular signal monitoring",
    version="1.0.0",
    lifespan=lifespan,
)


tracer = setup_tracing(app)

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]

if settings.debug:
    allowed_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False if "*" in allowed_origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(error_handler_middleware)

# Include API routes
app.include_router(api_router, prefix="/api", tags=["signals"])

<<<<<<< HEAD
# ---------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------


=======

# ============= Request Models =============
>>>>>>> a87032d (merged backend_develop, auth+middle, and nat branch)
class PointAnalysisRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = Field(default=5.0, ge=0.1, le=50.0)


class RouteCoordinate(BaseModel):
    latitude: float
    longitude: float
    name: str | None = None


class RouteAnalysisRequest(BaseModel):
    origin: RouteCoordinate
    destination: RouteCoordinate
    route_points: list[RouteCoordinate] | None = None
    radius_km: float = Field(default=5.0, ge=0.1, le=50.0)


<<<<<<< HEAD
class MCPToolCallRequest(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------
# Basic API Routes
# ---------------------------------------------------------------------


=======
# ============= Advanced Analysis Endpoints =============
@app.post("/analyze/point")
async def analyze_point_endpoint(payload: PointAnalysisRequest):
    """Analyze signal quality at a specific point"""
    result = analyze_point(
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_km=payload.radius_km,
    )
    return success_response(data=result, message="Point analysis complete")


@app.post("/analyze/route")
async def analyze_route_endpoint(payload: RouteAnalysisRequest):
    """Analyze signal quality along a route"""
    route_points = (
        [point.model_dump() for point in payload.route_points]
        if payload.route_points
        else None
    )
    result = analyze_route(
        origin=payload.origin.model_dump(),
        destination=payload.destination.model_dump(),
        route_points=route_points,
        radius_km=payload.radius_km,
    )
    return success_response(data=result, message="Route analysis complete")


# ============= Health Check & Info Endpoints =============
>>>>>>> a87032d (merged backend_develop, auth+middle, and nat branch)
@app.get("/")
async def root():
    return success_response(
        data={
            "status": "running",
            "environment": settings.app_env,
        },
        message="Signal PH API is running",
    )


@app.get("/health")
async def health():
    return success_response(
        data={"status": "healthy"},
        message="Service is healthy",
    )


@app.get("/info")
async def info():
    return success_response(
        data={
            "name": "Signal PH API",
            "version": "1.0.0",
            "environment": settings.app_env,
            "debug": settings.debug,
        },
        message="API Information",
    )


<<<<<<< HEAD
# ---------------------------------------------------------------------
# Analysis Routes
# ---------------------------------------------------------------------


@app.post("/analyze/point")
async def analyze_point_endpoint(payload: PointAnalysisRequest):
    result = analyze_point(
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_km=payload.radius_km,
    )

    return success_response(
        data=result,
        message="Point analysis complete",
    )


@app.post("/analyze/route")
async def analyze_route_endpoint(payload: RouteAnalysisRequest):
    route_points = (
        [point.model_dump() for point in payload.route_points]
        if payload.route_points
        else None
    )

    result = analyze_route(
        origin=payload.origin.model_dump(),
        destination=payload.destination.model_dump(),
        route_points=route_points,
        radius_km=payload.radius_km,
    )

    return success_response(
        data=result,
        message="Route analysis complete",
    )


# ---------------------------------------------------------------------
# MCP HTTP Bridge
# ---------------------------------------------------------------------
# Browser-based agents cannot call stdio MCP directly.
# This endpoint gives the frontend/browser LFM agent a clean HTTP bridge
# to call your allowed MCP-style backend tools.


@app.post("/mcp/tools/call")
async def call_mcp_tool(payload: MCPToolCallRequest):
    tool_name = payload.name
    args = payload.arguments

    try:
        if tool_name == "analyze_point":
            result = analyze_point(
                latitude=args["latitude"],
                longitude=args["longitude"],
                radius_km=args.get("radius_km", 5.0),
            )

            return {
                "tool": tool_name,
                "status": "success",
                "data": result,
            }

        if tool_name == "analyze_route":
            result = analyze_route(
                origin=args["origin"],
                destination=args["destination"],
                route_points=args.get("route_points"),
                radius_km=args.get("radius_km", 5.0),
            )

            return {
                "tool": tool_name,
                "status": "success",
                "data": result,
            }

        if tool_name == "submit_signal_report":
            # Import here so the app can still start even if the report
            # repository changes during development.
            try:
                from .db.report_repository import insert_crowdsourced_report

                insert_crowdsourced_report(args)

                return {
                    "tool": tool_name,
                    "status": "success",
                    "data": {
                        "message": "Signal report submitted.",
                    },
                }

            except ImportError:
                raise HTTPException(
                    status_code=501,
                    detail=(
                        "submit_signal_report is listed as an MCP tool, "
                        "but insert_crowdsourced_report was not found in "
                        "db.report_repository."
                    ),
                )

        raise HTTPException(
            status_code=400,
            detail=f"Unknown MCP tool: {tool_name}",
        )

    except KeyError as error:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required argument: {error}",
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"MCP tool call failed: {str(error)}",
        )


# ---------------------------------------------------------------------
# Error Handlers
# ---------------------------------------------------------------------


=======
# ============= Exception Handlers =============
>>>>>>> a87032d (merged backend_develop, auth+middle, and nat branch)
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content=error_response(
            message=f"Endpoint {request.url.path} not found",
            status_code=404,
        ),
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content=error_response(
            message="Internal server error",
            status_code=500,
        ),
    )

from .services.llm_client import call_lfm_json


@app.post("/agent/llm-test")
async def llm_test(payload: dict[str, Any]):
    with tracer.start_as_current_span("agent.llm_test") as span:
        prompt = payload.get("prompt", "Return {\"status\":\"ok\"}")

        span.set_attribute("agent.prompt_length", len(prompt))

        result = call_lfm_json(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are the SignalPH router. Return valid JSON only. "
                        "Use keys: intent, answer, tool_calls."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ]
        )

        span.set_attribute("agent.intent", result.get("intent", "unknown"))

        return {
            "status": "success",
            "data": result,
        }


# ---------------------------------------------------------------------
# Local Run
# ---------------------------------------------------------------------


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )
