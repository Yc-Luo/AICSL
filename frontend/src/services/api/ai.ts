import api from './client'

export interface AIPersona {
    id: string
    name: string
    icon: string
    description: string
    system_prompt?: string
}

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    created_at?: string
}

export const aiService = {
    getPersonas: async (): Promise<AIPersona[]> => {
        const response = await api.get('/ai/personas')
        return response.data
    },

    createConversation: async (personaId: string, contextConfig: any) => {
        console.log('[AI API] Creating conversation with:', { personaId, contextConfig });
        const response = await api.post('/ai/conversations', {
            project_id: contextConfig.project_id,
            role_id: personaId,
        })
        return response.data
    },

    sendMessage: async (conversationId: string | null | undefined, message: string, projectId: string) => {
        const response = await api.post('/ai/chat', {
            project_id: projectId,
            conversation_id: conversationId || undefined,
            message: message,
        })
        return response.data
    },

    // Get conversations for a project
    getConversations: async (projectId: string): Promise<any> => {
        const response = await api.get(`/ai/conversations/${projectId}`)
        return response.data
    },

    // Get messages for a conversation
    getMessages: async (conversationId: string): Promise<any> => {
        const response = await api.get(`/ai/conversations/${conversationId}/messages`)
        return response.data
    },

    // Delete a conversation
    deleteConversation: async (conversationId: string): Promise<void> => {
        await api.delete(`/ai/conversations/${conversationId}`)
    },

    // Perform specialized context actions
    performAction: async (data: {
        project_id: string
        action_type: 'summarize' | 'knowledge_graph' | 'optimize' | 'devil_advocate' | 'inquiry_clustering'
        context_type: 'document' | 'whiteboard' | 'browser' | 'dashboard'
        content: string
        additional_query?: string
    }) => {
        const response = await api.post('/ai/action', data)
        return response.data
    },

    // Helper to get streaming URL
    getStreamUrl: (conversationId: string) => {
        return `/ai/conversations/${conversationId}/messages/stream`
    }
}
