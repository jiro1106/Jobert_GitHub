"""Utility functions and helpers"""
import re
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_coordinates(latitude: float, longitude: float) -> bool:
    """Validate latitude and longitude coordinates"""
    return -90 <= latitude <= 90 and -180 <= longitude <= 180


def validate_signal_strength(signal_strength: int) -> bool:
    """Validate signal strength value (typically -140 to 0 dBm)"""
    return -140 <= signal_strength <= 0


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """Format datetime to ISO format string"""
    if dt is None:
        dt = datetime.utcnow()
    return dt.isoformat() + "Z"


def parse_timestamp(timestamp_str: str) -> datetime:
    """Parse ISO format timestamp string"""
    return datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates in kilometers using Haversine formula
    """
    from math import radians, cos, sin, asin, sqrt
    
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return km


def safe_dict_get(data: Dict[str, Any], key: str, default: Any = None) -> Any:
    """Safely get value from dictionary with nested key support"""
    keys = key.split(".")
    value = data
    
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k)
            if value is None:
                return default
        else:
            return default
    
    return value


def sanitize_string(text: str) -> str:
    """Sanitize string by removing special characters"""
    return re.sub(r'[^a-zA-Z0-9\s-_.]', '', text)


def error_response(message: str, status_code: int = 400, data: Optional[Dict] = None) -> Dict:
    """Format error response"""
    response = {
        "error": message,
        "status_code": status_code,
        "timestamp": format_timestamp()
    }
    if data:
        response["data"] = data
    return response


def success_response(data: Any = None, message: str = "Success") -> Dict:
    """Format success response"""
    return {
        "message": message,
        "data": data,
        "timestamp": format_timestamp()
    }
