import api from '../api/client';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';

export interface TrackEvent {
    module: 'whiteboard' | 'document' | 'chat' | 'resources' | 'browser' | 'ai' | 'task' | 'calendar' | 'dashboard' | 'analytics' | 'inquiry';
    action: string;
    resource_id?: string;
    metadata?: Record<string, any>;
    timestamp?: string; // ISO string
}

interface BehaviorData {
    project_id: string;
    user_id: string;
    module: string;
    action: string;
    resource_id?: string;
    metadata?: Record<string, any>;
    timestamp?: string;
}

class TrackingService {
    private buffer: BehaviorData[] = [];
    private readonly BATCH_SIZE = 10;
    private readonly FLUSH_INTERVAL = 5000;
    private timer: NodeJS.Timeout | null = null;

    constructor() {
        this.startFlushTimer();
        this.setupUnloadHandler();
    }

    /**
     * Track a user behavior event
     */
    track(event: TrackEvent) {
        const user = useAuthStore.getState().user;

        // We only track if user is logged in
        if (!user) return;

        // Ensure we have a project ID or fallback
        const storeState = useProjectStore.getState();
        const project = storeState.currentProject;

        const projectId = project?.id || event.metadata?.projectId || event.metadata?.project_id || 'global';

        // If currentProject is null but we have a projectId, try to find it in the projects list
        const activeProject = project || (projectId !== 'global' ? storeState.projects.find(p => p.id === projectId) : null);

        // Enhance metadata with role information
        const projectRole = activeProject?.members?.find((m: any) => m.user_id === user.id)?.role || 'unknown';

        const enhancedMetadata = {
            ...(event.metadata || {}),
            user_role: user.role, // Global role (student/teacher)
            project_role: projectRole // Project context role
        };

        const behaviorData: BehaviorData = {
            project_id: projectId,
            user_id: user.id,
            module: event.module,
            action: event.action,
            resource_id: event.resource_id,
            metadata: enhancedMetadata,
            timestamp: event.timestamp || new Date().toISOString(),
        };

        this.buffer.push(behaviorData);

        if (this.buffer.length >= this.BATCH_SIZE) {
            this.flush();
        }
    }

    /**
     * Flush buffered events to the backend
     */
    async flush() {
        if (this.buffer.length === 0) return;

        const batch = [...this.buffer];
        this.buffer = [];

        try {
            await api.post('/analytics/behavior/batch', { behaviors: batch });
        } catch (error) {
            console.error('[TrackingService] Failed to flush events', error);
            // Optional: Retry logic or re-add to buffer (careful with overflow)
        }
    }

    private startFlushTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.flush();
        }, this.FLUSH_INTERVAL);
    }

    private setupUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            this.flush();
        });
    }
}

export const trackingService = new TrackingService();
