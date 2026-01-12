"""RAG Knowledge Base API routes."""

import os
import io
from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks, UploadFile, File
from fastapi.responses import JSONResponse

from app.api.v1.auth import get_current_user
from app.repositories.user import User
from app.repositories.resource import Resource
from app.repositories.resource_embedding import ResourceEmbedding
from app.services.rag_service import rag_service
from app.services.storage_service import storage_service
from app.core.config import settings

router = APIRouter(prefix="/rag", tags=["rag"])


# =============================================================================
# Schemas
# =============================================================================

class RAGDocumentCreate(BaseModel):
    """Request to add a document to RAG knowledge base."""
    resource_id: str
    chunk_size: int = Field(default=1000, ge=100, le=5000)
    overlap: int = Field(default=100, ge=0, le=500)


class RAGDocumentResponse(BaseModel):
    """Response for RAG document."""
    id: str
    resource_id: str
    filename: str
    chunk_count: int
    status: str
    created_at: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None


class RAGStatsResponse(BaseModel):
    """RAG knowledge base statistics."""
    total_documents: int
    total_chunks: int
    total_vectors: int
    projects_covered: int
    last_updated: Optional[str] = None


class RAGQueryRequest(BaseModel):
    """Query request for RAG retrieval."""
    query: str
    project_id: Optional[str] = None
    max_results: int = Field(default=5, ge=1, le=20)


class RAGQueryResult(BaseModel):
    """Single result from RAG query."""
    content: str
    source_type: str
    source_id: str
    score: float
    metadata: Optional[dict] = None


class RAGQueryResponse(BaseModel):
    """Response from RAG query."""
    results: List[RAGQueryResult]
    total_found: int


# =============================================================================
# Helper Functions
# =============================================================================

async def extract_text_from_file(file_key: str, mime_type: str) -> str:
    """Extract text content from a file stored in MinIO/S3."""
    try:
        # Download file content
        response = storage_service.client.get_object(
            settings.MINIO_BUCKET_NAME,
            file_key
        )
        content = response.read()
        response.close()
        response.release_conn()
        
        # Handle different file types
        if mime_type in ['text/plain', 'text/markdown', 'text/csv']:
            # Plain text files
            return content.decode('utf-8', errors='ignore')
        
        elif mime_type == 'application/pdf':
            # PDF - requires PyMuPDF or pdfplumber
            try:
                import fitz  # PyMuPDF
                pdf = fitz.open(stream=content, filetype="pdf")
                text = ""
                for page in pdf:
                    text += page.get_text()
                pdf.close()
                return text
            except ImportError:
                # Fallback: try pdfplumber
                try:
                    import pdfplumber
                    with pdfplumber.open(io.BytesIO(content)) as pdf:
                        text = ""
                        for page in pdf.pages:
                            text += page.extract_text() or ""
                        return text
                except ImportError:
                    raise ValueError("PDF parsing library not installed. Install PyMuPDF or pdfplumber.")
        
        elif mime_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            # Word documents - requires python-docx
            try:
                from docx import Document
                doc = Document(io.BytesIO(content))
                text = "\n".join([para.text for para in doc.paragraphs])
                return text
            except ImportError:
                raise ValueError("python-docx not installed for Word document parsing.")
        
        elif mime_type == 'text/html':
            # HTML - extract text using BeautifulSoup
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(content.decode('utf-8', errors='ignore'), 'html.parser')
            return soup.get_text(separator='\n', strip=True)
        
        else:
            # Try to decode as text for unknown types
            return content.decode('utf-8', errors='ignore')
            
    except Exception as e:
        raise ValueError(f"Failed to extract text: {str(e)}")


async def process_resource_for_rag(resource_id: str, chunk_size: int = 1000, overlap: int = 100):
    """Background task to process resource for RAG."""
    try:
        # Get resource
        resource = await Resource.get(resource_id)
        if not resource:
            print(f"[RAG] Resource not found: {resource_id}")
            return
        
        # Extract text
        try:
            text = await extract_text_from_file(resource.file_key, resource.mime_type)
        except ValueError as e:
            print(f"[RAG] Failed to extract text from {resource.filename}: {e}")
            return
        
        if not text or len(text.strip()) < 50:
            print(f"[RAG] Insufficient text content in {resource.filename}")
            return
        
        # Delete existing embeddings for this resource
        await ResourceEmbedding.find(ResourceEmbedding.resource_id == resource_id).delete()
        
        # Process with RAG service
        await rag_service.process_resource(resource_id, text, chunk_size, overlap)
        
        print(f"[RAG] Successfully processed resource: {resource.filename}")
        
    except Exception as e:
        print(f"[RAG] Error processing resource {resource_id}: {e}")


# =============================================================================
# API Endpoints
# =============================================================================

@router.get("/stats")
async def get_rag_stats(
    current_user: User = Depends(get_current_user)
) -> RAGStatsResponse:
    """Get RAG knowledge base statistics."""
    # Only teachers and admins can view stats
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    # Count total embeddings
    total_chunks = await ResourceEmbedding.count()
    
    # Get unique resource IDs
    pipeline = [
        {"$group": {"_id": "$resource_id"}},
        {"$count": "total"}
    ]
    result = await ResourceEmbedding.aggregate(pipeline).to_list()
    total_documents = result[0]["total"] if result else 0
    
    # Get projects covered
    indexed_resource_ids = await ResourceEmbedding.distinct("resource_id")
    if indexed_resource_ids:
        from bson import ObjectId
        object_ids = []
        for rid in indexed_resource_ids:
            try:
                object_ids.append(ObjectId(rid))
            except:
                pass
        resources = await Resource.find({"_id": {"$in": object_ids}}).to_list()
        project_ids = set(r.project_id for r in resources if r.project_id)
        projects_covered = len(project_ids)
    else:
        projects_covered = 0
    
    # Get last updated
    latest = await ResourceEmbedding.find_one(sort=[("created_at", -1)])
    last_updated = latest.created_at.isoformat() if latest else None
    
    return RAGStatsResponse(
        total_documents=total_documents,
        total_chunks=total_chunks,
        total_vectors=total_chunks,  # Each chunk has one vector
        projects_covered=projects_covered,
        last_updated=last_updated
    )


@router.get("/documents")
async def list_rag_documents(
    project_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
) -> dict:
    """List documents in RAG knowledge base."""
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    # Get all indexed resource IDs
    indexed_resource_ids = await ResourceEmbedding.distinct("resource_id")
    
    if not indexed_resource_ids:
        return {"documents": [], "total": 0, "page": page, "page_size": page_size}
    
    # Convert string IDs to ObjectId for query
    from bson import ObjectId
    object_ids = []
    for rid in indexed_resource_ids:
        try:
            object_ids.append(ObjectId(rid))
        except:
            pass
    
    # Build query for resources
    query = {"_id": {"$in": object_ids}}
    if project_id:
        query["project_id"] = project_id
    
    # Get resources with pagination
    skip = (page - 1) * page_size
    resources = await Resource.find(query).skip(skip).limit(page_size).to_list()
    total = await Resource.find(query).count()
    
    # Get chunk counts for each resource
    documents = []
    for resource in resources:
        chunk_count = await ResourceEmbedding.find(
            ResourceEmbedding.resource_id == str(resource.id)
        ).count()
        
        # Get project name
        from app.repositories.project import Project
        project = await Project.get(resource.project_id) if resource.project_id else None
        
        documents.append({
            "id": str(resource.id),
            "resource_id": str(resource.id),
            "filename": resource.filename,
            "chunk_count": chunk_count,
            "status": "indexed" if chunk_count > 0 else "pending",
            "created_at": resource.uploaded_at.isoformat(),
            "project_id": resource.project_id,
            "project_name": project.name if project else None,
            "mime_type": resource.mime_type,
            "size": resource.size
        })
    
    return {
        "documents": documents,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/documents")
async def add_document_to_rag(
    request: RAGDocumentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Add a resource document to RAG knowledge base for vectorization."""
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    # Verify resource exists
    resource = await Resource.get(request.resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Check if already indexed
    existing_count = await ResourceEmbedding.find(
        ResourceEmbedding.resource_id == request.resource_id
    ).count()
    
    if existing_count > 0:
        # Re-index - delete existing
        await ResourceEmbedding.find(
            ResourceEmbedding.resource_id == request.resource_id
        ).delete()
    
    # Add background task for processing
    background_tasks.add_task(
        process_resource_for_rag,
        request.resource_id,
        request.chunk_size,
        request.overlap
    )
    
    return {
        "message": "Document queued for RAG indexing",
        "resource_id": request.resource_id,
        "filename": resource.filename,
        "status": "processing"
    }


@router.delete("/documents/{resource_id}")
async def remove_document_from_rag(
    resource_id: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Remove a document from RAG knowledge base."""
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    # Delete all embeddings for this resource
    delete_result = await ResourceEmbedding.find(
        ResourceEmbedding.resource_id == resource_id
    ).delete()
    
    return {
        "message": "Document removed from RAG knowledge base",
        "resource_id": resource_id,
        "chunks_deleted": delete_result.deleted_count if delete_result else 0
    }


@router.post("/query")
async def query_rag(
    request: RAGQueryRequest,
    current_user: User = Depends(get_current_user)
) -> RAGQueryResponse:
    """Query the RAG knowledge base."""
    
    if not request.project_id:
        # For now, require project_id
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="project_id is required for RAG queries"
        )
    
    # Use RAG service to retrieve context
    results = await rag_service.retrieve_context(
        project_id=request.project_id,
        query=request.query,
        max_results=request.max_results
    )
    
    # Format results
    query_results = []
    for citation in results.get("citations", []):
        query_results.append(RAGQueryResult(
            content="",  # Content would need to be fetched separately
            source_type=citation.get("resource_type", "unknown"),
            source_id=citation.get("resource_id", ""),
            score=citation.get("score", 0),
            metadata=None
        ))
    
    return RAGQueryResponse(
        results=query_results,
        total_found=len(query_results)
    )


@router.post("/batch-index")
async def batch_index_resources(
    project_id: Optional[str] = Query(None),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Batch index all resources for a project or all projects."""
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    # Get resources to index
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    resources = await Resource.find(query).to_list()
    
    # Get already indexed resource IDs
    indexed_ids = set(await ResourceEmbedding.distinct("resource_id"))
    
    # Filter to only unindexed resources
    to_index = [r for r in resources if str(r.id) not in indexed_ids]
    
    # Supported mime types for text extraction
    supported_types = [
        'text/plain', 'text/markdown', 'text/csv', 'text/html',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    to_index = [r for r in to_index if r.mime_type in supported_types]
    
    # Queue background tasks
    for resource in to_index:
        background_tasks.add_task(process_resource_for_rag, str(resource.id))
    
    return {
        "message": f"Queued {len(to_index)} resources for RAG indexing",
        "resources_queued": len(to_index),
        "skipped_already_indexed": len(resources) - len(to_index)
    }


@router.get("/unindexed-resources")
async def get_unindexed_resources(
    project_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
) -> dict:
    """Get list of resources that haven't been indexed yet."""
    if current_user.role not in ['teacher', 'admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    # Get all resources
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    resources = await Resource.find(query).to_list()
    
    # Get indexed resource IDs
    indexed_ids = set(await ResourceEmbedding.distinct("resource_id"))
    
    # Supported mime types
    supported_types = [
        'text/plain', 'text/markdown', 'text/csv', 'text/html',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    unindexed = []
    for r in resources:
        if str(r.id) not in indexed_ids:
            # Get project name
            from app.repositories.project import Project
            project = await Project.get(r.project_id) if r.project_id else None
            
            unindexed.append({
                "id": str(r.id),
                "filename": r.filename,
                "mime_type": r.mime_type,
                "size": r.size,
                "project_id": r.project_id,
                "project_name": project.name if project else None,
                "uploaded_at": r.uploaded_at.isoformat(),
                "supported": r.mime_type in supported_types
            })
    
    return {
        "resources": unindexed,
        "total": len(unindexed)
    }
