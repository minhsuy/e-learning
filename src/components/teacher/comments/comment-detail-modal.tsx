'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  MessageSquare,
  User,
  BookOpen,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  Trash2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { TeacherCommentItem } from '@/types/teacher-comment';

interface CommentDetailModalProps {
  comment: TeacherCommentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDeleteModal?: (comment: TeacherCommentItem) => void;
}

export function CommentDetailModal({
  comment,
  isOpen,
  onClose,
  onOpenDeleteModal,
}: CommentDetailModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !comment) return null;

  const isReply = !!comment.parentId;
  const likesCount = comment.likes?.length || 0;
  const dislikesCount = comment.dislikes?.length || 0;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-comment-detail-modal-title"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="teacher-comment-detail-modal-title"
                  className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
                >
                  Chi tiết bình luận bài học
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-3 h-3" /> Đã hiển thị
                </span>
                {isReply && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    <CornerDownRight className="w-3 h-3" /> Trả lời
                  </span>
                )}
              </div>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Mã bình luận: <span className="font-mono">{comment.id || comment._id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e849e] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
          {/* Full Content Block */}
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
              <span className="font-semibold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                Nội dung trao đổi của học viên
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{likesCount}</span>
                </span>
                <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{dislikesCount}</span>
                </span>
              </div>
            </div>

            <p className="text-sm text-[#1c192c] dark:text-[#f4eeff] leading-relaxed whitespace-pre-wrap pt-1">
              {comment.content}
            </p>
          </div>

          {/* Grid: Author & Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Author Box */}
            <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-2 pb-1.5 border-b border-[#f1ebff] dark:border-[#2b2438]">
                <User className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>Người viết bình luận</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438]">
                  {comment.user?.avatar ? (
                    <Image
                      src={comment.user.avatar}
                      alt={comment.user.username || 'User'}
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#7240b8] dark:text-[#a87ffb]">
                      {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-[#1c192c] dark:text-[#f4eeff] truncate">
                    {comment.user?.username || 'Học viên'}
                  </h4>
                  <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] font-mono truncate">
                    Mã học viên: {comment.user?.id || comment.user?._id || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Course & Lesson Box */}
            <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-2 pb-1.5 border-b border-[#f1ebff] dark:border-[#2b2438]">
                <BookOpen className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>Ngữ cảnh học tập</span>
              </div>

              <div className="space-y-1.5">
                <div>
                  <span className="text-[#8e849e] dark:text-[#8d8299]">Khóa học:</span>{' '}
                  <strong className="text-[#1c192c] dark:text-[#f4eeff]">
                    {comment.course?.title || 'Khóa học của bạn'}
                  </strong>
                </div>
                {comment.lesson?.title && (
                  <div>
                    <span className="text-[#8e849e] dark:text-[#8d8299]">Bài học:</span>{' '}
                    <span className="text-[#1c192c] dark:text-[#f4eeff] font-medium">
                      {comment.lesson.title}
                    </span>
                  </div>
                )}
                {comment.course?.slug && (
                  <div className="pt-0.5">
                    <a
                      href={`/courses/${comment.course.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#7240b8] dark:text-[#a87ffb] hover:underline"
                    >
                      <span>Xem trang khóa học</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hierarchy & Thread Details */}
          {isReply && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
              <CornerDownRight className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Bình luận phản hồi (Reply):</p>
                <p className="leading-relaxed">
                  Bình luận này là câu trả lời thuộc chuỗi thảo luận gốc (Parent ID:{' '}
                  <span className="font-mono font-medium">{comment.parentId}</span>, Cấp độ: {comment.level || 1}).
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8e849e] dark:text-[#8d8299] pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Đăng lúc: {formatDate(comment.createdAt)}</span>
            </div>
            {comment.updatedAt && (
              <div className="flex items-center gap-1.5">
                <span>Cập nhật: {formatDate(comment.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div>
            {onOpenDeleteModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDeleteModal(comment);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Gỡ bỏ bình luận</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
