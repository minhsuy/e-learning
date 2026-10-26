'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { ApiChapterItem } from '@/types/chapter';
import { chapterService } from '@/services/chapter.service';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface ChapterDeleteModalProps {
  chapter: ApiChapterItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (chapterId: string) => void;
}

export function ChapterDeleteModal({
  chapter,
  isOpen,
  onClose,
  onDeleted,
}: ChapterDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !chapter) return null;

  const handleClose = () => {
    if (isDeleting) return;
    setErrorMsg(null);
    onClose();
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const chapterId = chapter.id || chapter._id;
      if (!chapterId) throw new Error('Không tìm thấy mã chương học');

      const res = await chapterService.deleteChapter(chapterId);
      toast.success(res?.message || `Đã xóa chương "${chapter.title}" thành công!`);
      onDeleted(chapterId);
      onClose();
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        setErrorMsg(err.message);
        toast.error(err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
        toast.error(err.message);
      } else {
        const fallback = 'Không thể xóa chương học. Vui lòng kiểm tra lại.';
        setErrorMsg(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const lessonCount = chapter.lessons?.length || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chapter-delete-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="chapter-delete-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Xóa chương học?
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Thao tác xóa mềm theo quy định hệ thống TMDEMY
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            aria-label="Đóng dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] border border-[#eceaf3] dark:border-[#3b334a]">
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">Chương học được chọn:</p>
            <p className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 mt-0.5">
              {chapter.title}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#635a72] dark:text-[#a9a0b2]">
              <span>Thứ tự: <strong className="text-[#1c192c] dark:text-[#f4eeff]">{chapter.order}</strong></span>
              <span>•</span>
              <span>Số bài học: <strong className="text-[#1c192c] dark:text-[#f4eeff]">{lessonCount} bài</strong></span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Bạn có chắc chắn muốn xóa chương học này? {lessonCount > 0 && (
                <strong>
                  Chương học này hiện có {lessonCount} bài học. Thao tác xóa sẽ tuân thủ nghiêm ngặt quy tắc nghiệp vụ của máy chủ.
                </strong>
              )}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
