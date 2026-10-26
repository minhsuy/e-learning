'use client';

import React, { useState } from 'react';
import { X, HelpCircle, Edit, Loader2, AlertCircle, Clock, Award } from 'lucide-react';
import { ApiQuizDetail } from '@/types/quiz';
import { quizService } from '@/services/quiz.service';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface QuizModalProps {
  courseId?: string;
  lessonId: string;
  lessonTitle?: string;
  quiz: ApiQuizDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (quiz: ApiQuizDetail) => void;
}

interface QuizFormContentProps {
  courseId?: string;
  lessonId: string;
  lessonTitle?: string;
  quiz: ApiQuizDetail | null;
  onClose: () => void;
  onSuccess: (quiz: ApiQuizDetail) => void;
}

function QuizFormContent({
  courseId,
  lessonId,
  lessonTitle,
  quiz,
  onClose,
  onSuccess,
}: QuizFormContentProps) {
  const isEditing = Boolean(quiz);

  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [duration, setDuration] = useState<number>(
    typeof quiz?.duration === 'number' ? quiz.duration : 15
  );
  const [passingGrade, setPassingGrade] = useState<number>(
    typeof quiz?.passing_grade === 'number'
      ? quiz.passing_grade
      : typeof quiz?.passingGrade === 'number'
      ? quiz.passingGrade
      : 80
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
      setValidationError('Vui lòng nhập tiêu đề bài kiểm tra.');
      return;
    }

    if (duration < 1) {
      setValidationError('Thời lượng làm bài phải tối thiểu là 1 phút.');
      return;
    }

    if (passingGrade < 0 || passingGrade > 100) {
      setValidationError('Điểm đạt yêu cầu phải nằm trong khoảng từ 0% đến 100%.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      if (isEditing && quiz) {
        const quizId = quiz.id || quiz._id;
        if (!quizId) throw new Error('Không tìm thấy mã bài kiểm tra');

        const res = await quizService.updateQuiz(quizId, {
          title: trimmedTitle,
          description: description.trim() || undefined,
          duration: Number(duration),
          passing_grade: Number(passingGrade),
        });

        const updatedQuiz = res?.data || {
          ...quiz,
          title: trimmedTitle,
          description: description.trim(),
          duration: Number(duration),
          passing_grade: Number(passingGrade),
          passingGrade: Number(passingGrade),
        };

        toast.success(`Đã cập nhật bài kiểm tra "${trimmedTitle}" thành công!`);
        onSuccess(updatedQuiz);
        onClose();
      } else {
        if (!courseId) {
          setValidationError('Thiếu mã khóa học liên kết (courseId).');
          setIsSubmitting(false);
          return;
        }

        const res = await quizService.createQuiz({
          title: trimmedTitle,
          lesson: lessonId,
          courseId: courseId,
          description: description.trim() || undefined,
          duration: Number(duration),
          passing_grade: Number(passingGrade),
        });

        toast.success(`Đã tạo bài kiểm tra "${trimmedTitle}" thành công!`);
        if (res?.data) {
          onSuccess(res.data);
        }
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        setValidationError(err.message);
        toast.error(err.message);
      } else if (err instanceof Error) {
        setValidationError(err.message);
        toast.error(err.message);
      } else {
        const fallback = 'Đã có lỗi xảy ra khi lưu bài kiểm tra.';
        setValidationError(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-lg rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-1 border-b border-[#eceaf3] dark:border-[#352e43]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            {isEditing ? <Edit className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </div>
          <div>
            <h2
              id="quiz-modal-title"
              className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
            >
              {isEditing ? 'Cài đặt bài kiểm tra (Quiz)' : 'Tạo bài kiểm tra mới (Quiz)'}
            </h2>
            {lessonTitle && (
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate max-w-sm mt-0.5">
                Bài học: <span className="font-semibold">{lessonTitle}</span>
              </p>
            )}
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
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Title Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="quiz-title-input"
            className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
          >
            Tiêu đề bài kiểm tra <span className="text-rose-500">*</span>
          </label>
          <input
            id="quiz-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Kiểm tra trắc nghiệm củng cố kiến thức Chương 1"
            required
            disabled={isSubmitting}
            className="w-full h-10 px-3.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-colors"
          />
        </div>

        {/* Duration & Passing Grade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Duration */}
          <div className="space-y-1.5">
            <label
              htmlFor="quiz-duration-input"
              className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
              <span>Thời lượng làm bài</span>
            </label>
            <div className="relative">
              <input
                id="quiz-duration-input"
                type="number"
                min="1"
                max="180"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                disabled={isSubmitting}
                className="w-full h-10 px-3.5 pr-14 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                phút
              </span>
            </div>
            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
              Hệ thống tự động đếm ngược khi học viên bắt đầu làm bài.
            </p>
          </div>

          {/* Passing Grade */}
          <div className="space-y-1.5">
            <label
              htmlFor="quiz-passinggrade-input"
              className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Điểm đạt (Passing Grade)</span>
            </label>
            <div className="relative">
              <input
                id="quiz-passinggrade-input"
                type="number"
                min="0"
                max="100"
                value={passingGrade}
                onChange={(e) => setPassingGrade(Math.max(0, Math.min(100, Number(e.target.value))))}
                disabled={isSubmitting}
                className="w-full h-10 px-3.5 pr-10 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#635a72] dark:text-[#a9a0b2] font-semibold">
                %
              </span>
            </div>
            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
              Tỷ lệ phần trăm tối thiểu để vượt qua bài kiểm tra.
            </p>
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="quiz-description-input"
            className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
          >
            Mô tả hướng dẫn
          </label>
          <textarea
            id="quiz-description-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Hướng dẫn học viên về nội dung, số câu hỏi hoặc lưu ý làm bài..."
            disabled={isSubmitting}
            className="w-full p-3 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-colors resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eceaf3] dark:border-[#352e43]">
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
              <span>{isEditing ? 'Cập nhật Quiz' : 'Tạo bài kiểm tra'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function QuizModal({
  courseId,
  lessonId,
  lessonTitle,
  quiz,
  isOpen,
  onClose,
  onSuccess,
}: QuizModalProps) {
  if (!isOpen) return null;

  const key = quiz ? quiz.id || quiz._id || 'edit' : `new-${lessonId}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <QuizFormContent
        key={key}
        courseId={courseId}
        lessonId={lessonId}
        lessonTitle={lessonTitle}
        quiz={quiz}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
}
