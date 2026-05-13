"""Authentication and authorization middleware"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from backend.utils.helpers import error_response


async def error_handler_middleware(request: Request, call_next):
    """Middleware to handle errors"""
    try:
        response = await call_next(request)
        return response
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                message=exc.detail,
                status_code=exc.status_code
            )
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="Internal server error",
                status_code=500
            )
        )
