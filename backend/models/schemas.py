from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ============= Signal Report Schemas =============
class SignalReportBase(BaseModel):
    latitude: float
    longitude: float
    provider_name: Optional[str] = None
    signal_feedback: Optional[str] = None
    speed_feedback: Optional[str] = None
    issue_type: Optional[str] = None
    user_notes: Optional[str] = None
    source_type: Optional[str] = "user_report"


class SignalReportCreate(SignalReportBase):
    pass


class SignalReportResponse(SignalReportBase):
    report_id: int
    created_at: datetime


# ============= Tower Schemas =============
class TowerBase(BaseModel):
    latitude: float
    longitude: float
    provider_name: Optional[str] = None
    cell_id: Optional[int] = None
    area: Optional[int] = None
    range_meters: Optional[float] = None
    average_signal: Optional[int] = None


class TowerResponse(TowerBase):
    tower_id: int


# ============= Signal Analysis Schemas =============
class SignalAnalysisRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: Optional[float] = 5.0


class SignalAnalysisResponse(BaseModel):
    location_lat: float
    location_lng: float
    signal_score: float
    nearby_towers: int
    recent_reports: int
    recommendations: List[str]


# ============= Route Analysis Request Schemas =============
class RouteCoordinate(BaseModel):
    latitude: float
    longitude: float
    name: Optional[str] = None


class RouteAnalysisRequest(BaseModel):
    origin: RouteCoordinate
    destination: RouteCoordinate
    route_points: Optional[List[RouteCoordinate]] = None
    radius_km: Optional[float] = 5.0


# ============= Route Forecast Schemas =============
class RouteEndpoint(BaseModel):
    label: str
    lat: float
    lng: float


class TripSummary(BaseModel):
    distanceKm: float
    drivingTimeMin: int
    strongSignalPct: float
    deadZoneCount: int


class SimRecommendation(BaseModel):
    provider: str  # "globe" | "smart" | "dito"
    name: str
    reason: str
    score: float


class SignalGap(BaseModel):
    id: str
    km: float
    level: str  # "dead" | "patchy"
    name: str
    description: str


class ProviderScore(BaseModel):
    provider: str  # "globe" | "smart" | "dito"
    name: str
    fullName: str
    score: float
    delta: float
    network: str  # "5G" | "4G LTE" | "3G"
    avgSpeedMbps: float
    strongSignalPct: float
    confidencePct: float
    sparklineData: List[float]


class RouteForecast(BaseModel):
    origin: RouteEndpoint
    destination: RouteEndpoint
    summary: TripSummary
    recommendation: SimRecommendation
    gaps: List[SignalGap]
    providers: List[ProviderScore]


# ============= Stats Schemas =============
class StatCell(BaseModel):
    value: str
    label: str
    sublabel: str


class StatsResponse(BaseModel):
    stats: List[StatCell]


# ============= Chat Schemas =============
class ChatMessage(BaseModel):
    id: str
    role: str  # "bot" | "user"
    text: str
    citation: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    message: ChatMessage
    conversation_id: str


# ============= API Response Schemas =============
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    timestamp: datetime = datetime.now()


# ============= Error Response Schema =============
class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    timestamp: datetime = datetime.now()
