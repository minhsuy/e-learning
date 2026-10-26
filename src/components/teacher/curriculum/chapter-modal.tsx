'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Edit, Loader2, AlertCircle } from 'lucide-react';
import { ApiChapterItem } from '@/types/chapter';
import { chapterService } from '@/services/chapter.service';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface ChapterModalProps {
  courseId: string;
  chapter: ApiChapterItem | null; // null means Creating new chapter
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suggestedOrder?: number;
}

interface ChapterFormContentProps {
  courseId: string;
  chapter: ApiChapterItem | null;
  onClose: () => void;
  onSuccess: () => void;
  suggestedOrder: number;
}

function ChapterFormContent({
  courseId,
  chapter,
  onClose,
  onSuccess,
  suggestedOrder,
}: ChapterFormContentProps) {
  const isEditing = Boolean(chapter);
  const [title, setTitle] = useState(chapter?.title || '');
  const [order, setOrder] = useState<number>(
    typeof chapter?.order === 'number' ? chapter.order : suggestedOrder
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    setValidationError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Vui lòng nhập tên chương học.');
      return;
    }

    if (trimmedTitle.length < 3) {
      setValidationError('Tên chương học phải có tối thiểu 3 ký tự.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      if (isEditing && chapter) {
        const chapterId = chapter.id || chapter._id;
        if (!chapterId) throw new Error('Không tìm thấy mã chương học');

        await chapterService.updateChapter(chapterId, {
          title: trimmedTitle,
          order: Number(order) || 0,
        });
        toast.success(`Đã cập nhật chương "${trimmedTitle}" thành công!`);
      } else {
        await chapterService.createChapter(courseId, {
          title: trimmedTitle,
          order: Number(order) || suggestedOrder,
        });
        toast.success(`Đã thêm chương mới "${trimmedTitle}" thành công!`);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        setValidationError(err.message);
        toast.error(err.message);
      } else if (err instanceof Error) {
        setValidationError(err.message);
        toast.error(err.message);
      } else {
        const fallback = 'Đã có lỗi xảy ra khi lưu chương học.';
        setValidationError(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-md rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            {isEditing ? <Edit className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
          </div>
          <div>
            <h2
              id="chapter-modal-title"
              className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
            >
              {isEditing ? 'Chỉnh sửa chương học' : 'Thêm chương học mới'}
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              {isEditing
                ? 'Cập nhật tiêu đề và thứ tự hiển thị của chương học'
                : 'Tạo một chương mới để nhóm các bài học'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
          aria-label="Đóng dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Validation Alert */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Title Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="chapter-title-input"
            className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
          >
            Tên chương học <span className="text-rose-500">*</span>
          </label>
          <input
            id="chapter-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Chương 1: Giới thiệu tổng quan hệ thống"
            required
            disabled={isSubmitting}
            className="w-full h-10 px-3.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-colors"
          />
          <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
            Tối thiểu 3 ký tự theo chuẩn hợp đồng API TMDEMY.
          </p>
        </div>

        {/* Order Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="chapter-order-input"
            className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
          >
            Thứ tự hiển thị
          </label>
          <input
            id="chapter-order-input"
            type="number"
            min="1"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            disabled={isSubmitting}
            className="w-full h-10 px-3.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-colors"
          />
          <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
            Số nguyên xác định vị trí xuất hiện của chương trong danh mục.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#7240b8] hover:bg-[#5e3299] text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>{isEditing ? 'Cập nhật chương' : 'Tạo chương học'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ChapterModal({
  courseId,
  chapter,
  isOpen,
  onClose,
  onSuccess,
  suggestedOrder = 1,
}: ChapterModalProps) {
  if (!isOpen) return null;

  const key = chapter ? chapter.id || chapter._id || 'edit' : `new-${suggestedOrder}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <ChapterFormContent
        key={key}
        courseId={courseId}
        chapter={chapter}
        onClose={onClose}
        onSuccess={onSuccess}
        suggestedOrder={suggestedOrder}
      />
    </div>
  );
}
