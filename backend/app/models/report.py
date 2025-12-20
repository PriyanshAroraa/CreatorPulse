from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ReportBase(BaseModel):
    """Base report model."""
    channel_id: str
    title: str
    date_from: datetime
    date_to: datetime


class ReportCreate(BaseModel):
    """Request to create a report."""
    channel_id: str
    title: Optional[str] = None
    date_from: datetime
    date_to: datetime


class ReportData(BaseModel):
    """Report content data."""
    # Overview
    total_comments: int = 0
    total_videos: int = 0
    unique_commenters: int = 0
    
    # Sentiment
    sentiment_breakdown: Dict[str, int] = {}  # {positive: x, neutral: y, negative: z}
    sentiment_percentage: Dict[str, float] = {}
    
    # Tags
    tag_breakdown: Dict[str, int] = {}
    
    # Top content
    top_videos: List[Dict[str, Any]] = []
    top_commenters: List[Dict[str, Any]] = []
    
    # Trends
    comments_over_time: List[Dict[str, Any]] = []
    sentiment_over_time: List[Dict[str, Any]] = []


class ReportInDB(ReportBase):
    """Report model stored in database."""
    data: ReportData
    status: str = "generating"  # generating, completed, error
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class ReportResponse(ReportInDB):
    """Response model for report."""
    id: Optional[str] = Field(None, alias="_id")
    
    class Config:
        populate_by_name = True


class ReportList(BaseModel):
    """List of reports."""
    items: List[ReportResponse]
    total: int
