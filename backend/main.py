"""Signal PH Backend API - Main Application"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .config.settings import get_settings
from .middleware.auth import error_handler_middleware
from .services.route_service import analyze_point, analyze_route
from .utils.helpers import error_response, success_response

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

allowed_origins = (
    ["*"] if settings.debug else ["http://localhost:5173", "http://localhost:3000"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(error_handler_middleware)


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


@app.get("/")
async def root():
    return success_response(
        data={"status": "running", "environment": settings.app_env},
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


@app.post("/analyze/point")
async def analyze_point_endpoint(payload: PointAnalysisRequest):
    result = analyze_point(
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_km=payload.radius_km,
    )
    return success_response(data=result, message="Point analysis complete")


@app.post("/analyze/route")
async def analyze_route_endpoint(payload: RouteAnalysisRequest):
    route_points = [point.model_dump() for point in payload.route_points] if payload.route_points else None
    result = analyze_route(
        origin=payload.origin.model_dump(),
        destination=payload.destination.model_dump(),
        route_points=route_points,
        radius_km=payload.radius_km,
    )
    return success_response(data=result, message="Route analysis complete")


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )
