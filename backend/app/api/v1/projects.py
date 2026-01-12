"""Project management API routes."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.v1.auth import get_current_user
from app.core.config import settings
from app.core.permissions import check_project_permission
from app.repositories.project import Project
from app.repositories.user import User
from app.core.schemas.project import (
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectMemberAddRequest,
    ProjectResponse,
    ProjectUpdateRequest,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ProjectListResponse)
async def get_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    archived: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
) -> ProjectListResponse:
    """Get current user's projects."""
    query = {}

    # Filter by user participation
    if current_user.role == "student":
        # Students can only see projects they're members of
        query["$or"] = [
            {"owner_id": str(current_user.id)},
            {"members.user_id": str(current_user.id)},
        ]
    elif current_user.role == "teacher":
        # Teachers can see all projects (will be filtered by class later)
        pass
    # Admins can see all projects

    if archived is not None:
        query["is_archived"] = archived

    projects_cursor = Project.find(query).skip(skip).limit(limit)
    projects_list = await projects_cursor.to_list()
    total = await Project.find(query).count()

    return ProjectListResponse(
        projects=[
            ProjectResponse(
                id=str(p.id),
                name=p.name,
                subtitle=p.subtitle,
                description=p.description,
                owner_id=p.owner_id,
                members=[
                    {
                        "user_id": m.get("user_id"),
                        "role": m.get("role"),
                        "joined_at": m.get("joined_at"),
                    }
                    for m in p.members
                ],
                progress=p.progress,
                is_template=p.is_template,
                is_archived=p.is_archived,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in projects_list
        ],
        total=total,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """Create a new project."""
    # Check student project limit (only 1 project per student)
    if current_user.role == "student":
        existing_projects = await Project.find(
            {
                "$or": [
                    {"owner_id": str(current_user.id)},
                    {"members.user_id": str(current_user.id)},
                ],
                "is_archived": False,
            }
        ).to_list()
        if len(existing_projects) >= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Students can only join 1 project",
            )

    # Create project
    from datetime import datetime

    new_project = Project(
        name=project_data.name,
        subtitle=project_data.subtitle,
        description=project_data.description,
        owner_id=str(current_user.id),
        members=[
            {
                "user_id": str(current_user.id),
                "role": "owner",
                "joined_at": datetime.utcnow(),
            }
        ],
    )
    await new_project.insert()

    return ProjectResponse(
        id=str(new_project.id),
        name=new_project.name,
        subtitle=new_project.subtitle,
        description=new_project.description,
        owner_id=new_project.owner_id,
        members=[
            {
                "user_id": m.get("user_id"),
                "role": m.get("role"),
                "joined_at": m.get("joined_at"),
            }
            for m in new_project.members
        ],
        progress=new_project.progress,
        is_template=new_project.is_template,
        is_archived=new_project.is_archived,
        created_at=new_project.created_at,
        updated_at=new_project.updated_at,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """Get project details."""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check permission
    if not check_project_permission(
        current_user, project.owner_id, current_user.role
    ):
        # Check if user is a member
        is_member = any(
            m.get("user_id") == str(current_user.id) for m in project.members
        )
        if not is_member and current_user.role not in ["admin", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this project",
            )

    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        subtitle=project.subtitle,
        description=project.description,
        owner_id=project.owner_id,
        members=[
            {
                "user_id": m.get("user_id"),
                "role": m.get("role"),
                "joined_at": m.get("joined_at"),
            }
            for m in project.members
        ],
        progress=project.progress,
        is_template=project.is_template,
        is_archived=project.is_archived,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdateRequest,
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """Update project (Owner only)."""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Only owner or authorized staff can update
    if (
        str(current_user.id) != project.owner_id
        and current_user.role not in ["admin", "teacher"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or teacher can update project",
        )

    from datetime import datetime

    if project_data.name:
        project.name = project_data.name
    if project_data.subtitle is not None:
        project.subtitle = project_data.subtitle
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.progress is not None:
        project.progress = project_data.progress
    if project_data.is_archived is not None:
        project.is_archived = project_data.is_archived
    project.updated_at = datetime.utcnow()

    await project.save()

    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        subtitle=project.subtitle,
        description=project.description,
        owner_id=project.owner_id,
        members=[
            {
                "user_id": m.get("user_id"),
                "role": m.get("role"),
                "joined_at": m.get("joined_at"),
            }
            for m in project.members
        ],
        progress=project.progress,
        is_template=project.is_template,
        is_archived=project.is_archived,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete project (Owner only)."""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Only owner or authorized staff can delete
    if (
        str(current_user.id) != project.owner_id
        and current_user.role not in ["admin", "teacher"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or teacher can delete project",
        )

    await project.delete()


@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
async def add_project_member(
    project_id: str,
    member_data: ProjectMemberAddRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Add a member to project (Owner/Editor only)."""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check permission
    is_owner = str(current_user.id) == project.owner_id
    is_editor = any(
        m.get("user_id") == str(current_user.id) and m.get("role") in ["owner", "editor"]
        for m in project.members
    )
    if not (is_owner or is_editor) and current_user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner and editor can invite members",
        )

    # Check member limit
    if len(project.members) >= settings.MAX_PROJECT_MEMBERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project can have at most {settings.MAX_PROJECT_MEMBERS} members",
        )

    # Resolve user
    target_user_id = member_data.user_id
    if member_data.email:
        user = await User.find_one(User.email == member_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User with this email not found",
            )
        target_user_id = str(user.id)
    
    if not target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either user_id or email must be provided",
        )

    # Check if user is already a member
    if any(m.get("user_id") == target_user_id for m in project.members):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project",
        )

    # Add member
    from datetime import datetime

    project.members.append(
        {
            "user_id": target_user_id,
            "role": member_data.role,
            "joined_at": datetime.utcnow(),
        }
    )
    await project.save()

    return {"message": "Member added successfully"}


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project_member(
    project_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove a member from project (Owner only)."""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Only owner or authorized staff can remove members
    if (
        str(current_user.id) != project.owner_id
        and current_user.role not in ["admin", "teacher"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or teacher can remove members",
        )

    # Remove member
    project.members = [m for m in project.members if m.get("user_id") != user_id]
    await project.save()


@router.post("/{project_id}/archive", response_model=ProjectResponse)
async def archive_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """Archive a project (Owner only)."""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Only owner or authorized staff can archive
    if (
        str(current_user.id) != project.owner_id
        and current_user.role not in ["admin", "teacher"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or teacher can archive project",
        )

    from datetime import datetime

    project.is_archived = True
    project.updated_at = datetime.utcnow()
    await project.save()

    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        subtitle=project.subtitle,
        description=project.description,
        owner_id=project.owner_id,
        members=[
            {
                "user_id": m.get("user_id"),
                "role": m.get("role"),
                "joined_at": m.get("joined_at"),
            }
            for m in project.members
        ],
        progress=project.progress,
        is_template=project.is_template,
        is_archived=project.is_archived,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.post("/{project_id}/unarchive", response_model=ProjectResponse)
async def unarchive_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """Unarchive a project (Owner only)."""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Only owner or authorized staff can unarchive
    if (
        str(current_user.id) != project.owner_id
        and current_user.role not in ["admin", "teacher"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or teacher can unarchive project",
        )

    from datetime import datetime

    project.is_archived = False
    project.updated_at = datetime.utcnow()
    await project.save()

    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        subtitle=project.subtitle,
        description=project.description,
        owner_id=project.owner_id,
        members=[
            {
                "user_id": m.get("user_id"),
                "role": m.get("role"),
                "joined_at": m.get("joined_at"),
            }
            for m in project.members
        ],
        progress=project.progress,
        is_template=project.is_template,
        is_archived=project.is_archived,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.put("/{project_id}/members/{user_id}/role", response_model=dict)
async def update_member_role(
    project_id: str,
    user_id: str,
    new_role: str = Query(..., pattern="^(owner|editor|viewer)$"),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Update member role (Owner only)."""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Only owner can change roles
    if str(current_user.id) != project.owner_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner can change member roles",
        )

    # Find member
    member = next(
        (m for m in project.members if m.get("user_id") == user_id), None
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    # Update role
    member["role"] = new_role
    await project.save()

    return {"message": "Member role updated successfully"}


@router.post("/{project_id}/transfer-ownership", response_model=ProjectResponse)
async def transfer_ownership(
    project_id: str,
    new_owner_id: str = Query(...),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """Transfer project ownership (Owner only)."""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Only owner can transfer
    if str(current_user.id) != project.owner_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner can transfer ownership",
        )

    # Check if new owner is a member
    member = next(
        (m for m in project.members if m.get("user_id") == new_owner_id), None
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New owner must be a project member",
        )

    from datetime import datetime

    # Update old owner role to editor
    old_owner = next(
        (m for m in project.members if m.get("user_id") == project.owner_id), None
    )
    if old_owner:
        old_owner["role"] = "editor"

    # Update new owner role
    member["role"] = "owner"

    # Update project owner
    project.owner_id = new_owner_id
    project.updated_at = datetime.utcnow()
    await project.save()

    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        subtitle=project.subtitle,
        description=project.description,
        owner_id=project.owner_id,
        members=[
            {
                "user_id": m.get("user_id"),
                "role": m.get("role"),
                "joined_at": m.get("joined_at"),
            }
            for m in project.members
        ],
        progress=project.progress,
        is_template=project.is_template,
        is_archived=project.is_archived,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )

