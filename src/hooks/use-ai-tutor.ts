'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { aiTutorService } from '@/services/ai-tutor.service';
import {
  AiTutorMessage,
  AiTutorSession,
  RagStatus,
} from '@/types/ai-tutor';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';

interface UseAiTutorOptions {
  lessonId?: string;
  isEnrolled?: boolean;
  autoLoad?: boolean;
}

export interface UseAiTutorReturn {
  // State
  sessions: AiTutorSession[];
  activeSessionId: string | null;
  activeSession: AiTutorSession | null;
  messages: AiTutorMessage[];
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  isCreatingSession: boolean;
  error: string | null;
  ragStatus: RagStatus | null;
  statusFilter: 'active' | 'archived' | 'all';

  // Actions
  setStatusFilter: (status: 'active' | 'archived' | 'all') => void;
  loadSessions: (status?: 'active' | 'archived' | 'all') => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  createSession: (title?: string) => Promise<AiTutorSession | null>;
  sendMessage: (content: string) => Promise<boolean>;
  renameSession: (sessionId: string, newTitle: string) => Promise<boolean>;
  archiveSession: (sessionId: string) => Promise<boolean>;
  unarchiveSession: (sessionId: string) => Promise<boolean>;
  deleteSession: (sessionId: string, permanent?: boolean) => Promise<boolean>;
  clearError: () => void;
}

export function useAiTutor({
  lessonId,
  isEnrolled = true,
  autoLoad = true,
}: UseAiTutorOptions): UseAiTutorReturn {
  const [sessions, setSessions] = useState<AiTutorSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiTutorMessage[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ragStatus, setRagStatus] = useState<RagStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');

  // Track active lesson to prevent race conditions across lesson switches
  const currentLessonIdRef = useRef<string | undefined>(lessonId);
  useEffect(() => {
    currentLessonIdRef.current = lessonId;
  }, [lessonId]);

  // Active abort controllers
  const sessionsAbortRef = useRef<AbortController | null>(null);
  const messagesAbortRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Load message history for a specific session
  const selectSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return;
      setActiveSessionId(sessionId);
      setError(null);

      if (messagesAbortRef.current) {
        messagesAbortRef.current.abort();
      }
      const controller = new AbortController();
      messagesAbortRef.current = controller;

      setIsLoadingMessages(true);

      try {
        const res = await aiTutorService.getSession(sessionId, { limit: 100 }, { signal: controller.signal });

        if (currentLessonIdRef.current !== lessonId) return;

        if (res.success) {
          // Robust extraction: support top-level res.messages, res.data.messages, or res.data
          let fetchedMessages: AiTutorMessage[] = [];
          if (Array.isArray(res.messages)) {
            fetchedMessages = res.messages;
          } else if (
            res.data &&
            typeof res.data === 'object' &&
            'messages' in res.data &&
            Array.isArray((res.data as { messages?: unknown }).messages)
          ) {
            fetchedMessages = (res.data as { messages: AiTutorMessage[] }).messages;
          } else if (Array.isArray(res.data)) {
            fetchedMessages = res.data as unknown as AiTutorMessage[];
          }

          // Ensure messages are sorted chronologically
          fetchedMessages.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          setMessages(fetchedMessages);

          // Update session metadata in local list if returned
          let sessionObj: AiTutorSession | null = null;
          if (res.data && typeof res.data === 'object') {
            const dataObj = res.data as Record<string, unknown>;
            if (typeof dataObj.id === 'string') {
              sessionObj = res.data as AiTutorSession;
            } else if (dataObj.session && typeof dataObj.session === 'object') {
              sessionObj = dataObj.session as AiTutorSession;
            }
          }

          if (sessionObj) {
            setSessions((prev) =>
              prev.map((s) => (s.id === sessionId ? { ...s, ...sessionObj } : s))
            );
          }
        }
      } catch (err: unknown) {
        if (currentLessonIdRef.current !== lessonId) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        const msg = err instanceof AppApiError ? err.message : 'Không thể tải lịch sử trò chuyện.';
        setError(msg);
      } finally {
        if (currentLessonIdRef.current === lessonId) {
          setIsLoadingMessages(false);
        }
      }
    },
    [lessonId]
  );

  // Load sessions for current lesson
  const loadSessions = useCallback(
    async (status: 'active' | 'archived' | 'all' = statusFilter) => {
      if (!lessonId) {
        setSessions([]);
        setActiveSessionId(null);
        setMessages([]);
        return;
      }

      if (sessionsAbortRef.current) {
        sessionsAbortRef.current.abort();
      }
      const controller = new AbortController();
      sessionsAbortRef.current = controller;

      setIsLoadingSessions(true);
      setError(null);

      try {
        const res = await aiTutorService.listSessions(
          lessonId,
          {
            status: status === 'all' ? undefined : status,
            includeArchived: status === 'all' || status === 'archived',
            limit: 50,
          },
          { signal: controller.signal }
        );

        if (currentLessonIdRef.current !== lessonId) return;

        if (res.success && Array.isArray(res.data)) {
          setSessions(res.data);

          // Restore or select the most relevant session and fetch its messages immediately
          if (res.data.length > 0) {
            const chosen =
              (activeSessionId && res.data.find((s) => s.id === activeSessionId)) ||
              res.data.find((s) => s.isActive) ||
              res.data[0];

            setActiveSessionId(chosen.id);
            void selectSession(chosen.id);
          } else {
            setActiveSessionId(null);
            setMessages([]);
          }
        }
      } catch (err: unknown) {
        if (currentLessonIdRef.current !== lessonId) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        const msg = err instanceof AppApiError ? err.message : 'Không thể tải danh sách cuộc trò chuyện.';
        setError(msg);
      } finally {
        if (currentLessonIdRef.current === lessonId) {
          setIsLoadingSessions(false);
        }
      }
    },
    [activeSessionId, lessonId, selectSession, statusFilter]
  );

  // Create new session
  const createSession = useCallback(
    async (title?: string): Promise<AiTutorSession | null> => {
      if (!lessonId) return null;
      setIsCreatingSession(true);
      setError(null);

      try {
        const res = await aiTutorService.createSession(lessonId, { title });
        if (res.success && res.data) {
          const newSession = res.data;
          setSessions((prev) => [newSession, ...prev]);
          setActiveSessionId(newSession.id);
          setMessages([]);
          setRagStatus(null);
          toast.success('Đã tạo cuộc trò chuyện mới với AI Tutor!');
          return newSession;
        }
        return null;
      } catch (err: unknown) {
        const msg = err instanceof AppApiError ? err.message : 'Không thể tạo cuộc trò chuyện mới.';
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setIsCreatingSession(false);
      }
    },
    [lessonId]
  );

  // Send student question
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return false;

      if (!lessonId) {
        toast.warning('Vui lòng chọn bài học trước khi đặt câu hỏi.');
        return false;
      }

      if (!isEnrolled) {
        toast.warning('Bạn cần ghi danh vào khóa học để sử dụng trợ lý AI Tutor.');
        return false;
      }

      setIsSending(true);
      setError(null);
      setRagStatus(null);

      let targetSessionId = activeSessionId;

      // 1. If no active session exists, create one on the fly first
      if (!targetSessionId) {
        try {
          const autoTitle = trimmed.length > 40 ? `${trimmed.substring(0, 37)}...` : trimmed;
          const created = await aiTutorService.createSession(lessonId, { title: autoTitle });
          if (created.success && created.data) {
            targetSessionId = created.data.id;
            setSessions((prev) => [created.data, ...prev]);
            setActiveSessionId(created.data.id);
          } else {
            throw new Error('Không thể khởi tạo phiên trò chuyện cho câu hỏi này.');
          }
        } catch (sessionErr: unknown) {
          setIsSending(false);
          const msg = sessionErr instanceof Error ? sessionErr.message : 'Lỗi khởi tạo phiên.';
          setError(msg);
          toast.error(msg);
          return false;
        }
      }

      // 2. Optimistic user message rendering
      const tempUserMsgId = `temp-${Date.now()}`;
      const optimisticUserMsg: AiTutorMessage = {
        id: tempUserMsgId,
        sessionId: targetSessionId,
        role: 'user',
        content: trimmed,
        citations: [],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUserMsg]);

      try {
        const res = await aiTutorService.sendMessage(targetSessionId, { content: trimmed });

        if (res.success && res.data) {
          const { userMessage, assistantMessage, ragStatus: status } = res.data;

          setRagStatus(status);

          // Replace optimistic message and append assistant message
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== tempUserMsgId);
            return [...filtered, userMessage, assistantMessage];
          });

          // Update session message count & updatedAt in local sessions list
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId) {
                return {
                  ...s,
                  updatedAt: assistantMessage.createdAt || new Date().toISOString(),
                  _count: {
                    messages: (s._count?.messages || 0) + 2,
                  },
                };
              }
              return s;
            })
          );

          return true;
        }

        throw new Error('Không nhận được phản hồi từ AI Tutor.');
      } catch (err: unknown) {
        // Rollback optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsgId));

        let msg = 'Có lỗi xảy ra khi gửi câu hỏi đến AI Tutor.';
        if (err instanceof AppApiError) {
          msg = err.message;
        } else if (err instanceof Error) {
          msg = err.message;
        }

        setError(msg);
        toast.error(msg);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [activeSessionId, isEnrolled, isSending, lessonId]
  );

  // Rename session
  const renameSession = useCallback(
    async (sessionId: string, newTitle: string): Promise<boolean> => {
      const trimmed = newTitle.trim();
      if (!trimmed) return false;

      try {
        const res = await aiTutorService.updateSession(sessionId, { title: trimmed });
        if (res.success && res.data) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, title: trimmed, updatedAt: res.data.updatedAt } : s))
          );
          toast.success('Đã đổi tên cuộc trò chuyện.');
          return true;
        }
        return false;
      } catch (err: unknown) {
        const msg = err instanceof AppApiError ? err.message : 'Đổi tên thất bại.';
        toast.error(msg);
        return false;
      }
    },
    []
  );

  // Archive session (soft delete)
  const archiveSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const res = await aiTutorService.deleteSession(sessionId, { permanent: false });
        if (res.success) {
          toast.success('Đã lưu trữ cuộc trò chuyện.');
          // Update local status or remove from active list
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, isActive: false } : s))
          );

          // If current session was archived and viewing active only, switch to another
          if (activeSessionId === sessionId) {
            setSessions((currentSessions) => {
              const remaining = currentSessions.filter((s) => s.id !== sessionId && s.isActive);
              if (remaining.length > 0) {
                setActiveSessionId(remaining[0].id);
              } else {
                setActiveSessionId(null);
                setMessages([]);
              }
              return currentSessions;
            });
          }
          return true;
        }
        return false;
      } catch (err: unknown) {
        const msg = err instanceof AppApiError ? err.message : 'Lưu trữ thất bại.';
        toast.error(msg);
        return false;
      }
    },
    [activeSessionId]
  );

  // Unarchive session
  const unarchiveSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const res = await aiTutorService.updateSession(sessionId, { isActive: true });
        if (res.success && res.data) {
          toast.success('Đã khôi phục cuộc trò chuyện.');
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, isActive: true } : s))
          );
          return true;
        }
        return false;
      } catch (err: unknown) {
        const msg = err instanceof AppApiError ? err.message : 'Khôi phục thất bại.';
        toast.error(msg);
        return false;
      }
    },
    []
  );

  // Permanent delete session
  const deleteSession = useCallback(
    async (sessionId: string, permanent = true): Promise<boolean> => {
      try {
        const res = await aiTutorService.deleteSession(sessionId, { permanent });
        if (res.success) {
          toast.success('Đã xóa vĩnh viễn cuộc trò chuyện.');
          setSessions((prev) => prev.filter((s) => s.id !== sessionId));

          if (activeSessionId === sessionId) {
            setSessions((currentSessions) => {
              const remaining = currentSessions.filter((s) => s.id !== sessionId);
              if (remaining.length > 0) {
                setActiveSessionId(remaining[0].id);
              } else {
                setActiveSessionId(null);
                setMessages([]);
              }
              return currentSessions;
            });
          }
          return true;
        }
        return false;
      } catch (err: unknown) {
        const msg = err instanceof AppApiError ? err.message : 'Xóa thất bại.';
        toast.error(msg);
        return false;
      }
    },
    [activeSessionId]
  );

  // Initial load when lessonId or statusFilter changes
  useEffect(() => {
    let isCancelled = false;
    if (autoLoad && lessonId) {
      queueMicrotask(() => {
        if (!isCancelled) {
          void loadSessions(statusFilter);
        }
      });
    } else {
      queueMicrotask(() => {
        if (!isCancelled) {
          setSessions([]);
          setActiveSessionId(null);
          setMessages([]);
        }
      });
    }

    return () => {
      isCancelled = true;
      if (sessionsAbortRef.current) sessionsAbortRef.current.abort();
      if (messagesAbortRef.current) messagesAbortRef.current.abort();
    };
  }, [autoLoad, lessonId, loadSessions, statusFilter]);

  // When activeSessionId changes, fetch messages
  useEffect(() => {
    let isCancelled = false;
    if (activeSessionId) {
      queueMicrotask(() => {
        if (!isCancelled) {
          void selectSession(activeSessionId);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [activeSessionId, selectSession]);

  return {
    sessions,
    activeSessionId,
    activeSession,
    messages,
    isLoadingSessions,
    isLoadingMessages,
    isSending,
    isCreatingSession,
    error,
    ragStatus,
    statusFilter,
    setStatusFilter,
    loadSessions,
    selectSession,
    createSession,
    sendMessage,
    renameSession,
    archiveSession,
    unarchiveSession,
    deleteSession,
    clearError,
  };
}
