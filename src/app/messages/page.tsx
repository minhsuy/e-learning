'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { MessageBubble } from '@/components/chat/message-bubble';
import { NewConversationModal } from '@/components/chat/new-conversation-modal';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { conversationService } from '@/services/conversation.service';
import { Conversation } from '@/types/conversation';
import { Message } from '@/types/message';
import { useSoundSetting, playNotificationSound } from '@/lib/sound';

type FilterCategory = 'all' | 'instructor' | 'group';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryConvId = searchParams.get('conversationId');
  const { user, status: authStatus, isAuthenticated } = useAuth();

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationError, setConversationError] = useState<string | null>(null);

  // Composer state
  const [inputText, setInputText] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Mobile navigation state: false = show conversation list, true = show chat thread
  const [mobileShowThread, setMobileShowThread] = useState(false);

  // Scroll management
  const messageStreamRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Conversations List
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingConversations(true);
    setConversationError(null);

    try {
      const res = await conversationService.getConversations();
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
        // Select queryConvId if available in returned data, otherwise default to first
        if (res.data.length > 0) {
          if (queryConvId && res.data.some((c) => (c.id || c._id) === queryConvId)) {
            setActiveId(queryConvId);
            setMobileShowThread(true);
          } else if (!activeId) {
            const first = res.data[0];
            setActiveId(first.id || first._id || null);
          }
        }
      } else {
        setConversations([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách hội thoại';
      setConversationError(msg);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated, activeId, queryConvId]);

  useEffect(() => {
    let isCancelled = false;

    const initPage = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      if (authStatus === 'unauthenticated') {
        router.push('/login?redirect=/messages');
        return;
      }

      if (isAuthenticated) {
        await fetchConversations();
      }
    };

    void initPage();

    return () => {
      isCancelled = true;
    };
  }, [authStatus, isAuthenticated, router, fetchConversations]);

  const currentUserId = user?.id || (user as { _id?: string })?._id || '';
  const { soundEnabled, toggleSound } = useSoundSetting();
  const { socket } = useSocket();

  const activeIdRef = useRef<string | null>(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Join all conversation rooms on socket connect / conversations update to receive realtime messages across rooms
  useEffect(() => {
    if (!socket || !conversations.length) return;
    conversations.forEach((c) => {
      const cId = c.id || c._id;
      if (cId) {
        socket.emit('join', cId);
      }
    });
  }, [socket, conversations]);

  // Callback when a new message arrives from socket to update conversation preview & unread state
  const handleNewMessageReceived = useCallback((incomingMsg: Message) => {
    const convId = incomingMsg.conversationId || incomingMsg.conversation;
    const currentActive = activeIdRef.current;
    const msgSenderId =
      incomingMsg.senderId || incomingMsg.sender?.id || incomingMsg.sender?._id;
    const isFromMe =
      msgSenderId === currentUserId ||
      (user?.username && incomingMsg.sender?.username === user.username);

    // Audio policy:
    // - Only play when from another sender
    // - Never play for own message or echo
    // - Never play if user is actively watching this conversation
    if (!isFromMe && convId !== currentActive) {
      playNotificationSound({
        id: incomingMsg.id || incomingMsg._id,
        source: 'message',
      });
    }

    setConversations((prev) => {
      const found = prev.find((c) => (c.id || c._id) === convId);
      if (!found) return prev;

      // If user is currently in this conversation, unread is 0. Otherwise increment unread if from someone else.
      const shouldIncrement = !isFromMe && convId !== currentActive;
      const nextUnread = shouldIncrement
        ? (found.unreadCount || 0) + 1
        : convId === currentActive
        ? 0
        : found.unreadCount || 0;

      const updatedConv: Conversation = {
        ...found,
        unreadCount: nextUnread,
        lastMessage: {
          id: incomingMsg.id || incomingMsg._id || '',
          content: incomingMsg.content,
          type: incomingMsg.type,
          createdAt: incomingMsg.createdAt,
        },
        updatedAt: incomingMsg.createdAt,
      };

      // Move updated conversation to the top
      return [updatedConv, ...prev.filter((c) => (c.id || c._id) !== convId)];
    });
  }, [currentUserId, user]);

  const handleMessageUpdated = useCallback((updatedMsg: Message) => {
    const convId = updatedMsg.conversationId || updatedMsg.conversation;
    setConversations((prev) =>
      prev.map((c): Conversation => {
        const msgId = updatedMsg.id || updatedMsg._id;
        if ((c.id || c._id) === convId && c.lastMessage) {
          const lastMsgId = c.lastMessage.id || c.lastMessage._id;
          if (lastMsgId === msgId) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                content: updatedMsg.content,
              },
            };
          }
        }
        return c;
      })
    );
  }, []);

  // 2. Realtime Messages Hook
  const {
    messages,
    isLoadingMessages,
    error: messagesError,
    isOtherTyping,
    isConnected: isSocketConnected,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTyping,
    sendStopTyping,
    reloadMessages,
  } = useRealtimeMessages({
    activeConversationId: activeId,
    onNewMessageReceived: handleNewMessageReceived,
    onMessageUpdated: handleMessageUpdated,
  });

  const activeConversation = conversations.find(
    (c) => (c.id || c._id) === activeId
  ) || null;

  // 3. Scroll Behavior Tracking
  const handleScroll = () => {
    if (!messageStreamRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageStreamRef.current;
    isNearBottomRef.current = scrollHeight - (scrollTop + clientHeight) < 120;
  };

  useEffect(() => {
    if (messageStreamRef.current && isNearBottomRef.current) {
      messageStreamRef.current.scrollTop = messageStreamRef.current.scrollHeight;
    }
  }, [messages, isOtherTyping]);

  // 4. Conversation Filtering
  const filteredConversations = conversations.filter((c) => {
    const name = c.displayName || c.name || '';
    const lastContent = c.lastMessage?.content || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastContent.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'group') return c.isGroup;
    if (activeFilter === 'instructor') return !c.isGroup;
    return true;
  });

  const totalUnreadCount = conversations.reduce(
    (acc, c) => acc + (c.unreadCount || 0),
    0
  );

  const handleSelectConversation = (convId: string) => {
    setActiveId(convId);
    setMobileShowThread(true);
    setEditingMessage(null);

    // Clear unread count on opening conversation
    setConversations((prev) =>
      prev.map((c) =>
        (c.id || c._id) === convId && c.unreadCount && c.unreadCount > 0
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  };

  // 5. Typing Handling
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Send typing event debounced
    sendTyping();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendStopTyping();
    }, 1500);
  };

  // 6. Send or Edit Message
  const handleSendOrSave = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (editingMessage) {
      editMessage(editingMessage.id || (editingMessage as { _id?: string })._id || '', trimmed);
      setEditingMessage(null);
      setInputText('');
    } else {
      sendMessage(trimmed, 'text');
      setInputText('');
    }

    sendStopTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendOrSave();
    }
  };

  const startEditMessage = (msg: Message) => {
    setEditingMessage(msg);
    setInputText(msg.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setInputText('');
  };

  const formatLastMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      if (isToday) {
        return new Intl.DateTimeFormat('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(d);
      }
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(d);
    } catch {
      return '';
    }
  };

  // State: Unauthorized / Guest Prompt
  if (authStatus === 'unauthenticated') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f7f1ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] mb-4">
            <span className="material-symbols-outlined text-[36px]">lock</span>
          </div>
          <h2 className="text-xl font-bold text-[#1c192c] dark:text-[#f4eeff] mb-2">
            Đăng nhập để sử dụng tính năng Tin nhắn
          </h2>
          <p className="text-sm text-[#635a72] dark:text-[#b4a9c7] max-w-md mb-6">
            Bạn cần đăng nhập tài khoản học viên để trao đổi trực tiếp với giảng viên và tham gia nhóm học tập.
          </p>
          <Link
            href="/login?redirect=/messages"
            className="px-6 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5f339c] text-white text-sm font-bold shadow-sm transition-all"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col w-full h-[calc(100vh-4rem)] overflow-hidden bg-[#fdf8ff] dark:bg-[#16131e]">
        <div className="flex flex-1 h-full overflow-hidden p-3 md:p-4 gap-4">
          {/* ========================================================== */}
          {/* LEFT PANEL: Conversation List */}
          {/* ========================================================== */}
          <section
            className={`w-full lg:w-96 flex-shrink-0 flex flex-col bg-white dark:bg-[#1d1926] rounded-2xl shadow-[0_2px_12px_rgba(30,27,46,0.03)] border border-[#f1ebff] dark:border-[#2f2742] overflow-hidden ${
              mobileShowThread ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="p-4 pb-3 flex flex-col gap-3 border-b border-[#f7f1ff] dark:border-[#282136]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                    Tin nhắn
                  </h1>
                  {totalUnreadCount > 0 ? (
                    <span
                      title={`${totalUnreadCount} tin nhắn chưa đọc`}
                      className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#7240b8] text-white text-[11px] font-extrabold animate-pulse shadow-2xs"
                    >
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount} mới
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#8b5ad3] text-white text-[11px] font-bold">
                      {conversations.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Sound Toggle Button */}
                  <button
                    aria-label={soundEnabled ? 'Tắt âm thanh thông báo' : 'Bật âm thanh thông báo'}
                    onClick={toggleSound}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer ${
                      soundEnabled
                        ? 'bg-[#eddcff]/70 dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#7240b8] hover:text-white'
                        : 'bg-[#f7f1ff] dark:bg-[#1f1b29] text-[#7c7483] dark:text-[#6a6374] hover:bg-[#ebe5ff]'
                    }`}
                    title={
                      soundEnabled
                        ? 'Âm thanh thông báo: Đang bật (Nhấp để tắt)'
                        : 'Âm thanh thông báo: Đang tắt (Nhấp để bật)'
                    }
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {soundEnabled ? 'volume_up' : 'volume_off'}
                    </span>
                  </button>

                  <button
                    aria-label="Soạn tin nhắn mới"
                    onClick={() => setIsNewModalOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#f7f1ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#7240b8] hover:text-white transition-all active:scale-95 shadow-2xs cursor-pointer"
                    title="Soạn tin nhắn mới"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit_square</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7483] dark:text-[#8e8596] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm hội thoại, giảng viên..."
                  className="w-full h-9 pl-9 pr-4 bg-[#f7f1ff] dark:bg-[#221c2e] rounded-lg text-xs md:text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#7c7483] dark:placeholder:text-[#8e8596] focus:outline-none focus:bg-white dark:focus:bg-[#1d1926] focus:ring-1 focus:ring-[#7240b8] transition-all border border-transparent focus:border-[#7240b8]"
                />
              </div>

              {/* Quick Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-nowrap">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeFilter === 'all'
                      ? 'bg-[#7240b8] text-white'
                      : 'bg-[#f7f1ff] dark:bg-[#282136] text-[#4b4452] dark:text-[#b4a9c7] hover:bg-[#ebe5ff] hover:text-[#1c192c]'
                  }`}
                >
                  Tất cả ({conversations.length})
                </button>
                <button
                  onClick={() => setActiveFilter('instructor')}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeFilter === 'instructor'
                      ? 'bg-[#7240b8] text-white'
                      : 'bg-[#f7f1ff] dark:bg-[#282136] text-[#4b4452] dark:text-[#b4a9c7] hover:bg-[#ebe5ff] hover:text-[#1c192c]'
                  }`}
                >
                  Giảng viên
                </button>
                <button
                  onClick={() => setActiveFilter('group')}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeFilter === 'group'
                      ? 'bg-[#7240b8] text-white'
                      : 'bg-[#f7f1ff] dark:bg-[#282136] text-[#4b4452] dark:text-[#b4a9c7] hover:bg-[#ebe5ff] hover:text-[#1c192c]'
                  }`}
                >
                  Nhóm học tập
                </button>
              </div>
            </div>

            {/* Conversations Scroll Area */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {isLoadingConversations && (
                <div className="p-3 space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] animate-pulse"
                    />
                  ))}
                </div>
              )}

              {!isLoadingConversations && conversationError && (
                <div className="p-6 text-center text-xs text-rose-500 flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[24px]">error</span>
                  <span>{conversationError}</span>
                  <button
                    onClick={() => fetchConversations()}
                    className="px-3 py-1.5 rounded-lg bg-[#f7f1ff] dark:bg-[#282136] text-[#7240b8] text-xs font-bold hover:bg-[#ebe5ff]"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {!isLoadingConversations &&
                !conversationError &&
                filteredConversations.map((conv) => {
                  const convId = conv.id || conv._id || '';
                  const isActive = convId === activeId;
                  const unreadCount = conv.unreadCount || 0;
                  const hasUnread = unreadCount > 0;
                  const displayName = conv.displayName || conv.name || 'Người dùng TMdemy';
                  const avatar = conv.avatar;
                  const lastSnippet = conv.lastMessage?.content || 'Bắt đầu cuộc trò chuyện...';
                  const timeFormatted = formatLastMessageTime(
                    conv.lastMessage?.createdAt || conv.updatedAt
                  );

                  return (
                    <div
                      key={convId}
                      onClick={() => handleSelectConversation(convId)}
                      className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? 'bg-[#ebe5ff] dark:bg-[#282136] shadow-2xs border-l-4 border-l-[#7240b8]'
                          : hasUnread
                          ? 'bg-violet-50/80 dark:bg-violet-950/25 border-l-4 border-l-[#7240b8] hover:bg-violet-100/70 dark:hover:bg-violet-900/40'
                          : 'hover:bg-[#f7f1ff] dark:hover:bg-[#221c2e] border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={displayName}
                            className="w-11 h-11 rounded-full object-cover shadow-2xs"
                          />
                        ) : conv.isGroup ? (
                          <div className="w-11 h-11 rounded-full bg-[#ebe5ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] font-bold text-xs shadow-2xs">
                            <span className="material-symbols-outlined text-[20px]">groups</span>
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#e7dbf7] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] font-bold text-sm shadow-2xs">
                            {displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}

                        {/* Online status indicator */}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#1d1926] ${
                            isSocketConnected ? 'bg-[#006947]' : 'bg-[#cdc3d4]'
                          }`}
                        />
                      </div>

                      {/* Meta info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span
                              className={`text-[13px] truncate ${
                                hasUnread
                                  ? 'font-black text-[#7240b8] dark:text-[#c4a4ff]'
                                  : 'font-bold text-[#1c192c] dark:text-[#f4eeff]'
                              }`}
                            >
                              {displayName}
                            </span>
                            {!conv.isGroup && (
                              <span
                                className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[15px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                                title="Giảng viên chính thức"
                              >
                                verified
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[11px] flex-shrink-0 ml-1 ${
                              hasUnread
                                ? 'font-bold text-[#7240b8] dark:text-[#c4a4ff]'
                                : 'font-semibold text-[#7c7483] dark:text-[#8e8596]'
                            }`}
                          >
                            {timeFormatted}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] mb-1 truncate">
                          {conv.isGroup ? 'Nhóm thảo luận' : 'Trao đổi trực tiếp'}
                        </p>

                        <div className="flex items-center justify-between gap-1.5">
                          <p
                            className={`text-xs truncate ${
                              hasUnread
                                ? 'font-bold text-[#1c192c] dark:text-[#f4eeff]'
                                : 'text-[#635a72] dark:text-[#b4a9c7]'
                            }`}
                          >
                            {lastSnippet}
                          </p>
                          {hasUnread && (
                            <span
                              className="flex-shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-[#7240b8] text-white text-[10px] font-black shadow-2xs animate-in zoom-in-50"
                              title={`${unreadCount} tin nhắn mới chưa đọc`}
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {!isLoadingConversations &&
                !conversationError &&
                filteredConversations.length === 0 && (
                  <div className="p-8 text-center text-[#635a72] dark:text-[#b4a9c7] text-xs flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[32px] text-[#7240b8]">
                      chat_bubble_outline
                    </span>
                    <span>Không có cuộc trò chuyện nào phù hợp.</span>
                    <button
                      onClick={() => setIsNewModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#7240b8] text-white text-xs font-bold mt-1 shadow-2xs"
                    >
                      Bắt đầu cuộc trò chuyện mới
                    </button>
                  </div>
                )}
            </div>
          </section>

          {/* ========================================================== */}
          {/* RIGHT PANEL: Active Chat Thread */}
          {/* ========================================================== */}
          <main
            className={`flex-1 flex flex-col bg-white dark:bg-[#1d1926] rounded-2xl shadow-[0_2px_12px_rgba(30,27,46,0.03)] border border-[#f1ebff] dark:border-[#2f2742] overflow-hidden min-w-0 ${
              !mobileShowThread ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <header className="p-4 bg-white dark:bg-[#1d1926] flex items-center justify-between gap-3 border-b border-[#f7f1ff] dark:border-[#282136] z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setMobileShowThread(false)}
                      className="lg:hidden p-1.5 rounded-lg text-[#635a72] dark:text-[#b4a9c7] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors"
                      aria-label="Quay lại danh sách hội thoại"
                    >
                      <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                    </button>

                    <div className="relative flex-shrink-0">
                      {activeConversation.avatar ? (
                        <img
                          src={activeConversation.avatar}
                          alt={activeConversation.displayName}
                          className="w-11 h-11 rounded-full object-cover shadow-2xs"
                        />
                      ) : activeConversation.isGroup ? (
                        <div className="w-11 h-11 rounded-full bg-[#ebe5ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] shadow-2xs">
                          <span className="material-symbols-outlined text-[24px]">groups</span>
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#e7dbf7] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] shadow-2xs font-bold text-base">
                          {activeConversation.displayName?.slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      {/* Online dot */}
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#1d1926] ${
                          isSocketConnected ? 'bg-[#006947]' : 'bg-[#cdc3d4]'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                          {activeConversation.displayName || activeConversation.name}
                        </h2>
                        {!activeConversation.isGroup && (
                          <span
                            className="material-symbols-outlined text-[15px] text-[#7240b8] dark:text-[#a87ffb]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            verified
                          </span>
                        )}
                        <span
                          className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-medium ml-1 ${
                            isSocketConnected
                              ? 'text-[#006947] dark:text-[#4edea3]'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSocketConnected ? 'bg-[#006947] animate-pulse' : 'bg-amber-500'
                            }`}
                          />
                          {isSocketConnected ? 'Trực tuyến' : 'Đang kết nối lại...'}
                        </span>
                      </div>

                      <p className="text-[12px] text-[#635a72] dark:text-[#b4a9c7] truncate mt-0.5">
                        {activeConversation.isGroup
                          ? 'Kênh trao đổi nhóm học tập'
                          : 'Hỗ trợ giải đáp kiến thức trực tiếp'}
                      </p>
                    </div>
                  </div>

                  {/* Actions in header */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => reloadMessages()}
                      title="Làm mới tin nhắn"
                      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f7f1ff] dark:hover:bg-[#282136] text-[#635a72] dark:text-[#b4a9c7] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">refresh</span>
                    </button>
                  </div>
                </header>

                {/* Message Stream */}
                <div
                  ref={messageStreamRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdf8ff]/60 dark:bg-[#16131e]/60"
                  id="messageStream"
                >
                  {/* Loading indicator */}
                  {isLoadingMessages && (
                    <div className="p-8 text-center text-xs text-[#635a72] dark:text-[#b4a9c7] flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#7240b8] border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải lịch sử tin nhắn...</span>
                    </div>
                  )}

                  {/* Error state */}
                  {!isLoadingMessages && messagesError && (
                    <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs text-center flex flex-col items-center gap-2">
                      <span>{messagesError}</span>
                      <button
                        onClick={() => reloadMessages()}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold"
                      >
                        Tải lại
                      </button>
                    </div>
                  )}

                  {/* Empty state */}
                  {!isLoadingMessages && !messagesError && messages.length === 0 && (
                    <div className="p-12 text-center text-[#635a72] dark:text-[#b4a9c7] flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#f1ebff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8]">
                        <span className="material-symbols-outlined text-[28px]">waving_hand</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        Chưa có tin nhắn nào
                      </h3>
                      <p className="text-xs max-w-xs">
                        Hãy gửi tin nhắn đầu tiên để bắt đầu thảo luận với{' '}
                        {activeConversation.displayName}!
                      </p>
                    </div>
                  )}

                  {/* Messages List */}
                  {!isLoadingMessages &&
                    messages.map((msg, idx) => {
                      const msgSenderId = msg.senderId || msg.sender?.id || msg.sender?._id;
                      const isMe =
                        msgSenderId === currentUserId || msg.sender?.username === user?.username;

                      return (
                        <MessageBubble
                          key={msg.id || (msg as { _id?: string })._id || `msg-${idx}`}
                          message={msg}
                          isMe={isMe}
                          onEdit={isMe ? startEditMessage : undefined}
                          onDelete={isMe ? deleteMessage : undefined}
                        />
                      );
                    })}

                  {/* Live Typing Indicator */}
                  {isOtherTyping && (
                    <div className="flex items-center gap-2.5 animate-in fade-in duration-200">
                      <div className="w-7 h-7 rounded-full bg-[#ebe5ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] text-xs font-bold">
                        {activeConversation.displayName?.slice(0, 1)}
                      </div>
                      <div className="px-3.5 py-2 rounded-2xl rounded-tl-xs bg-white dark:bg-[#1d1926] text-[#635a72] dark:text-[#b4a9c7] shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] flex items-center gap-2">
                        <span className="text-[11px] text-[#7c7483] dark:text-[#8e8596]">
                          Đang soạn tin nhắn
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7240b8] animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7240b8] animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7240b8] animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Composer */}
                <footer className="p-4 bg-white dark:bg-[#1d1926] border-t border-[#f7f1ff] dark:border-[#282136] shadow-[0_-2px_12px_rgba(30,27,46,0.03)] flex flex-col gap-2 z-10">
                  {/* Edit Banner if editing */}
                  {editingMessage && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#ebe5ff] dark:bg-[#282136] text-xs text-[#5b27a1] dark:text-[#d6c4ff]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        <span className="font-semibold">Đang sửa tin nhắn:</span>
                        <span className="truncate max-w-sm italic opacity-90">
                          {editingMessage.content}
                        </span>
                      </div>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  {/* Input Box Container */}
                  <div className="relative bg-[#f7f1ff] dark:bg-[#221c2e] rounded-xl p-2.5 flex flex-col gap-2 border border-[#f1ebff] dark:border-[#2f2742] focus-within:bg-white dark:focus-within:bg-[#1d1926] focus-within:ring-2 focus-within:ring-[#7240b8] transition-all">
                    <textarea
                      id="chatInput"
                      rows={2}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        editingMessage
                          ? 'Cập nhật nội dung tin nhắn...'
                          : `Nhập tin nhắn để trao đổi cùng ${activeConversation.displayName}...`
                      }
                      className="w-full bg-transparent resize-none text-xs md:text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#7c7483] dark:placeholder:text-[#8e8596] focus:outline-none px-2 py-1 leading-relaxed"
                    />

                    {/* Action Toolbar */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#f1ebff]/70 dark:border-[#2f2742]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setInputText(
                              (prev) => `${prev}\n\`\`\`typescript\n// Code snippet\n\`\`\`\n`
                            );
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ebe5ff] dark:hover:bg-[#282136] text-[#635a72] dark:text-[#b4a9c7] hover:text-[#7240b8] transition-colors"
                          title="Chèn đoạn mã (Code snippet)"
                        >
                          <span className="material-symbols-outlined text-[20px]">code</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInputText((prev) => `${prev} 👍`);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ebe5ff] dark:hover:bg-[#282136] text-[#635a72] dark:text-[#b4a9c7] hover:text-[#7240b8] transition-colors"
                          title="Biểu tượng cảm xúc (Emoji)"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            sentiment_satisfied
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingMessage && (
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#635a72] dark:text-[#b4a9c7] hover:bg-[#ebe5ff] dark:hover:bg-[#282136]"
                          >
                            Hủy
                          </button>
                        )}
                        <button
                          id="sendBtn"
                          type="button"
                          onClick={handleSendOrSave}
                          disabled={!inputText.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-[13px] font-bold shadow-md shadow-[#7240b8]/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <span>{editingMessage ? 'Lưu' : 'Gửi'}</span>
                          <span className="material-symbols-outlined text-[18px]">
                            {editingMessage ? 'check' : 'send'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </footer>
              </>
            ) : (
              /* No Active Conversation Selected */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#635a72] dark:text-[#b4a9c7]">
                <div className="w-16 h-16 rounded-full bg-[#f7f1ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] mb-3">
                  <span className="material-symbols-outlined text-[32px]">forum</span>
                </div>
                <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                  Chọn cuộc trò chuyện để bắt đầu
                </h3>
                <p className="text-xs max-w-sm mb-4">
                  Chọn một cuộc hội thoại từ danh sách bên trái hoặc bắt đầu một cuộc trò chuyện mới với giảng viên.
                </p>
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#7240b8] text-white text-xs font-bold shadow-sm hover:bg-[#5f339c] transition-all"
                >
                  Soạn tin nhắn mới
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onConversationCreated={(newConv) => {
          const newId = newConv.id || newConv._id || '';
          setConversations((prev) => {
            const exists = prev.some((c) => (c.id || c._id) === newId);
            if (exists) return prev;
            return [newConv, ...prev];
          });
          setActiveId(newId);
          setMobileShowThread(true);
        }}
      />
    </AppShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-3 border-[#7240b8] border-t-transparent rounded-full animate-spin" />
          </div>
        </AppShell>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
