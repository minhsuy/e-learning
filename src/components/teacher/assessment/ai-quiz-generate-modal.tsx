'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Check,
  RotateCcw,
  Save,
  BookOpen,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  AiAssessmentDifficulty,
  AiQuizPreviewQuestion,
  AiQuizPreviewResponseData,
  AiQuizPersistResponseData,
} from '@/types/ai-assessment';
import { ApiQuizDetail } from '@/types/quiz';
import { ApiLessonItem } from '@/types/lesson';
import { aiAssessmentService } from '@/services/ai-assessment.service';

import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface AiQuizGenerateModalProps {
  courseId?: string;
  lesson: ApiLessonItem;
  existingQuiz?: ApiQuizDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (quiz: ApiQuizDetail) => void;
}

export function AiQuizGenerateModal({
  courseId,
  lesson,
  existingQuiz,
  isOpen,
  onClose,
  onSuccess,
}: AiQuizGenerateModalProps) {
  if (!isOpen) return null;

  return (
    <AiQuizGenerateContent
      courseId={courseId}
      lesson={lesson}
      existingQuiz={existingQuiz}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

interface AiQuizGenerateContentProps {
  courseId?: string;
  lesson: ApiLessonItem;
  existingQuiz?: ApiQuizDetail | null;
  onClose: () => void;
  onSuccess: (quiz: ApiQuizDetail) => void;
}

type StepMode = 'form' | 'loading' | 'preview';

function AiQuizGenerateContent({
  lesson,
  existingQuiz,
  onClose,
  onSuccess,
}: AiQuizGenerateContentProps) {
  const lessonId = lesson.id || (lesson as { _id?: string })._id || '';

  // Form states

  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<AiAssessmentDifficulty>('MEDIUM');
  const [teacherInstructions, setTeacherInstructions] = useState<string>('');
  const [confirmOverwrite, setConfirmOverwrite] = useState<boolean>(false);

  // Workflow states
  const [step, setStep] = useState<StepMode>('form');
  const [loadingMessage, setLoadingMessage] = useState<string>(
    'Đang phân tích transcript bài học và sinh câu hỏi trắc nghiệm...'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview data
  const [previewData, setPreviewData] = useState<AiQuizPreviewResponseData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasExistingQuiz = Boolean(existingQuiz);

  const handleGenerate = async (previewOnly: boolean) => {
    setErrorMessage(null);
    setStep('loading');
    setLoadingMessage(
      previewOnly
        ? 'AI đang phân tích bài học và tạo bản xem trước câu hỏi...'
        : 'AI đang phân tích bài học, sinh câu hỏi và lưu trực tiếp vào cơ sở dữ liệu...'
    );

    try {
      const response = await aiAssessmentService.generateAiQuiz(lessonId, {
        questionCount,
        difficulty,
        teacherInstructions: teacherInstructions.trim() || undefined,
        previewOnly,
        confirmOverwrite: hasExistingQuiz ? confirmOverwrite : false,

      });

      if (!response.success && !response.data) {
        throw new Error(response.message || 'Không nhận được dữ liệu từ hệ thống AI');
      }

      if (previewOnly) {
        const preview = response.data as AiQuizPreviewResponseData;
        setPreviewData(preview);
        setStep('preview');
        toast.success('Đã sinh bản xem trước câu hỏi AI thành công!');
      } else {
        // Persisted directly
        const persisted = response.data as AiQuizPersistResponseData;
        toast.success('Đã sinh và lưu bài Quiz AI thành công!');

        // Convert to standard ApiQuizDetail format
        const formattedQuiz: ApiQuizDetail = {
          id: persisted.id,
          lessonId: persisted.lessonId,
          title: persisted.title,
          questions: persisted.questions.map((q) => ({
            id: q.id,
            quizId: q.quizId,
            type: 'multiple_choice',
            title: q.title,
            answer: q.answer,
            options: q.options.map((opt) => opt.title),
          })),
          createdAt: persisted.createdAt,
          updatedAt: persisted.updatedAt,
        };

        onSuccess(formattedQuiz);
        onClose();
      }
    } catch (err: unknown) {
      setStep('form');
      if (err instanceof AppApiError) {
        if (err.statusCode === 400) {
          setErrorMessage(
            'Bài học chưa có nội dung phụ đề/transcript (độ dài tối thiểu 50 ký tự). Vui lòng thêm phụ đề cho bài học này trước khi sinh bài đánh giá.'
          );
        } else if (err.statusCode === 409) {
          if (err.message.includes('nộp bài') || err.message.includes('submission')) {
            setErrorMessage(
              'Bài học đã có Quiz và đã có học viên nộp bài. Hệ thống khóa ghi đè để bảo vệ kết quả học tập của học viên.'
            );
          } else {
            setErrorMessage(
              'Bài học đã có Quiz trước đó. Vui lòng tích chọn "Xác nhận ghi đè Quiz hiện tại" để tiếp tục.'
            );
          }
        } else if (err.statusCode === 403) {
          setErrorMessage('Bạn không có quyền giảng viên hoặc không phải chủ sở hữu khóa học này.');
        } else if (err.statusCode === 502 || err.statusCode === 504) {
          setErrorMessage(
            'Dịch vụ AI Assessment đang bận hoặc hết thời gian phản hồi (Timeout). Vui lòng thử lại sau.'
          );
        } else {
          setErrorMessage(err.message || 'Đã có lỗi xảy ra khi tạo Quiz với AI.');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ AI. Vui lòng thử lại.');
      }
    }
  };

  /**
   * Persists the EXACT approved previewed questions using the atomic batch save-approved API.
   * Guarantees 100% preview-persist consistency in a single transaction without silent regeneration or partial writes.
   */
  const handleSaveApprovedPreview = async () => {
    if (!previewData || !previewData.questions || previewData.questions.length === 0) {
      toast.error('Không có nội dung câu hỏi để lưu.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (hasExistingQuiz && !confirmOverwrite) {
        setErrorMessage('Bài học đã có Quiz trước đó. Vui lòng tích chọn "Xác nhận ghi đè Quiz hiện tại" để tiếp tục.');
        setIsSaving(false);
        return;
      }

      // Format questions for atomic persistence
      const questionsToSave = previewData.questions.map((q) => ({
        question: q.question,
        type: q.type || 'SINGLE_CHOICE',
        difficulty: q.difficulty,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        sourceTimestamp: q.sourceTimestamp,
      }));

      const res = await aiAssessmentService.saveApprovedQuiz(lessonId, {
        title: previewData.title || `Quiz - ${lesson.title}`,
        difficulty: previewData.difficulty,
        confirmOverwrite: hasExistingQuiz ? confirmOverwrite : false,
        questions: questionsToSave,
      });

      if (!res.data) {
        throw new Error('Không nhận được dữ liệu Quiz đã lưu từ máy chủ.');
      }

      const persisted = res.data;
      const formattedQuiz: ApiQuizDetail = {
        id: persisted.id,
        lessonId: persisted.lessonId,
        title: persisted.title,
        questions: (persisted.questions || []).map((q) => ({
          id: q.id,
          quizId: q.quizId,
          type: 'multiple_choice',
          title: q.title,
          answer: q.answer,
          options: (q.options || []).map((opt) => opt.title),
        })),
        createdAt: persisted.createdAt,
        updatedAt: persisted.updatedAt,
      };

      toast.success(
        `Đã lưu thành công ${formattedQuiz.questions?.length || 0} câu hỏi xem trước vào Quiz (Atomic Batch)!`
      );
      onSuccess(formattedQuiz);
      onClose();
    } catch (saveErr: unknown) {
      if (saveErr instanceof AppApiError) {
        if (saveErr.statusCode === 409) {
          if (saveErr.message.includes('nộp bài') || saveErr.message.includes('submission')) {
            setErrorMessage(
              'Không thể ghi đè vì bài Quiz hiện tại đã có học viên nộp bài! Hệ thống khóa ghi đè để bảo vệ kết quả học tập.'
            );
          } else {
            setErrorMessage(
              'Bài học đã có Quiz trước đó. Vui lòng tích chọn "Xác nhận ghi đè Quiz hiện tại" để tiếp tục.'
            );
          }
        } else {
          setErrorMessage(saveErr.message || 'Không thể lưu câu hỏi vào cơ sở dữ liệu.');
        }
      } else if (saveErr instanceof Error) {
        setErrorMessage(saveErr.message);
      } else {
        setErrorMessage('Không thể lưu câu hỏi vào cơ sở dữ liệu. Vui lòng thử lại.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-quiz-modal-title"
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#eceaf3] dark:border-[#352e43] bg-[#f7f1ff]/50 dark:bg-[#252030]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[#7240b8] to-[#9b6ef3] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2
                id="ai-quiz-modal-title"
                className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-2"
              >
                <span>Sinh Quiz bằng AI</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                  Gemini 3.1 Flash-Lite
                </span>
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate max-w-md sm:max-w-lg">
                Bài học: <span className="font-semibold text-slate-700 dark:text-slate-200">{lesson.title}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={step === 'loading' || isSaving}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Global Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Lỗi xử lý yêu cầu:</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: CONFIGURATION FORM */}
          {step === 'form' && (
            <div className="space-y-5">
              {/* Existing Quiz Conflict Warning */}
              {hasExistingQuiz && (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-2">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Cảnh báo: Bài học đã có bài Quiz</p>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        Bài Quiz hiện tại có {existingQuiz?.questions?.length || 0} câu hỏi. Nếu tiếp tục sinh và lưu bài mới, bài Quiz cũ sẽ bị thay thế.
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 italic">
                        * Chú ý: Nếu bài Quiz đã có học viên làm bài, hệ thống sẽ tự động chặn ghi đè (409 Conflict) để bảo vệ điểm số của học viên.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 pt-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmOverwrite}
                      onChange={(e) => setConfirmOverwrite(e.target.checked)}
                      className="w-4 h-4 rounded text-[#7240b8] border-amber-400 focus:ring-[#7240b8]"
                    />
      
                    <span className="text-xs font-semibold text-amber-950 dark:text-amber-100">
                      Tôi xác nhận muốn ghi đè bài Quiz hiện tại (nếu chưa có học viên nộp bài)
                    </span>
                  </label>
                </div>
              )}








              {/* Question Count Selection */}
              <div>
                <label className="block text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Số lượng câu hỏi cần sinh (1 – 20)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[3, 5, 8, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        questionCount === num
                          ? 'bg-[#7240b8] text-white border-[#7240b8] shadow-xs'
                          : 'bg-white dark:bg-[#252030] text-slate-700 dark:text-slate-200 border-[#eceaf3] dark:border-[#352e43] hover:border-violet-300'
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-slate-500">Tùy chỉnh:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={questionCount}
                      onChange={(e) =>
                        setQuestionCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))
                      }
                      className="w-16 px-2.5 py-1 text-center text-xs font-bold rounded-lg border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] text-[#1c192c] dark:text-[#f4eeff]"
                    />
      
                  </div>
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="block text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Độ khó câu hỏi
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: 'EASY',
                      label: 'Dễ (EASY)',
                      desc: 'Câu hỏi nhận biết, tái hiện khái niệm cơ bản',
                      border: 'border-emerald-300 dark:border-emerald-800',
                      bg: 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
                    },
                    {
                      id: 'MEDIUM',
                      label: 'Trung bình (MEDIUM)',
                      desc: 'Câu hỏi thông hiểu, phân tích tình huống thực tế',
                      border: 'border-violet-300 dark:border-violet-800',
                      bg: 'bg-violet-50/60 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300',
                    },
                    {
                      id: 'HARD',
                      label: 'Khó (HARD)',
                      desc: 'Câu hỏi vận dụng cao, so sánh & bẫy phổ biến',
                      border: 'border-amber-300 dark:border-amber-800',
                      bg: 'bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
                    },
                  ].map((lvl) => {
                    const isSelected = difficulty === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setDifficulty(lvl.id as AiAssessmentDifficulty)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          isSelected
                            ? `${lvl.border} ${lvl.bg} ring-2 ring-[#7240b8] shadow-xs`
                            : 'border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] hover:bg-slate-50 dark:hover:bg-[#2d263a]'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff]">
                          {lvl.label}
                        </div>
                        <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-1 leading-snug">
                          {lvl.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teacher Instructions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Chỉ dẫn bổ sung cho AI (Tùy chọn)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {teacherInstructions.length}/500 ký tự
                  </span>
                </div>
                <textarea
                  value={teacherInstructions}
                  maxLength={500}
                  onChange={(e) => setTeacherInstructions(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Tập trung vào kiến thức HTTP verbs, phân biệt POST vs PUT, status codes 200 vs 201..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]"
                />
              </div>

              {/* Informational Guidance */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#252030] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb] shrink-0" />
                <span>
                  Hệ thống AI sẽ tự động đọc transcript chuẩn xác của bài học để tạo câu hỏi trắc nghiệm khách quan với 4 phương án lựa chọn và 1 đáp án chính xác duy nhất.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: LOADING STATE */}
          {step === 'loading' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-900/50 animate-ping opacity-40" />
                <div className="w-16 h-16 rounded-full border-4 border-t-[#7240b8] border-r-[#7240b8] border-b-transparent border-l-transparent animate-spin flex items-center justify-center bg-violet-50 dark:bg-[#282234]">
                  <Sparkles className="w-7 h-7 text-[#7240b8] dark:text-[#a87ffb]" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Đang khởi tạo câu hỏi với AI
                </h3>
                <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto">
                  {loadingMessage}
                </p>
                <p className="text-[11px] text-slate-400 pt-2 italic">
                  Quá trình này có thể mất từ 5 – 15 giây tùy thuộc độ dài transcript của bài học.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & REVIEW STATE */}
          {step === 'preview' && previewData && (
            <div className="space-y-5">
              {/* Preview Header Summary */}
              <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50/70 dark:bg-violet-950/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7240b8] dark:text-[#a87ffb]">
                      Bản xem trước câu hỏi
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#1d1926] text-slate-700 dark:text-slate-200 border border-violet-200 dark:border-violet-800">
                      {previewData.questions.length} câu hỏi
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {previewData.difficulty}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mt-1">
                    {previewData.title}
                  </h3>
                  {previewData.description && (
                    <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                      {previewData.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#252030] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cấu hình lại</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {previewData.questions.map((q: AiQuizPreviewQuestion, qIdx: number) => {
                  return (
                    <div
                      key={qIdx}
                      className="p-4 sm:p-5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] shadow-xs space-y-3"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#f7f1ff] dark:bg-[#2e263d] text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {qIdx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] leading-relaxed">
                              {q.question}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {q.type || 'SINGLE_CHOICE'}
                              </span>
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                                {q.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const optionLetter = ['A', 'B', 'C', 'D'][oIdx] || opt.id || `${oIdx + 1}`;
                          const isCorrect = opt.isCorrect;

                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-colors ${
                                isCorrect
                                  ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold'
                                  : 'border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {optionLetter}
                              </span>
                              <span className="flex-1 truncate">{opt.text}</span>
                              {isCorrect && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase shrink-0">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Đúng</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3 rounded-lg border border-violet-100 dark:border-violet-900/40 bg-violet-50/40 dark:bg-[#201a2c] text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                              Giải thích chi tiết:{' '}
                            </span>
                            <span>{q.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#eceaf3] dark:border-[#352e43] bg-[#fdf8ff] dark:bg-[#201a2c] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={step === 'loading' || isSaving}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {step === 'form' && (
              <>
                <button
                  type="button"
                  onClick={() => handleGenerate(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-300 dark:border-violet-700 bg-white dark:bg-[#252030] text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold hover:bg-violet-50 dark:hover:bg-[#2d243c] transition-colors shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Xem trước (Preview)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerate(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-[#7240b8] to-[#8d54e8] hover:from-[#6232a5] hover:to-[#7c44d7] text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Sinh & Lưu trực tiếp</span>
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={() => handleGenerate(true)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sinh lại bản khác</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveApprovedPreview}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu câu hỏi...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu chính xác nội dung này vào Quiz</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
