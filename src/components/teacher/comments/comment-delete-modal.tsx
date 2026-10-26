'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X, Trash2, MessageSquare, BookOpen } from 'lucide-react';
import { TeacherCommentItem } from '@/types/teacher-comment';
import { teacherCommentService, normalizeTeacherCommentError } from '@/services/teacher-comment.service';
import { toast } from '@/lib/toast';

interface CommentDeleteModalProps {
  comment: TeacherCommentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export function CommentDeleteModal({
  comment,
  isOpen,
  onClose,
  onSuccess,
}: CommentDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !comment) return null;

  const commentId = comment.id || comment._id;

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!commentId || loading) return;

    setLoading(true);
    setError(null);

    try {
      await teacherCommentService.deleteComment(commentId);
      toast.success('Đã gỡ bỏ bình luận thành công khỏi khóa học!');
      onSuccess(commentId);
      handleClose();
    } catch (err: unknown) {
      const msg = normalizeTeacherCommentError(err, 'Không thể gỡ bỏ bình luận. Vui lòng thử lại.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-delete-comment-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="teacher-delete-comment-modal-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Gỡ bỏ bình luận bài giảng
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Quyền quản trị giảng viên trong khóa học
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e849e] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Comment Snapshot Card */}
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
              <MessageSquare className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
              <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                Người viết: {comment.user?.username || 'Học viên ẩn danh'}
              </span>
            </div>

            <blockquote className="p-2.5 rounded-lg bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#1c192c] dark:text-[#f4eeff] italic line-clamp-3">
              &ldquo;{comment.content}&rdquo;
            </blockquote>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8e849e] dark:text-[#8d8299] pt-1">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
                {comment.course?.title || 'Khóa học'}
              </span>
              {comment.lesson?.title && (
                <>
                  <span>•</span>
                  <span>{comment.lesson.title}</span>
                </>
              )}
            </div>
          </div>

          {/* Impact Warning */}
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Lưu ý khi xóa bình luận:</p>
              <p className="leading-relaxed">
                Bình luận này sẽ bị gỡ vĩnh viễn khỏi khu vực thảo luận bài học của bạn. Toàn bộ các câu trả lời trực tiếp bên dưới cũng sẽ được hệ thống gỡ bỏ tương ứng.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận Gỡ bỏ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
