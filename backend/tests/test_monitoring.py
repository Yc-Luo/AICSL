"""Tests for monitoring utilities."""

import pytest
from unittest.mock import patch, AsyncMock

from app.core.monitoring import PerformanceMonitor


class TestPerformanceMonitor:
    """Test performance monitoring functions."""

    @pytest.fixture
    def monitor(self):
        """Create performance monitor instance."""
        return PerformanceMonitor()

    @pytest.mark.asyncio
    async def test_track_ai_request_success(self, monitor):
        """Test tracking successful AI request."""
        with patch('app.core.monitoring.AI_REQUESTS') as mock_counter:
            await monitor.track_ai_request("openai", "gpt-4", "success")

            mock_counter.labels.assert_called_once_with(
                provider="openai",
                model="gpt-4",
                status="success"
            )
            mock_counter.labels().inc.assert_called_once()

    @pytest.mark.asyncio
    async def test_track_ai_request_error(self, monitor):
        """Test tracking failed AI request."""
        with patch('app.core.monitoring.AI_REQUESTS') as mock_counter:
            await monitor.track_ai_request("openai", "gpt-4", "error")

            mock_counter.labels.assert_called_once_with(
                provider="openai",
                model="gpt-4",
                status="error"
            )
            mock_counter.labels().inc.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_active_users(self, monitor):
        """Test updating active users gauge."""
        with patch('app.core.monitoring.ACTIVE_USERS') as mock_gauge:
            await monitor.update_active_users(42)

            mock_gauge.set.assert_called_once_with(42)

    @pytest.mark.asyncio
    async def test_update_active_projects(self, monitor):
        """Test updating active projects gauge."""
        with patch('app.core.monitoring.ACTIVE_PROJECTS') as mock_gauge:
            await monitor.update_active_projects(15)

            mock_gauge.set.assert_called_once_with(15)

    @pytest.mark.asyncio
    async def test_update_websocket_connections(self, monitor):
        """Test updating WebSocket connections gauge."""
        with patch('app.core.monitoring.WEBSOCKET_CONNECTIONS') as mock_gauge:
            await monitor.update_websocket_connections(8)

            mock_gauge.set.assert_called_once_with(8)

    @pytest.mark.asyncio
    async def test_track_cache_hit(self, monitor):
        """Test tracking cache hit."""
        with patch('app.core.monitoring.CACHE_HITS') as mock_counter:
            await monitor.track_cache_hit("user")

            mock_counter.labels.assert_called_once_with(cache_type="user")
            mock_counter.labels().inc.assert_called_once()

    @pytest.mark.asyncio
    async def test_track_cache_miss(self, monitor):
        """Test tracking cache miss."""
        with patch('app.core.monitoring.CACHE_MISSES') as mock_counter:
            await monitor.track_cache_miss("project")

            mock_counter.labels.assert_called_once_with(cache_type="project")
            mock_counter.labels().inc.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_cache_stats(self, monitor):
        """Test getting cache statistics."""
        with patch('app.core.monitoring.CACHE_HITS') as mock_hits, \
             patch('app.core.monitoring.CACHE_MISSES') as mock_misses:

            # Mock the _value.sum() calls
            mock_hits._value.sum.return_value = 100
            mock_misses._value.sum.return_value = 20

            stats = await monitor.get_cache_stats()

            assert stats["cache_hits"] == 100
            assert stats["cache_misses"] == 20

