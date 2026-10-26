'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Settings,
  Trash2,
  Edit2,
  Clock,
  Award,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  Check,
  RefreshCw,
  FileQuestion,
} from 'lucide-react';
import { ApiQuizDetail, ApiQuizQuestion } from '@/types/quiz';
import { quizService } from '@/services/quiz.service';
import { toast } from '@/lib/toast';
import { QuizModal } from './quiz-modal';
import { QuizDeleteModal } from './quiz-delete-modal';
import { QuestionModal } from './question-modal';
import { QuestionDeleteModal } from './question-delete-modal';

interface QuizStudioModalProps {
  courseId?: string;
  quiz: ApiQuizDetail | null;
  lessonId: string;
  lessonTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onQuizUpdated: (updatedQuiz: ApiQuizDetail) => void;
  onQuizDeleted: (quizId: string) => void;
}

export function QuizStudioModal(props: QuizStudioModalProps) {
  if (!props.isOpen || !props.quiz) return null;
  const quizKey = props.quiz.id || (props.quiz as { _id?: string })._id || 'studio';
  return <QuizStudioContent key={quizKey} {...props} quiz={props.quiz} />;
}

interface QuizStudioContentProps extends QuizStudioModalProps {
  quiz: ApiQuizDetail;
}

const getStoredAnswers = (qId: string): Record<string, string> => {
  if (typeof window === 'undefined' || !qId) return {};
  try {
    const saved = localStorage.getItem(`tmdemy_answers_${qId}`);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const setStoredAnswers = (qId: string, map: Record<string, string>) => {
  if (typeof window === 'undefined' || !qId) return;
  try {
    localStorage.setItem(`tmdemy_answers_${qId}`, JSON.stringify(map));
  } catch {}
};

function QuizStudioContent({
  courseId,
  quiz: initialQuiz,
  lessonId,
  lessonTitle,
  onClose,
  onQuizUpdated,
  onQuizDeleted,
}: QuizStudioContentProps) {
  const quizId = initialQuiz.id || (initialQuiz as { _id?: string })._id || '';

  const [knownAnswers, setKnownAnswers] = useState<Record<string, string>>(() =>
    getStoredAnswers(quizId)
  );

  const [currentQuiz, setCurrentQuiz] = useState<ApiQuizDetail>(() => {
    const answers = getStoredAnswers(quizId);
    const mergedQuestions = (initialQuiz.questions || []).map((q) => {
      const id = q.id || (q as { _id?: string })._id;
      const ans = (id && answers[id]) || q.answer;
      return { ...q, answer: ans };
    });
    return { ...initialQuiz, questions: mergedQuestions };
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sub-modal states
  const [isEditQuizOpen, setIsEditQuizOpen] = useState(false);
  const [isDeleteQuizOpen, setIsDeleteQuizOpen] = useState(false);
  const [questionModalState, setQuestionModalState] = useState<{
    isOpen: boolean;
    question: ApiQuizQuestion | null;
  }>({ isOpen: false, question: null });
  const [questionDeleteState, setQuestionDeleteState] = useState<{
    isOpen: boolean;
    question: ApiQuizQuestion | null;
  }>({ isOpen: false, question: null });

  const refreshQuiz = async (latestAnswerMap?: Record<string, string>) => {
    if (!lessonId) return;
    setIsRefreshing(true);
    try {
      const res = await quizService.getQuizByLesson(lessonId);
      const quizzes = res?.data || [];
      const matched = quizzes.find(
        (q) => (q.id || (q as { _id?: string })._id) === quizId
      ) || quizzes[0] || null;

      if (matched) {
        const activeAnswers = latestAnswerMap || knownAnswers;
        const mergedQuestions = (matched.questions || []).map((q) => {
          const id = q.id || (q as { _id?: string })._id;
          const ans = (id && activeAnswers[id]) || q.answer;
          return { ...q, answer: ans };
        });
        const enriched = { ...matched, questions: mergedQuestions };
        setCurrentQuiz(enriched);
        onQuizUpdated(enriched);
      }
    } catch {
      // Quiet fail on refresh
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuizSettingsUpdated = (updated: ApiQuizDetail) => {
    setCurrentQuiz(updated);
    onQuizUpdated(updated);
  };

  const handleQuizDeletedSuccess = (deletedId: string) => {
    onQuizDeleted(deletedId);
    onClose();
  };

  const handleQuestionSaved = (savedQuestion: ApiQuizQuestion) => {
    const qId = savedQuestion.id || (savedQuestion as { _id?: string })._id;
    const nextAnswers = { ...knownAnswers };
    if (qId && savedQuestion.answer) {
      nextAnswers[qId] = savedQuestion.answer;
      setKnownAnswers(nextAnswers);
      setStoredAnswers(quizId, nextAnswers);
    }
    toast.success('Đã lưu câu hỏi thành công!');
    refreshQuiz(nextAnswers);
  };

  const handleQuestionDeleted = (deletedQuestionId: string) => {
    const nextAnswers = { ...knownAnswers };
    delete nextAnswers[deletedQuestionId];
    setKnownAnswers(nextAnswers);
    setStoredAnswers(quizId, nextAnswers);
    refreshQuiz(nextAnswers);
  };

  const questions: ApiQuizQuestion[] = currentQuiz.questions || [];
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-[#fcfbfe] dark:bg-[#161220] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-studio-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Studio Top Navigation & Info Header */}
        <div className="shrink-0 border-b border-[#eceaf3] dark:border-[#2a2436] bg-white dark:bg-[#1d1926] px-5 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300">
                  <BookOpen className="w-3 h-3" />
                  Quiz Studio
                </span>
                {lessonTitle && (
                  <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate max-w-sm">
                    Bài học: <strong>{lessonTitle}</strong>
                  </span>
                )}
              </div>
              <h1
                id="quiz-studio-title"
                className="text-lg sm:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-1"
              >
                {currentQuiz.title}
              </h1>
              {currentQuiz.description && (
                <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] line-clamp-2">
                  {currentQuiz.description}
                </p>
              )}
            </div>

            {/* Top action buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => refreshQuiz()}
                disabled={isRefreshing}
                className="p-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#282234] transition-colors disabled:opacity-40"
                title="Làm mới dữ liệu"
                aria-label="Làm mới câu hỏi"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsEditQuizOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#eceaf3] dark:border-[#352e43] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#282234] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cài đặt Quiz</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteQuizOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Xóa bài kiểm tra này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa Quiz</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                aria-label="Đóng Quiz Studio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-4 pt-3 border-t border-[#f0edf7] dark:border-[#2a2436] flex flex-wrap items-center gap-4 text-xs text-[#635a72] dark:text-[#a9a0b2]">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>Số câu hỏi:</span>
              <strong className="text-[#1c192c] dark:text-[#f4eeff]">{questions.length} câu</strong>
            </div>

            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Thời lượng làm bài:</span>
              <strong className="text-[#1c192c] dark:text-[#f4eeff]">{currentQuiz.duration || 15} phút</strong>
            </div>

            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Điểm đạt yêu cầu:</span>
              <strong className="text-[#1c192c] dark:text-[#f4eeff]">{currentQuiz.passingGrade || 80}%</strong>
            </div>

            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-1.5">
              <span>Tổng điểm đề thi:</span>
              <strong className="text-[#1c192c] dark:text-[#f4eeff]">{totalPoints} điểm</strong>
            </div>
          </div>
        </div>

        {/* Studio Body: Questions List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] uppercase tracking-wide">
              Danh sách câu hỏi ({questions.length})
            </h2>

            <button
              type="button"
              onClick={() => setQuestionModalState({ isOpen: true, question: null })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#7c3bed] hover:bg-[#6d28d9] text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi</span>
            </button>
          </div>

          {questions.length === 0 ? (
            /* Empty State */
            <div className="py-14 px-4 text-center rounded-2xl border-2 border-dashed border-[#e6e2ee] dark:border-[#352e43] bg-white/60 dark:bg-[#1d1926]/40 flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 flex items-center justify-center shadow-xs">
                <FileQuestion className="w-7 h-7" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Chưa có câu hỏi nào trong bài kiểm tra
                </h3>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  Hãy tạo các câu hỏi trắc nghiệm hoặc điền khuyết đầu tiên để học viên có thể kiểm tra kiến thức sau khi hoàn thành bài học.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuestionModalState({ isOpen: true, question: null })}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#7c3bed] hover:bg-[#6d28d9] text-white shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo câu hỏi đầu tiên</span>
              </button>
            </div>
          ) : (
            /* Questions Cards List */
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const questionId = q.id || (q as { _id?: string })._id || `q-${idx}`;
                const isFillInBlank = q.type === 'fill_in_blank';
                const options = q.options || [];

                return (
                  <div
                    key={questionId}
                    className="p-4 sm:p-5 rounded-2xl border border-[#eceaf3] dark:border-[#312a3e] bg-white dark:bg-[#1d1926] shadow-xs hover:border-violet-300 dark:hover:border-violet-700/60 transition-all space-y-4"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 shrink-0 mt-0.5">
                          {idx + 1}
                        </span>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {isFillInBlank ? 'Điền khuyết' : 'Trắc nghiệm'}
                            </span>

                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {q.points || 10} điểm
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-semibold text-[#1c192c] dark:text-[#f4eeff] leading-snug">
                            {q.title}
                          </h3>
                        </div>
                      </div>

                      {/* Question Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const id = q.id || (q as { _id?: string })._id;
                            const ans = (id && knownAnswers[id]) || q.answer;
                            setQuestionModalState({ isOpen: true, question: { ...q, answer: ans } });
                          }}
                          className="p-1.5 rounded-lg border border-[#eceaf3] dark:border-[#352e43] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#282234] transition-colors"
                          title="Chỉnh sửa câu hỏi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setQuestionDeleteState({ isOpen: true, question: q })}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Options or Answer display */}
                    {!isFillInBlank ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {options.map((opt, optIdx) => {
                          const isCorrect = opt === q.answer;
                          const optLabel = String.fromCharCode(65 + optIdx); // A, B, C, D...

                          return (
                            <div
                              key={optIdx}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs sm:text-sm transition-colors ${
                                isCorrect
                                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 font-medium'
                                  : 'bg-[#faf9fc] border-[#eceaf3] text-[#3e384c] dark:bg-[#252030] dark:border-[#383146] dark:text-[#d3cce0]'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {optLabel}
                              </span>

                              <span className="flex-1 break-words">{opt}</span>

                              {isCorrect && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span className="hidden sm:inline">Đáp án đúng</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Fill in blank answer block */
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          Đáp án đúng bắt buộc:{' '}
                          {q.answer ? (
                            <strong className="underline underline-offset-2">{q.answer}</strong>
                          ) : (
                            <span className="font-medium text-emerald-800/80 dark:text-emerald-300/80 italic">
                              (Đã lưu trên máy chủ • Bảo mật chống gian lận)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Studio Footer */}
        <div className="shrink-0 border-t border-[#eceaf3] dark:border-[#2a2436] bg-white dark:bg-[#1d1926] px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
          <span>
            Đã đồng bộ với bài học • Tối đa 1 Quiz cho mỗi bài học
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Đóng Studio
          </button>
        </div>
      </div>

      {/* Embedded Sub-Modals */}
      {/* 1. Quiz Settings Edit Modal */}
      <QuizModal
        isOpen={isEditQuizOpen}
        courseId={courseId}
        lessonId={lessonId}
        quiz={currentQuiz}
        onClose={() => setIsEditQuizOpen(false)}
        onSuccess={handleQuizSettingsUpdated}
      />

      {/* 2. Quiz Delete Confirmation Modal */}
      <QuizDeleteModal
        isOpen={isDeleteQuizOpen}
        quiz={currentQuiz}
        lessonTitle={lessonTitle}
        onClose={() => setIsDeleteQuizOpen(false)}
        onDeleted={handleQuizDeletedSuccess}
      />

      {/* 3. Question Create / Edit Modal */}
      <QuestionModal
        isOpen={questionModalState.isOpen}
        quizId={quizId}
        question={questionModalState.question}
        onClose={() => setQuestionModalState({ isOpen: false, question: null })}
        onSuccess={handleQuestionSaved}
      />

      {/* 4. Question Delete Confirmation Modal */}
      <QuestionDeleteModal
        isOpen={questionDeleteState.isOpen}
        question={questionDeleteState.question}
        onClose={() => setQuestionDeleteState({ isOpen: false, question: null })}
        onDeleted={handleQuestionDeleted}
      />
    </div>
  );
}
