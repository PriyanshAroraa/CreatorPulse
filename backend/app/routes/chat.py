from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_database
from app.services import gemini_service
from app.routes.auth import get_current_user, require_auth
from app.models.user import User

router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message model."""
    message: str


class ChatResponse(BaseModel):
    """Chat response model."""
    response: str
    timestamp: datetime


@router.post("/channel/{channel_id}", response_model=ChatResponse)
async def chat_with_comments(
    channel_id: str, 
    chat: ChatMessage,
    user: Optional[User] = Depends(get_current_user)
):
    """Chat with AI about channel comments."""
    db = get_database()
    
    # Get channel info (filtered by user)
    query = {"channel_id": channel_id}
    if user:
        query["user_id"] = user.google_id
    
    channel = await db.channels.find_one(query)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Get recent comments for context
    comments_query = {"channel_id": channel_id}
    if user:
        comments_query["user_id"] = user.google_id
    
    comments = await db.comments.find(
        comments_query
    ).sort("published_at", -1).limit(100).to_list(100)
    
    if not comments:
        return ChatResponse(
            response="No comments found for this channel. Please sync the channel first.",
            timestamp=datetime.utcnow()
        )
    
    # Get AI response
    response = await gemini_service.chat_with_comments(
        question=chat.message,
        comments_context=comments,
        channel_name=channel['name']
    )
    
    # Save to chat history with user_id
    chat_entry = {
        "channel_id": channel_id,
        "user_message": chat.message,
        "ai_response": response,
        "created_at": datetime.utcnow()
    }
    if user:
        chat_entry["user_id"] = user.google_id
    
    await db.chat_history.insert_one(chat_entry)
    
    return ChatResponse(
        response=response,
        timestamp=datetime.utcnow()
    )


@router.get("/channel/{channel_id}/history")
async def get_chat_history(
    channel_id: str, 
    limit: int = 20,
    user: Optional[User] = Depends(get_current_user)
):
    """Get chat history for a channel."""
    db = get_database()
    
    query = {"channel_id": channel_id}
    if user:
        query["user_id"] = user.google_id
    
    history = await db.chat_history.find(
        query
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Reverse to get chronological order
    history.reverse()
    
    return [
        {
            "user_message": h['user_message'],
            "ai_response": h['ai_response'],
            "timestamp": h['created_at']
        }
        for h in history
    ]


@router.delete("/channel/{channel_id}/history")
async def clear_chat_history(
    channel_id: str,
    user: User = Depends(require_auth)
):
    """Clear chat history for a channel."""
    db = get_database()
    
    result = await db.chat_history.delete_many({
        "channel_id": channel_id,
        "user_id": user.google_id
    })
    
    return {"message": f"Deleted {result.deleted_count} messages"}
