from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class User(BaseModel):
    """User model for authenticated users."""
    id: Optional[str] = Field(None, alias="_id")
    email: str
    name: str
    image: Optional[str] = None
    google_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class UserCreate(BaseModel):
    """Schema for creating a user from Google OAuth."""
    email: str
    name: str
    image: Optional[str] = None
    google_id: str


class UserResponse(BaseModel):
    """Response schema for user data."""
    id: str
    email: str
    name: str
    image: Optional[str] = None
    created_at: datetime
