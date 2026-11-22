'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Loader2,
  AlertTriangle,
  Info,
  BookOpen,
  ArrowDown,
  X,
  Lock,
} from 'lucide-react';
import { useAiTutor } from '@/hooks/use-ai-tutor';
import { AiTutorMessageItem } from './ai-tutor-message-item';
import { AiTutorSessionMenu } from './ai-tutor-session-menu';

export interface AiTutorChatPanelProps {
  lessonId: string;
  lessonTitle?: string;
  isEnrolled?: boolean;
  onSeek?: (seconds: number) => void;
  onClose?: () => void;
  className?: string;
  showCloseButton?: boolean;
}

const STARTER_PROMPTS = [
  'Tóm tắt các ý chính quan trọng của bài học này.',
  'Giải thích chi tiết các khái niệm trọng tâm trong bài.',
  'Cho mình một ví dụ thực hành cụ thể về kiến thức bài giảng.',
  'Những điểm cần lưu ý để tránh lỗi khi thực hiện bài này?',
];

export function AiTutorChatPanel({
  lessonId,
  lessonTitle,
  isEnrolled = true,
  onSeek,
  onClose,
  className = '',
  showCloseButton = false,
}: AiTutorChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    sessions,
    activeSessionId,
    messages,
    isLoadingSessions,
    isLoadingMessages,
    isSending,
    isCreatingSession,
    error,
    ragStatus,
    statusFilter,
    setStatusFilter,
    selectSession,
    createSession,
    sendMessage,
    renameSession,
    archiveSession,
    unarchiveSession,
    deleteSession,
    clearError,
  } = useAiTutor({
    lessonId,
    autoLoad: isEnrolled,
  });

  // Auto scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

  // Monitor scroll position to show "scroll to bottom" button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  }, []);

  // Scroll to bottom when new messages arrive or loading completes
  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  // Handle textarea auto-height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputText]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !isEnrolled) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const success = await sendMessage(trimmed);
    if (!success) {
      // Re-populate text if send failed
      setInputText(trimmed);
    } else {
      setTimeout(() => scrollToBottom(true), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 relative ${className}`}
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-purple-400/40 shadow-xs bg-white dark:bg-gray-800 p-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.png"
              alt="TMdemy AI Tutor"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-gray-900" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                TMdemy AI Tutor
              </h3>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded shrink-0 hidden sm:inline">
                RAG
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
              {lessonTitle ? (
                <>
                  <BookOpen className="w-3 h-3 shrink-0" />
                  <span className="truncate">{lessonTitle}</span>
                </>
              ) : (
                'Trợ lý học tập của bạn'
              )}
            </p>
          </div>
        </div>

        {/* Right Action: Session Menu & Close Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isEnrolled && (
            <AiTutorSessionMenu
              sessions={sessions}
              activeSessionId={activeSessionId}
              isLoading={isLoadingSessions}
              isCreating={isCreatingSession}
              statusFilter={statusFilter}
              onFilterChange={setStatusFilter}
              onSelectSession={(id) => void selectSession(id)}
              onCreateSession={() => void createSession()}
              onRenameSession={renameSession}
              onArchiveSession={archiveSession}
              onUnarchiveSession={unarchiveSession}
              onDeleteSession={deleteSession}
            />
          )}

          {showCloseButton && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Đóng bảng AI Tutor"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* RAG Status Alerts Banner */}
      {ragStatus === 'INSUFFICIENT_CONTEXT' && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Nội dung câu hỏi vượt quá phạm vi bài học này. AI Tutor đã phản hồi dựa trên thông tin sẵn có.
          </span>
        </div>
      )}
      {ragStatus === 'INDEX_NOT_READY' && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600" />
          <span>
            Transcript bài học đang được lập chỉ mục vector. Câu trả lời có thể chưa kèm mốc thời gian đầy đủ.
          </span>
        </div>
      )}
      {ragStatus === 'INDEX_STALE' && (
        <div className="px-4 py-2 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-900/40 text-purple-800 dark:text-purple-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-purple-600" />
          <span>
            Bài học vừa cập nhật nội dung mới. Dữ liệu đang đồng bộ với chỉ mục mới nhất.
          </span>
        </div>
      )}

      {/* 2. Chat Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      >
        {/* Guard: Unenrolled or no access */}
        {!isEnrolled ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Tính năng AI Tutor dành cho học viên
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mb-4">
              Vui lòng đăng ký khóa học để trò chuyện, hỏi đáp nội dung video và điều hướng mốc thời gian bài giảng cùng AI.
            </p>
          </div>
        ) : isLoadingMessages ? (
          /* Loading message history */
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600 mb-2" />
            <p className="text-xs">Đang tải cuộc trò chuyện...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State & Starter Prompts */
          <div className="py-6 px-2 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl overflow-hidden p-1 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 flex items-center justify-center mb-3 shadow-sm ring-4 ring-purple-100 dark:ring-purple-950/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="TMdemy AI Tutor"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
              TMdemy AI Tutor
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
              Mọi câu trả lời đều được đối chiếu trực tiếp với bài giảng và kèm trích dẫn mốc thời gian video.
            </p>

            {/* Quick Starter Chips */}
            <div className="w-full max-w-md space-y-2 text-left">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">
                Gợi ý câu hỏi bắt đầu:
              </p>
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 text-xs text-gray-700 dark:text-gray-300 transition group flex items-center justify-between"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <Send className="w-3 h-3 text-gray-400 group-hover:text-purple-600 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="space-y-4">
            {messages.map((message) => (
              <AiTutorMessageItem
                key={message.id}
                message={message}
                onSeek={onSeek}
              />
            ))}

            {/* Thinking / Streaming Indicator */}
            {isSending && (
              <div className="flex items-start gap-3 text-xs animate-in fade-in-0 duration-200">
                <div className="w-8 h-8 rounded-full overflow-hidden p-0.5 bg-white dark:bg-gray-800 ring-2 ring-purple-400/40 shadow-xs shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icon.png"
                    alt="TMdemy AI Tutor"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-gray-600 dark:text-gray-300 flex items-center gap-2 border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span>AI Tutor đang tra cứu tài liệu bài học và soạn câu trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-6 p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-purple-600 hover:text-purple-700 transition hover:scale-105 z-20"
          title="Cuộn xuống dưới cùng"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/30 border-t border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="truncate">{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-xs font-semibold underline shrink-0 ml-2"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 3. Input Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/20 transition">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              disabled={!isEnrolled || isSending}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
              placeholder={
                isEnrolled
                  ? 'Hỏi AI Tutor về bài học... (Nhấn Enter để gửi)'
                  : 'Đăng ký khóa học để đặt câu hỏi cho AI Tutor'
              }
              className="flex-1 max-h-32 bg-transparent text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none px-1.5 py-1 disabled:opacity-50"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              {inputText.length > 0 && (
                <span className="text-[10px] text-gray-400 select-none hidden sm:inline">
                  {inputText.length}/2000
                </span>
              )}
              <button
                type="submit"
                disabled={!isEnrolled || isSending || !inputText.trim()}
                className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white flex items-center justify-center transition shadow-sm disabled:cursor-not-allowed"
                title="Gửi câu hỏi"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-gray-400">
          <span>AI Tutor chỉ giải đáp nội dung nằm trong phạm vi bài giảng.</span>
          <span className="hidden sm:inline">Shift + Enter để xuống dòng</span>
        </div>
      </div>
    </div>
  );
}
