/**
 * Chat Sync Hook
 * 用于聊天功能的同步和状态管理
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { ChatAdapter } from '../../modules/chat/ChatAdapter';
import { ChatPersistence, ChatMessage } from '../../modules/chat/ChatPersistence';
import { useAuthStore } from '../../stores/authStore';

import { syncService } from '../../services/sync/SyncService';

interface UseChatSyncProps {
    projectId: string; // 通常 projectId 对应 roomId，或者有特定规则
    onMessage?: (message: ChatMessage) => void;
}

export function useChatSync({ projectId, onMessage }: UseChatSyncProps) {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [adapter, setAdapter] = useState<ChatAdapter | null>(null);
    const roomId = `project:${projectId}`; // 假设房间 ID 规则

    // 初始化 SyncService
    useEffect(() => {
        syncService.init().catch(console.error);
        // 加入房间
        syncService.joinRoom(roomId, 'chat').catch(console.error);

        return () => {
            syncService.leaveRoom(roomId, 'chat');
        };
    }, [roomId]);

    // 加载本地缓存
    useEffect(() => {
        const loadCache = async () => {
            const cached = await ChatPersistence.loadMessages(roomId);
            if (cached.length > 0) {
                setMessages(prev => {
                    const msgMap = new Map<string, ChatMessage>();
                    // Add cached first
                    cached.forEach(m => msgMap.set(m.id, m));
                    // Add existing (usually empty on mount, but safe to merge)
                    prev.forEach(m => msgMap.set(m.id, m));

                    return Array.from(msgMap.values()).sort((a, b) =>
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                });
            }
        };
        loadCache();
    }, [roomId]);

    const onMessageRef = useRef(onMessage);
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    // 初始化 Adapter
    useEffect(() => {
        const newAdapter = new ChatAdapter(roomId, (msg) => {
            // 收到新消息时更新状态
            setMessages(prev => {
                const index = prev.findIndex(m => m.id === msg.id);
                let newMessages;
                if (index !== -1) {
                    // Update existing message (important for recall/edit)
                    newMessages = [...prev];
                    newMessages[index] = { ...prev[index], ...msg };
                } else {
                    // Append new message
                    newMessages = [...prev, msg];
                }

                // Ensure messages are sorted by timestamp
                newMessages.sort((a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                // 异步保存缓存
                ChatPersistence.saveMessages(roomId, newMessages);
                return newMessages;
            });

            if (onMessageRef.current) onMessageRef.current(msg);
        });

        setAdapter(newAdapter);

        return () => {
            newAdapter.destroy();
        };
    }, [roomId]);

    // 发送消息
    const sendMessage = useCallback(async (content: string, mentions: string[] = [], fileInfo?: any, replyTo?: string, isRecalled?: boolean) => {
        if (!adapter || !user) return;

        // 发送消息。适配器会触发 syncService.sendOperation，
        // 后者会发射本地事件，进而由于 adapter 监听了 'operation:chat' 而处理。
        await adapter.sendMessage(content, mentions, user, fileInfo, replyTo, isRecalled);
    }, [adapter, user]);

    return {
        messages,
        setMessages,
        sendMessage,
        connected: true
    };
}
