"""Signal PH Backend API - Main Application"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from config.settings import get_settings
from middleware.auth import error_handler_middleware
from utils.helpers import success_response, error_response

# Load settings
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    yield
    # Shutdown cleanup if needed


# Initialize FastAPI app
app = FastAPI(
    title="Signal PH API",
    description="Backend API for Signal PH - Crowdsourced cellular signal monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
allowed_origins = (
    ["*"] if settings.debug 
    else ["http://localhost:5173", "http://localhost:3000"]  # Update with frontend URLs
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handling middleware
app.middleware("http")(error_handler_middleware)


# Import routes
# from routes import api
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


# Import routes
# from routes import api
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
