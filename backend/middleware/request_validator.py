"""Request validation and sanitization middleware"""
from fastapi import Request, HTTPException, status
from typing import Callable, Any
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class RequestValidator:
    """Middleware for validating and sanitizing requests"""
    
    @staticmethod
    def add_request_id() -> Callable:
        """
        Middleware that adds a unique request ID to each request.
        
        Useful for logging and tracing.
        
        Usage:
            app.middleware("http")(RequestValidator.add_request_id())
        """
        async def middleware(request: Request, call_next):
            request_id = str(uuid.uuid4())
            request.state.request_id = request_id
            
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            
            return response
        return middleware
    
    @staticmethod
    def log_requests() -> Callable:
        """
        Middleware that logs all incoming requests.
        
        Logs: timestamp, method, path, status code, request ID
        
        Usage:
            app.middleware("http")(RequestValidator.log_requests())
        """
        async def middleware(request: Request, call_next):
            start_time = datetime.utcnow()
            
            request_id = getattr(request.state, "request_id", "unknown")
            path = request.url.path
            method = request.method
            
            response = await call_next(request)
            
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            logger.info(
                f"[{request_id}] {method} {path} - "
                f"Status: {response.status_code} - "
                f"Duration: {duration_ms:.2f}ms"
            )
            
            return response
        return middleware
    
    @staticmethod
    async def validate_json_request_size(
        request: Request,
        max_size_mb: int = 10
    ) -> None:
        """
        Validate that request body doesn't exceed max size.
        
        Args:
            request: FastAPI request object
            max_size_mb: Maximum allowed size in megabytes
            
        Raises:
            HTTPException: If request body too large
        """
        content_length = request.headers.get("content-length")
        if content_length:
            size_bytes = int(content_length)
            max_size_bytes = max_size_mb * 1024 * 1024
            
            if size_bytes > max_size_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Request body exceeds {max_size_mb}MB limit"
                )
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 500) -> str:
        """
        Sanitize string input.
        
        - Strip whitespace
        - Remove null bytes
        - Limit length
        
        Args:
            value: String to sanitize
            max_length: Maximum allowed length
            
        Returns:
            Sanitized string
        """
        if not isinstance(value, str):
            return str(value)
        
        # Remove null bytes
        value = value.replace("\x00", "")
        
        # Strip whitespace
        value = value.strip()
        
        # Limit length
        if len(value) > max_length:
            value = value[:max_length]
        
        return value
    
    @staticmethod
    def validate_email_format(email: str) -> bool:
        """
        Basic email format validation.
        
        Args:
            email: Email string to validate
            
        Returns:
            True if valid format, False otherwise
        """
        import re
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_coordinates(
        latitude: float,
        longitude: float
    ) -> bool:
        """
        Validate geographic coordinates.
        
        Args:
            latitude: Latitude (-90 to 90)
            longitude: Longitude (-180 to 180)
            
        Returns:
            True if valid, False otherwise
        """
        try:
            lat = float(latitude)
            lon = float(longitude)
            return -90 <= lat <= 90 and -180 <= lon <= 180
        except (TypeError, ValueError):
            return False
    
    @staticmethod
    def validate_radius(radius_km: float) -> bool:
        """
        Validate search radius.
        
        Args:
            radius_km: Radius in kilometers
            
        Returns:
            True if valid (0.1 to 100 km), False otherwise
        """
        try:
            radius = float(radius_km)
            return 0.1 <= radius <= 100
        except (TypeError, ValueError):
            return False
    
    @staticmethod
    def validate_signal_feedback(feedback: str) -> bool:
        """
        Validate signal feedback value.
        
        Args:
            feedback: Feedback string
            
        Returns:
            True if valid, False otherwise
        """
        valid_feedbacks = {
            "good", "excellent", "poor", "bad", "no_signal",
            "fast", "slow", "unstable", "stable", "great"
        }
        return feedback.lower() in valid_feedbacks
    
    @staticmethod
    def validate_provider_name(provider: str) -> bool:
        """
        Validate provider name.
        
        Args:
            provider: Provider name
            
        Returns:
            True if valid (Globe, Smart, DITO), False otherwise
        """
        valid_providers = {"Globe", "Smart", "DITO"}
        return provider in valid_providers
