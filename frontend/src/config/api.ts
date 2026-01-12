import { config } from './env';

export const API_CONFIG = {
    BASE_URL: config.apiBaseUrl,
    TIMEOUT: 20000,
    HEADERS: {
        'Content-Type': 'application/json',
    },
};

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ME: '/auth/me',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
    },
    PROJECTS: {
        BASE: '/projects',
        MEMBERS: (id: string) => `/projects/${id}/members`,
        MEMBER_ROLE: (id: string, userId: string) => `/projects/${id}/members/${userId}/role`,
        ARCHIVE: (id: string) => `/projects/${id}/archive`,
        UNARCHIVE: (id: string) => `/projects/${id}/unarchive`,
        TRANSFER: (id: string) => `/projects/${id}/transfer-ownership`,
    },
    DOCUMENTS: {
        BASE: '/documents',
        BY_PROJECT: (projectId: string) => `/documents/projects/${projectId}`,
        VERSIONS: (id: string) => `/documents/${id}/versions`,
        RESTORE: (id: string, versionId: string) => `/documents/${id}/versions/${versionId}/restore`,
    },
    USERS: '/users',
    ADMIN: {
        USERS: '/admin/users',
        STATS: '/admin/stats',
        BROADCAST: '/admin/broadcast',
        CONFIGS: '/admin/system-configs',
        CONFIG_DETAIL: (key: string) => `/admin/system-configs/${key}`,
        BEHAVIOR_LOGS: '/admin/behavior-logs',
        BEHAVIOR_LOGS_EXPORT: '/admin/behavior-logs/export',
    },
    ANALYTICS: {
        BEHAVIOR: '/analytics/behavior',
        BATCH: '/analytics/behavior/batch',
        HEARTBEAT: '/analytics/heartbeat',
        ACTIVITY_LOGS: (id: string) => `/analytics/projects/${id}/activity-logs`,
        DASHBOARD: (id: string) => `/analytics/projects/${id}/dashboard`,
        BEHAVIOR_STREAM: (id: string) => `/analytics/projects/${id}/behavior`,
        EXPORT: (id: string) => `/analytics/projects/${id}/export`,
    },
    COLLABORATION: {
        BASE: '/collaboration',
        SNAPSHOT: (id: string) => `/collaboration/projects/${id}/snapshot`,
    },
    TASKS: '/tasks',
    RESOURCES: '/storage',
} as const;
