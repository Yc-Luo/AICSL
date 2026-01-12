"""AI intervention rule model."""

from datetime import datetime
from typing import List, Optional

from beanie import Document as BeanieDocument
from pydantic import Field


class AIInterventionRule(BeanieDocument):
    """AI intervention rule model."""

    project_id: Optional[str] = Field(None, index=True)  # None for global rules
    rule_type: str = Field(
        ..., pattern="^(silence|emotion|keyword|custom)$"
    )  # silence/emotion/keyword/custom
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: int = Field(default=0, ge=0)  # Higher priority = executed first
    enabled: bool = Field(default=True)

    # Rule conditions
    silence_threshold: Optional[int] = Field(
        None, ge=0
    )  # Seconds of silence before triggering
    emotion_keywords: Optional[List[str]] = Field(
        None
    )  # Keywords indicating negative emotions
    trigger_keywords: Optional[List[str]] = Field(None)  # Keywords to trigger intervention
    custom_condition: Optional[str] = Field(None)  # Custom condition expression

    # Intervention action
    action_type: str = Field(
        ..., pattern="^(message|suggestion|question|redirect)$"
    )  # message/suggestion/question/redirect
    message_template: str = Field(..., min_length=1, max_length=1000)
    ai_role_id: Optional[str] = None  # AI role to use for intervention

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        """Beanie settings."""

        name = "ai_intervention_rules"
        indexes = [
            [("project_id", 1)],
            [("project_id", 1), ("priority", 1)],
            [("rule_type", 1)],
            [("enabled", 1)],
        ]

