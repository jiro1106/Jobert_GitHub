"""Authentication module for Signal PH Backend"""
from .config import JWT_ALGORITHM, JWT_EXPIRATION_HOURS
from .types import UserRole, TokenType, CurrentUser, TokenPayload
from .utils import (
    decode_token,
    extract_token_from_header,
    get_user_from_token,
    is_token_expired,
)

__all__ = [
    "JWT_ALGORITHM",
    "JWT_EXPIRATION_HOURS",
    "UserRole",
    "TokenType",
    "CurrentUser",
    "TokenPayload",
    "decode_token",
    "extract_token_from_header",
    "get_user_from_token",
    "is_token_expired",
]
