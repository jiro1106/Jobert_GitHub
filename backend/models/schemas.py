from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Signal Report Schemas
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

# Tower Schemas
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

# Signal Analysis Schemas
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

# API Response Schemas
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    timestamp: datetime = datetime.now()

# Error Response Schema
class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    timestamp: datetime = datetime.now()
