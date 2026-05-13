"""Authentication and authorization middleware"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from utils.helpers import error_response
import logging

logger = logging.getLogger(__name__)


async def error_handler_middleware(request: Request, call_next):
    """
    Middleware to handle all errors with consistent JSON format.
    
    Catches:
    - HTTPException: Expected app errors
    - RateLimitExceeded: Rate limiting violations
    - Generic exceptions: Unexpected server errors
    
    Returns consistent error response format:
        {
            "status": "error",
            "message": "...",
            "error_code": "...",
            "status_code": 400
        }
    """
    try:
        response = await call_next(request)
        return response
    
    except HTTPException as exc:
        # Expected application errors (auth, validation, etc.)
        request_id = getattr(request.state, "request_id", "unknown")
        logger.warning(
            f"[{request_id}] HTTP Exception: {exc.status_code} - {exc.detail}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                message=exc.detail,
                status_code=exc.status_code,
                error_code=get_error_code_from_status(exc.status_code)
            )
        )
    
    except Exception as exc:
        # Unexpected server errors
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error(
            f"[{request_id}] Unexpected error: {str(exc)}",
            exc_info=True
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="Internal server error",
                status_code=500,
                error_code="INTERNAL_ERROR"
            )
        )


def get_error_code_from_status(status_code: int) -> str:
    """
    Map HTTP status code to error code for client handling.
    
    Args:
        status_code: HTTP status code
        
    Returns:
        Error code string for client logic
    """
    error_code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR",
    }
    return error_code_map.get(status_code, "UNKNOWN_ERROR")
