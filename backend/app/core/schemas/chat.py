"""Chat log schemas for API requests and responses."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ChatLogResponse(BaseModel):
    """Response schema for a chat log message."""

    id: str
    project_id: str
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    content: str
    message_type: str
    mentions: List[str]
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class ChatLogListResponse(BaseModel):
    """Response schema for chat log list."""

    messages: List[ChatLogResponse]
    total: int

