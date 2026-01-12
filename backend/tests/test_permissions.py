"""Tests for permission checking utilities."""

import pytest
from unittest.mock import Mock

from app.core.permissions import (
    check_project_permission,
    check_project_member_permission,
    get_user_role_in_project_sync,
    get_user_role_in_project,
    can_edit_whiteboard,
    can_edit_document,
    can_manage_members,
    can_upload_resources,
)
from app.repositories.project import Project
from app.repositories.user import User


class TestPermissions:
    """Test permission checking functions."""

    def test_check_project_permission_admin(self):
        """Test admin permission check."""
        user = Mock()
        user.role = "admin"

        result = check_project_permission(user, "owner_123", "admin")
        assert result is True

    def test_check_project_permission_teacher(self):
        """Test teacher permission check."""
        user = Mock()
        user.role = "teacher"

        result = check_project_permission(user, "owner_123", "teacher")
        assert result is True

    def test_check_project_permission_owner(self):
        """Test owner permission check."""
        user = Mock()
        user.id = "user_123"

        result = check_project_permission(user, "user_123", "student")
        assert result is True

    def test_check_project_permission_non_owner(self):
        """Test non-owner permission check (legacy function)."""
        user = Mock()
        user.id = "user_123"

        result = check_project_permission(user, "owner_456", "student")
        assert result is False

    def test_get_user_role_in_project_admin(self):
        """Test admin role override."""
        user = Mock()
        user.role = "admin"
        project = Mock()

        result = get_user_role_in_project_sync(user, project)
        assert result == "admin"

    def test_get_user_role_in_project_teacher(self):
        """Test teacher role override."""
        user = Mock()
        user.role = "teacher"
        project = Mock()

        result = get_user_role_in_project_sync(user, project)
        assert result == "teacher"

    def test_get_user_role_in_project_owner(self):
        """Test project owner role."""
        user = Mock()
        user.id = "user_123"
        user.role = "student"

        project = Mock()
        project.owner_id = "user_123"

        result = get_user_role_in_project_sync(user, project)
        assert result == "owner"

    def test_get_user_role_in_project_member(self):
        """Test project member role."""
        user = Mock()
        user.id = "user_123"
        user.role = "student"

        project = Mock()
        project.owner_id = "owner_456"
        project.members = [
            {"user_id": "user_123", "role": "editor"},
            {"user_id": "user_456", "role": "viewer"}
        ]

        result = get_user_role_in_project_sync(user, project)
        assert result == "editor"

    def test_get_user_role_in_project_non_member(self):
        """Test non-member role."""
        user = Mock()
        user.id = "user_123"
        user.role = "student"

        project = Mock()
        project.owner_id = "owner_456"
        project.members = [
            {"user_id": "user_456", "role": "viewer"}
        ]

        result = get_user_role_in_project_sync(user, project)
        assert result == "none"

    def test_can_edit_whiteboard_admin(self):
        """Test admin whiteboard edit permission."""
        assert can_edit_whiteboard("admin") is True

    def test_can_edit_whiteboard_owner(self):
        """Test owner whiteboard edit permission."""
        assert can_edit_whiteboard("owner") is True

    def test_can_edit_whiteboard_editor(self):
        """Test editor whiteboard edit permission."""
        assert can_edit_whiteboard("editor") is True

    def test_can_edit_whiteboard_viewer(self):
        """Test viewer whiteboard edit permission."""
        assert can_edit_whiteboard("viewer") is False

    def test_can_edit_whiteboard_none(self):
        """Test none role whiteboard edit permission."""
        assert can_edit_whiteboard("none") is False

    def test_can_edit_document_admin(self):
        """Test admin document edit permission."""
        assert can_edit_document("admin") is True

    def test_can_edit_document_owner(self):
        """Test owner document edit permission."""
        assert can_edit_document("owner") is True

    def test_can_edit_document_editor(self):
        """Test editor document edit permission."""
        assert can_edit_document("editor") is True

    def test_can_edit_document_viewer(self):
        """Test viewer document edit permission."""
        assert can_edit_document("viewer") is False

    def test_can_manage_members_admin(self):
        """Test admin member management permission."""
        assert can_manage_members("admin") is True

    def test_can_manage_members_teacher(self):
        """Test teacher member management permission."""
        assert can_manage_members("teacher") is True

    def test_can_manage_members_owner(self):
        """Test owner member management permission."""
        assert can_manage_members("owner") is True

    def test_can_manage_members_editor(self):
        """Test editor member management permission."""
        assert can_manage_members("editor") is False

    def test_can_upload_resources_admin(self):
        """Test admin resource upload permission."""
        assert can_upload_resources("admin") is True

    def test_can_upload_resources_owner(self):
        """Test owner resource upload permission."""
        assert can_upload_resources("owner") is True

    def test_can_upload_resources_editor(self):
        """Test editor resource upload permission."""
        assert can_upload_resources("editor") is True

    def test_can_upload_resources_viewer(self):
        """Test viewer resource upload permission."""
        assert can_upload_resources("viewer") is False


class TestPermissionsAsync:
    """Test async permission checking functions."""

    @pytest.mark.asyncio
    async def test_check_project_member_permission_admin(self):
        """Test async admin permission check."""
        user = Mock()
        user.role = "admin"
        project = Mock()

        result = await check_project_member_permission(user, project)
        assert result is True

    @pytest.mark.asyncio
    async def test_check_project_member_permission_owner(self):
        """Test async owner permission check."""
        user = Mock()
        user.id = "user_123"
        user.role = "student"

        project = Mock()
        project.owner_id = "user_123"

        result = await check_project_member_permission(user, project)
        assert result is True

    @pytest.mark.asyncio
    async def test_check_project_member_permission_member(self):
        """Test async member permission check."""
        user = Mock()
        user.id = "user_123"
        user.role = "student"

        project = Mock()
        project.owner_id = "owner_456"
        project.members = [
            {"user_id": "user_123", "role": "editor"}
        ]

        result = await check_project_member_permission(user, project)
        assert result is True

    @pytest.mark.asyncio
    async def test_check_project_member_permission_non_member(self):
        """Test async non-member permission check."""
        user = Mock()
        user.id = "user_123"
        user.role = "student"

        project = Mock()
        project.owner_id = "owner_456"
        project.members = [
            {"user_id": "user_456", "role": "viewer"}
        ]

        result = await check_project_member_permission(user, project)
        assert result is False

