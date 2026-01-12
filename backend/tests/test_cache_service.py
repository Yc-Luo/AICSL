"""Tests for cache service."""

import pytest
from unittest.mock import Mock, patch, AsyncMock

from app.services.cache_service import CacheService


class TestCacheService:
    """Test cache service functions."""

    @pytest.fixture
    def cache_service(self):
        """Create cache service instance."""
        return CacheService()

    @pytest.mark.asyncio
    async def test_get_cached_user(self, cache_service):
        """Test getting cached user."""
        with patch('app.services.cache_service.get_cache') as mock_get_cache:
            mock_get_cache.return_value = {"username": "testuser"}

            result = await cache_service.get_cached_user("user_123")

            mock_get_cache.assert_called_once_with("user:user_123")
            assert result == {"username": "testuser"}

    @pytest.mark.asyncio
    async def test_set_cached_user(self, cache_service):
        """Test setting cached user."""
        user_mock = Mock()
        user_mock.dict.return_value = {"username": "testuser", "id": "user_123"}

        with patch('app.services.cache_service.set_cache') as mock_set_cache:
            await cache_service.set_cached_user(user_mock)

            mock_set_cache.assert_called_once()
            call_args = mock_set_cache.call_args
            assert call_args[0][0] == "user:user_123"
            assert call_args[0][2] == cache_service.USER_TTL

    @pytest.mark.asyncio
    async def test_invalidate_user_cache(self, cache_service):
        """Test invalidating user cache."""
        with patch('app.services.cache_service.delete_cache') as mock_delete_cache:
            await cache_service.invalidate_user_cache("user_123")

            mock_delete_cache.assert_called_once_with("user:user_123")

    @pytest.mark.asyncio
    async def test_get_cached_project(self, cache_service):
        """Test getting cached project."""
        with patch('app.services.cache_service.get_cache') as mock_get_cache:
            mock_get_cache.return_value = {"name": "Test Project"}

            result = await cache_service.get_cached_project("project_123")

            mock_get_cache.assert_called_once_with("project:project_123")
            assert result == {"name": "Test Project"}

    @pytest.mark.asyncio
    async def test_set_cached_project(self, cache_service):
        """Test setting cached project."""
        project_mock = Mock()
        project_mock.dict.return_value = {"name": "Test Project", "id": "project_123"}

        with patch('app.services.cache_service.set_cache') as mock_set_cache:
            await cache_service.set_cached_project(project_mock)

            mock_set_cache.assert_called_once()
            call_args = mock_set_cache.call_args
            assert call_args[0][0] == "project:project_123"
            assert call_args[0][2] == cache_service.PROJECT_TTL

    @pytest.mark.asyncio
    async def test_invalidate_project_cache(self, cache_service):
        """Test invalidating project cache."""
        with patch('app.services.cache_service.delete_cache') as mock_delete_cache:
            await cache_service.invalidate_project_cache("project_123")

            # Should delete project cache and members cache
            assert mock_delete_cache.call_count == 2
            mock_delete_cache.assert_any_call("project:project_123")
            mock_delete_cache.assert_any_call("project:project_123:members")

    @pytest.mark.asyncio
    async def test_get_cached_project_members(self, cache_service):
        """Test getting cached project members."""
        with patch('app.services.cache_service.get_cache') as mock_get_cache:
            mock_get_cache.return_value = [{"user_id": "user_123", "role": "editor"}]

            result = await cache_service.get_cached_project_members("project_123")

            mock_get_cache.assert_called_once_with("project:project_123:members")
            assert result == [{"user_id": "user_123", "role": "editor"}]

    @pytest.mark.asyncio
    async def test_set_cached_project_members(self, cache_service):
        """Test setting cached project members."""
        members = [{"user_id": "user_123", "role": "editor"}]

        with patch('app.services.cache_service.set_cache') as mock_set_cache:
            await cache_service.set_cached_project_members("project_123", members)

            mock_set_cache.assert_called_once()
            call_args = mock_set_cache.call_args
            assert call_args[0][0] == "project:project_123:members"
            assert call_args[0][1] == members
            assert call_args[0][2] == cache_service.PROJECT_MEMBERS_TTL

    @pytest.mark.asyncio
    async def test_get_cached_user_permissions(self, cache_service):
        """Test getting cached user permissions."""
        with patch('app.services.cache_service.get_cache') as mock_get_cache:
            mock_get_cache.return_value = "editor"

            result = await cache_service.get_cached_user_permissions("user_123", "project_456")

            mock_get_cache.assert_called_once_with("perm:project:project_456:user:user_123")
            assert result == "editor"

    @pytest.mark.asyncio
    async def test_set_cached_user_permissions(self, cache_service):
        """Test setting cached user permissions."""
        with patch('app.services.cache_service.set_cache') as mock_set_cache:
            await cache_service.set_cached_user_permissions("user_123", "project_456", "editor")

            mock_set_cache.assert_called_once()
            call_args = mock_set_cache.call_args
            assert call_args[0][0] == "perm:project:project_456:user:user_123"
            assert call_args[0][1] == "editor"
            assert call_args[0][2] == cache_service.PERMISSIONS_TTL

    @pytest.mark.asyncio
    async def test_invalidate_user_permissions_cache(self, cache_service):
        """Test invalidating user permissions cache."""
        with patch('app.services.cache_service.delete_cache') as mock_delete_cache:
            await cache_service.invalidate_user_permissions_cache("user_123", "project_456")

            mock_delete_cache.assert_called_once_with("perm:project:project_456:user:user_123")

    @pytest.mark.asyncio
    async def test_invalidate_all_permissions_cache(self, cache_service):
        """Test invalidating all permissions cache for a project."""
        with patch('app.services.cache_service.delete_cache_pattern') as mock_delete_pattern:
            await cache_service.invalidate_all_permissions_cache("project_456")

            mock_delete_pattern.assert_called_once_with("perm:project:project_456:*")

    @pytest.mark.asyncio
    async def test_clear_all_cache(self, cache_service):
        """Test clearing all cache."""
        with patch('app.services.cache_service.delete_cache_pattern') as mock_delete_pattern:
            await cache_service.clear_all_cache()

            assert mock_delete_pattern.call_count == 3
            mock_delete_pattern.assert_any_call("user:*")
            mock_delete_pattern.assert_any_call("project:*")
            mock_delete_pattern.assert_any_call("perm:*")

