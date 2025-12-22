from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime
import math

from app.database import get_database
from app.models import CommentResponse, CommentBookmark, CommentTags, CommentsPaginated
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/channel/{channel_id}", response_model=CommentsPaginated)
async def list_channel_comments(
    channel_id: str,
    user: Optional[User] = Depends(get_current_user),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment (positive, neutral, negative)"),
    tags: Optional[str] = Query(None, description="Comma-separated tags to filter"),
    video_id: Optional[str] = None,
    is_bookmarked: Optional[bool] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """List comments for a channel with filters."""
    db = get_database()
    
    # Build query with user_id filtering
    query = {"channel_id": channel_id}
    
    if user:
        query["user_id"] = user.google_id
    
    if sentiment:
        query["sentiment"] = sentiment
    
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    
    if video_id:
        query["video_id"] = video_id
    
    if is_bookmarked is not None:
        query["is_bookmarked"] = is_bookmarked
    
    if date_from:
        query.setdefault("published_at", {})["$gte"] = date_from
    
    if date_to:
        query.setdefault("published_at", {})["$lte"] = date_to
    
    if search:
        query["text"] = {"$regex": search, "$options": "i"}
    
    # Get total count
    total = await db.comments.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * limit
    pages = math.ceil(total / limit) if total > 0 else 1
    
    # Get comments
    comments = await db.comments.find(query).sort(
        "published_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    
    for comment in comments:
        comment['_id'] = str(comment['_id'])
    
    return CommentsPaginated(
        items=[CommentResponse(**c) for c in comments],
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(comment_id: str, user: Optional[User] = Depends(get_current_user)):
    """Get a single comment."""
    db = get_database()
    
    query = {"comment_id": comment_id}
    if user:
        query["user_id"] = user.google_id
    
    comment = await db.comments.find_one(query)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment['_id'] = str(comment['_id'])
    return CommentResponse(**comment)


@router.patch("/{comment_id}/bookmark")
async def toggle_bookmark(
    comment_id: str, 
    bookmark: CommentBookmark,
    user: Optional[User] = Depends(get_current_user)
):
    """Toggle bookmark status for a comment."""
    db = get_database()
    
    query = {"comment_id": comment_id}
    if user:
        query["user_id"] = user.google_id
    
    result = await db.comments.update_one(
        query,
        {"$set": {"is_bookmarked": bookmark.is_bookmarked}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return {"message": "Bookmark updated", "is_bookmarked": bookmark.is_bookmarked}


@router.patch("/{comment_id}/tags")
async def update_tags(
    comment_id: str, 
    tags: CommentTags,
    user: Optional[User] = Depends(get_current_user)
):
    """Update tags for a comment."""
    db = get_database()
    
    query = {"comment_id": comment_id}
    if user:
        query["user_id"] = user.google_id
    
    result = await db.comments.update_one(
        query,
        {"$set": {"tags": tags.tags}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return {"message": "Tags updated", "tags": tags.tags}


@router.get("/bookmarked/{channel_id}")
async def get_bookmarked_comments(
    channel_id: str,
    user: Optional[User] = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """Get all bookmarked comments for a channel."""
    db = get_database()
    
    query = {"channel_id": channel_id, "is_bookmarked": True}
    if user:
        query["user_id"] = user.google_id
    
    total = await db.comments.count_documents(query)
    skip = (page - 1) * limit
    
    comments = await db.comments.find(query).sort(
        "published_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    
    for comment in comments:
        comment['_id'] = str(comment['_id'])
    
    return {
        "items": comments,
        "total": total,
        "page": page,
        "limit": limit
    }
