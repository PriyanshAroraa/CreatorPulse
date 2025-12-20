from fastapi import APIRouter, Query
from typing import List

from app.database import get_database
from app.models import CommunityStats, TopCommenter

router = APIRouter()


@router.get("/channel/{channel_id}/stats", response_model=CommunityStats)
async def get_community_stats(channel_id: str):
    """Get community statistics for a channel."""
    db = get_database()
    
    # Total and unique commenters
    total_comments = await db.comments.count_documents({"channel_id": channel_id})
    unique_commenters = await db.commenters.count_documents({"channel_id": channel_id})
    repeat_commenters = await db.commenters.count_documents({
        "channel_id": channel_id,
        "is_repeat": True
    })
    
    repeat_percentage = round(
        (repeat_commenters / unique_commenters * 100) if unique_commenters > 0 else 0, 1
    )
    
    avg_comments = round(
        total_comments / unique_commenters if unique_commenters > 0 else 0, 2
    )
    
    # Top commenters
    top_commenters_data = await db.commenters.find(
        {"channel_id": channel_id}
    ).sort("comment_count", -1).limit(10).to_list(10)
    
    top_commenters = [
        TopCommenter(
            author_channel_id=c['author_channel_id'],
            author_name=c['author_name'],
            author_profile_image=c.get('author_profile_image'),
            comment_count=c['comment_count'],
            total_likes_received=c.get('total_likes_received', 0),
            videos_count=len(c.get('videos_commented_on', [])),
            streak_days=c.get('streak_days', 0)
        )
        for c in top_commenters_data
    ]
    
    return CommunityStats(
        total_commenters=total_comments,
        unique_commenters=unique_commenters,
        repeat_commenters=repeat_commenters,
        repeat_percentage=repeat_percentage,
        avg_comments_per_user=avg_comments,
        top_commenters=top_commenters
    )


@router.get("/channel/{channel_id}/top-commenters")
async def get_top_commenters(
    channel_id: str,
    limit: int = Query(20, ge=1, le=100)
):
    """Get top commenters for a channel."""
    db = get_database()
    
    commenters = await db.commenters.find(
        {"channel_id": channel_id}
    ).sort("comment_count", -1).limit(limit).to_list(limit)
    
    return [
        {
            "author_channel_id": c['author_channel_id'],
            "author_name": c['author_name'],
            "author_profile_image": c.get('author_profile_image'),
            "comment_count": c['comment_count'],
            "total_likes_received": c.get('total_likes_received', 0),
            "videos_count": len(c.get('videos_commented_on', [])),
            "first_comment_at": c.get('first_comment_at'),
            "last_comment_at": c.get('last_comment_at'),
            "is_repeat": c.get('is_repeat', False)
        }
        for c in commenters
    ]


@router.get("/channel/{channel_id}/streaks")
async def get_commenters_with_streaks(
    channel_id: str,
    limit: int = Query(20, ge=1, le=100)
):
    """Get commenters with the longest streaks."""
    db = get_database()
    
    commenters = await db.commenters.find(
        {"channel_id": channel_id, "streak_days": {"$gt": 0}}
    ).sort("streak_days", -1).limit(limit).to_list(limit)
    
    return [
        {
            "author_channel_id": c['author_channel_id'],
            "author_name": c['author_name'],
            "author_profile_image": c.get('author_profile_image'),
            "streak_days": c['streak_days'],
            "comment_count": c['comment_count']
        }
        for c in commenters
    ]


@router.get("/commenter/{author_channel_id}")
async def get_commenter_profile(author_channel_id: str, channel_id: str):
    """Get detailed profile for a commenter."""
    db = get_database()
    
    commenter = await db.commenters.find_one({
        "author_channel_id": author_channel_id,
        "channel_id": channel_id
    })
    
    if not commenter:
        return {"error": "Commenter not found"}
    
    # Get their comments
    comments = await db.comments.find({
        "author_channel_id": author_channel_id,
        "channel_id": channel_id
    }).sort("published_at", -1).limit(20).to_list(20)
    
    return {
        "profile": {
            "author_channel_id": commenter['author_channel_id'],
            "author_name": commenter['author_name'],
            "author_profile_image": commenter.get('author_profile_image'),
            "comment_count": commenter['comment_count'],
            "total_likes_received": commenter.get('total_likes_received', 0),
            "videos_commented_on": len(commenter.get('videos_commented_on', [])),
            "first_comment_at": commenter.get('first_comment_at'),
            "last_comment_at": commenter.get('last_comment_at'),
            "streak_days": commenter.get('streak_days', 0),
            "is_repeat": commenter.get('is_repeat', False)
        },
        "recent_comments": [
            {
                "comment_id": c['comment_id'],
                "text": c['text'],
                "video_id": c['video_id'],
                "published_at": c['published_at'],
                "like_count": c['like_count'],
                "sentiment": c.get('sentiment')
            }
            for c in comments
        ]
    }
