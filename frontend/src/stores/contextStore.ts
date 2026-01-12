import { create } from 'zustand'

interface ContextState {
    projectId: string | null
    activeTab: string | null
    documentId: string | null
    documentContent: string | null
    whiteboardSummary: string | null
    browserUrl: string | null
    browserContent: string | null
}

interface ContextActions {
    setProjectId: (id: string | null) => void
    setActiveTab: (tab: string | null) => void
    setDocumentId: (id: string | null) => void
    setDocumentContent: (content: string | null) => void
    setWhiteboardSummary: (summary: string | null) => void
    setBrowserUrl: (url: string | null) => void
    setBrowserContent: (content: string | null) => void
}

export type ContextStore = ContextState & ContextActions

export const useContextStore = create<ContextStore>((set) => ({
    projectId: null,
    activeTab: null,
    documentId: null,
    documentContent: null,
    whiteboardSummary: null,
    browserUrl: null,
    browserContent: null,

    setProjectId: (id) => set({ projectId: id }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setDocumentId: (id) => set({ documentId: id }),
    setDocumentContent: (content) => set({ documentContent: content }),
    setWhiteboardSummary: (summary) => set({ whiteboardSummary: summary }),
    setBrowserUrl: (url) => set({ browserUrl: url }),
    setBrowserContent: (content) => set({ browserContent: content }),
}))
