'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/contexts/socket-context';
import { messageService } from '@/services/message.service';
import {
  Message,
  MessageType,
  UserTypingEvent,
} from '@/types/message';

interface UseRealtimeMessagesOptions {
  activeConversationId: string | null;
  onNewMessageReceived?: (msg: Message) => void;
  onMessageUpdated?: (msg: Message) => void;
  onMessageDeleted?: (messageId: string, conversationId: string) => void;
}

export function useRealtimeMessages({
  activeConversationId,
  onNewMessageReceived,
  onMessageUpdated,
  onMessageDeleted,
}: UseRealtimeMessagesOptions) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);

  // Keep references to callbacks to prevent unnecessary listener rebinding
  const activeConvIdRef = useRef<string | null>(activeConversationId);
  useEffect(() => {
    activeConvIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const currentUserId = user?.id || (user as { _id?: string })?._id || '';
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch historical messages for the active conversation
  const loadMessageHistory = useCallback(async (convId: string) => {
    setIsLoadingMessages(true);
    setError(null);
    try {
      const res = await messageService.getMessages(convId);
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
      } else {
        setMessages([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải lịch sử tin nhắn';
      setError(msg);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const initHistory = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      if (!activeConversationId) {
        setMessages([]);
        setIsLoadingMessages(false);
        setIsOtherTyping(false);
        return;
      }

      await loadMessageHistory(activeConversationId);
    };

    void initHistory();

    return () => {
      isCancelled = true;
    };
  }, [activeConversationId, loadMessageHistory]);

  // 2. Realtime Socket.IO Listeners & Room Management
  useEffect(() => {
    if (!socket || !activeConversationId) return;

    // Join the conversation room on connect or activeConversationId change
    const joinRoom = () => {
      if (activeConversationId) {
        socket.emit('join', activeConversationId);
      }
    };

    joinRoom();
    socket.on('connect', joinRoom);

    // Event: receiveMessage (New message arrived in room)
    const handleReceiveMessage = (incomingMsg: Message) => {
      const targetConvId = incomingMsg.conversationId || incomingMsg.conversation;

      // Ensure message belongs to the current active conversation
      if (targetConvId === activeConvIdRef.current) {
        setMessages((prev) => {
          const msgId = incomingMsg.id || incomingMsg._id;
          // Avoid duplicate messages
          const exists = prev.some((m) => (m.id || m._id) === msgId);
          if (exists) return prev;
          return [...prev, incomingMsg];
        });
      }

      // Propagate event upward for conversation list preview updating
      onNewMessageReceived?.(incomingMsg);
    };

    // Event: messageUpdated (Message was edited in room)
    const handleMessageUpdated = (updatedMsg: Message) => {
      const targetConvId = updatedMsg.conversationId || updatedMsg.conversation;
      const updatedId = updatedMsg.id || updatedMsg._id;

      if (targetConvId === activeConvIdRef.current) {
        setMessages((prev) =>
          prev.map((m) => ((m.id || m._id) === updatedId ? updatedMsg : m))
        );
      }

      onMessageUpdated?.(updatedMsg);
    };

    // Event: messageDeleted (Message was deleted in room)
    const handleMessageDeleted = (payload: { messageId?: string; id?: string }) => {
      const deletedId = payload.messageId || payload.id;
      if (!deletedId) return;

      setMessages((prev) => prev.filter((m) => (m.id || m._id) !== deletedId));

      if (activeConvIdRef.current) {
        onMessageDeleted?.(deletedId, activeConvIdRef.current);
      }
    };

    // Event: userTyping
    const handleUserTyping = (event: UserTypingEvent) => {
      if (
        event.conversationId === activeConvIdRef.current &&
        event.userId !== currentUserId
      ) {
        setIsOtherTyping(true);

        // Safety timeout to reset typing if stopTyping is missed
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherTyping(false);
        }, 4000);
      }
    };

    // Event: userStopTyping
    const handleUserStopTyping = (event: UserTypingEvent) => {
      if (
        event.conversationId === activeConvIdRef.current &&
        event.userId !== currentUserId
      ) {
        setIsOtherTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    // Attach listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageUpdated', handleMessageUpdated);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStopTyping', handleUserStopTyping);

    // Cleanup listeners on conversation switch or unmount
    return () => {
      socket.off('connect', joinRoom);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageUpdated', handleMessageUpdated);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStopTyping', handleUserStopTyping);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [
    socket,
    activeConversationId,
    currentUserId,
    onNewMessageReceived,
    onMessageUpdated,
    onMessageDeleted,
  ]);

  // 3. User Actions (Client to Server)
  const sendMessage = useCallback(
    (content: string, type: MessageType = 'text') => {
      if (!socket || !activeConversationId) return;
      const trimmed = content.trim();
      if (!trimmed) return;

      socket.emit('sendMessage', {
        conversationId: activeConversationId,
        content: trimmed,
        type,
      });

      // Also send stop typing immediately after sending
      socket.emit('stopTyping', {
        conversationId: activeConversationId,
      });
    },
    [socket, activeConversationId]
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!socket) return;
      const trimmed = content.trim();
      if (!trimmed) return;

      socket.emit('editMessage', {
        messageId,
        content: trimmed,
      });
    },
    [socket]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socket) return;
      socket.emit('deleteMessage', {
        messageId,
      });
    },
    [socket]
  );

  const sendTyping = useCallback(() => {
    if (!socket || !activeConversationId) return;
    socket.emit('typing', {
      conversationId: activeConversationId,
    });
  }, [socket, activeConversationId]);

  const sendStopTyping = useCallback(() => {
    if (!socket || !activeConversationId) return;
    socket.emit('stopTyping', {
      conversationId: activeConversationId,
    });
  }, [socket, activeConversationId]);

  return {
    messages,
    isLoadingMessages,
    error,
    isOtherTyping,
    isConnected,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTyping,
    sendStopTyping,
    reloadMessages: () => {
      if (activeConversationId) {
        loadMessageHistory(activeConversationId);
      }
    },
  };
}
