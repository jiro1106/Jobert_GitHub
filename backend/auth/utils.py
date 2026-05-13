"""Authentication utilities - token parsing, validation, and generation"""
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt as jose_jwt
from config.settings import get_settings
from .types import CurrentUser, TokenPayload, TokenType, UserRole
from .config import JWT_ALGORITHM

settings = get_settings()


def decode_token(token: str) -> Optional[TokenPayload]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        TokenPayload if valid, None if invalid
    """
    try:
        payload = jose_jwt.decode(
            token,
            settings.supabase_key,
            algorithms=[JWT_ALGORITHM],
            audience="authenticated",  # Supabase JWT audience
        )
        return TokenPayload(**payload)
    except JWTError as e:
        print(f"Token decode error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error decoding token: {e}")
        return None


def extract_token_from_header(authorization: str) -> Optional[str]:
    """
    Extract token from Authorization header.
    
    Expected format: "Bearer <token>"
    
    Args:
        authorization: Authorization header value
        
    Returns:
        Token string if valid format, None otherwise
    """
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]


def get_user_from_token(token: str) -> Optional[CurrentUser]:
    """
    Extract current user context from token.
    
    Validates token and extracts user claims from Supabase JWT.
    
    Args:
        token: JWT token string
        
    Returns:
        CurrentUser if token valid and claims present, None otherwise
    """
    payload = decode_token(token)
    if not payload:
        return None
    
    try:
        user = CurrentUser(
            user_id=payload.sub,
            email=payload.email,
            role=payload.role,
            email_verified=True,  # Supabase handles verification
        )
        return user
    except Exception as e:
        print(f"Error creating CurrentUser from token: {e}")
        return None


def is_token_expired(token: str) -> bool:
    """
    Check if token is expired.
    
    Args:
        token: JWT token string
        
    Returns:
        True if token is expired, False otherwise
    """
    payload = decode_token(token)
    if not payload or not payload.exp:
        return True
    
    current_timestamp = datetime.utcnow().timestamp()
    return current_timestamp > payload.exp


def validate_token_type(token_payload: TokenPayload, expected_type: TokenType) -> bool:
    """
    Validate token type matches expected type.
    
    Args:
        token_payload: Decoded token payload
        expected_type: Expected token type (ACCESS or REFRESH)
        
    Returns:
        True if type matches, False otherwise
    """
    return token_payload.token_type == expected_type


def extract_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user_id (sub claim) from token.
    
    Args:
        token: JWT token string
        
    Returns:
        User ID if valid, None otherwise
    """
    payload = decode_token(token)
    return payload.sub if payload else None


def extract_email_from_token(token: str) -> Optional[str]:
    """
    Extract email from token.
    
    Args:
        token: JWT token string
        
    Returns:
        Email if valid, None otherwise
    """
    payload = decode_token(token)
    return payload.email if payload else None
