from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.database import get_database
from app.models import VideoResponse, VideoWithStats
from app.services import analytics_service

router = APIRouter()


@router.get("/channel/{channel_id}", response_model=List[VideoResponse])
async def list_channel_videos(
    channel_id: str,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """List videos for a channel."""
    db = get_database()
    
    videos = await db.videos.find(
        {"channel_id": channel_id}
    ).sort("published_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for video in videos:
        video['id'] = str(video['_id'])
    
    return [VideoResponse(**v) for v in videos]


@router.get("/{video_id}", response_model=VideoWithStats)
async def get_video(video_id: str):
    """Get video details with statistics."""
    db = get_database()
    
    video = await db.videos.find_one({"video_id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video['id'] = str(video['_id'])
    
    # Get sentiment breakdown
    pipeline = [
        {"$match": {"video_id": video_id}},
        {
            "$group": {
                "_id": "$sentiment",
                "count": {"$sum": 1}
            }
        }
    ]
    
    sentiment_results = await db.comments.aggregate(pipeline).to_list(None)
    sentiment_breakdown = {"positive": 0, "neutral": 0, "negative": 0}
    for result in sentiment_results:
        if result['_id']:
            sentiment_breakdown[result['_id']] = result['count']
    
    # Get top tags
    tag_pipeline = [
        {"$match": {"video_id": video_id, "tags": {"$ne": []}}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    
    tag_results = await db.comments.aggregate(tag_pipeline).to_list(None)
    top_tags = [{"tag": r['_id'], "count": r['count']} for r in tag_results]
    
    video['sentiment_breakdown'] = sentiment_breakdown
    video['top_tags'] = top_tags
    
    return VideoWithStats(**video)


@router.get("/{video_id}/comments")
async def get_video_comments(
    video_id: str,
    sentiment: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """Get comments for a specific video."""
    db = get_database()
    
    query = {"video_id": video_id}
    if sentiment:
        query["sentiment"] = sentiment
    
    comments = await db.comments.find(query).sort(
        "published_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.comments.count_documents(query)
    
    for comment in comments:
        comment['id'] = str(comment['_id'])
    
    return {
        "items": comments,
        "total": total,
        "video_id": video_id
    }
