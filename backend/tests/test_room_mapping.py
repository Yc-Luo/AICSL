"""Tests for room mapping service."""

import pytest
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.repositories.project import Project
from app.repositories.user import User
from app.services.room_mapping_service import (
    extract_project_id_from_room,
    get_room_mapping,
    get_socketio_room,
    get_yjs_document_room,
    get_yjs_whiteboard_room,
    parse_room_id,
    validate_room_access,
)


@pytest.fixture
async def db_setup():
    """Set up test database."""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(
        database=client.test_aicsl,
        document_models=[User, Project],
    )
    yield
    await client.drop_database("test_aicsl")
    client.close()


@pytest.fixture
async def test_user(db_setup):
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password",
        role="student",
    )
    await user.insert()
    return user


@pytest.fixture
async def test_project(test_user):
    """Create a test project."""
    from datetime import datetime

    project = Project(
        name="Test Project",
        description="Test Description",
        owner_id=str(test_user.id),
        members=[
            {
                "user_id": str(test_user.id),
                "role": "owner",
                "joined_at": datetime.utcnow(),
            }
        ],
    )
    await project.insert()
    return project


class TestRoomMapping:
    """Test room mapping functions."""

    def test_get_room_mapping(self):
        """Test get_room_mapping function."""
        project_id = "test_project_123"
        mapping = get_room_mapping(project_id)

        assert mapping["socketio_room"] == "project:test_project_123"
        assert "wb:test_project_123" in mapping["yjs_rooms"]
        assert mapping["project_id"] == project_id

    def test_parse_room_id_socketio(self):
        """Test parsing Socket.IO room ID."""
        room_id = "project:test_project_123"
        parsed = parse_room_id(room_id)

        assert parsed["type"] == "socketio"
        assert parsed["project_id"] == "test_project_123"
        assert parsed["resource_id"] is None

    def test_parse_room_id_yjs_whiteboard(self):
        """Test parsing Y.js whiteboard room ID."""
        room_id = "wb:test_project_123"
        parsed = parse_room_id(room_id)

        assert parsed["type"] == "yjs_whiteboard"
        assert parsed["project_id"] == "test_project_123"
        assert parsed["resource_id"] is None

    def test_parse_room_id_yjs_document(self):
        """Test parsing Y.js document room ID."""
        room_id = "doc:test_document_456"
        parsed = parse_room_id(room_id)

        assert parsed["type"] == "yjs_document"
        assert parsed["project_id"] is None  # Will be resolved from document
        assert parsed["resource_id"] == "test_document_456"

    def test_parse_room_id_unknown(self):
        """Test parsing unknown room ID."""
        room_id = "unknown:test"
        parsed = parse_room_id(room_id)

        assert parsed["type"] == "unknown"
        assert parsed["project_id"] is None
        assert parsed["resource_id"] is None

    def test_get_socketio_room(self):
        """Test get_socketio_room function."""
        project_id = "test_project_123"
        room_id = get_socketio_room(project_id)
        assert room_id == "project:test_project_123"

    def test_get_yjs_whiteboard_room(self):
        """Test get_yjs_whiteboard_room function."""
        project_id = "test_project_123"
        room_id = get_yjs_whiteboard_room(project_id)
        assert room_id == "wb:test_project_123"

    def test_get_yjs_document_room(self):
        """Test get_yjs_document_room function."""
        document_id = "test_document_456"
        room_id = get_yjs_document_room(document_id)
        assert room_id == "doc:test_document_456"

    def test_extract_project_id_from_room(self):
        """Test extract_project_id_from_room function."""
        # Socket.IO room
        project_id = extract_project_id_from_room("project:test_project_123")
        assert project_id == "test_project_123"

        # Y.js whiteboard room
        project_id = extract_project_id_from_room("wb:test_project_123")
        assert project_id == "test_project_123"

        # Y.js document room (returns None as project_id needs to be resolved)
        project_id = extract_project_id_from_room("doc:test_document_456")
        assert project_id is None

        # Unknown room
        project_id = extract_project_id_from_room("unknown:test")
        assert project_id is None

    @pytest.mark.asyncio
    async def test_validate_room_access_owner(self, test_user, test_project):
        """Test room access validation for project owner."""
        # Socket.IO room
        socketio_room = f"project:{test_project.id}"
        has_access = await validate_room_access(socketio_room, str(test_user.id))
        assert has_access is True

        # Y.js whiteboard room
        whiteboard_room = f"wb:{test_project.id}"
        has_access = await validate_room_access(whiteboard_room, str(test_user.id))
        assert has_access is True

    @pytest.mark.asyncio
    async def test_validate_room_access_member(self, test_user, test_project):
        """Test room access validation for project member."""
        # Create another user as a member
        member_user = User(
            username="member",
            email="member@example.com",
            password_hash="hashed_password",
            role="student",
        )
        await member_user.insert()

        # Add member to project
        from datetime import datetime

        test_project.members.append(
            {
                "user_id": str(member_user.id),
                "role": "editor",
                "joined_at": datetime.utcnow(),
            }
        )
        await test_project.save()

        # Socket.IO room
        socketio_room = f"project:{test_project.id}"
        has_access = await validate_room_access(socketio_room, str(member_user.id))
        assert has_access is True

        # Y.js whiteboard room
        whiteboard_room = f"wb:{test_project.id}"
        has_access = await validate_room_access(whiteboard_room, str(member_user.id))
        assert has_access is True

    @pytest.mark.asyncio
    async def test_validate_room_access_non_member(self, test_user, test_project):
        """Test room access validation for non-member."""
        # Create a user who is not a member
        non_member = User(
            username="nonmember",
            email="nonmember@example.com",
            password_hash="hashed_password",
            role="student",
        )
        await non_member.insert()

        # Socket.IO room
        socketio_room = f"project:{test_project.id}"
        has_access = await validate_room_access(socketio_room, str(non_member.id))
        assert has_access is False

        # Y.js whiteboard room
        whiteboard_room = f"wb:{test_project.id}"
        has_access = await validate_room_access(whiteboard_room, str(non_member.id))
        assert has_access is False

    @pytest.mark.asyncio
    async def test_validate_room_access_admin(self, test_project):
        """Test room access validation for admin."""
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@example.com",
            password_hash="hashed_password",
            role="admin",
        )
        await admin_user.insert()

        # Socket.IO room
        socketio_room = f"project:{test_project.id}"
        has_access = await validate_room_access(socketio_room, str(admin_user.id))
        assert has_access is True

        # Y.js whiteboard room
        whiteboard_room = f"wb:{test_project.id}"
        has_access = await validate_room_access(whiteboard_room, str(admin_user.id))
        assert has_access is True

    @pytest.mark.asyncio
    async def test_validate_room_access_teacher(self, test_project):
        """Test room access validation for teacher."""
        # Create teacher user
        teacher_user = User(
            username="teacher",
            email="teacher@example.com",
            password_hash="hashed_password",
            role="teacher",
        )
        await teacher_user.insert()

        # Socket.IO room
        socketio_room = f"project:{test_project.id}"
        has_access = await validate_room_access(socketio_room, str(teacher_user.id))
        assert has_access is True

        # Y.js whiteboard room
        whiteboard_room = f"wb:{test_project.id}"
        has_access = await validate_room_access(whiteboard_room, str(teacher_user.id))
        assert has_access is True

    @pytest.mark.asyncio
    async def test_validate_room_access_invalid_room(self, test_user):
        """Test room access validation for invalid room."""
        invalid_room = "unknown:test"
        has_access = await validate_room_access(invalid_room, str(test_user.id))
        assert has_access is False

    @pytest.mark.asyncio
    async def test_validate_room_access_invalid_user(self, test_project):
        """Test room access validation for invalid user."""
        socketio_room = f"project:{test_project.id}"
        has_access = await validate_room_access(socketio_room, "invalid_user_id")
        assert has_access is False

