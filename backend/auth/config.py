"""Authentication configuration and constants"""
from datetime import timedelta
from typing import Final

# JWT Settings
JWT_ALGORITHM: Final[str] = "HS256"
JWT_EXPIRATION_HOURS: Final[int] = 24
JWT_REFRESH_EXPIRATION_DAYS: Final[int] = 7

# Token names and header
ACCESS_TOKEN_NAME: Final[str] = "access_token"
REFRESH_TOKEN_NAME: Final[str] = "refresh_token"
AUTHORIZATION_HEADER: Final[str] = "Authorization"
BEARER_PREFIX: Final[str] = "Bearer "

# Rate limiting
RATE_LIMIT_REPORTS: Final[str] = "10/hour"  # 10 reports per hour per user
RATE_LIMIT_QUESTIONS: Final[str] = "30/hour"  # 30 questions per hour per user
RATE_LIMIT_PUBLIC_ENDPOINTS: Final[str] = "100/hour"  # General public limit

# User roles
USER_ROLE_USER: Final[str] = "user"
USER_ROLE_ADMIN: Final[str] = "admin"
USER_ROLE_MODERATOR: Final[str] = "moderator"

# Session timeouts
SESSION_TIMEOUT_MINUTES: Final[int] = 30
INACTIVITY_TIMEOUT_MINUTES: Final[int] = 60
