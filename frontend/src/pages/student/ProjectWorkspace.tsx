import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import RightSidebar from '../../components/layout/RightSidebar'
import TabNavigation from '../../components/layout/TabNavigation'
import ConnectionStatusBanner from '../../components/feedback/ConnectionStatusBanner'
import ResourceLibrary from '../../components/features/student/resources/ResourceLibrary'
import LearningDashboard from '../../components/features/student/dashboard/LearningDashboard'
import DocumentEditor from '../../components/features/student/document/DocumentEditor'
import { InquirySpace } from '../../modules/inquiry/components/InquirySpace'
import AITutor from '../../components/features/student/ai/AITutor'
import AIAssistant from '../../components/features/student/ai/AIAssistant'
import NotificationCenter from '../../components/feedback/NotificationCenter'
import WebAnnotationBrowser from '../../components/features/student/browser/WebAnnotationBrowser'
import { projectService } from '../../services/api/project'
import { documentService } from '../../services/api/document'
import { Project } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import { useSyncStore } from '../../stores/syncStore'
import Settings from '../../components/features/student/settings/Settings'
import { syncService } from '../../services/sync/SyncService'
import { useBehaviorTracking } from '../../hooks/common/useBehaviorTracking'
import { useActivityTracking } from '../../hooks/common/useActivityTracking'
import { useContextStore } from '../../stores/contextStore'

export default function Main() {
  const { projectId } = useParams<{ projectId?: string }>()
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(projectId)
  const [activeTab, setActiveTab] = useState('document')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [_project, setProject] = useState<Project | null>(null)
  const [currentDocumentId, setCurrentDocumentId] = useState<string | undefined>(undefined)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const { connectionStatus } = useSyncStore()
  const { user } = useAuthStore()
  const setContextProjectId = useContextStore(state => state.setProjectId)
  const setContextActiveTab = useContextStore(state => state.setActiveTab)
  const setContextDocumentId = useContextStore(state => state.setDocumentId)

  // Update Context Store
  useEffect(() => {
    setContextProjectId(currentProjectId || null)
  }, [currentProjectId, setContextProjectId])

  useEffect(() => {
    setContextActiveTab(activeTab)
  }, [activeTab, setContextActiveTab])

  useEffect(() => {
    setContextDocumentId(currentDocumentId || null)
  }, [currentDocumentId, setContextDocumentId])

  // Track behavior and activity
  useBehaviorTracking(currentProjectId || null, activeTab)
  useActivityTracking(currentProjectId || null, activeTab)

  // Initialize SyncService
  useEffect(() => {
    syncService.init().catch(console.error)
  }, [])

  // Handle room joining/leaving at project level
  useEffect(() => {
    if (currentProjectId) {
      const roomId = `project:${currentProjectId}`
      syncService.joinRoom(roomId, 'chat').catch(console.error)
      return () => {
        syncService.leaveRoom(roomId, 'chat')
      }
    }
  }, [currentProjectId])

  // Get document ID when switching to document tab
  useEffect(() => {
    const getDocumentId = async () => {
      if (activeTab === 'document' && currentProjectId && !currentDocumentId) {
        try {
          const docsResponse = await documentService.getDocuments(currentProjectId, 0, 1)
          if (docsResponse.documents && docsResponse.documents.length > 0) {
            setCurrentDocumentId(docsResponse.documents[0].id)
          } else {
            // Create a new default document
            const defaultDoc = await documentService.createDocument(
              currentProjectId,
              '项目文档',
              ''
            )
            setCurrentDocumentId(defaultDoc.id)
          }
        } catch (error) {
          console.error('Failed to get/create document:', error)
        }
      }
    }

    getDocumentId()
  }, [activeTab, currentProjectId, currentDocumentId])

  useEffect(() => {
    // If no projectId in URL, try to get first project
    if (!currentProjectId) {
      projectService.getProjects(false).then((data) => {
        if (data.projects.length > 0) {
          setCurrentProjectId(data.projects[0].id)
          setProject(data.projects[0])
        } else {
          // If no active project, try to get archived one
          projectService.getProjects(true).then((archivedData) => {
            if (archivedData.projects.length > 0) {
              setCurrentProjectId(archivedData.projects[0].id)
              setProject(archivedData.projects[0])
            }
          })
        }
      })
    } else {
      projectService.getProject(currentProjectId).then(setProject)
    }
  }, [currentProjectId])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Connection Status Banner */}
      <ConnectionStatusBanner
        yjsConnected={connectionStatus === 'connected'}
        socketioConnected={connectionStatus === 'connected'}
        aggregatedState={connectionStatus === 'connected' ? 'full' : 'offline'}
        onReconnect={() => syncService.init()}
      />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-indigo-100/50 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-2 hover:bg-indigo-50 rounded-xl text-indigo-600 transition-colors"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">AICSL</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold tracking-wide border border-indigo-100">协作学习系统</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-2 hover:bg-indigo-50 rounded-xl text-indigo-600 transition-colors"
          >
            👥
          </button>
          <div
            className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-md cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all overflow-hidden flex items-center justify-center text-white font-bold text-sm"
            onClick={() => setIsSettingsOpen(true)}
            title={user?.username || '用户设置'}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="User" className="h-full w-full object-cover" />
            ) : (
              (user?.username || 'U')[0].toUpperCase()
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {leftSidebarOpen && (
          <div className="flex-shrink-0 transition-all duration-300">
            <Sidebar projectId={currentProjectId} />
          </div>
        )}

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden">
            {currentProjectId && (
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                {activeTab === 'document' && (
                  <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
                    {currentDocumentId ? (
                      <DocumentEditor
                        key={currentDocumentId}
                        documentId={currentDocumentId}
                        projectId={currentProjectId}
                        onDocumentChange={setCurrentDocumentId}
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        请选择或创建一个文档
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'inquiry' && (
                  <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
                    <InquirySpace projectId={currentProjectId} />
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
                    <ResourceLibrary projectId={currentProjectId} />
                  </div>
                )}

                {activeTab === 'browser' && (
                  <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
                    <WebAnnotationBrowser projectId={currentProjectId} />
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <AITutor projectId={currentProjectId} />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'dashboard' && <LearningDashboard />}
          </div>
        </div>

        {/* Right Sidebar */}
        {rightSidebarOpen && (
          <div className="w-[400px] flex-shrink-0">
            <RightSidebar projectId={currentProjectId} />
          </div>
        )}
      </div>

      <AIAssistant />
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

