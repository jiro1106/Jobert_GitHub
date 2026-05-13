from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI(
    title="Signal PH API",
    description="Backend API for Signal PH - Crowdsourced cellular signal monitoring",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes
# from routes import api

# Include routes
# app.include_router(api.router)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Signal PH API is running"}

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
