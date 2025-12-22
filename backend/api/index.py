from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# Create FastAPI app
app = FastAPI(title="CreatorPulse API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{path:path}")
async def options_handler(path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.get("/")
async def root():
    return {"message": "CreatorPulse API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/test")
async def test():
    return {"test": "ok"}

# Try to import routes
import_error = None
try:
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    from app.database import connect_to_mongo, close_mongo_connection, get_database
    from app.routes import channels, videos, comments, analytics, community, tags, reports, chat, auth
    
    app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
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
        
except Exception as e:
    import_error = str(e)
    
    @app.get("/api/error")
    async def error_endpoint():
        return {"import_error": import_error}
    
    @app.get("/api/channels")
    async def channels_fallback():
        return {"error": f"Initialization failed: {import_error}"}
