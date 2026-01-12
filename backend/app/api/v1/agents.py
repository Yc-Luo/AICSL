"""Agent Configuration API routes for managing AI personas."""

from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId

from app.api.v1.auth import get_current_user
from app.repositories.user import User
from app.repositories.agent_config import AgentConfig, initialize_default_agents

router = APIRouter(prefix="/agents", tags=["agents"])


# =============================================================================
# Schemas
# =============================================================================

class AgentConfigCreate(BaseModel):
    """Request to create a new agent configuration."""
    name: str = Field(..., min_length=1, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="")
    system_prompt: str = Field(..., min_length=10)
    enabled: bool = Field(default=True)
    icon: str = Field(default="brain")
    color: str = Field(default="#6366f1")
    project_id: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2000, ge=100, le=8000)
    role_type: str = Field(default="specialist")
    can_be_router_target: bool = Field(default=True)


class AgentConfigUpdate(BaseModel):
    """Request to update an agent configuration."""
    display_name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    enabled: Optional[bool] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    role_type: Optional[str] = None
    can_be_router_target: Optional[bool] = None


class AgentConfigResponse(BaseModel):
    """Response for agent configuration."""
    id: str
    name: str
    display_name: str
    description: str
    system_prompt: str
    enabled: bool
    icon: str
    color: str
    project_id: Optional[str]
    temperature: float
    max_tokens: int
    role_type: str
    can_be_router_target: bool
    is_system: bool
    created_at: str
    updated_at: str


# =============================================================================
# Helper Functions
# =============================================================================

def agent_to_response(agent: AgentConfig) -> dict:
    """Convert AgentConfig model to response dict."""
    return {
        "id": str(agent.id),
        "name": agent.name,
        "display_name": agent.display_name,
        "description": agent.description,
        "system_prompt": agent.system_prompt,
        "enabled": agent.enabled,
        "icon": agent.icon,
        "color": agent.color,
        "project_id": agent.project_id,
        "temperature": agent.temperature,
        "max_tokens": agent.max_tokens,
        "role_type": agent.role_type,
        "can_be_router_target": agent.can_be_router_target,
        "is_system": agent.is_system,
        "created_at": agent.created_at.isoformat(),
        "updated_at": agent.updated_at.isoformat()
    }


# =============================================================================
# API Endpoints
# =============================================================================

@router.get("")
async def list_agents(
    project_id: Optional[str] = Query(None, description="Filter by project, None for global"),
    include_global: bool = Query(True, description="Include global agents when project_id is set"),
    enabled_only: bool = Query(False, description="Only return enabled agents"),
    current_user: User = Depends(get_current_user)
) -> dict:
    """List all agent configurations."""
    
    # Build query
    query_conditions = []
    
    if project_id:
        if include_global:
            query_conditions.append({"$or": [
                {"project_id": project_id},
                {"project_id": None}
            ]})
        else:
            query_conditions.append({"project_id": project_id})
    else:
        # Global agents only
        query_conditions.append({"project_id": None})
    
    if enabled_only:
        query_conditions.append({"enabled": True})
    
    # Execute query
    if query_conditions:
        agents = await AgentConfig.find({"$and": query_conditions}).to_list()
    else:
        agents = await AgentConfig.find_all().to_list()
    
    return {
        "agents": [agent_to_response(a) for a in agents],
        "total": len(agents)
    }


@router.get("/{agent_id}")
async def get_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
) -> AgentConfigResponse:
    """Get a specific agent configuration."""
    
    agent = await AgentConfig.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return agent_to_response(agent)


@router.post("")
async def create_agent(
    request: AgentConfigCreate,
    current_user: User = Depends(get_current_user)
) -> AgentConfigResponse:
    """Create a new agent configuration."""
    
    # Only teachers and admins can create agents
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    # Check for duplicate name in same scope
    existing = await AgentConfig.find_one(
        AgentConfig.name == request.name,
        AgentConfig.project_id == request.project_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Agent with name '{request.name}' already exists in this scope"
        )
    
    # Create agent
    agent = AgentConfig(
        name=request.name,
        display_name=request.display_name,
        description=request.description,
        system_prompt=request.system_prompt,
        enabled=request.enabled,
        icon=request.icon,
        color=request.color,
        project_id=request.project_id,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        role_type=request.role_type,
        can_be_router_target=request.can_be_router_target,
        is_system=False,
        created_by=str(current_user.id)
    )
    
    await agent.insert()
    
    return agent_to_response(agent)


@router.put("/{agent_id}")
async def update_agent(
    agent_id: str,
    request: AgentConfigUpdate,
    current_user: User = Depends(get_current_user)
) -> AgentConfigResponse:
    """Update an agent configuration."""
    
    # Only teachers and admins can update agents
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    agent = await AgentConfig.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        for field, value in update_data.items():
            setattr(agent, field, value)
        await agent.save()
    
    return agent_to_response(agent)


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Delete an agent configuration."""
    
    # Only teachers and admins can delete agents
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    agent = await AgentConfig.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Cannot delete system agents
    if agent.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system agents"
        )
    
    await agent.delete()
    
    return {
        "message": "Agent deleted successfully",
        "agent_id": agent_id
    }


@router.post("/{agent_id}/toggle")
async def toggle_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
) -> AgentConfigResponse:
    """Toggle agent enabled status."""
    
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    agent = await AgentConfig.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Supervisor cannot be disabled
    if agent.name == "supervisor" and agent.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot disable the supervisor agent"
        )
    
    agent.enabled = not agent.enabled
    agent.updated_at = datetime.utcnow()
    await agent.save()
    
    return agent_to_response(agent)


@router.post("/initialize-defaults")
async def initialize_defaults(
    current_user: User = Depends(get_current_user)
) -> dict:
    """Initialize default system agents (admin only)."""
    
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    await initialize_default_agents()
    
    return {"message": "Default agents initialized"}


@router.post("/{agent_id}/duplicate")
async def duplicate_agent(
    agent_id: str,
    new_name: str = Query(..., min_length=1, max_length=50),
    project_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
) -> AgentConfigResponse:
    """Duplicate an agent configuration."""
    
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    source_agent = await AgentConfig.get(agent_id)
    if not source_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source agent not found"
        )
    
    # Check for duplicate name
    existing = await AgentConfig.find_one(
        AgentConfig.name == new_name,
        AgentConfig.project_id == project_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Agent with name '{new_name}' already exists"
        )
    
    # Create duplicate
    new_agent = AgentConfig(
        name=new_name,
        display_name=f"{source_agent.display_name} (副本)",
        description=source_agent.description,
        system_prompt=source_agent.system_prompt,
        enabled=True,
        icon=source_agent.icon,
        color=source_agent.color,
        project_id=project_id,
        temperature=source_agent.temperature,
        max_tokens=source_agent.max_tokens,
        role_type=source_agent.role_type,
        can_be_router_target=source_agent.can_be_router_target,
        is_system=False,
        created_by=str(current_user.id)
    )
    
    await new_agent.insert()
    
    return agent_to_response(new_agent)
