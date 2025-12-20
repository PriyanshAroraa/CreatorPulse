from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Create FastAPI app first
app = FastAPI(
    title="CreatorPulse API",
    description="API for analyzing YouTube comments with AI-powered sentiment analysis and insights",
    version="1.0.0"
)

# CORS middleware - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)


# Explicit OPTIONS handler for preflight requests
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


# Health check that works without database
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "CreatorPulse API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Now import and register routes (after app is created)
try:
    from app.database import connect_to_mongo, close_mongo_connection
    from app.routes import channels, videos, comments, analytics, community, tags, reports, chat
    
    # Register routes
    app.include_router(channels.router, prefix="/api/channels", tags=["Channels"])
    app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
    app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
    app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
    app.include_router(community.router, prefix="/api/community", tags=["Community"])
    app.include_router(tags.router, prefix="/api/tags", tags=["Tags"])
    app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
    app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
    
    @app.on_event("startup")
    async def startup():
        try:
            await connect_to_mongo()
        except Exception as e:
            print(f"Database connection error: {e}")
    
    @app.on_event("shutdown")
    async def shutdown():
        try:
            await close_mongo_connection()
        except Exception as e:
            print(f"Database disconnect error: {e}")

except Exception as e:
    print(f"Import error: {e}")
    
    @app.get("/api/{rest_of_path:path}")
    async def fallback_api(rest_of_path: str):
        return JSONResponse(
            status_code=500,
            content={"error": f"API initialization failed: {str(e)}"}
        )


# Export handler for Vercel
handler = app
