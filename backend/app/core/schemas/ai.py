"""AI-related schemas for API requests and responses."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    """Request schema for AI chat."""

    project_id: str
    message: Optional[str] = Field(None, max_length=2000)
    role_id: Optional[str] = None
    conversation_id: Optional[str] = None
    use_rag: bool = Field(default=True, description="Use RAG for context retrieval")


class AIChatResponse(BaseModel):
    """Response schema for AI chat."""

    conversation_id: str
    message: str
    citations: List[dict] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)


class AIConversationResponse(BaseModel):
    """Response schema for an AI conversation."""

    id: str
    project_id: str
    user_id: str
    role_id: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class AIConversationListResponse(BaseModel):
    """Response schema for AI conversation list."""

    conversations: List[AIConversationResponse]
    total: int


class AIRoleResponse(BaseModel):
    """Response schema for an AI role."""

    id: str
    name: str
    icon: Optional[str] = None
    description: Optional[str] = None
    temperature: float
    is_default: bool
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class AIRoleListResponse(BaseModel):
    """Response schema for AI role list."""

    roles: List[AIRoleResponse]


class InterventionRuleCreateRequest(BaseModel):
    """Request schema for creating an intervention rule."""

    project_id: Optional[str] = None
    rule_type: str = Field(..., pattern="^(silence|emotion|keyword|custom)$")
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: int = Field(default=0, ge=0)
    enabled: bool = Field(default=True)
    silence_threshold: Optional[int] = Field(None, ge=0)
    emotion_keywords: Optional[List[str]] = None
    trigger_keywords: Optional[List[str]] = None
    action_type: str = Field(..., pattern="^(message|suggestion|question|redirect)$")
    message_template: str = Field(..., min_length=1, max_length=1000)
    ai_role_id: Optional[str] = None


class InterventionRuleUpdateRequest(BaseModel):
    """Request schema for updating an intervention rule."""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: Optional[int] = Field(None, ge=0)
    enabled: Optional[bool] = None
    silence_threshold: Optional[int] = Field(None, ge=0)
    emotion_keywords: Optional[List[str]] = None
    trigger_keywords: Optional[List[str]] = None
    action_type: Optional[str] = Field(None, pattern="^(message|suggestion|question|redirect)$")
    message_template: Optional[str] = Field(None, min_length=1, max_length=1000)
    ai_role_id: Optional[str] = None


class InterventionRuleResponse(BaseModel):
    """Response schema for an intervention rule."""

    id: str
    project_id: Optional[str]
    rule_type: str
    name: str
    description: Optional[str]
    priority: int
    enabled: bool
    silence_threshold: Optional[int]
    emotion_keywords: Optional[List[str]]
    trigger_keywords: Optional[List[str]]
    action_type: str
    message_template: str
    ai_role_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class AIMessageResponse(BaseModel):
    """Response schema for an AI message."""

    id: str
    conversation_id: str
    role: str
    content: str
    citations: List[dict] = Field(default_factory=list)
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class AIMessageListResponse(BaseModel):
    """Response schema for AI message list."""

    messages: List[AIMessageResponse]
    total: int


class AIContextActionRequest(BaseModel):
    """Request schema for specialized context actions."""

    project_id: str
    action_type: str = Field(..., pattern="^(summarize|knowledge_graph|optimize|devil_advocate|inquiry_clustering)$")
    context_type: str = Field(..., pattern="^(document|whiteboard|browser|dashboard)$")
    content: str = Field(..., max_length=50000)
    additional_query: Optional[str] = Field(None, max_length=1000)

