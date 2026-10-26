'use client';

import React, { useState } from 'react';
import {
  X,
  FileQuestion,
  Edit,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Check,
} from 'lucide-react';
import { ApiQuizQuestion } from '@/types/quiz';
import { questionService } from '@/services/question.service';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface QuestionModalProps {
  quizId: string;
  quizTitle?: string;
  question: ApiQuizQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (question: ApiQuizQuestion) => void;
  suggestedIndex?: number;
}

interface QuestionFormContentProps {
  quizId: string;
  quizTitle?: string;
  question: ApiQuizQuestion | null;
  onClose: () => void;
  onSuccess: (question: ApiQuizQuestion) => void;
  suggestedIndex: number;
}

function QuestionFormContent({
  quizId,
  quizTitle,
  question,
  onClose,
  onSuccess,
  suggestedIndex,
}: QuestionFormContentProps) {
  const isEditing = Boolean(question);

  const initialType: 'multiple_choice' | 'fill_in_blank' =
    question?.type === 'fill_in_blank' ? 'fill_in_blank' : 'multiple_choice';

  const defaultOptions = ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'];
  const initialOptions =
    question?.options && question.options.length > 0 ? question.options : defaultOptions;

  const [type, setType] = useState<'multiple_choice' | 'fill_in_blank'>(initialType);
  const [title, setTitle] = useState(question?.title || '');
  const [points, setPoints] = useState<number>(question?.points || 1);
  const [options, setOptions] = useState<string[]>(initialOptions);
  const [selectedAnswer, setSelectedAnswer] = useState<string>(
    question?.answer || (initialType === 'multiple_choice' ? (initialOptions[0] || '') : '')
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    setValidationError(null);
    onClose();
  };

  // Multiple Choice Options Handlers
  const handleOptionChange = (idx: number, val: string) => {
    const oldVal = options[idx];
    const newOptions = [...options];
    newOptions[idx] = val;
    setOptions(newOptions);

    // If the changed option was the selected answer, update selectedAnswer
    if (selectedAnswer === oldVal) {
      setSelectedAnswer(val);
    }
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    const nextChar = String.fromCharCode(65 + options.length); // E, F, ...
    setOptions([...options, `Lựa chọn ${nextChar}`]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    const removedVal = options[idx];
    const newOptions = options.filter((_, i) => i !== idx);
    setOptions(newOptions);

    if (selectedAnswer === removedVal) {
      setSelectedAnswer(newOptions[0] || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    if (points < 1) {
      setValidationError('Điểm số của câu hỏi phải tối thiểu là 1 điểm.');
      return;
    }

    const finalAnswer = selectedAnswer.trim();
    let finalOptions: string[] | undefined = undefined;

    if (type === 'multiple_choice') {
      const cleanedOptions = options.map((opt) => opt.trim());
      if (cleanedOptions.some((opt) => !opt)) {
        setValidationError('Tất cả các lựa chọn đáp án không được để trống.');
        return;
      }

      if (cleanedOptions.length < 2) {
        setValidationError('Câu hỏi trắc nghiệm phải có tối thiểu 2 lựa chọn.');
        return;
      }

      if (!finalAnswer || !cleanedOptions.includes(finalAnswer)) {
        setValidationError('Vui lòng chọn 1 phương án làm đáp án chính xác.');
        return;
      }

      finalOptions = cleanedOptions;
    } else {
      // fill_in_blank
      if (!finalAnswer) {
        setValidationError('Vui lòng nhập từ hoặc cụm từ đáp án chính xác cần điền.');
        return;
      }
      finalOptions = [];
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      if (isEditing && question) {
        const questionId = question.id || question._id;
        if (!questionId) throw new Error('Không tìm thấy mã câu hỏi');

        const res = await questionService.updateQuestion(questionId, {
          title: trimmedTitle,
          type,
          points: Number(points),
          options: finalOptions,
          answer: finalAnswer,
        });

        const updated = res?.data || {
          ...question,
          title: trimmedTitle,
          type,
          points: Number(points),
          options: finalOptions,
          answer: finalAnswer,
        };

        toast.success('Đã cập nhật câu hỏi thành công!');
        onSuccess(updated);
        onClose();
      } else {
        const res = await questionService.createQuestion({
          quiz: quizId,
          type,
          title: trimmedTitle,
          points: Number(points),
          options: finalOptions,
          answer: finalAnswer,
        });

        toast.success('Đã thêm câu hỏi mới thành công!');
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
        const fallback = 'Đã có lỗi xảy ra khi lưu câu hỏi.';
        setValidationError(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-2xl rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-1 border-b border-[#eceaf3] dark:border-[#352e43]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            {isEditing ? <Edit className="w-5 h-5" /> : <FileQuestion className="w-5 h-5" />}
          </div>
          <div>
            <h2
              id="question-modal-title"
              className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
            >
              {isEditing ? `Chỉnh sửa câu hỏi (${suggestedIndex})` : `Thêm câu hỏi mới (Câu ${suggestedIndex})`}
            </h2>
            {quizTitle && (
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate max-w-sm mt-0.5">
                Bài kiểm tra: <span className="font-semibold">{quizTitle}</span>
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

        {/* Type & Points Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Question Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              Loại câu hỏi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('multiple_choice');
                  if (!options.includes(selectedAnswer) && options.length > 0) {
                    setSelectedAnswer(options[0]);
                  }
                }}
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'multiple_choice'
                    ? 'bg-[#7240b8] text-white border-[#7240b8] shadow-xs'
                    : 'bg-white dark:bg-[#252030] border-[#e2e0ea] dark:border-[#3d364b] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff]'
                }`}
              >
                <span>Trắc nghiệm</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('fill_in_blank');
                  if (!selectedAnswer && options.length > 0) {
                    setSelectedAnswer(options[0]);
                  }
                }}
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'fill_in_blank'
                    ? 'bg-[#7240b8] text-white border-[#7240b8] shadow-xs'
                    : 'bg-white dark:bg-[#252030] border-[#e2e0ea] dark:border-[#3d364b] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff]'
                }`}
              >
                <span>Điền từ khuyết</span>
              </button>
            </div>
          </div>

          {/* Points */}
          <div className="space-y-1.5">
            <label
              htmlFor="question-points-input"
              className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
            >
              Điểm số câu hỏi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="question-points-input"
                type="number"
                min="1"
                max="20"
                value={points}
                onChange={(e) => setPoints(Math.max(1, Number(e.target.value)))}
                disabled={isSubmitting}
                className="w-full h-10 px-3.5 pr-14 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                điểm
              </span>
            </div>
          </div>
        </div>

        {/* Question Title */}
        <div className="space-y-1.5">
          <label
            htmlFor="question-title-input"
            className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
          >
            Nội dung câu hỏi <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="question-title-input"
            rows={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Hàm Repository trong kiến trúc Clean Architecture của TMDEMY có đặc điểm gì?"
            required
            disabled={isSubmitting}
            className="w-full p-3.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-colors resize-none"
          />
        </div>

        {/* Multiple Choice Options Editor */}
        {type === 'multiple_choice' ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                  Các lựa chọn đáp án (Chọn 1 đáp án đúng) <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                  Click vào biểu tượng hình tròn để chọn đáp án làm câu trả lời chính xác.
                </p>
              </div>

              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm lựa chọn</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx); // A, B, C, D, ...
                const isCorrect = selectedAnswer === opt && Boolean(opt.trim());

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-[#e2e0ea] dark:border-[#3d364b] bg-[#fdf8ff] dark:bg-[#252030]'
                    }`}
                  >
                    {/* Select as Correct Answer Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedAnswer(opt)}
                      disabled={isSubmitting}
                      className={`p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
                        isCorrect
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={isCorrect ? 'Đáp án đúng' : 'Chọn làm đáp án đúng'}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>

                    <span className="w-6 text-xs font-bold font-mono text-[#7240b8] dark:text-[#a87ffb] shrink-0">
                      {label}.
                    </span>

                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Nhập phương án ${label}...`}
                      disabled={isSubmitting}
                      className="flex-1 h-8 px-2.5 bg-transparent border-0 text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] focus:outline-none"
                    />

                    {/* Delete Option (minimum 2 options) */}
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={isSubmitting}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                        title="Xóa lựa chọn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Fill in the blank Answer Input */
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="question-fillblank-input"
                className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Đáp án chính xác cần điền <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-[#7240b8] dark:text-[#a87ffb] font-medium">
                (Được điền từ đáp án trắc nghiệm)
              </span>
            </div>

            <input
              id="question-fillblank-input"
              type="text"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="VD: PostgreSQL 16"
              required
              disabled={isSubmitting}
              className="w-full h-10 px-3.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
            />

            {/* Quick Option Picker Chips from Multiple Choice Options */}
            {options.filter((opt) => opt && opt.trim()).length > 0 && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#635a72] dark:text-[#a9a0b2]">
                    Lấy nhanh đáp án từ phương án trắc nghiệm:
                  </span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400">
                    (Click để chọn)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {options
                    .filter((opt) => opt && opt.trim())
                    .map((opt, oIdx) => {
                      const label = String.fromCharCode(65 + oIdx);
                      const isSelected = selectedAnswer === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setSelectedAnswer(opt)}
                          disabled={isSubmitting}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
                            isSelected
                              ? 'bg-emerald-100 border border-emerald-400 text-emerald-900 dark:bg-emerald-950/80 dark:border-emerald-700 dark:text-emerald-200 font-semibold shadow-2xs'
                              : 'bg-[#f7f1ff] border border-[#e2e0ea] dark:bg-[#282234] dark:border-[#3d364b] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#ede5fa] dark:hover:bg-[#352c48]'
                          }`}
                          title={`Điền phương án ${label} (${opt}) vào đáp án`}
                        >
                          <span className="font-bold font-mono text-[#7240b8] dark:text-[#a87ffb]">
                            {label}:
                          </span>
                          <span className="truncate max-w-[180px]">{opt}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 stroke-[3]" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
              Hệ thống sẽ so khớp chính xác chuỗi ký tự mà học viên nhập vào để chấm điểm tự động.
            </p>
          </div>
        )}

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
              <span>{isEditing ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function QuestionModal({
  quizId,
  quizTitle,
  question,
  isOpen,
  onClose,
  onSuccess,
  suggestedIndex = 1,
}: QuestionModalProps) {
  if (!isOpen) return null;

  const key = question ? question.id || question._id || 'edit' : `new-${suggestedIndex}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <QuestionFormContent
        key={key}
        quizId={quizId}
        quizTitle={quizTitle}
        question={question}
        onClose={onClose}
        onSuccess={onSuccess}
        suggestedIndex={suggestedIndex}
      />
    </div>
  );
}
