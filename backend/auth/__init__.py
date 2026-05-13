"""Authentication module - JWT, token validation, and user context"""
from .types import (
    CurrentUser,
    TokenPayload,
    TokenType,
    UserRole,
    TokenResponse,
    SignupRequest,
    LoginRequest,
    AuthError,
)
from .utils import (
    decode_token,
    extract_token_from_header,
    get_user_from_token,
    is_token_expired,
    validate_token_type,
    extract_user_id_from_token,
    extract_email_from_token,
)
from .config import (
    JWT_ALGORITHM,
    AUTHORIZATION_HEADER,
    BEARER_PREFIX,
    RATE_LIMIT_REPORTS,
    RATE_LIMIT_QUESTIONS,
)

__all__ = [
    # Types
    "CurrentUser",
    "TokenPayload",
    "TokenType",
    "UserRole",
    "TokenResponse",
    "SignupRequest",
    "LoginRequest",
    "AuthError",
    # Utils
    "decode_token",
    "extract_token_from_header",
    "get_user_from_token",
    "is_token_expired",
    "validate_token_type",
    "extract_user_id_from_token",
    "extract_email_from_token",
    # Config
    "JWT_ALGORITHM",
    "AUTHORIZATION_HEADER",
    "BEARER_PREFIX",
    "RATE_LIMIT_REPORTS",
    "RATE_LIMIT_QUESTIONS",
]
