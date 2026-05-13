"""Authentication types and data models"""
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles in the system"""
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"


class TokenType(str, Enum):
    """Types of tokens"""
    ACCESS = "access"
    REFRESH = "refresh"


class CurrentUser(BaseModel):
    """Current authenticated user context"""
    user_id: str = Field(..., description="Unique user identifier from Supabase")
    email: str = Field(..., description="User email address")
    email_verified: bool = Field(default=False, description="Whether email is verified")
    phone: Optional[str] = Field(default=None, description="User phone number")
    name: Optional[str] = Field(default=None, description="User display name")
    role: UserRole = Field(default=UserRole.USER, description="User role")
    created_at: Optional[datetime] = Field(default=None, description="Account creation timestamp")
    last_login: Optional[datetime] = Field(default=None, description="Last login timestamp")
    is_active: bool = Field(default=True, description="Whether account is active")

    class Config:
        use_enum_values = False


class TokenPayload(BaseModel):
    """JWT token payload structure"""
    sub: str = Field(..., description="Subject (user_id)")
    email: str = Field(..., description="User email")
    role: UserRole = Field(default=UserRole.USER, description="User role")
    token_type: TokenType = Field(default=TokenType.ACCESS, description="Token type")
    iat: Optional[int] = Field(default=None, description="Issued at timestamp")
    exp: Optional[int] = Field(default=None, description="Expiration timestamp")
    aud: Optional[str] = Field(default="signalph", description="Audience")


class TokenResponse(BaseModel):
    """OAuth2 token response"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: Optional[str] = Field(default=None, description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type (always 'bearer')")
    expires_in: int = Field(..., description="Token expiration in seconds")


class SignupRequest(BaseModel):
    """User signup request"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")
    name: Optional[str] = Field(default=None, description="Display name")


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="Password")


class RefreshTokenRequest(BaseModel):
    """Token refresh request"""
    refresh_token: str = Field(..., description="Refresh token")


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr = Field(..., description="User email address")


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, description="New password")


class AuthError(BaseModel):
    """Authentication error response"""
    detail: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Error code for client handling")
    status_code: int = Field(..., description="HTTP status code")
