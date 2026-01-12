export interface Project {
    id: string
    name: string
    subtitle?: string
    description?: string
    owner_id: string
    members: ProjectMember[]
    progress: number
    is_template: boolean
    is_archived: boolean
    created_at: string
    updated_at: string
}

export interface ProjectMember {
    user_id: string
    role: 'owner' | 'editor' | 'viewer'
    joined_at: string
}

export interface CreateProjectData {
    name: string
    subtitle?: string
    description?: string
    members?: string[]
    is_template?: boolean
}

export interface UpdateProjectData {
    name?: string
    subtitle?: string
    description?: string
    progress?: number
    is_archived?: boolean
}
