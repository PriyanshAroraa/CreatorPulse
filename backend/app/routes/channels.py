from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import List, Optional
from datetime import datetime

from app.database import get_database
from app.models import ChannelCreate, ChannelResponse, ChannelSyncStatus
from app.services import youtube_service, sync_service
from app.routes.auth import get_current_user, require_auth
from app.models.user import User

router = APIRouter()


@router.post("", response_model=ChannelResponse)
async def add_channel(channel: ChannelCreate, user: Optional[User] = Depends(get_current_user)):
    """Add a new YouTube channel to track for the authenticated user."""
    db = get_database()
    
    # Get user_id (use 'anonymous' as fallback for unauthenticated users)
    user_id = user.google_id if user else "anonymous"
    
    # Extract channel ID from URL
    channel_id = youtube_service.extract_channel_id(channel.channel_url)
    if not channel_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube channel URL or ID")
    
    # Check if already exists for this user
    existing = await db.channels.find_one({
        "channel_id": channel_id,
        "user_id": user_id
    })
    if existing:
        existing['_id'] = str(existing['_id'])
        return ChannelResponse(**existing)
    
    # Get channel info from YouTube
    channel_info = youtube_service.get_channel_info(channel_id)
    if not channel_info:
        raise HTTPException(status_code=404, detail="Channel not found on YouTube")
    
    # Save to database with user_id
    channel_data = {
        **channel_info,
        "user_id": user_id,  # Link to user
        "created_at": datetime.utcnow(),
        "last_synced": None,
        "sync_status": "pending",
        "total_comments": 0,
        "total_videos_analyzed": 0
    }
    
    result = await db.channels.insert_one(channel_data)
    channel_data['_id'] = str(result.inserted_id)
    
    return ChannelResponse(**channel_data)


@router.get("", response_model=List[ChannelResponse])
async def list_channels(user: Optional[User] = Depends(get_current_user)):
    """List all tracked channels for the authenticated user."""
    db = get_database()
    
    # If authenticated, filter by user_id
    query = {}
    if user:
        query["user_id"] = user.google_id
    
    channels = await db.channels.find(query).sort("created_at", -1).to_list(100)
    
    for channel in channels:
        channel['_id'] = str(channel['_id'])
    
    return [ChannelResponse(**c) for c in channels]


@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(channel_id: str, user: Optional[User] = Depends(get_current_user)):
    """Get channel details."""
    db = get_database()
    
    # Build query - if authenticated, ensure user owns channel
    query = {"channel_id": channel_id}
    if user:
        query["user_id"] = user.google_id
    
    channel = await db.channels.find_one(query)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    channel['_id'] = str(channel['_id'])
    return ChannelResponse(**channel)


@router.delete("/{channel_id}")
async def delete_channel(channel_id: str, user: Optional[User] = Depends(get_current_user)):
    """Delete a channel and all its data."""
    db = get_database()
    
    user_id = user.google_id if user else "anonymous"
    
    # Only delete if user owns it
    result = await db.channels.delete_one({
        "channel_id": channel_id,
        "user_id": user_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Delete related data (also filtered by user_id for safety)
    await db.videos.delete_many({"channel_id": channel_id, "user_id": user_id})
    await db.comments.delete_many({"channel_id": channel_id, "user_id": user_id})
    await db.commenters.delete_many({"channel_id": channel_id, "user_id": user_id})
    await db.reports.delete_many({"channel_id": channel_id, "user_id": user_id})
    await db.chat_history.delete_many({"channel_id": channel_id, "user_id": user_id})
    
    return {"message": "Channel and all related data deleted"}


@router.post("/{channel_id}/sync")
async def sync_channel(
    channel_id: str,
    background_tasks: BackgroundTasks,
    user: Optional[User] = Depends(get_current_user),
    days_back: int = 30,
    max_videos: int = 50
):
    """Trigger a sync for a channel."""
    db = get_database()
    
    user_id = user.google_id if user else "anonymous"
    
    # Check channel exists and user owns it
    channel = await db.channels.find_one({
        "channel_id": channel_id,
        "user_id": user_id
    })
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Check if already syncing
    if channel.get('sync_status') == 'syncing':
        raise HTTPException(status_code=400, detail="Sync already in progress")
    
    # Start sync in background with user_id
    background_tasks.add_task(
        sync_service.sync_channel,
        channel_id,
        user_id,  # Pass user_id to sync
        days_back,
        max_videos
    )
    
    return {
        "message": "Sync started",
        "channel_id": channel_id,
        "days_back": days_back,
        "max_videos": max_videos
    }


@router.get("/{channel_id}/sync-status", response_model=ChannelSyncStatus)
async def get_sync_status(channel_id: str, user: Optional[User] = Depends(get_current_user)):
    """Get sync status for a channel."""
    db = get_database()
    
    query = {"channel_id": channel_id}
    if user:
        query["user_id"] = user.google_id
    
    channel = await db.channels.find_one(query)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    return ChannelSyncStatus(
        channel_id=channel_id,
        sync_status=channel.get('sync_status', 'pending'),
        last_synced=channel.get('last_synced'),
        total_comments=channel.get('total_comments', 0),
        total_videos_analyzed=channel.get('total_videos_analyzed', 0)
    )
