from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .agents.question_router_agent import QuestionRouterAgent
from .db.anomaly_repository import insert_anomaly_log
from .db.connection import get_connection
from .db.report_repository import get_recent_reports, insert_report
from .db.schema import create_database
from .services.route_service import analyze_point, analyze_route

app = FastAPI(title="SignalPH API", version="0.1.0")


def dump_model(model: Any) -> dict[str, Any]:
    model_dump = getattr(model, "model_dump", None)
    if callable(model_dump):
        return model_dump()
    return model.dict()


class PointAnalysisRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = Field(default=5.0, ge=0.1, le=50.0)


class RouteCoordinate(BaseModel):
    latitude: float
    longitude: float


class RouteAnalysisRequest(BaseModel):
    origin: RouteCoordinate
    destination: RouteCoordinate
    route_points: list[RouteCoordinate] | None = None
    radius_km: float = Field(default=5.0, ge=0.1, le=50.0)


class ReportCreateRequest(BaseModel):
    latitude: float
    longitude: float
    provider_name: str | None = None
    signal_feedback: str | None = None
    speed_feedback: str | None = None
    issue_type: str | None = None
    user_notes: str | None = None
    source_type: str = "user_report"


class AgentQuestionRequest(BaseModel):
    question: str
    latitude: float | None = None
    longitude: float | None = None
    radius_km: float = Field(default=5.0, ge=0.1, le=50.0)


@app.on_event("startup")
def startup_event() -> None:
    create_database()


@app.get("/health")
def health() -> dict[str, str]:
    connection = get_connection()
    connection.close()
    return {"status": "ok"}


@app.post("/analyze/point")
def analyze_point_endpoint(payload: PointAnalysisRequest) -> dict[str, Any]:
    return analyze_point(payload.latitude, payload.longitude, payload.radius_km)


@app.post("/analyze/route")
def analyze_route_endpoint(payload: RouteAnalysisRequest) -> dict[str, Any]:
    route_points = (
        [dump_model(point) for point in payload.route_points]
        if payload.route_points is not None
        else None
    )
    return analyze_route(
        origin=dump_model(payload.origin),
        destination=dump_model(payload.destination),
        route_points=route_points,
        radius_km=payload.radius_km,
    )


@app.post("/reports")
def create_report(payload: ReportCreateRequest) -> dict[str, Any]:
    report_id = insert_report(dump_model(payload))
    return {"report_id": report_id, "status": "saved"}


@app.get("/reports/recent")
def recent_reports(limit: int = 20) -> list[dict[str, Any]]:
    return get_recent_reports(limit=limit)


@app.post("/admin/anomalies")
def create_anomaly(payload: dict[str, Any]) -> dict[str, Any]:
    if "latitude" not in payload or "longitude" not in payload:
        raise HTTPException(status_code=400, detail="latitude and longitude are required")

    anomaly_id = insert_anomaly_log(payload)
    return {"anomaly_id": anomaly_id, "status": "saved"}


@app.post("/agent/question")
def agent_question(payload: AgentQuestionRequest) -> dict[str, Any]:
    # web chatbot endpoint - routes questions through agent to appropriate analysis
    agent = QuestionRouterAgent()
    return agent.answer_question(
        question=payload.question,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_km=payload.radius_km
    )