"""Signal PH Backend API - Main Application"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from config.settings import get_settings
from middleware import (
    error_handler_middleware,
    setup_rate_limiter,
    RequestValidator,
)
from utils.helpers import success_response, error_response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load settings
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    
    Startup: Initialize resources
    Shutdown: Cleanup resources
    """
    logger.info("Signal PH API starting up...")
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"Debug mode: {settings.debug}")
    
    yield
    
    logger.info("Signal PH API shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="Signal PH API",
    description="Backend API for Signal PH - Crowdsourced cellular signal monitoring platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Configure CORS with settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if not settings.debug else ["*"],
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    expose_headers=["X-Request-ID"],
)

# Setup rate limiting (must be before adding to app)
setup_rate_limiter(app)

# Add request processing middleware (order matters - add in reverse)
# 1. Request ID tracking
app.middleware("http")(RequestValidator.add_request_id())

# 2. Request logging
app.middleware("http")(RequestValidator.log_requests())

# 3. Error handling (catches all exceptions)
app.middleware("http")(error_handler_middleware)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """
    Root endpoint - health check.
    
    Returns basic API status and environment info.
    """
    return success_response(
        data={
            "status": "running",
            "environment": settings.app_env,
            "version": "1.0.0"
        },
        message="Signal PH API is running"
    )


@app.get("/health", tags=["Health"])
async def health():
    """
    Health check endpoint for monitoring/load balancers.
    
    Returns 200 OK if service is healthy.
    """
    return success_response(
        data={"status": "healthy"},
        message="Service is healthy"
    )


@app.get("/info", tags=["Health"])
async def info():
    """
    API information and metadata endpoint.
    
    Returns version, environment, and configuration info.
    """
    return success_response(
        data={
            "name": "Signal PH API",
            "version": "1.0.0",
            "environment": settings.app_env,
            "debug": settings.debug,
            "rate_limiting": settings.rate_limit_enabled,
        },
        message="API Information"
    )


@app.get("/status", tags=["Health"])
async def status():
    """
    Detailed status endpoint.
    
    Returns detailed service status and configuration.
    """
    return success_response(
        data={
            "service": "Signal PH API",
            "status": "operational",
            "environment": settings.app_env,
            "features": {
                "authentication": True,
                "rate_limiting": settings.rate_limit_enabled,
                "crowdsourced_reports": True,
                "signal_analysis": True,
                "narrow_agents": True,
            },
            "limits": {
                "reports_per_hour": settings.rate_limit_reports_per_hour,
                "questions_per_hour": settings.rate_limit_questions_per_hour,
                "public_requests_per_hour": settings.rate_limit_public_per_hour,
            }
        },
        message="Service status"
    )


# ============================================================================
# Routes (commented out - ready for implementation)
# ============================================================================

# from routes import api
# from routes import auth as auth_routes
# from routes import reports as reports_routes
# from routes import analysis as analysis_routes
#
# app.include_router(auth_routes.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(reports_routes.router, prefix="/api/v1/reports", tags=["Reports"])
# app.include_router(analysis_routes.router, prefix="/api/v1/analysis", tags=["Analysis"])


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 Not Found errors"""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.warning(f"[{request_id}] 404 Not Found: {request.url.path}")
    
    return JSONResponse(
        status_code=404,
        content=error_response(
            message=f"Endpoint {request.url.path} not found",
            status_code=404,
            error_code="NOT_FOUND"
        )
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Handle 500 Internal Server errors"""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        f"[{request_id}] 500 Internal Server Error: {str(exc)}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content=error_response(
            message="Internal server error",
            status_code=500,
            error_code="INTERNAL_ERROR"
        )
    )


# ============================================================================
# Development Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
        reload=settings.debug,  # Auto-reload in development
    )

# app.include_router(api.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint - health check"""
    return success_response(
        data={"status": "running", "environment": settings.app_env},
        message="Signal PH API is running"
    )


@app.get("/health")
async def health():
    """Health check endpoint for monitoring"""
    return success_response(
        data={"status": "healthy"},
        message="Service is healthy"
    )


@app.get("/info")
async def info():
    """API information endpoint"""
    return success_response(
        data={
            "name": "Signal PH API",
            "version": "1.0.0",
            "environment": settings.app_env,
            "debug": settings.debug
        },
        message="API Information"
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 Not Found errors"""
    return JSONResponse(
        status_code=404,
        content=error_response(
            message=f"Endpoint {request.url.path} not found",
            status_code=404
        )
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Handle 500 Internal Server errors"""
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=error_response(
            message="Internal server error",
            status_code=500
        )
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower()
    )
