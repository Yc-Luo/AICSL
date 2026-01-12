"""Tests for Agent Configuration API endpoints."""

import pytest
from httpx import AsyncClient
from bson import ObjectId

from app.main import app


@pytest.fixture
def mock_agent_id():
    """Generate a mock agent ID."""
    return str(ObjectId())


@pytest.fixture
def sample_agent_data():
    """Sample agent configuration data."""
    return {
        "name": "test_agent",
        "display_name": "Test Agent",
        "description": "A test agent for unit testing",
        "system_prompt": "You are a helpful test agent.",
        "enabled": True,
        "icon": "brain",
        "color": "#6366f1",
        "temperature": 0.7,
        "max_tokens": 2000,
        "role_type": "specialist",
    }


class TestAgentEndpointsAuth:
    """Test authentication requirements for agent endpoints."""

    @pytest.mark.asyncio
    async def test_list_agents_unauthorized(self):
        """Test listing agents requires authentication."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/v1/agents")
            assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_agent_unauthorized(self, mock_agent_id):
        """Test getting a specific agent requires authentication."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/v1/agents/{mock_agent_id}")
            assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_agent_unauthorized(self, sample_agent_data):
        """Test creating an agent requires authentication."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/api/v1/agents", json=sample_agent_data)
            assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_agent_unauthorized(self, mock_agent_id):
        """Test updating an agent requires authentication."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/api/v1/agents/{mock_agent_id}",
                json={"display_name": "Updated Name"}
            )
            assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_agent_unauthorized(self, mock_agent_id):
        """Test deleting an agent requires authentication."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(f"/api/v1/agents/{mock_agent_id}")
            assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_toggle_agent_unauthorized(self, mock_agent_id):
        """Test toggling an agent requires authentication."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(f"/api/v1/agents/{mock_agent_id}/toggle")
            assert response.status_code == 401


class TestAgentConfigModel:
    """Test AgentConfig model validation."""

    def test_agent_config_creation(self, sample_agent_data):
        """Test AgentConfig model can be created with valid data."""
        from app.repositories.agent_config import AgentConfig
        
        agent = AgentConfig(**sample_agent_data)
        
        assert agent.name == "test_agent"
        assert agent.display_name == "Test Agent"
        assert agent.enabled is True
        assert agent.temperature == 0.7
        assert agent.role_type == "specialist"

    def test_agent_config_defaults(self):
        """Test AgentConfig model has correct defaults."""
        from app.repositories.agent_config import AgentConfig
        
        agent = AgentConfig(
            name="minimal_agent",
            display_name="Minimal Agent",
            system_prompt="You are a minimal agent."
        )
        
        # Check defaults
        assert agent.enabled is True
        assert agent.is_system is False
        assert agent.can_be_router_target is True
        assert agent.temperature == 0.7
        assert agent.max_tokens == 2000
        assert agent.role_type == "specialist"

    def test_agent_config_role_types(self):
        """Test valid role types for agents."""
        from app.repositories.agent_config import AgentConfig
        
        valid_roles = ["supervisor", "specialist", "critic"]
        
        for role in valid_roles:
            agent = AgentConfig(
                name=f"agent_{role}",
                display_name=f"Agent {role.title()}",
                system_prompt="Test prompt",
                role_type=role
            )
            assert agent.role_type == role


class TestDefaultAgents:
    """Test default agent initialization."""

    def test_default_agents_defined(self):
        """Test that default agents are properly defined."""
        from app.repositories.agent_config import DEFAULT_AGENTS
        
        assert len(DEFAULT_AGENTS) >= 5
        
        # Check supervisor exists
        supervisor = next(
            (a for a in DEFAULT_AGENTS if a["name"] == "supervisor"), 
            None
        )
        assert supervisor is not None
        assert supervisor["role_type"] == "supervisor"
        assert supervisor["is_system"] is True

    def test_default_agent_required_fields(self):
        """Test all default agents have required fields."""
        from app.repositories.agent_config import DEFAULT_AGENTS
        
        required_fields = [
            "name", "display_name", "description", 
            "system_prompt", "is_system", "role_type"
        ]
        
        for agent in DEFAULT_AGENTS:
            for field in required_fields:
                assert field in agent, f"Agent {agent.get('name')} missing field: {field}"


class TestAgentIntegration:
    """Integration tests for agent configuration.
    
    These tests require:
    - MongoDB connection
    - Authentication with teacher/admin role
    """

    @pytest.mark.skip(reason="Requires database and auth setup")
    @pytest.mark.asyncio
    async def test_create_and_delete_agent(self, sample_agent_data):
        """Test full lifecycle: create, read, update, delete agent."""
        pass

    @pytest.mark.skip(reason="Requires database and auth setup")
    @pytest.mark.asyncio
    async def test_duplicate_agent(self):
        """Test duplicating an existing agent."""
        pass

    @pytest.mark.skip(reason="Requires database and auth setup")
    @pytest.mark.asyncio
    async def test_cannot_delete_system_agent(self):
        """Test that system agents cannot be deleted."""
        pass

    @pytest.mark.skip(reason="Requires database and auth setup")
    @pytest.mark.asyncio
    async def test_cannot_disable_supervisor(self):
        """Test that supervisor agent cannot be disabled."""
        pass

    @pytest.mark.skip(reason="Requires database and auth setup")
    @pytest.mark.asyncio
    async def test_initialize_default_agents(self):
        """Test that default agents are initialized on startup."""
        from app.repositories.agent_config import initialize_default_agents
        
        await initialize_default_agents()
        # Verify agents exist in database
