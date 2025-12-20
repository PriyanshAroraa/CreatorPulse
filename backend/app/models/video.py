from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VideoBase(BaseModel):
    """Base video model."""
    video_id: str
    channel_id: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    published_at: Optional[datetime] = None


class VideoInDB(VideoBase):
    """Video model stored in database."""
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    comment_count: int = 0
    analyzed_comment_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_synced: Optional[datetime] = None


class VideoResponse(VideoInDB):
    """Response model for video."""
    id: Optional[str] = Field(None, alias="_id")
    
    class Config:
        populate_by_name = True


class VideoWithStats(VideoResponse):
    """Video with comment statistics."""
    sentiment_breakdown: Optional[dict] = None  # {positive: x, neutral: y, negative: z}
    top_tags: Optional[list] = None
