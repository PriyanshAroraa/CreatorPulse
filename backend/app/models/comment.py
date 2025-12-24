from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CommentBase(BaseModel):
    """Base comment model."""
    comment_id: str
    video_id: str
    channel_id: str
    author_name: str
    author_channel_id: str
    author_profile_image: Optional[str] = None
    text: str
    like_count: int = 0
    reply_count: int = 0
    published_at: datetime
    updated_at: Optional[datetime] = None
    parent_id: Optional[str] = None  # For replies


class CommentInDB(CommentBase):
    """Comment model stored in database."""
    sentiment: Optional[str] = None  # positive, neutral, negative
    sentiment_score: Optional[float] = None  # -1 to 1
    tags: List[str] = []
    is_bookmarked: bool = False
    is_reply: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CommentResponse(CommentInDB):
    """Response model for comment."""
    id: Optional[str] = Field(None, alias="_id")
    video_title: Optional[str] = None  # Populated from video lookup
    
    class Config:
        populate_by_name = True


class CommentFilter(BaseModel):
    """Filter parameters for comments."""
    sentiment: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    video_id: Optional[str] = None
    is_bookmarked: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = None
    page: int = 1
    limit: int = 50


class CommentBookmark(BaseModel):
    """Request to toggle bookmark."""
    is_bookmarked: bool


class CommentTags(BaseModel):
    """Request to update tags."""
    tags: List[str]


class CommentsPaginated(BaseModel):
    """Paginated comments response."""
    items: List[CommentResponse]
    total: int
    page: int
    limit: int
    pages: int
