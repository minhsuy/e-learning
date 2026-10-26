'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  MessageSquare,
  Eye,
  Trash2,
  CheckCircle2,
  CornerDownRight,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { TeacherCommentItem } from '@/types/teacher-comment';
import { toast } from '@/lib/toast';

interface CommentTableProps {
  comments: TeacherCommentItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewDetail: (comment: TeacherCommentItem) => void;
  onDelete: (comment: TeacherCommentItem) => void;
  hasFilters: boolean;
  onResetFilters: () => void;
}

export function CommentTable({
  comments,
  loading,
  error,
  onRetry,
  onViewDetail,
  onDelete,
  hasFilters,
  onResetFilters,
}: CommentTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Đã sao chép mã bình luận!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // 1. Error State
  if (error) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-[#1d1926] border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h4 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Không thể tải danh sách bình luận
          </h4>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
            {error}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#7240b8] text-white hover:bg-[#5d3299] shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (loading && comments.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] overflow-hidden shadow-xs">
        {/* Desktop skeleton */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-[#fdf8ff] dark:bg-[#17141f] border-b border-[#f1ebff] dark:border-[#2b2438]">
            <div className="col-span-4 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-2 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-3 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-2 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-1 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
          </div>

          <div className="divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
                <div className="col-span-4 space-y-1.5">
                  <div className="h-4 w-3/4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  <div className="h-3 w-1/2 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse" />
                  <div className="h-4 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-3 space-y-1">
                  <div className="h-4 w-28 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  <div className="h-3 w-36 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-2 space-y-1">
                  <div className="h-4 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  <div className="h-3 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-1 flex justify-end gap-1.5">
                  <div className="w-8 h-8 bg-[#f1ebff] dark:bg-[#2b2438] rounded-lg animate-pulse" />
                  <div className="w-8 h-8 bg-[#f1ebff] dark:bg-[#2b2438] rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile skeleton */}
        <div className="lg:hidden p-4 space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#f1ebff] dark:border-[#2b2438] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                <div className="h-4 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
              </div>
              <div className="h-3.5 w-full bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
              <div className="h-3.5 w-3/4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (comments.length === 0) {
    return (
      <div className="p-8 sm:p-14 text-center rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mx-auto">
          <MessageSquare className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h4 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            {hasFilters
              ? 'Không tìm thấy bình luận nào phù hợp'
              : 'Chưa có bình luận nào trong các khóa học của bạn'}
          </h4>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
            {hasFilters
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn khóa học khác để xem bình luận.'
              : 'Bình luận trao đổi của học viên trong các bài học do bạn phụ trách sẽ xuất hiện tại đây.'}
          </p>
        </div>

        {hasFilters && (
          <div>
            <button
              onClick={onResetFilters}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#7240b8]/30 text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 4. Data State
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] overflow-hidden shadow-xs">
      {/* ================= DESKTOP TABLE VIEW (>= 1024px) ================= */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fdf8ff] dark:bg-[#17141f] border-b border-[#f1ebff] dark:border-[#2b2438] text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider">
              <th className="py-3.5 px-4">Nội dung bình luận</th>
              <th className="py-3.5 px-4">Học viên</th>
              <th className="py-3.5 px-4">Bài học & Khóa học</th>
              <th className="py-3.5 px-4">Phân loại & Tương tác</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4">Ngày đăng</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1ebff] dark:divide-[#2b2438] text-xs">
            {comments.map((comment) => {
              const commentId = comment.id || comment._id || '';
              const isReply = !!comment.parentId;
              const isCopied = copiedId === commentId;
              const likesCount = comment.likes?.length || 0;
              const dislikesCount = comment.dislikes?.length || 0;

              return (
                <tr
                  key={commentId}
                  onClick={() => onViewDetail(comment)}
                  className="hover:bg-[#fcfaff] dark:hover:bg-[#231e2e] transition-colors cursor-pointer group"
                >
                  {/* Nội dung bình luận */}
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <div className="space-y-1">
                      <p className="font-medium text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 leading-relaxed">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8e849e] dark:text-[#8d8299] font-mono">
                        <span>ID: {commentId.slice(-8)}</span>
                        <button
                          onClick={(e) => handleCopyId(commentId, e)}
                          className="hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors p-0.5 rounded cursor-pointer"
                          title="Sao chép ID"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Người viết */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438]">
                        {comment.user?.avatar ? (
                          <Image
                            src={comment.user.avatar}
                            alt={comment.user.username || 'User'}
                            fill
                            className="object-cover"
                            sizes="28px"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-[#7240b8] dark:text-[#a87ffb]">
                            {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff] block truncate max-w-[140px]">
                          {comment.user?.username || 'Học viên'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Bài học & Khóa học */}
                  <td className="py-3.5 px-4 max-w-[220px]">
                    <div className="space-y-0.5">
                      <p className="font-medium text-[#1c192c] dark:text-[#f4eeff] truncate">
                        {comment.lesson?.title || 'Bài học'}
                      </p>
                      <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] truncate flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb] shrink-0" />
                        <span>{comment.course?.title || 'Khóa học'}</span>
                      </p>
                    </div>
                  </td>

                  {/* Phân loại & Tương tác */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div>
                        {isReply ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            <CornerDownRight className="w-3 h-3" /> Trả lời
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                            <MessageSquare className="w-3 h-3" /> Bình luận gốc
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#8e849e] dark:text-[#8d8299]">
                        <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                          <ThumbsUp className="w-3 h-3" /> {likesCount}
                        </span>
                        <span className="flex items-center gap-0.5 text-rose-500 dark:text-rose-400">
                          <ThumbsDown className="w-3 h-3" /> {dislikesCount}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> Đã hiển thị
                    </span>
                  </td>

                  {/* Ngày đăng */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#8e849e] dark:text-[#8d8299]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(comment.createdAt)}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onViewDetail(comment)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#635a72] dark:text-[#a9a0b2] hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer"
                        title="Xem chi tiết bình luận"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDelete(comment)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Gỡ bỏ bình luận"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE / TABLET CARD VIEW (< 1024px) ================= */}
      <div className="lg:hidden divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
        {comments.map((comment) => {
          const commentId = comment.id || comment._id || '';
          const isReply = !!comment.parentId;
          const likesCount = comment.likes?.length || 0;
          const dislikesCount = comment.dislikes?.length || 0;

          return (
            <div
              key={commentId}
              onClick={() => onViewDetail(comment)}
              className="p-4 space-y-3 hover:bg-[#fcfaff] dark:hover:bg-[#231e2e] transition-colors cursor-pointer"
            >
              {/* Row 1: Author, Status & Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6 rounded-full overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438]">
                    {comment.user?.avatar ? (
                      <Image
                        src={comment.user.avatar}
                        alt={comment.user.username || 'User'}
                        fill
                        className="object-cover"
                        sizes="24px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[9px] text-[#7240b8] dark:text-[#a87ffb]">
                        {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <strong className="text-xs text-[#1c192c] dark:text-[#f4eeff]">
                    {comment.user?.username || 'Học viên'}
                  </strong>
                </div>

                <div className="flex items-center gap-1.5">
                  {isReply ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      <CornerDownRight className="w-3 h-3" /> Trả lời
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                      <MessageSquare className="w-3 h-3" /> Gốc
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> Đã hiển thị
                  </span>
                </div>
              </div>

              {/* Row 2: Content */}
              <p className="text-xs text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 leading-relaxed">
                {comment.content}
              </p>

              {/* Row 3: Context & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#f1ebff] dark:border-[#2b2438] text-[11px] text-[#8e849e] dark:text-[#8d8299]">
                <div className="flex items-center gap-3">
                  <span>{formatDate(comment.createdAt)}</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ThumbsUp className="w-3 h-3" /> {likesCount}
                  </span>
                  <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                    <ThumbsDown className="w-3 h-3" /> {dislikesCount}
                  </span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onViewDetail(comment)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] border border-[#f1ebff] dark:border-[#2b2438] cursor-pointer"
                  >
                    Chi tiết
                  </button>

                  <button
                    onClick={() => onDelete(comment)}
                    className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                    title="Gỡ bỏ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
