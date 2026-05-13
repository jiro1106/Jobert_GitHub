"""Rate limiting middleware and utilities"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request
from auth.config import (
    RATE_LIMIT_REPORTS,
    RATE_LIMIT_QUESTIONS,
    RATE_LIMIT_PUBLIC_ENDPOINTS,
)

# Initialize rate limiter with default key function (client IP)
limiter = Limiter(key_func=get_remote_address)


def setup_rate_limiter(app: FastAPI) -> None:
    """
    Setup rate limiter on FastAPI app.
    
    Must be called before registering routes.
    
    Args:
        app: FastAPI application instance
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def get_rate_limit_for_user(user_id: str, endpoint_type: str) -> str:
    """
    Get rate limit string for a specific user and endpoint type.
    
    Can be customized per user (e.g., premium users get higher limits).
    
    Args:
        user_id: User identifier
        endpoint_type: Type of endpoint ('reports', 'questions', 'public')
        
    Returns:
        Rate limit string (e.g., "10/hour")
    """
    # TODO: Query user table for premium status and adjust limits
    
    if endpoint_type == "reports":
        return RATE_LIMIT_REPORTS
    elif endpoint_type == "questions":
        return RATE_LIMIT_QUESTIONS
    else:
        return RATE_LIMIT_PUBLIC_ENDPOINTS


# Rate limit key functions for different scenarios
def get_rate_limit_key_by_ip(request: Request) -> str:
    """Rate limit by IP address"""
    return get_remote_address(request)


def get_rate_limit_key_by_user(request: Request) -> str:
    """
    Rate limit by user ID (from token).
    
    Falls back to IP if user not authenticated.
    """
    # Try to extract user_id from token in Authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            from auth.utils import extract_user_id_from_token
            user_id = extract_user_id_from_token(token)
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass
    
    # Fallback to IP
    return f"ip:{get_remote_address(request)}"


# Common rate limit decorators
LIMIT_REPORT_SUBMISSION = f"{RATE_LIMIT_REPORTS}"
LIMIT_QUESTION_SUBMISSION = f"{RATE_LIMIT_QUESTIONS}"
LIMIT_PUBLIC_ENDPOINT = f"{RATE_LIMIT_PUBLIC_ENDPOINTS}"
