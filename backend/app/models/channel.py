from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChannelBase(BaseModel):
    """Base channel model."""
    channel_id: str
    name: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    video_count: Optional[int] = None


class ChannelCreate(BaseModel):
    """Request model for creating a channel."""
    channel_url: str = Field(..., description="YouTube channel URL or ID")


class ChannelInDB(ChannelBase):
    """Channel model stored in database."""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_synced: Optional[datetime] = None
    sync_status: str = "pending"  # pending, syncing, completed, error
    total_comments: int = 0
    total_videos_analyzed: int = 0


class ChannelResponse(ChannelInDB):
    """Response model for channel."""
    id: Optional[str] = Field(None, alias="_id")
    
    class Config:
        populate_by_name = True


class ChannelSyncStatus(BaseModel):
    """Sync status response."""
    channel_id: str
    sync_status: str
    last_synced: Optional[datetime] = None
    total_comments: int = 0
    total_videos_analyzed: int = 0
    progress: Optional[float] = None
    message: Optional[str] = None
