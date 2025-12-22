from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from datetime import datetime

from app.services import analytics_service
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/channel/{channel_id}/summary")
async def get_channel_summary(
    channel_id: str,
    user: Optional[User] = Depends(get_current_user)
):
    """Get overall channel summary statistics."""
    user_id = user.google_id if user else None
    return await analytics_service.get_channel_summary(channel_id, user_id)


@router.get("/channel/{channel_id}/sentiment")
async def get_sentiment_breakdown(
    channel_id: str,
    user: Optional[User] = Depends(get_current_user),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    """Get sentiment distribution for a channel."""
    user_id = user.google_id if user else None
    return await analytics_service.get_sentiment_breakdown(
        channel_id, user_id, date_from, date_to
    )


@router.get("/channel/{channel_id}/tags")
async def get_tag_breakdown(
    channel_id: str,
    user: Optional[User] = Depends(get_current_user),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    """Get tag distribution for a channel."""
    user_id = user.google_id if user else None
    return await analytics_service.get_tag_breakdown(
        channel_id, user_id, date_from, date_to
    )


@router.get("/channel/{channel_id}/trends")
async def get_sentiment_trends(
    channel_id: str,
    user: Optional[User] = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365)
):
    """Get sentiment trends over time."""
    user_id = user.google_id if user else None
    return await analytics_service.get_sentiment_over_time(channel_id, days, user_id)


@router.get("/channel/{channel_id}/top-videos")
async def get_top_videos(
    channel_id: str,
    user: Optional[User] = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50)
):
    """Get top videos by comment count."""
    user_id = user.google_id if user else None
    return await analytics_service.get_top_videos(channel_id, limit, user_id)
