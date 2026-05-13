"""Middleware module - authentication, rate limiting, validation"""
from .auth import error_handler_middleware, get_error_code_from_status
from .dependencies import (
    get_current_user,
    get_current_user_optional,
    require_admin,
    require_moderator,
)
from .rate_limiter import (
    limiter,
    setup_rate_limiter,
    get_rate_limit_for_user,
    get_rate_limit_key_by_ip,
    get_rate_limit_key_by_user,
    LIMIT_REPORT_SUBMISSION,
    LIMIT_QUESTION_SUBMISSION,
    LIMIT_PUBLIC_ENDPOINT,
)
from .request_validator import RequestValidator

__all__ = [
    # Auth middleware
    "error_handler_middleware",
    "get_error_code_from_status",
    # Dependencies (route protections)
    "get_current_user",
    "get_current_user_optional",
    "require_admin",
    "require_moderator",
    "security",
    # Rate limiting
    "limiter",
    "setup_rate_limiter",
    "get_rate_limit_for_user",
    "get_rate_limit_key_by_ip",
    "get_rate_limit_key_by_user",
    "LIMIT_REPORT_SUBMISSION",
    "LIMIT_QUESTION_SUBMISSION",
    "LIMIT_PUBLIC_ENDPOINT",
    # Request validation
    "RequestValidator",
]
