/**
 * RAG Knowledge Base Service API
 */

import { apiClient } from './base';

// Types
export interface RAGStats {
    total_documents: number;
    total_chunks: number;
    total_vectors: number;
    projects_covered: number;
    last_updated: string | null;
}

export interface RAGDocument {
    id: string;
    resource_id: string;
    filename: string;
    chunk_count: number;
    status: 'indexed' | 'pending' | 'processing' | 'error';
    created_at: string;
    project_id: string | null;
    project_name: string | null;
    mime_type?: string;
    size?: number;
}

export interface UnindexedResource {
    id: string;
    filename: string;
    mime_type: string;
    size: number;
    project_id: string;
    project_name: string | null;
    uploaded_at: string;
    supported: boolean;
}

export interface RAGQueryResult {
    content: string;
    source_type: string;
    source_id: string;
    score: number;
    metadata?: Record<string, unknown>;
}

// API Functions
export const ragService = {
    /**
     * Get RAG knowledge base statistics
     */
    async getStats(): Promise<RAGStats> {
        return await apiClient.get<RAGStats>('/rag/stats');
    },

    /**
     * List indexed documents
     */
    async listDocuments(params?: {
        project_id?: string;
        page?: number;
        page_size?: number;
    }): Promise<{
        documents: RAGDocument[];
        total: number;
        page: number;
        page_size: number;
    }> {
        return await apiClient.get('/rag/documents', { params });
    },

    /**
     * Add a document to RAG knowledge base
     */
    async addDocument(data: {
        resource_id: string;
        chunk_size?: number;
        overlap?: number;
    }): Promise<{
        message: string;
        resource_id: string;
        filename: string;
        status: string;
    }> {
        return await apiClient.post('/rag/documents', data);
    },

    /**
     * Remove a document from RAG knowledge base
     */
    async removeDocument(resourceId: string): Promise<{
        message: string;
        resource_id: string;
        chunks_deleted: number;
    }> {
        return await apiClient.delete(`/rag/documents/${resourceId}`);
    },

    /**
     * Query the RAG knowledge base
     */
    async query(data: {
        query: string;
        project_id?: string;
        max_results?: number;
    }): Promise<{
        results: RAGQueryResult[];
        total_found: number;
    }> {
        return await apiClient.post('/rag/query', data);
    },

    /**
     * Batch index resources for a project
     */
    async batchIndex(projectId?: string): Promise<{
        message: string;
        resources_queued: number;
        skipped_already_indexed: number;
    }> {
        return await apiClient.post('/rag/batch-index', null, {
            params: { project_id: projectId }
        });
    },

    /**
     * Get unindexed resources
     */
    async getUnindexedResources(projectId?: string): Promise<{
        resources: UnindexedResource[];
        total: number;
    }> {
        return await apiClient.get('/rag/unindexed-resources', {
            params: { project_id: projectId }
        });
    }
};

export default ragService;

