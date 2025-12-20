from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime

from app.database import get_database
from app.models import TagCreate, TagUpdate, TagResponse, DEFAULT_TAGS

router = APIRouter()


async def ensure_default_tags():
    """Ensure default system tags exist."""
    db = get_database()
    
    for tag in DEFAULT_TAGS:
        await db.tags.update_one(
            {"name": tag['name']},
            {"$setOnInsert": {**tag, "usage_count": 0, "created_at": datetime.utcnow()}},
            upsert=True
        )


@router.get("", response_model=List[TagResponse])
async def list_tags():
    """List all available tags."""
    db = get_database()
    
    # Ensure defaults exist
    await ensure_default_tags()
    
    tags = await db.tags.find({"is_active": True}).sort("name", 1).to_list(100)
    
    for tag in tags:
        tag['id'] = str(tag['_id'])
    
    return [TagResponse(**t) for t in tags]


@router.post("", response_model=TagResponse)
async def create_tag(tag: TagCreate):
    """Create a custom tag."""
    db = get_database()
    
    # Check if exists
    existing = await db.tags.find_one({"name": tag.name})
    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")
    
    tag_data = {
        **tag.model_dump(),
        "is_system": False,
        "is_active": True,
        "usage_count": 0,
        "created_at": datetime.utcnow()
    }
    
    result = await db.tags.insert_one(tag_data)
    tag_data['id'] = str(result.inserted_id)
    
    return TagResponse(**tag_data)


@router.patch("/{tag_name}", response_model=TagResponse)
async def update_tag(tag_name: str, tag_update: TagUpdate):
    """Update a tag."""
    db = get_database()
    
    existing = await db.tags.find_one({"name": tag_name})
    if not existing:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    update_data = {k: v for k, v in tag_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.tags.update_one(
            {"name": tag_name},
            {"$set": update_data}
        )
    
    updated = await db.tags.find_one({"name": tag_update.name or tag_name})
    updated['id'] = str(updated['_id'])
    
    return TagResponse(**updated)


@router.delete("/{tag_name}")
async def delete_tag(tag_name: str):
    """Delete a custom tag (cannot delete system tags)."""
    db = get_database()
    
    tag = await db.tags.find_one({"name": tag_name})
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    if tag.get('is_system'):
        raise HTTPException(status_code=400, detail="Cannot delete system tags")
    
    await db.tags.delete_one({"name": tag_name})
    
    # Remove tag from all comments
    await db.comments.update_many(
        {"tags": tag_name},
        {"$pull": {"tags": tag_name}}
    )
    
    return {"message": f"Tag '{tag_name}' deleted"}
