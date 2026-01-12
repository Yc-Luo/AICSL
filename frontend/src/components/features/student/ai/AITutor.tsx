import { useState, useRef, useEffect } from 'react'
import { aiService } from '../../../../services/api/ai'
import { trackingService } from '../../../../services/tracking/TrackingService'
import { useScrapbookActions } from '../../../../modules/inquiry/hooks/useScrapbookActions'
import { Lightbulb } from 'lucide-react'
import { Toast } from '../../../ui/Toast'

interface AITutorProps {
    projectId: string
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function AITutor({ projectId }: AITutorProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '你好！我是你的 AI 导师。有什么我可以帮你的吗？不管是项目思路还是协作问题，随时问我！',
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<any[]>([])
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [convToDelete, setConvToDelete] = useState<string | null>(null)

    const { addMaterial } = useScrapbookActions(projectId)
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [suggestions, setSuggestions] = useState<string[]>([
        "我们的项目目前进展如何？",
        "能帮我梳理一下下一步的任务吗？",
        "这个协作项目中有什么我可以学习的重点？"
    ])

    const loadMessages = async (convId: string) => {
        try {
            const msgsResponse = await aiService.getMessages(convId);
            if (msgsResponse.messages) {
                const history = msgsResponse.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.created_at)
                }));
                // If history is empty, show welcome
                if (history.length === 0) {
                    setMessages([
                        {
                            id: 'welcome',
                            role: 'assistant',
                            content: '你好！我是你的 AI 导师。有什么我可以帮你的吗？不管是项目思路还是协作问题，随时问我！',
                            timestamp: new Date()
                        }
                    ]);
                } else {
                    setMessages(history);
                }
            }
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const loadConversationsList = async () => {
        try {
            const response = await aiService.getConversations(projectId);
            setConversations(response.conversations || []);
            return response.conversations || [];
        } catch (error) {
            console.error('Failed to load conversations', error);
            return [];
        }
    };

    const handleNewChat = async () => {
        setConversationId(null);
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: '你好！新的对话已开启。有什么我可以帮你的吗？',
                timestamp: new Date()
            }
        ]);
        setSuggestions([
            "我们的项目目前进展如何？",
            "能帮我梳理一下下一步的任务吗？",
            "这个协作项目中有什么我可以学习的重点？"
        ]);
        setIsHistoryOpen(false);
        trackingService.track({
            module: 'ai',
            action: 'ai_conversation_start',
            metadata: { projectId }
        });
    };

    const handleSwitchChat = async (convId: string) => {
        setConversationId(convId);
        await loadMessages(convId);
        setIsHistoryOpen(false);
        trackingService.track({
            module: 'ai',
            action: 'ai_conversation_switch',
            metadata: { conversationId: convId }
        });
    };

    const handleDeleteChat = async (e: React.MouseEvent, convId: string) => {
        e.stopPropagation();
        setConvToDelete(convId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!convToDelete) return;

        try {
            await aiService.deleteConversation(convToDelete);
            trackingService.track({
                module: 'ai',
                action: 'ai_conversation_delete',
                metadata: { conversationId: convToDelete }
            });
            const updatedList = await loadConversationsList();

            // If we deleted the current conversation, switch to the most recent one or start a new one
            if (convToDelete === conversationId) {
                if (updatedList.length > 0) {
                    const nextId = updatedList[0].id;
                    setConversationId(nextId);
                    await loadMessages(nextId);
                } else {
                    await handleNewChat();
                }
            }
        } catch (error) {
            console.error('Failed to delete chat', error);
        } finally {
            setIsDeleteModalOpen(false);
            setConvToDelete(null);
        }
    };

    // Initialize conversation and load history
    useEffect(() => {
        const init = async () => {
            const list = await loadConversationsList();
            if (list.length > 0) {
                const activeId = list[0].id;
                setConversationId(activeId);
                await loadMessages(activeId);
            } else {
                // If no history, don't create backend conversation yet.
                // Just keep it in a 'new' state.
                setConversationId(null);
                setMessages([
                    {
                        id: 'welcome',
                        role: 'assistant',
                        content: '你好！我是你的 AI 导师。有什么我可以帮你的吗？',
                        timestamp: new Date()
                    }
                ]);
            }
        };
        if (projectId) {
            init();
        }
    }, [projectId]);

    useEffect(() => {
        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };
        // 稍微延迟确保 DOM 已渲染完成且高度已更新
        const timeoutId = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timeoutId);
    }, [messages, isTyping]);

    const handleSend = async (content: string = inputValue) => {
        if (!content.trim()) return

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, newMessage])
        setInputValue('')
        setIsTyping(true)

        try {
            const startTime = Date.now();
            trackingService.track({
                module: 'ai',
                action: 'ai_query_start',
                metadata: { projectId, length: content.length }
            });

            let activeConvId = conversationId;

            // Late initialization: if no conversation exists yet, create it now
            if (!activeConvId) {
                const response = await aiService.createConversation('default-tutor', { project_id: projectId });
                activeConvId = response.id;
                setConversationId(activeConvId);
            }

            if (activeConvId) {
                // Prepare for streaming response
                const assistantMsgId = (Date.now() + 1).toString();
                const assistantMsg: Message = {
                    id: assistantMsgId,
                    role: 'assistant',
                    content: '',
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMsg]);

                // Attempt to use EventSource for streaming if not mocked
                // Note: For simplicity in this static check phase, we implement the non-streaming fallback logic 
                // or a simple simulation of consuming the stream if api supports it.
                // Assuming the backend returns standard JSON for MVP first or we use fetch for stream.

                // Non-streaming fallback for reliability in MVP:
                const response = await aiService.sendMessage(activeConvId, content, projectId);

                const latency = Date.now() - startTime;
                trackingService.track({
                    module: 'ai',
                    action: 'ai_response_end',
                    metadata: {
                        projectId,
                        conversationId: activeConvId,
                        latency,
                        responseLength: (response.content || response.message || '').length
                    }
                });

                // Update dynamic suggestions from backend
                if (response.suggestions && response.suggestions.length > 0) {
                    setSuggestions(response.suggestions);
                } else {
                    setSuggestions([]); // Clear if no new suggestions
                }

                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMsgId
                        ? { ...msg, content: response.content || response.message }
                        : msg
                ));

                // If this was the first message exchange, refresh the history list
                if (messages.length <= 1) {
                    await loadConversationsList();
                }
            } else {
                // Fallback if no conversation ID (e.g. backend down)
                setTimeout(() => {
                    const responseMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `[离线模式] 后端连接似乎不可用。这是针对 "${content}" 的本地响应。`,
                        timestamp: new Date()
                    }
                    setMessages(prev => [...prev, responseMessage])
                }, 1000);
            }
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: '抱歉，AI 服务暂时不可用。',
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    }

    const handleSaveToScrapbook = async (content: string) => {
        try {
            await addMaterial(
                content,
                '来自 AI 导师的解答',
                window.location.href // Or a specific identifier for the chat
            );
            setToastMessage('已提取到探究空间素材池');
            setShowToast(true);
        } catch (error) {
            setToastMessage('保存失败');
            setShowToast(true);
        }
    }

    return (
        <div className="flex h-full relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 transition-all duration-300 hover:shadow-2xl ring-1 ring-black/5">
            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ${isHistoryOpen ? 'mr-0' : ''}`}>
                {/* Header */}
                <div className="py-2 px-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-indigo-100/50 flex items-center justify-between backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-base">
                            <span className="text-xl filter drop-shadow-sm">🎓</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">AI 智能导师</span>
                        </h3>
                        <p className="text-[10px] text-indigo-500/80 mt-0 font-medium tracking-tight">✨ 您的实时协作学习助手</p>
                    </div>
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`p-1.5 rounded-lg transition-all ${isHistoryOpen ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        title="历史对话"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                        >
                            <div
                                className={`max-w-[90%] px-3.5 py-2 shadow-sm transition-all duration-200 hover:shadow-md ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm'
                                    : 'bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]'
                                    }`}
                            >
                                <div className={`text-sm whitespace-pre-wrap leading-6 ${msg.role === 'assistant' ? 'markdown-body' : ''}`}>
                                    {msg.content || (msg.role === 'assistant' && isTyping && msg.id === messages[messages.length - 1].id ? '...' : '')}
                                </div>
                                <div className={`text-[10px] mt-1 flex items-center gap-1 ${msg.role === 'user' ? 'text-indigo-200 justify-end' : 'text-gray-400'}`}>
                                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {msg.role === 'assistant' && <span>• AI Tutor</span>}
                                    {msg.role === 'assistant' && msg.content && (
                                        <button
                                            onClick={() => handleSaveToScrapbook(msg.content)}
                                            className="ml-2 hover:text-indigo-500 transition-colors p-0.5"
                                            title="存入探究空间素材池"
                                        >
                                            <Lightbulb className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && messages[messages.length - 1].role === 'user' && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white/50 backdrop-blur-md border-t border-indigo-50">
                    {suggestions.length > 0 && !isTyping && (
                        <div className="mb-4 flex flex-wrap gap-2 animate-slideUp">
                            {suggestions.map((chip, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSend(chip)}
                                    className="text-xs font-medium px-4 py-2 bg-white text-indigo-600 rounded-full shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all duration-200 border border-indigo-100 hover:scale-105 active:scale-95"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 relative group">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="向 AI 导师提问..."
                                className="w-full px-4 py-2 bg-white border-0 ring-1 ring-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all placeholder:text-gray-400 text-sm focus:shadow-inner"
                            />
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="p-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                        >
                            <svg className="w-5 h-5 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* History Sidebar */}
            <div className={`absolute top-0 right-0 h-full w-64 bg-gray-50/95 backdrop-blur-md border-l border-indigo-100 shadow-2xl transition-transform duration-300 z-20 flex flex-col ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b border-indigo-100 flex items-center justify-between bg-white/50">
                    <h4 className="font-bold text-gray-700 text-sm">历史对话</h4>
                    <button
                        onClick={() => setIsHistoryOpen(false)}
                        className="p-1 hover:bg-gray-200 rounded-md text-gray-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className="w-full py-2 px-4 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl text-sm font-medium hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 mb-4"
                    >
                        <span>+</span> 新建对话
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className="group relative"
                        >
                            <button
                                onClick={() => handleSwitchChat(conv.id)}
                                className={`w-full p-3 text-left rounded-xl transition-all border ${conversationId === conv.id
                                    ? 'bg-white border-indigo-300 shadow-sm ring-1 ring-indigo-100'
                                    : 'bg-transparent border-transparent hover:bg-white/50 hover:border-gray-200'
                                    }`}
                            >
                                <div className="font-medium text-gray-800 text-xs truncate mb-1 pr-6">
                                    {conv.title || (conv.id === conversationId && messages.length > 1 ? messages[1].content.substring(0, 20) : "新对话")}
                                </div>
                                <div className="text-[10px] text-gray-400 flex items-center justify-between">
                                    <span>{new Date(conv.updated_at).toLocaleDateString()}</span>
                                </div>
                            </button>
                            <button
                                onClick={(e) => handleDeleteChat(e, conv.id)}
                                className="absolute right-2 top-3 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                                title="删除对话"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {conversations.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-xs text-gray-400">暂无历史对话</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Overlay */}
            {isHistoryOpen && (
                <div
                    className="absolute inset-0 bg-black/5 z-10 animate-fadeIn"
                    onClick={() => setIsHistoryOpen(false)}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm animate-fadeIn"
                        onClick={() => setIsDeleteModalOpen(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-full max-w-[280px] animate-scaleUp">
                        <div className="text-center mb-4">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h4 className="text-gray-800 font-bold text-base mb-1">确定要删除吗？</h4>
                            <p className="text-gray-500 text-xs">删除后对话内容将无法恢复</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-500/20"
                            >
                                确定删除
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showToast && (
                <Toast message={toastMessage} onClose={() => setShowToast(false)} />
            )}
        </div>
    )
}

