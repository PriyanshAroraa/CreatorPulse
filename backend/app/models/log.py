from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ChannelLog(BaseModel):
    """Log entry for channel operations (sync, analysis, etc)."""
    id: Optional[str] = Field(None, alias="_id")
    channel_id: str
    user_id: str
    message: str
    level: str = "info"  # info, warning, error, success
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
