import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useContextStore } from '../../../../stores/contextStore'
import { aiService } from '../../../../services/api/ai'
import { trackingService } from '../../../../services/tracking/TrackingService'

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [showActions, setShowActions] = useState(true)
    const [conversationId, setConversationId] = useState<string | null>(null)

    // Draggable state
    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem('ai-assistant-pos')
        return saved ? JSON.parse(saved) : { bottom: 24, left: 24 }
    })
    const [isDragging, setIsDragging] = useState(false)
    const draggingRef = useRef({
        isActuallyDragging: false,
        startX: 0,
        startY: 0,
        startBottom: 0,
        startLeft: 0
    })

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only left click
        if (e.button !== 0) return

        setIsDragging(true)
        draggingRef.current = {
            isActuallyDragging: false,
            startX: e.clientX,
            startY: e.clientY,
            startBottom: position.bottom,
            startLeft: position.left
        }
    }

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - draggingRef.current.startX
            const dy = e.clientY - draggingRef.current.startY

            // Threshold to start dragging
            if (!draggingRef.current.isActuallyDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                draggingRef.current.isActuallyDragging = true
            }

            if (draggingRef.current.isActuallyDragging) {
                const newLeft = draggingRef.current.startLeft + dx
                const newBottom = draggingRef.current.startBottom - dy

                // Bounds checking (optional but recommended)
                const boundedLeft = Math.max(10, Math.min(window.innerWidth - 60, newLeft))
                const boundedBottom = Math.max(10, Math.min(window.innerHeight - 60, newBottom))

                setPosition({ left: boundedLeft, bottom: boundedBottom })
            }
        }

        const handleMouseUp = () => {
            if (draggingRef.current.isActuallyDragging) {
                localStorage.setItem('ai-assistant-pos', JSON.stringify(position))
            }
            setIsDragging(false)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, position])

    const toggleOpen = () => {
        // If we were just dragging, don't toggle
        if (draggingRef.current.isActuallyDragging) return
        setIsOpen(!isOpen)
    }

    // Get context from store
    const {
        projectId,
        activeTab,
        documentContent,
        whiteboardSummary,
        browserUrl,
        browserContent
    } = useContextStore()

    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleAction = async (type: 'summarize' | 'knowledge_graph' | 'optimize') => {
        if (!projectId) return

        let content = ''
        let contextType: 'document' | 'whiteboard' | 'browser' | 'dashboard' = 'dashboard'

        if (activeTab === 'document') {
            content = documentContent || '文档内容为空。'
            contextType = 'document'
        } else if (activeTab === 'whiteboard') {
            content = whiteboardSummary || '白板当前无内容。'
            contextType = 'whiteboard'
        } else if (activeTab === 'browser') {
            content = `URL: ${browserUrl}\nAnnotations: ${browserContent || '无'}`
            contextType = 'browser'
        } else {
            content = '正在项目仪表盘页面。'
            contextType = 'dashboard'
        }

        const actionLabels = {
            'summarize': '📝 总结当前',
            'knowledge_graph': '🧠 形成知识图谱',
            'optimize': '💡 提供优化建议'
        }

        setMessages(prev => [...prev, { role: 'user', content: `${actionLabels[type]}${contextType === 'document' ? '文档' : contextType === 'whiteboard' ? '白板' : '页面'}` }])
        setLoading(true)
        setShowActions(false)

        try {
            const response = await aiService.performAction({
                project_id: projectId,
                action_type: type,
                context_type: contextType,
                content: content
            })

            setMessages(prev => [...prev, { role: 'assistant', content: response.message }])

            trackingService.track({
                module: 'ai',
                action: 'ai_assistant_action',
                metadata: { action_type: type, context_type: contextType, projectId }
            })
        } catch (error) {
            console.error('AI Action failed:', error)
            setMessages(prev => [...prev, { role: 'system', content: '抱歉，由于网络或处理错误，操作失败。' }])
        } finally {
            setLoading(false)
        }
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!inputValue.trim() || !projectId || loading) return

        const userMsg = inputValue
        setInputValue('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setLoading(true)
        setShowActions(false)

        // Basic context injection for chat
        let contextText = ''
        if (activeTab === 'document' && documentContent) {
            contextText = `[当前文档内容]:\n${documentContent.substring(0, 2000)}${documentContent.length > 2000 ? '...' : ''}\n\n`
        }

        try {
            const response = await aiService.sendMessage(conversationId || '', `${contextText}用户提问: ${userMsg}`, projectId)
            setMessages(prev => [...prev, { role: 'assistant', content: response.message }])
            if (response.conversation_id) {
                setConversationId(response.conversation_id)
            }

            trackingService.track({
                module: 'ai',
                action: 'ai_assistant_chat',
                metadata: { projectId, has_context: !!contextText, conversationId: response.conversation_id }
            })
        } catch (error) {
            console.error('AI Chat failed:', error)
            setMessages(prev => [...prev, { role: 'system', content: '抱歉，消息发送失败。' }])
        } finally {
            setLoading(false)
        }
    }

    const resetAssistant = () => {
        setMessages([])
        setShowActions(true)
        setLoading(false)
        setConversationId(null)
    }

    const isRightSide = position.left > window.innerWidth / 2

    return (
        <div
            className={`fixed z-50 flex flex-col ${isDragging ? 'transition-none' : 'transition-all duration-300'}`}
            style={{
                bottom: position.bottom,
                left: isRightSide ? 'auto' : position.left,
                right: isRightSide ? window.innerWidth - position.left - 48 : 'auto',
                alignItems: isRightSide ? 'flex-end' : 'flex-start'
            }}
        >
            {isOpen && (
                <div className="mb-4 w-96 bg-white rounded-2xl shadow-2xl border border-indigo-100/50 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-200 flex flex-col max-h-[600px]">
                    {/* Header - Draggable */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white shrink-0 cursor-grab active:cursor-grabbing"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold flex items-center gap-2 text-lg select-none">
                                <span className="animate-pulse">✨</span> AI 助手
                            </h3>
                            <button onClick={resetAssistant} className="text-white/60 hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 select-none">
                            <div className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] uppercase font-bold tracking-wider">
                                {activeTab === 'document' ? '📝 文档模式' : activeTab === 'whiteboard' ? '🎨 白板模式' : activeTab === 'browser' ? '🌐 浏览器模式' : '📊 仪表盘'}
                            </div>
                            <p className="text-xs text-indigo-100 italic">按住头部或下方图标可拖动</p>
                        </div>
                    </div>

                    {/* Chat Body */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-indigo-50/20 scroll-smooth min-h-[300px]">
                        {showActions && messages.length === 0 && (
                            <div className="space-y-4">
                                <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        你好！我是你的智能助手。我可以基于当前你正在进行的任务，为你提供以下快捷帮助：
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => handleAction('summarize')}
                                        disabled={loading}
                                        className="group w-full text-left p-4 rounded-xl bg-white border border-gray-100 hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50/30 transition-all flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📝</div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">总结当前{activeTab === 'document' ? '文档' : '页面'}</div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">提取核心观点和关键信息</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleAction('knowledge_graph')}
                                        disabled={loading}
                                        className="group w-full text-left p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-300 hover:shadow-md hover:bg-purple-50/30 transition-all flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🧠</div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">形成知识图谱</div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">梳理内容脉络和概念连接</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleAction('optimize')}
                                        disabled={loading}
                                        className="group w-full text-left p-4 rounded-xl bg-white border border-gray-100 hover:border-amber-300 hover:shadow-md hover:bg-amber-50/30 transition-all flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💡</div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">提供优化建议</div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">发现不足并给出改进思路</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}


                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : msg.role === 'assistant'
                                        ? 'bg-white text-gray-800 border border-indigo-100 rounded-tl-none prose prose-indigo prose-xs prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100'
                                        : 'bg-red-50 text-red-600 border border-red-100 italic'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    ) : msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-indigo-100 shadow-sm flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder="或者直接问我问题..."
                                disabled={loading}
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            />
                            <button
                                type="submit"
                                disabled={loading || !inputValue.trim()}
                                className="absolute right-2 p-2 text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <button
                onMouseDown={handleMouseDown}
                onClick={toggleOpen}
                className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 group relative ${isOpen
                    ? 'bg-gray-900 text-white rotate-0'
                    : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-700 text-white ring-2 ring-white shadow-indigo-500/50 hover:scale-110'
                    } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
                {isOpen ? (
                    <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-ping opacity-75" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    </div>
                )}
            </button>
        </div>
    )
}
