"""Course (class) model."""

from datetime import datetime
from typing import List, Optional

from beanie import Document
from pydantic import Field


class Course(Document):
    """Course document model."""

    name: str = Field(..., min_length=1, max_length=100)
    teacher_id: str = Field(..., index=True)
    semester: str  # e.g., "2024-Spring"
    invite_code: str = Field(..., unique=True, index=True)
    students: List[str] = Field(default_factory=list)  # List of student user IDs
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        """Beanie settings."""

        name = "courses"
        indexes = [
            [("teacher_id", 1)],
            [("invite_code", 1)],
            [("students", 1)],
        ]

