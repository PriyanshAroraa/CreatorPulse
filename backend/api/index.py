from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.database import connect_to_mongo, close_mongo_connection

# Import routes
from app.routes import channels, videos, comments, analytics, community, tags, reports, chat

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="CreatorPulse API",
    description="API for analyzing YouTube comments with AI-powered sentiment analysis and insights",
    version="1.0.0"
)

# CORS middleware - allow all origins for Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using "*" for origins
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "CreatorPulse API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Export handler for Vercel
handler = app
