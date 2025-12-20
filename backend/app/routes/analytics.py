from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime

from app.services import analytics_service

router = APIRouter()


@router.get("/channel/{channel_id}/summary")
async def get_channel_summary(channel_id: str):
    """Get overall channel summary statistics."""
    return await analytics_service.get_channel_summary(channel_id)


@router.get("/channel/{channel_id}/sentiment")
async def get_sentiment_breakdown(
    channel_id: str,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    """Get sentiment distribution for a channel."""
    return await analytics_service.get_sentiment_breakdown(
        channel_id, date_from, date_to
    )


@router.get("/channel/{channel_id}/tags")
async def get_tag_breakdown(
    channel_id: str,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    """Get tag distribution for a channel."""
    return await analytics_service.get_tag_breakdown(
        channel_id, date_from, date_to
    )


@router.get("/channel/{channel_id}/trends")
async def get_sentiment_trends(
    channel_id: str,
    days: int = Query(30, ge=1, le=365)
):
    """Get sentiment trends over time."""
    return await analytics_service.get_sentiment_over_time(channel_id, days)


@router.get("/channel/{channel_id}/top-videos")
async def get_top_videos(
    channel_id: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Get top videos by comment count."""
    return await analytics_service.get_top_videos(channel_id, limit)
