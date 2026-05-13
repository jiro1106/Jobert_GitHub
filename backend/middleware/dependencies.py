"""Dependency injection utilities for FastAPI route protection"""
from fastapi import Depends, HTTPException, status, Header
from typing import Optional
from auth import (
    CurrentUser,
    extract_token_from_header,
    get_user_from_token,
    is_token_expired,
    UserRole,
)


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> CurrentUser:
    """
    Dependency that validates JWT token and returns current user.
    
    Usage in routes:
        @router.get("/protected")
        async def protected_route(current_user: CurrentUser = Depends(get_current_user)):
            return {"user_id": current_user.user_id}
    
    Args:
        authorization: Authorization header value
        
    Returns:
        CurrentUser with user context
        
    Raises:
        HTTPException: If token missing, invalid, or expired
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if expired
    if is_token_expired(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Decode and extract user
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    return user


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
) -> Optional[CurrentUser]:
    """
    Dependency for optional authentication.
    
    Returns user if token present and valid, None otherwise.
    
    Usage in routes:
        @router.get("/semi-protected")
        async def semi_protected(user: CurrentUser | None = Depends(get_current_user_optional)):
            if user:
                return {"message": f"Hello {user.email}"}
            return {"message": "Hello guest"}
    
    Args:
        authorization: Authorization header value (optional)
        
    Returns:
        CurrentUser if authenticated, None if not
    """
    if not authorization:
        return None
    
    token = extract_token_from_header(authorization)
    if not token:
        return None
    
    if is_token_expired(token):
        return None
    
    user = get_user_from_token(token)
    if user and user.is_active:
        return user
    
    return None


async def require_admin(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """
    Dependency that requires ADMIN role.
    
    Usage in routes:
        @router.delete("/admin/users/{user_id}")
        async def delete_user(admin: CurrentUser = Depends(require_admin)):
            # Only admins can call this
            pass
    
    Args:
        current_user: Current user from get_current_user dependency
        
    Returns:
        CurrentUser if user has admin role
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires admin privileges",
        )
    return current_user


async def require_moderator(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """
    Dependency that requires MODERATOR or ADMIN role.
    
    Args:
        current_user: Current user from get_current_user dependency
        
    Returns:
        CurrentUser if user has moderator or admin role
        
    Raises:
        HTTPException: If user doesn't have required role
    """
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires moderator privileges",
        )
    return current_user
