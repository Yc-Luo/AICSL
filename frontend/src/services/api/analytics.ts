import api from './client'
import { API_ENDPOINTS } from '../../config/api'

export interface BehaviorData {
  project_id: string
  user_id: string
  module: string
  action: string
  resource_id?: string
  metadata?: Record<string, any>
  timestamp?: Date
}

export interface HeartbeatData {
  project_id: string
  user_id: string
  module: string
  resource_id?: string
  timestamp: Date
}

export const analyticsService = {
  async sendBehavior(data: BehaviorData): Promise<void> {
    await api.post(API_ENDPOINTS.ANALYTICS.BEHAVIOR, data)
  },

  async sendBehaviorBatch(behaviors: BehaviorData[]): Promise<void> {
    await api.post(API_ENDPOINTS.ANALYTICS.BATCH, {
      behaviors,
    })
  },

  async sendHeartbeat(data: HeartbeatData): Promise<void> {
    await api.post(API_ENDPOINTS.ANALYTICS.HEARTBEAT, data)
  },

  async getActivityLogs(
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params: Record<string, string> = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    const response = await api.get(
      API_ENDPOINTS.ANALYTICS.ACTIVITY_LOGS(projectId),
      { params }
    )
    return response.data
  },

  async getDashboardData(
    projectId: string,
    userId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params: Record<string, string> = {}
    if (userId) params.user_id = userId
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    const response = await api.get(
      API_ENDPOINTS.ANALYTICS.DASHBOARD(projectId),
      { params }
    )
    return response.data
  },

  async getBehaviorStream(
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params: Record<string, string> = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    const response = await api.get(
      API_ENDPOINTS.ANALYTICS.BEHAVIOR_STREAM(projectId),
      { params }
    )
    return response.data
  },

  async exportData(
    projectId: string,
    format: 'json' | 'csv' = 'json',
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params: Record<string, string> = { format }
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    const response = await api.get(
      API_ENDPOINTS.ANALYTICS.EXPORT(projectId),
      { params }
    )
    return response.data
  },
}

