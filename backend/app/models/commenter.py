from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CommenterBase(BaseModel):
    """Base commenter model."""
    author_channel_id: str
    channel_id: str  # The YouTube channel they commented on
    author_name: str
    author_profile_image: Optional[str] = None


class CommenterInDB(CommenterBase):
    """Commenter model stored in database."""
    comment_count: int = 1
    total_likes_received: int = 0
    first_comment_at: datetime
    last_comment_at: datetime
    videos_commented_on: List[str] = []  # List of video IDs
    streak_days: int = 0
    is_repeat: bool = False  # Has commented more than once
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CommenterResponse(CommenterInDB):
    """Response model for commenter."""
    id: Optional[str] = Field(None, alias="_id")
    
    class Config:
        populate_by_name = True


class TopCommenter(BaseModel):
    """Top commenter summary."""
    author_channel_id: str
    author_name: str
    author_profile_image: Optional[str] = None
    comment_count: int
    total_likes_received: int
    videos_count: int
    streak_days: int


class CommunityStats(BaseModel):
    """Community statistics."""
    total_commenters: int
    unique_commenters: int
    repeat_commenters: int
    repeat_percentage: float
    avg_comments_per_user: float
    top_commenters: List[TopCommenter]
