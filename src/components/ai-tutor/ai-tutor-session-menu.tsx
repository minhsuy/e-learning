'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Archive,
  ArchiveRestore,
  ChevronDown,
  Check,
  X,
  Loader2,
  Clock,
  History,
} from 'lucide-react';
import { AiTutorSession } from '@/types/ai-tutor';

interface AiTutorSessionMenuProps {
  sessions: AiTutorSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  isCreating: boolean;
  statusFilter: 'active' | 'archived' | 'all';
  onFilterChange: (filter: 'active' | 'archived' | 'all') => void;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (id: string, newTitle: string) => Promise<boolean>;
  onArchiveSession: (id: string) => Promise<boolean>;
  onUnarchiveSession: (id: string) => Promise<boolean>;
  onDeleteSession: (id: string) => Promise<boolean>;
}

export function AiTutorSessionMenu({
  sessions,
  activeSessionId,
  isLoading,
  isCreating,
  statusFilter,
  onFilterChange,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onArchiveSession,
  onUnarchiveSession,
  onDeleteSession,
}: AiTutorSessionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isSubmittingRename, setIsSubmittingRename] = useState(false);

  // Deletion state
  const [deletingSession, setDeletingSession] = useState<AiTutorSession | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingSessionId(null);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingSessionId]);

  const handleStartRename = (e: React.MouseEvent, session: AiTutorSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = async (e: React.FormEvent | React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editTitle.trim() || isSubmittingRename) return;

    setIsSubmittingRename(true);
    const success = await onRenameSession(sessionId, editTitle.trim());
    setIsSubmittingRename(false);
    if (success) {
      setEditingSessionId(null);
    }
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingSession || isSubmittingDelete) return;
    setIsSubmittingDelete(true);
    const success = await onDeleteSession(deletingSession.id);
    setIsSubmittingDelete(false);
    if (success) {
      setDeletingSession(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Session Switcher Trigger */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 max-w-[220px] sm:max-w-[260px] px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition border border-gray-200 dark:border-gray-700 shadow-sm"
          title="Chọn phiên hội thoại"
        >
          <History className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
            {activeSession ? activeSession.title : 'Phiên hội thoại mới'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <button
          type="button"
          onClick={onCreateSession}
          disabled={isCreating}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          title="Tạo cuộc trò chuyện mới"
        >
          {isCreating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Mới</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden flex flex-col max-h-[480px] animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header & Filter Tabs */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Lịch sử hội thoại
              </span>
              <button
                type="button"
                onClick={onCreateSession}
                disabled={isCreating}
                className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo phiên mới
              </button>
            </div>

            {/* Filter pills */}
            <div className="grid grid-cols-3 gap-1 bg-gray-200/70 dark:bg-gray-800 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => onFilterChange('active')}
                className={`py-1 rounded-md transition text-center ${
                  statusFilter === 'active'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Đang mở
              </button>
              <button
                type="button"
                onClick={() => onFilterChange('archived')}
                className={`py-1 rounded-md transition text-center ${
                  statusFilter === 'archived'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Lưu trữ
              </button>
              <button
                type="button"
                onClick={() => onFilterChange('all')}
                className={`py-1 rounded-md transition text-center ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Tất cả
              </button>
            </div>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-gray-100 dark:divide-gray-800/40">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mb-2 text-purple-600" />
                <span className="text-xs">Đang tải danh sách...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 px-4 text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {statusFilter === 'archived'
                    ? 'Không có phiên lưu trữ nào'
                    : 'Chưa có phiên hội thoại nào'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Nhập câu hỏi đầu tiên để bắt đầu ngay!
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const isSelected = session.id === activeSessionId;
                const isEditing = session.id === editingSessionId;

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      if (!isEditing) {
                        onSelectSession(session.id);
                        setIsOpen(false);
                      }
                    }}
                    className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => void handleSaveRename(e, session.id)}
                        className="flex items-center gap-1.5 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          maxLength={120}
                          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-purple-400 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          type="submit"
                          disabled={isSubmittingRename}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Lưu"
                        >
                          {isSubmittingRename ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Hủy"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-medium truncate ${
                                isSelected
                                  ? 'text-purple-700 dark:text-purple-300 font-semibold'
                                  : 'text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {session.title}
                            </span>
                            {!session.isActive && (
                              <span className="shrink-0 px-1 py-0.2 text-[10px] rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                Lưu trữ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDate(session.updatedAt || session.createdAt)}
                            </span>
                            {session._count?.messages !== undefined && (
                              <span>• {session._count.messages} tin nhắn</span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons (rename, archive, delete) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(e, session)}
                            className="p-1 rounded text-gray-400 hover:text-purple-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            title="Đổi tên"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {session.isActive ? (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await onArchiveSession(session.id);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-amber-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                              title="Lưu trữ"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await onUnarchiveSession(session.id);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                              title="Mở lại phiên"
                            >
                              <ArchiveRestore className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSession(session);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            title="Xóa phiên"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Xóa cuộc trò chuyện này?
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa phiên{' '}
              <strong className="text-gray-800 dark:text-gray-200">
                &ldquo;{deletingSession.title}&rdquo;
              </strong>
              ? Nếu phiên có tin nhắn, nó sẽ được lưu trữ an toàn; nếu rỗng, phiên sẽ được xóa vĩnh viễn.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isSubmittingDelete}
                onClick={() => setDeletingSession(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmittingDelete}
                onClick={() => void handleConfirmDelete()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-1.5 disabled:opacity-60"
              >
                {isSubmittingDelete ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Xóa phiên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

