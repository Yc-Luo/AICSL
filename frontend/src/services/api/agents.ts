/**
 * Agent Configuration Service API
 * For managing AI agent personas and their settings
 */

import { apiClient } from './base';

// Types
export interface AgentConfig {
    id: string;
    name: string;
    display_name: string;
    description: string;
    system_prompt: string;
    enabled: boolean;
    icon: string;
    color: string;
    project_id: string | null;
    temperature: number;
    max_tokens: number;
    role_type: 'supervisor' | 'specialist' | 'critic';
    can_be_router_target: boolean;
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

export interface AgentConfigCreate {
    name: string;
    display_name: string;
    description?: string;
    system_prompt: string;
    enabled?: boolean;
    icon?: string;
    color?: string;
    project_id?: string | null;
    temperature?: number;
    max_tokens?: number;
    role_type?: string;
    can_be_router_target?: boolean;
}

export interface AgentConfigUpdate {
    display_name?: string;
    description?: string;
    system_prompt?: string;
    enabled?: boolean;
    icon?: string;
    color?: string;
    temperature?: number;
    max_tokens?: number;
    role_type?: string;
    can_be_router_target?: boolean;
}

// API Functions
export const agentService = {
    /**
     * List all agent configurations
     */
    async listAgents(params?: {
        project_id?: string;
        include_global?: boolean;
        enabled_only?: boolean;
    }): Promise<{
        agents: AgentConfig[];
        total: number;
    }> {
        return await apiClient.get('/agents', { params });
    },

    /**
     * Get a specific agent configuration
     */
    async getAgent(agentId: string): Promise<AgentConfig> {
        return await apiClient.get(`/agents/${agentId}`);
    },

    /**
     * Create a new agent configuration
     */
    async createAgent(data: AgentConfigCreate): Promise<AgentConfig> {
        return await apiClient.post('/agents', data);
    },

    /**
     * Update an agent configuration
     */
    async updateAgent(agentId: string, data: AgentConfigUpdate): Promise<AgentConfig> {
        return await apiClient.put(`/agents/${agentId}`, data);
    },

    /**
     * Delete an agent configuration
     */
    async deleteAgent(agentId: string): Promise<{
        message: string;
        agent_id: string;
    }> {
        return await apiClient.delete(`/agents/${agentId}`);
    },

    /**
     * Toggle agent enabled status
     */
    async toggleAgent(agentId: string): Promise<AgentConfig> {
        return await apiClient.post(`/agents/${agentId}/toggle`);
    },

    /**
     * Duplicate an agent configuration
     */
    async duplicateAgent(agentId: string, newName: string, projectId?: string): Promise<AgentConfig> {
        return await apiClient.post(`/agents/${agentId}/duplicate`, null, {
            params: { new_name: newName, project_id: projectId }
        });
    },

    /**
     * Initialize default system agents
     */
    async initializeDefaults(): Promise<{ message: string }> {
        return await apiClient.post('/agents/initialize-defaults');
    }
};

export default agentService;
