from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from pydantic import BaseModel

from app.database import get_database
from app.services import gemini_service

router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message model."""
    message: str


class ChatResponse(BaseModel):
    """Chat response model."""
    response: str
    timestamp: datetime


@router.post("/channel/{channel_id}", response_model=ChatResponse)
async def chat_with_comments(channel_id: str, chat: ChatMessage):
    """Chat with AI about channel comments."""
    db = get_database()
    
    # Get channel info
    channel = await db.channels.find_one({"channel_id": channel_id})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Get recent comments for context
    comments = await db.comments.find(
        {"channel_id": channel_id}
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
    
    # Save to chat history
    await db.chat_history.insert_one({
        "channel_id": channel_id,
        "user_message": chat.message,
        "ai_response": response,
        "created_at": datetime.utcnow()
    })
    
    return ChatResponse(
        response=response,
        timestamp=datetime.utcnow()
    )


@router.get("/channel/{channel_id}/history")
async def get_chat_history(channel_id: str, limit: int = 20):
    """Get chat history for a channel."""
    db = get_database()
    
    history = await db.chat_history.find(
        {"channel_id": channel_id}
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
async def clear_chat_history(channel_id: str):
    """Clear chat history for a channel."""
    db = get_database()
    
    result = await db.chat_history.delete_many({"channel_id": channel_id})
    
    return {"message": f"Deleted {result.deleted_count} messages"}
