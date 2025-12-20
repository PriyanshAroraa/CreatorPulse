from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TagBase(BaseModel):
    """Base tag model."""
    name: str
    color: str = "#6366f1"  # Default indigo
    description: Optional[str] = None


class TagCreate(TagBase):
    """Request to create a tag."""
    pass


class TagUpdate(BaseModel):
    """Request to update a tag."""
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class TagInDB(TagBase):
    """Tag model stored in database."""
    is_system: bool = False  # System tags cannot be deleted
    is_active: bool = True
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TagResponse(TagInDB):
    """Response model for tag."""
    id: Optional[str] = Field(None, alias="_id")
    
    class Config:
        populate_by_name = True


# Default system tags
DEFAULT_TAGS = [
    {"name": "viral_moment", "color": "#ef4444", "description": "Potential viral content", "is_system": True},
    {"name": "new_opportunity", "color": "#22c55e", "description": "Business or collab opportunity", "is_system": True},
    {"name": "content_goldmine", "color": "#f59e0b", "description": "Content ideas from audience", "is_system": True},
    {"name": "urgent_response", "color": "#dc2626", "description": "Needs immediate attention", "is_system": True},
    {"name": "collaboration", "color": "#8b5cf6", "description": "Collaboration request", "is_system": True},
    {"name": "feedback", "color": "#06b6d4", "description": "Constructive feedback", "is_system": True},
    {"name": "question", "color": "#3b82f6", "description": "Question from viewer", "is_system": True},
    {"name": "appreciation", "color": "#10b981", "description": "Positive appreciation", "is_system": True},
]
