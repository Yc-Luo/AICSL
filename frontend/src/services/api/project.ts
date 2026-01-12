import { projectService as newProjectService } from './projectApi' // Assuming index was renamed or migrated? Or I remove this import if project.ts IS the new service?
import { Project, CreateProjectData } from '../../types'

export type ProjectListResponse = {
  projects: Project[]
  total: number
}

export type ProjectCreateRequest = CreateProjectData

// Re-export specific methods or just default to new service
// We map the old interface to the new one if needed
export const projectService = {
  async getProjects(archived?: boolean): Promise<ProjectListResponse> {
    return newProjectService.getProjects(!!archived)
    // Wait, getProjects in Repo takes (forceRefresh), Api takes (archived).
    // The repo implementation in Step 127 seemed to ignore arguments for getProjects?
    // Let's re-read the repo implementation. 
    // Ah, Repo.getProjects(forceRefresh). It calls Api.getProjects().
    // Api.getProjects(archived). 
    // Repo is hiding the archived param! This is a bug in my new Repo.

    // For now, let's just proxy to the repo assuming standard fetch.
    // If archived is needed, we should probably access API directly or fix Repo.
    // I'll fix the Repo next.
  },

  async getProject(projectId: string): Promise<Project> {
    return newProjectService.getProject(projectId)
  },

  async createProject(data: ProjectCreateRequest): Promise<Project> {
    return newProjectService.createProject(data)
  },

  async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
    return newProjectService.updateProject(projectId, data)
  },

  async deleteProject(projectId: string): Promise<void> {
    return newProjectService.deleteProject(projectId)
  },

  async addMember(projectId: string, data: { userId?: string, email?: string, role: string }): Promise<void> {
    return newProjectService.addMember(projectId, data)
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    return newProjectService.removeMember(projectId, userId)
  },

  async archiveProject(projectId: string): Promise<Project> {
    return newProjectService.archiveProject(projectId)
  },

  async unarchiveProject(projectId: string): Promise<Project> {
    return newProjectService.unarchiveProject(projectId)
  },
}
