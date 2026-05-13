"""Authentication types and Pydantic models"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class UserRole(str, Enum):
    """User role enum"""
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"
    GUEST = "guest"


class TokenType(str, Enum):
    """Token type enum"""
    ACCESS = "access_token"
    REFRESH = "refresh_token"


class CurrentUser(BaseModel):
    """Current authenticated user context"""
    user_id: str
    email: str
    role: UserRole = UserRole.USER
    email_verified: bool = False


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str  # subject (user_id)
    email: str
    role: UserRole = UserRole.USER
    token_type: TokenType = TokenType.ACCESS
    exp: Optional[int] = None  # expiration timestamp
    iat: Optional[int] = None  # issued at


class LoginRequest(BaseModel):
    """Login request schema"""
    email: str
    password: str


class SignupRequest(BaseModel):
    """Signup request schema"""
    email: str
    password: str
    name: Optional[str] = None


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
