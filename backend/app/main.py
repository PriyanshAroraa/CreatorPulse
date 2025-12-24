from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database import connect_to_mongo, close_mongo_connection

# Import routes
from app.routes import channels, videos, comments, analytics, community, tags, reports, chat, auth

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


# Create FastAPI app
app = FastAPI(
    title="YouTube Comment Analyzer API",
    description="API for analyzing YouTube comments with AI-powered sentiment analysis and insights",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url, 
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://creatorpulse-yt.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(channels.router, prefix="/api/channels", tags=["Channels"])
app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(community.router, prefix="/api/community", tags=["Community"])
app.include_router(tags.router, prefix="/api/tags", tags=["Tags"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "YouTube Comment Analyzer API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
