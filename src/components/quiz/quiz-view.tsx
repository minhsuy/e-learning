'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ApiQuizDetail, ApiQuizSubmissionData } from '@/types/quiz';
import { quizService } from '@/services/quiz.service';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface QuizViewProps {
  quiz: ApiQuizDetail;
  courseSlug?: string;
  isEnrolled: boolean;
  onBackToLesson?: () => void;
  onCompleted?: (result: { passed: boolean; score: number; percentage: number }) => void;
}

export function QuizView({
  quiz,
  isEnrolled,
  onBackToLesson,
  onCompleted,
}: QuizViewProps) {
  // Screen mode: 'overview' | 'taking' | 'review' | 'submitted'
  const [mode, setMode] = useState<'overview' | 'taking' | 'review' | 'submitted'>('overview');

  // Active question index in taking mode
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Student answers: questionId -> selectedAnswer (string)
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Submission state & history
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionData, setSubmissionData] = useState<ApiQuizSubmissionData | null>(null);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);

  // Timer states (if duration > 0)
  const totalSeconds = (quiz.duration || 0) * 60;
  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Questions array
  const questions = useMemo(() => quiz.questions || [], [quiz.questions]);
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  // Total possible points
  const totalMaxPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points || 1), 0);
  }, [questions]);

  // Load prior submission if any
  const quizId = quiz.id || quiz._id || '';
  useEffect(() => {
    if (!quizId || !isEnrolled) return;
    let isCurrent = true;
    async function loadSubmission() {
      setIsLoadingSubmission(true);
      try {
        const res = await quizService.getMySubmission(quizId);
        if (isCurrent && res?.data) {
          setSubmissionData(res.data);
        }
      } catch {
        // Non-blocking
      } finally {
        if (isCurrent) setIsLoadingSubmission(false);
      }
    }
    loadSubmission();
    return () => {
      isCurrent = false;
    };
  }, [quizId, isEnrolled]);

  // Count answered questions in active taking session
  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter((qId) => answers[qId] && answers[qId].trim() !== '').length;
  }, [answers]);

  // Progress percentage in active session
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Countdown timer effect
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          toast.warning('Thời gian làm bài kiểm tra đã kết thúc!');
          setMode('review');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Quiz handler
  const handleStartQuiz = () => {
    if (questions.length === 0) {
      toast.info('Bài kiểm tra này chưa có câu hỏi nào.');
      return;
    }
    if (!isEnrolled) {
      toast.warning('Vui lòng ghi danh khóa học để tham gia làm bài kiểm tra.');
      return;
    }
    setCurrentQuestionIndex(0);
    setAnswers({});
    if (totalSeconds > 0) {
      setTimeLeft(totalSeconds);
      setIsTimerRunning(true);
    }
    setMode('taking');
  };

  // Answer change handler
  const handleSelectAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Clear answer of current question
  const handleClearCurrentAnswer = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id || currentQuestion._id || '';
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  // Navigate questions
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setMode('review');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Submit quiz handler
  const handleSubmitQuiz = useCallback(async () => {
    if (!quizId) return;
    if (isSubmitting) return;

    // Build payload conforming strictly to QUIZ_SUBMISSION_API.md
    const answerPayload = questions.map((q) => {
      const qId = q.id || q._id || '';
      return {
        question: qId,
        selectedAnswer: answers[qId] ? answers[qId].trim() : '',
      };
    });

    if (answerPayload.length === 0) {
      toast.warning('Vui lòng trả lời ít nhất một câu hỏi trước khi nộp bài.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await quizService.submitQuiz({
        quizId,
        answers: answerPayload,
      });

      if (res.data) {
        setIsTimerRunning(false);

        // Fetch detailed submission answers with isCorrect badges
        const fullSub = await quizService.getMySubmission(quizId).catch(() => null);
        if (fullSub?.data) {
          setSubmissionData(fullSub.data);
        } else {
          // Fallback to response data if detail call is slow
          setSubmissionData({
            id: res.data.submissionId,
            quizId: res.data.quizId,
            score: res.data.score,
            percentage: res.data.percentage,
            passed: res.data.passed,
            passingGrade: res.data.passingGrade,
            createdAt: res.data.createdAt,
          });
        }

        setMode('submitted');
        toast.success(
          res.data.passed
            ? '🎉 Chúc mừng! Bạn đã vượt qua bài kiểm tra thành công!'
            : 'Đã nộp bài làm kiểm tra thành công.'
        );

        // Notify parent Classroom for Learning Progress synchronization
        onCompleted?.({
          passed: res.data.passed,
          score: res.data.score,
          percentage: res.data.percentage,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể nộp bài kiểm tra.';

      // Handle single submission policy error gracefully
      if (
        msg.toLowerCase().includes('already submitted') ||
        (err instanceof AppApiError && err.statusCode === 400 && msg.includes('submitted'))
      ) {
        toast.info('Bạn đã nộp bài kiểm tra này trước đó. Đang tải kết quả bài làm...');
        const fullSub = await quizService.getMySubmission(quizId).catch(() => null);
        if (fullSub?.data) {
          setSubmissionData(fullSub.data);
          setMode('submitted');
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [quizId, questions, answers, isSubmitting, onCompleted]);

  // Determine pass status from submission data
  const passingThreshold = quiz.passingGrade || quiz.passing_grade || 80;
  const isSubmissionPassed = useMemo(() => {
    if (!submissionData) return false;
    if (typeof submissionData.passed === 'boolean') return submissionData.passed;
    return submissionData.percentage >= passingThreshold;
  }, [submissionData, passingThreshold]);

  // Count correct answers from submission detail
  const correctAnswersCount = useMemo(() => {
    if (!submissionData?.answers) return 0;
    return submissionData.answers.filter((a) => a.isCorrect === true).length;
  }, [submissionData]);

  // ==================== RENDER: EMPTY QUIZ STATE ====================
  if (totalQuestions === 0) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] p-8 text-center flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/50 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
          <span className="material-symbols-outlined text-[36px]">quiz</span>
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <h3 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            {quiz.title}
          </h3>
          <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
            Bài kiểm tra này đang được giảng viên hoàn thiện bộ câu hỏi. Vui lòng quay lại sau!
          </p>
        </div>
        {onBackToLesson && (
          <button
            onClick={onBackToLesson}
            className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Quay lại bài giảng
          </button>
        )}
      </div>
    );
  }

  // ==================== 1. OVERVIEW SCREEN ====================
  if (mode === 'overview') {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] p-6 md:p-8 flex flex-col gap-6 shadow-xs">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#f1ebff] dark:border-[#2b2438]">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ebe5ff] dark:bg-[#342a47] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">assignment</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-[#ebe5ff] dark:bg-[#342a47] text-[#7240b8] dark:text-[#a87ffb] text-[10px] font-bold uppercase tracking-wider">
                  Bài kiểm tra trắc nghiệm
                </span>
                {submissionData && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isSubmissionPassed
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {isSubmissionPassed ? '✓ Đã đạt yêu cầu' : 'Chưa đạt yêu cầu'} (
                    {submissionData.percentage}%)
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {quiz.title}
              </h2>
            </div>
          </div>

          {onBackToLesson && (
            <button
              onClick={onBackToLesson}
              className="self-start md:self-auto px-3.5 py-2 rounded-xl border border-[#e6dffa] dark:border-[#382d50] text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Quay lại bài giảng
            </button>
          )}
        </div>

        {/* Description */}
        {quiz.description && (
          <p className="text-xs md:text-sm text-[#4b4452] dark:text-[#cdc3d4] leading-relaxed">
            {quiz.description}
          </p>
        )}

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-1">
            <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Số câu hỏi</span>
            <strong className="text-base md:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {totalQuestions} câu
            </strong>
          </div>
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-1">
            <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Thời gian</span>
            <strong className="text-base md:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {quiz.duration && quiz.duration > 0 ? `${quiz.duration} phút` : 'Tự do'}
            </strong>
          </div>
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-1">
            <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Điểm đạt</span>
            <strong className="text-base md:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {passingThreshold}%
            </strong>
          </div>
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-1">
            <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Tổng điểm</span>
            <strong className="text-base md:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {totalMaxPoints} điểm
            </strong>
          </div>
        </div>

        {/* Existing Submission History Banner */}
        {submissionData && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isSubmissionPassed
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isSubmissionPassed ? 'check_circle' : 'cancel'}
                </span>
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Lịch sử nộp bài gần nhất: {submissionData.score}/{submissionData.totalPoints || totalMaxPoints} điểm ({submissionData.percentage}%)
                </span>
                <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                  Đã hoàn thành vào{' '}
                  {new Date(submissionData.completedAt || submissionData.createdAt || '').toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setMode('submitted')}
              className="px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Xem chi tiết kết quả bài làm</span>
              <span className="material-symbols-outlined text-[16px]">visibility</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-end">
          {submissionData ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] italic">
                (Theo quy định hệ thống: Mỗi học viên nộp bài 1 lần duy nhất)
              </span>
              <button
                onClick={() => setMode('submitted')}
                className="px-6 py-3 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                <span>Xem kết quả &amp; Đáp án chi tiết</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartQuiz}
              disabled={isLoadingSubmission}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Bắt đầu làm bài</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==================== 2. TAKING QUIZ SCREEN ====================
  if (mode === 'taking') {
    const qId = currentQuestion?.id || currentQuestion?._id || '';
    const currentAnswer = answers[qId] || '';

    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] p-5 md:p-7 flex flex-col gap-6 shadow-xs">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f1ebff] dark:border-[#2b2438]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[22px] shrink-0">
              timer
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-[#7240b8] dark:text-[#a87ffb] uppercase tracking-wider truncate">
                {quiz.title}
              </span>
              <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                Tiến độ: {answeredCount}/{totalQuestions} câu đã trả lời ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            {/* Timer Badge */}
            {totalSeconds > 0 && (
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  timeLeft < 180
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 animate-pulse'
                    : 'bg-[#ebe5ff] dark:bg-[#342a47] text-[#7240b8] dark:text-[#a87ffb]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">alarm</span>
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Review Button */}
            <button
              onClick={() => setMode('review')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#282136] dark:hover:bg-[#342a47] text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Xem lại</span>
              <span className="material-symbols-outlined text-[16px]">visibility</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#ebe5ff] dark:bg-[#282136] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7240b8] dark:bg-[#a87ffb] transition-all rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Current Question Main Card */}
        {currentQuestion && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#7240b8] text-white text-xs font-bold">
                  Câu {currentQuestionIndex + 1} / {totalQuestions}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#ebe5ff] dark:bg-[#342a47] text-[#7240b8] dark:text-[#a87ffb] text-[11px] font-semibold">
                  {currentQuestion.type?.toLowerCase().includes('blank') ? 'Điền câu trả lời' : 'Trắc nghiệm'}
                </span>
              </div>
              <span className="text-xs font-bold text-[#00855b]">
                {currentQuestion.points || 1} điểm
              </span>
            </div>

            {/* Question Title */}
            <h3 className="text-sm md:text-base font-bold text-[#1c192c] dark:text-[#f4eeff] leading-relaxed">
              {currentQuestion.title}
            </h3>

            {/* Options / Answer Input Area */}
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              <div className="flex flex-col gap-2.5 pt-1">
                {currentQuestion.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = currentAnswer === opt;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectAnswer(qId, opt)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs md:text-sm flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#7240b8] dark:border-[#a87ffb] bg-[#f7f1ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#f4eeff] font-bold shadow-xs'
                          : 'border-[#e6dffa] dark:border-[#382d50] hover:border-[#7240b8] bg-white dark:bg-[#16131e] text-[#383141] dark:text-[#ded8e8]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#7240b8] text-white'
                              : 'bg-slate-100 dark:bg-[#282136] text-[#635a72] dark:text-[#b4a9c7]'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="leading-relaxed break-words">{opt}</span>
                      </div>

                      <span
                        className={`material-symbols-outlined text-[20px] shrink-0 ${
                          isSelected
                            ? 'text-[#7240b8] dark:text-[#a87ffb]'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Fill-in-the-blank text input */
              <div className="flex flex-col gap-2 pt-1">
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => handleSelectAnswer(qId, e.target.value)}
                  placeholder="Nhập câu trả lời của bạn vào đây..."
                  className="w-full p-3.5 rounded-xl border border-[#e6dffa] dark:border-[#382d50] bg-white dark:bg-[#16131e] text-xs md:text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#968e9e] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-all"
                />
                <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                  Nhập chính xác nội dung câu trả lời. Hệ thống sẽ so khớp khi chấm điểm.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Navigation & Controls */}
        <div className="pt-4 border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClearCurrentAnswer}
            disabled={!currentAnswer}
            className="self-start sm:self-auto text-xs text-[#635a72] dark:text-[#b4a9c7] hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">clear</span>
            <span>Xóa câu trả lời</span>
          </button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-[#e6dffa] dark:border-[#382d50] text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              <span>Câu trước</span>
            </button>

            <button
              type="button"
              onClick={handleNextQuestion}
              className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>{currentQuestionIndex === totalQuestions - 1 ? 'Xem lại bài làm' : 'Câu tiếp theo'}</span>
              <span className="material-symbols-outlined text-[18px]">
                {currentQuestionIndex === totalQuestions - 1 ? 'task_alt' : 'chevron_right'}
              </span>
            </button>
          </div>
        </div>

        {/* Question Palette / Navigator */}
        <div className="pt-4 border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-col gap-2.5">
          <span className="text-[11px] font-bold text-[#635a72] dark:text-[#b4a9c7] uppercase tracking-wider">
            Bảng điều hướng câu hỏi
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {questions.map((q, idx) => {
              const itemQId = q.id || q._id || '';
              const isAnswered = Boolean(answers[itemQId] && answers[itemQId].trim() !== '');
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={itemQId || idx}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#7240b8] text-white ring-2 ring-[#7240b8] ring-offset-2 dark:ring-offset-[#1d1926]'
                      : isAnswered
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#282136] dark:hover:bg-[#342a47] text-[#635a72] dark:text-[#b4a9c7]'
                  }`}
                  title={`Câu ${idx + 1}: ${isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==================== 3. REVIEW & CONFIRMATION SCREEN ====================
  if (mode === 'review') {
    const unAnsweredCount = totalQuestions - answeredCount;

    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] p-6 md:p-8 flex flex-col gap-6 shadow-xs">
        <div className="flex flex-col gap-1 pb-4 border-b border-[#f1ebff] dark:border-[#2b2438]">
          <h2 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Xác nhận bài làm &amp; Nộp bài
          </h2>
          <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
            Vui lòng kiểm tra lại câu trả lời trước khi gửi bài làm lên hệ thống để chấm điểm.
          </p>
        </div>

        {/* Warning if unanswered */}
        {unAnsweredCount > 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
            <span className="material-symbols-outlined text-[24px] text-amber-600 dark:text-amber-400 shrink-0">
              warning
            </span>
            <span>
              Bạn còn <strong>{unAnsweredCount}</strong> câu hỏi chưa trả lời. Bạn có thể quay lại
              hoàn thiện hoặc bấm nộp bài để nộp các câu đã làm.
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
            <span className="material-symbols-outlined text-[24px] text-emerald-600 dark:text-emerald-400 shrink-0">
              check_circle
            </span>
            <span>
              Bạn đã hoàn thành toàn bộ <strong>{totalQuestions}/{totalQuestions}</strong> câu hỏi. Hãy
              sẵn sàng nộp bài!
            </span>
          </div>
        )}

        {/* Question Review List */}
        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
          {questions.map((q, idx) => {
            const itemQId = q.id || q._id || '';
            const ans = answers[itemQId];
            const hasAns = Boolean(ans && ans.trim() !== '');

            return (
              <div
                key={itemQId || idx}
                onClick={() => {
                  setCurrentQuestionIndex(idx);
                  setMode('taking');
                }}
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  hasAns
                    ? 'border-[#e6dffa] dark:border-[#382d50] bg-[#fdf8ff] dark:bg-[#16131e] hover:border-[#7240b8]'
                    : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      hasAns
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                      {q.title}
                    </span>
                    <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] truncate">
                      {hasAns ? `Đáp án: ${ans}` : 'Chưa có câu trả lời'}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-[#7240b8] dark:text-[#a87ffb] font-bold shrink-0">
                  Sửa câu này
                </span>
              </div>
            );
          })}
        </div>

        {/* Buttons Bar */}
        <div className="pt-4 border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMode('taking')}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e6dffa] dark:border-[#382d50] text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Tiếp tục làm bài</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitQuiz}
            disabled={isSubmitting || answeredCount === 0}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#00855b] hover:bg-[#00704d] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span>Đang nộp bài...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Xác nhận nộp bài</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==================== 4. SUBMISSION RESULT & DETAILED BREAKDOWN SCREEN ====================
  if (mode === 'submitted' && submissionData) {
    const isPassed = isSubmissionPassed;
    const submissionDate = submissionData.completedAt || submissionData.createdAt;

    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] p-6 md:p-8 flex flex-col gap-6 shadow-xs">
        {/* Result Header Badge */}
        <div className="flex flex-col items-center justify-center text-center gap-4 pb-6 border-b border-[#f1ebff] dark:border-[#2b2438]">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isPassed
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span className="material-symbols-outlined text-[44px]">
              {isPassed ? 'emoji_events' : 'sentiment_dissatisfied'}
            </span>
          </div>

          <div className="flex flex-col gap-1 max-w-md">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isPassed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {isPassed ? '✓ ĐÃ ĐẠT YÊU CẦU' : '✕ CHƯA ĐẠT YÊU CẦU'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#1c192c] dark:text-[#f4eeff]">
              {isPassed ? 'Chúc mừng bạn đã vượt qua bài kiểm tra!' : 'Rất tiếc! Bạn chưa đạt điểm chuẩn'}
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
              {isPassed
                ? 'Bạn đã hoàn thành xuất sắc bài kiểm tra và đáp ứng tiêu chuẩn kiến thức của bài học.'
                : `Yêu cầu đạt tối thiểu ${passingThreshold}%. Bạn có thể ôn tập lại kiến thức bài học.`}
            </p>
            {submissionDate && (
              <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                Thời gian nộp: {new Date(submissionDate).toLocaleString('vi-VN')}
              </span>
            )}
          </div>

          {/* Score Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl pt-2">
            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-0.5 text-center">
              <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Điểm đạt được</span>
              <strong className="text-base md:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {submissionData.score} / {submissionData.totalPoints || totalMaxPoints}
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-0.5 text-center">
              <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Tỷ lệ chính xác</span>
              <strong
                className={`text-base md:text-lg font-bold ${
                  isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {submissionData.percentage}%
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-0.5 text-center">
              <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Điểm chuẩn</span>
              <strong className="text-base md:text-lg font-bold text-[#7240b8] dark:text-[#a87ffb]">
                {passingThreshold}%
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-0.5 text-center">
              <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Số câu đúng</span>
              <strong className="text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {correctAnswersCount} / {totalQuestions} câu
              </strong>
            </div>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] uppercase tracking-wider">
              Chi tiết câu trả lời bài nộp
            </h3>
            <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
              Hiển thị kết quả đánh giá tự động từ hệ thống
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {questions.map((q, idx) => {
              const qId = q.id || q._id || '';

              // Match submission answer by questionId or question object id
              const recordedAns = submissionData.answers?.find(
                (a) =>
                  a.questionId === qId ||
                  (typeof a.question === 'object' && a.question !== null && (a.question.id === qId || a.question._id === qId))
              );

              const selectedText = recordedAns?.selectedAnswer;
              const hasAnswered = Boolean(selectedText && selectedText.trim() !== '');
              const isCorrect = recordedAns?.isCorrect;

              return (
                <div
                  key={qId || idx}
                  className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${
                    isCorrect === true
                      ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10'
                      : isCorrect === false
                      ? 'border-rose-200 dark:border-rose-800/50 bg-rose-50/30 dark:bg-rose-950/10'
                      : 'border-[#f1ebff] dark:border-[#2f2742] bg-[#fdf8ff] dark:bg-[#16131e]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                          isCorrect === true
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isCorrect === false
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-[#282136] dark:text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs md:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] leading-relaxed">
                          {q.title}
                        </span>
                        <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                          Thang điểm: {q.points || 1} điểm
                        </span>
                      </div>
                    </div>

                    {/* Result Badge */}
                    {isCorrect === true ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Đúng (+{q.points || 1} điểm)</span>
                      </span>
                    ) : isCorrect === false ? (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Chưa chính xác (0 điểm)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#282136] text-[#635a72] dark:text-[#b4a9c7] text-xs font-semibold shrink-0">
                        Chưa chấm
                      </span>
                    )}
                  </div>

                  {/* Student's Selected Answer */}
                  <div className="p-3 rounded-lg bg-white dark:bg-[#16131e] border border-black/5 dark:border-white/5 flex flex-col gap-1 text-xs">
                    <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                      Câu trả lời của bạn:
                    </span>
                    <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      {hasAnswered ? selectedText : '(Bỏ trống câu trả lời)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => setMode('overview')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e6dffa] dark:border-[#382d50] text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Xem thông tin bài kiểm tra</span>
          </button>

          {onBackToLesson && (
            <button
              onClick={onBackToLesson}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Quay lại bài giảng</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
