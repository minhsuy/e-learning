'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { ApiQuizQuestion } from '@/types/quiz';
import { questionService } from '@/services/question.service';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface QuestionDeleteModalProps {
  question: ApiQuizQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (questionId: string) => void;
}

export function QuestionDeleteModal({
  question,
  isOpen,
  onClose,
  onDeleted,
}: QuestionDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !question) return null;

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
      const questionId = question.id || (question as { _id?: string })._id;
      if (!questionId) throw new Error('Không tìm thấy mã câu hỏi');

      const res = await questionService.deleteQuestion(questionId);
      toast.success(res?.message || 'Đã xóa câu hỏi thành công!');
      onDeleted(questionId);
      onClose();
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        setErrorMsg(err.message);
        toast.error(err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
        toast.error(err.message);
      } else {
        const fallback = 'Không thể xóa câu hỏi. Vui lòng thử lại sau.';
        setErrorMsg(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-delete-title"
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
                id="question-delete-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Xóa câu hỏi?
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                Hành động này sẽ gỡ bỏ câu hỏi khỏi bài kiểm tra.
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
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">Nội dung câu hỏi:</p>
            <p className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff] line-clamp-3 mt-1">
              {question.title}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#635a72] dark:text-[#a9a0b2]">
              <span>Điểm: <strong className="text-[#1c192c] dark:text-[#f4eeff]">{question.points || 10} điểm</strong></span>
              <span>•</span>
              <span>Loại: <strong className="text-[#1c192c] dark:text-[#f4eeff]">{question.type === 'fill_in_blank' ? 'Điền khuyết' : 'Trắc nghiệm'}</strong></span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Bạn có chắc chắn muốn xóa câu hỏi này không? Câu hỏi sẽ bị gỡ bỏ vĩnh viễn khỏi bài kiểm tra và không thể hoàn tác.
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
