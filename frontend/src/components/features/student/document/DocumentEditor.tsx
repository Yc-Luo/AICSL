import { useEffect, useState, useCallback, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { trackingService } from '../../../../services/tracking/TrackingService'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import CodeBlock from '@tiptap/extension-code-block'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Collaboration } from '@tiptap/extension-collaboration'
import { useAuthStore } from '../../../../stores/authStore'
import { documentService, Document } from '../../../../services/api/document'
import { Annotation, AnnotationAttributes } from '../../../../extensions/Annotation'
import EditorToolbar from './EditorToolbar'
import RemoteCursors from './RemoteCursors'
import AnnotationInput from './AnnotationInput'
import AnnotationPopup from './AnnotationPopup'
import { useDocumentSync } from '../../../../hooks/document/useDocumentSync'
import { useContextStore } from '../../../../stores/contextStore'
import { useScrapbookActions } from '../../../../modules/inquiry/hooks/useScrapbookActions'
import { Toast } from '../../../ui/Toast'
import * as Y from 'yjs'
import { Plus, FileText, Loader2, X, Trash2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../ui/dialog"
import { Button } from "../../../ui/button"

interface DocumentEditorProps {
  documentId?: string
  projectId?: string
  onDocumentChange?: (id: string) => void
}

export default function DocumentEditor({
  documentId,
  projectId,
  onDocumentChange,
}: DocumentEditorProps) {
  const { user } = useAuthStore()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [remoteUsers] = useState<any[]>([])
  const [showAnnotationInput, setShowAnnotationInput] = useState(false)
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false)
  const [activeAnnotation, setActiveAnnotation] = useState<AnnotationAttributes | null>(null)
  const [annotationInputPosition, setAnnotationInputPosition] = useState<{ top: number; left: number } | undefined>()

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const [showDocumentList, setShowDocumentList] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isListLoading, setIsListLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { addMaterial } = useScrapbookActions(projectId || '')

  // Load document list when sidebar opens
  useEffect(() => {
    if (showDocumentList && projectId) {
      const loadDocuments = async () => {
        setIsListLoading(true)
        try {
          const res = await documentService.getDocuments(projectId)
          setDocuments(res.documents)
        } catch (error) {
          console.error('Failed to load documents:', error)
        } finally {
          setIsListLoading(false)
        }
      }
      loadDocuments()
    }
  }, [showDocumentList, projectId])

  // Load document metadata
  useEffect(() => {
    const loadDocument = async () => {
      if (documentId) {
        try {
          const doc = await documentService.getDocument(documentId)
          setDocument(doc)
        } catch (error) {
          console.error('Failed to load document:', error)
        } finally {
          setIsLoading(false)
          trackingService.track({
            module: 'document',
            action: 'document_open',
            metadata: { documentId, projectId }
          })
        }
      } else {
        setIsLoading(false)
      }
    }

    loadDocument()
  }, [documentId, projectId])

  const { provider, ydoc } = useDocumentSync({
    documentId: documentId || document?.id || '',
  })

  const isConnected = !!provider

  const extensions = useMemo(() => {
    return [
      StarterKit.configure({
        history: false,
        codeBlock: false,
      } as any),
      CodeBlock.configure({
        languageClassPrefix: 'language-',
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      Placeholder.configure({
        placeholder: '提出问题或开始写作...',
      }),
      ...(ydoc ? [Collaboration.configure({
        document: ydoc,
      })] : []),
      Annotation,
    ]
  }, [ydoc])

  const setContextDocumentContent = useContextStore(state => state.setDocumentContent)

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    if (!document) return

    // 1. Update local state immediately for UI responsiveness
    setDocument({ ...document, title: newTitle })

    // 2. Sync to sidebar list if open
    setDocuments(prev => prev.map(d => d.id === document.id ? { ...d, title: newTitle } : d))

    // 3. Debounce sync to backend would be better, but for now simple sync
    try {
      await documentService.updateDocument(document.id, newTitle)
    } catch (error) {
      console.error('Failed to update title:', error)
    }
  }

  const editor = useEditor({
    extensions,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-[900px] mx-auto focus:outline-none min-h-full p-4',
      },
    },
    onUpdate: ({ editor }) => {
      setContextDocumentContent(editor.getText())
    }
  }, [extensions])

  const handleSaveToScrapbook = useCallback(async () => {
    if (!editor || !projectId) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')

    if (!selectedText.trim()) {
      setToastMessage('请先选中一些文字')
      setShowToast(true)
      return
    }

    try {
      await addMaterial(
        selectedText,
        `引自文档: ${document?.title || '未命名文件'}`,
        window.location.href
      )
      setToastMessage('已存入灵感池')
      setShowToast(true)
    } catch (e) {
      setToastMessage('保存失败')
      setShowToast(true)
    }
  }, [editor, projectId, document, addMaterial])

  const handleSave = useCallback(async () => {
    if (!documentId || !editor) return
    try {
      // 1. Sync HTML to database
      await documentService.updateDocument(documentId, undefined, editor.getHTML())

      // 2. Force snapshot Yjs to backend
      if (ydoc) {
        const update = Y.encodeStateAsUpdate(ydoc)
        await documentService.saveSnapshot(documentId, update)
      }

      setToastMessage('文档已保存')
      setShowToast(true)
    } catch (error) {
      console.error('Failed to save document:', error)
      setToastMessage('保存失败')
      setShowToast(true)
    }
  }, [documentId, editor, ydoc])

  const handleCreateNewDocument = async () => {
    if (!projectId || !onDocumentChange) return
    setIsCreating(true)
    try {
      const newDoc = await documentService.createDocument(projectId, '新文档', '')
      onDocumentChange(newDoc.id)
      setShowDocumentList(false)
      setToastMessage('新文档已创建')
      setShowToast(true)
    } catch (error) {
      console.error('Failed to create document:', error)
      setToastMessage('创建失败')
      setShowToast(true)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectDocument = (id: string) => {
    if (onDocumentChange) {
      onDocumentChange(id)
      setShowDocumentList(false)
    }
  }

  const handleDeleteDocument = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    setIsDeleting(true)
    try {
      await documentService.deleteDocument(deleteConfirmId)
      setDocuments(prev => prev.filter(d => d.id !== deleteConfirmId))
      setToastMessage('文档已删除')
      setShowToast(true)

      // If current document is deleted, switch to another
      if (deleteConfirmId === documentId && onDocumentChange) {
        const remaining = documents.filter(d => d.id !== deleteConfirmId)
        if (remaining.length > 0) {
          onDocumentChange(remaining[0].id)
        } else {
          handleCreateNewDocument()
        }
      }
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete document:', error)
      setToastMessage('删除失败')
      setShowToast(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateAnnotation = useCallback((content: string) => {
    if (!editor || !user) return
    const annotationId = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const annotationData: AnnotationAttributes = {
      id: annotationId,
      content,
      author: user.username || user.email,
      authorId: user.id,
      timestamp: new Date().toISOString(),
      resolved: false,
    }
      ; (editor.chain().focus() as any).setAnnotation(annotationData).run()
    setShowAnnotationInput(false)
  }, [editor, user])

  const handleEditAnnotation = useCallback((content: string) => {
    if (!editor || !activeAnnotation) return
    const updatedAnnotation = { ...activeAnnotation, content }
      ; (editor.chain().focus() as any).extendMarkRange('annotation', { id: activeAnnotation.id }).setAnnotation(updatedAnnotation).run()
    setActiveAnnotation(updatedAnnotation)
  }, [editor, activeAnnotation])

  const handleResolveAnnotation = useCallback(() => {
    if (!editor || !activeAnnotation) return
    const resolvedAnnotation = { ...activeAnnotation, resolved: true }
      ; (editor.chain().focus() as any).extendMarkRange('annotation', { id: activeAnnotation.id }).setAnnotation(resolvedAnnotation).run()
    setShowAnnotationPopup(false)
  }, [editor, activeAnnotation])

  const handleDeleteAnnotation = useCallback(() => {
    if (!editor || !activeAnnotation) return
      ; (editor.chain().focus() as any).extendMarkRange('annotation', { id: activeAnnotation.id }).unsetAnnotation().run()
    setShowAnnotationPopup(false)
  }, [editor, activeAnnotation])

  const handleAddReply = useCallback((content: string) => {
    if (!editor || !activeAnnotation || !user) return
    const newReply = {
      id: `reply-${Date.now()}`,
      content,
      author: user.username || user.email,
      authorId: user.id,
      timestamp: new Date().toISOString(),
    }
    const updatedAnnotation = {
      ...activeAnnotation,
      replies: [...(activeAnnotation.replies || []), newReply],
    }
      ; (editor.chain().focus() as any).extendMarkRange('annotation', { id: activeAnnotation.id }).setAnnotation(updatedAnnotation).run()
    setActiveAnnotation(updatedAnnotation)
  }, [editor, activeAnnotation, user])

  const handleOpenAnnotationInput = useCallback(() => {
    if (!editor) return
    const { from } = editor.state.selection
    const coords = editor.view.coordsAtPos(from)
    setAnnotationInputPosition({
      top: coords.bottom + window.scrollY + 8,
      left: coords.left + window.scrollX,
    })
    setShowAnnotationInput(true)
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const annotationMark = target.closest('.annotation-mark')
      if (annotationMark) {
        const annotationId = annotationMark.getAttribute('data-annotation-id')
        const content = annotationMark.getAttribute('data-annotation-content')
        if (annotationId && content) {
          setActiveAnnotation({
            id: annotationId,
            content,
            author: annotationMark.getAttribute('data-annotation-author') || '',
            authorId: annotationMark.getAttribute('data-annotation-author-id') || '',
            timestamp: annotationMark.getAttribute('data-annotation-timestamp') || '',
            resolved: annotationMark.getAttribute('data-annotation-resolved') === 'true',
          })
          const rect = annotationMark.getBoundingClientRect()
          setAnnotationInputPosition({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX })
          setShowAnnotationPopup(true)
        }
      }
    }
    editor.view.dom.addEventListener('click', handleClick)
    return () => editor.view.dom.removeEventListener('click', handleClick)
  }, [editor])

  if (isLoading || !document) return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* History Sidebar */}
      {showDocumentList && (
        <div className="w-64 border-r bg-gray-50/50 flex flex-col shrink-0 animate-in slide-in-from-left duration-300">
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-700">项目文档</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateNewDocument}
                disabled={isCreating}
                className="p-1 hover:bg-gray-100 rounded text-indigo-600 transition-colors disabled:opacity-50"
                title="新建文档"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowDocumentList(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                title="关闭侧边栏"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isListLoading ? (
              <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">加载中...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs text-pretty italic">
                暂无文档，点击上方 + 号新建
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc.id)}
                  className={`w-full flex flex-col items-start p-2.5 rounded-lg border text-left transition-all group cursor-pointer ${doc.id === documentId
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                    : 'bg-white border-transparent hover:border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <FileText className={`w-3.5 h-3.5 shrink-0 ${doc.id === documentId ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                      <span className="truncate text-sm font-medium">{doc.title || '未命名文档'}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDocument(doc.id)
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-all"
                      title="删除文档"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="mt-1 pl-5.5 flex items-center justify-between w-full opacity-60 text-[10px]">
                    <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {editor && (
          <EditorToolbar
            editor={editor}
            isConnected={isConnected}
            onAnnotationClick={handleOpenAnnotationInput}
            onSaveToScrapbook={handleSaveToScrapbook}
            onSave={handleSave}
            onHistoryClick={() => setShowDocumentList(!showDocumentList)}
          />
        )}
        <div className="flex-1 overflow-auto bg-white flex flex-col items-center">
          {/* Document Title Input - Ultra-Compact Styling */}
          <div className="w-full bg-slate-50/50 border-b border-slate-100/50 flex justify-center">
            <div className="w-full max-w-[900px] px-8 py-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-indigo-100 rounded">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <input
                  type="text"
                  value={document?.title || ''}
                  onChange={handleTitleChange}
                  placeholder="未命名文档"
                  className="w-full text-lg font-bold border-none focus:outline-none focus:ring-0 placeholder:text-slate-300 text-indigo-950 bg-transparent tracking-tight leading-none"
                />
              </div>
            </div>
          </div>

          <div className="w-full max-w-[900px] px-8">
            <EditorContent editor={editor} />
          </div>
        </div>
        <RemoteCursors users={remoteUsers} />
      </div>

      {showAnnotationInput && (
        <AnnotationInput
          onSubmit={handleCreateAnnotation}
          onCancel={() => setShowAnnotationInput(false)}
          position={annotationInputPosition}
        />
      )}

      {showAnnotationPopup && activeAnnotation && (
        <AnnotationPopup
          annotation={activeAnnotation}
          onResolve={handleResolveAnnotation}
          onEdit={handleEditAnnotation}
          onDelete={handleDeleteAnnotation}
          onAddReply={handleAddReply}
          onClose={() => setShowAnnotationPopup(false)}
          position={annotationInputPosition}
        />
      )}

      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>删除文档</DialogTitle>
            </div>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-500">
            确定要删除这个文档吗？此操作将永久移除该文档，不可撤销。
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              确定删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
