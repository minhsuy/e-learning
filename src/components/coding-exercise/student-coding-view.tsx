'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Terminal,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  History,
  Code2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  CodingExercise,
  CodingTestCase,
  RunCodeResultData,
  CodingSubmissionItem,
} from '@/types/coding-exercise';
import { codingExerciseService } from '@/services/coding-exercise.service';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface StudentCodingViewProps {
  lessonId: string;
  isEnrolled: boolean;
  onCompleted?: () => void;
}

export function StudentCodingView({
  lessonId,
  isEnrolled,
  onCompleted,
}: StudentCodingViewProps) {
  // Data states
  const [exercises, setExercises] = useState<CodingExercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [detailMap, setDetailMap] = useState<Record<string, CodingExercise>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student code per exercise: exerciseId -> string
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<RunCodeResultData | null>(null);
  const [submissionResult, setSubmissionResult] = useState<CodingSubmissionItem | null>(null);

  // History states
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'history'>('editor');
  const [submissions, setSubmissions] = useState<CodingSubmissionItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Load published exercises for the lesson
  const loadExercises = useCallback(async () => {
    if (!lessonId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await codingExerciseService.getPublicExercisesByLesson(lessonId);
      const list = res.data || [];
      setExercises(list);

      if (list.length > 0) {
        const firstId = list[0].id || (list[0] as { _id?: string })._id || '';
        setSelectedExerciseId(firstId);
      } else {
        setSelectedExerciseId(null);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof AppApiError ? err.message : 'Không thể tải bài tập lập trình.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExercises();
    setRunResult(null);
    setSubmissionResult(null);
  }, [loadExercises]);

  // Load detailed exercise (starterCode, testCases, description) when selected
  useEffect(() => {
    if (!selectedExerciseId) return;
    if (detailMap[selectedExerciseId]) return;

    let isMounted = true;
    void (async () => {
      try {
        const res = await codingExerciseService.getExerciseDetail(selectedExerciseId);
        if (res.data && isMounted) {
          const detail = res.data;
          setDetailMap((prev) => ({ ...prev, [selectedExerciseId]: detail }));
          setCodeMap((prev) => {
            const sc = detail.starterCode || detail.currentRevision?.starterCode || '';
            if (prev[selectedExerciseId] === undefined && sc) {
              return { ...prev, [selectedExerciseId]: sc };
            }
            return prev;
          });
        }
      } catch {
        // Non-fatal, fallback to summary info
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedExerciseId, detailMap]);

  // Selected exercise
  const currentExercise = useMemo(() => {
    if (!selectedExerciseId) return exercises[0] || null;
    return (
      detailMap[selectedExerciseId] ||
      exercises.find(
        (ex) => (ex.id || (ex as { _id?: string })._id) === selectedExerciseId
      ) ||
      null
    );
  }, [exercises, selectedExerciseId, detailMap]);

  const currentExerciseId = currentExercise
    ? currentExercise.id || (currentExercise as { _id?: string })._id || ''
    : '';

  const currentCode = currentExerciseId
    ? codeMap[currentExerciseId] ?? (currentExercise?.starterCode || currentExercise?.currentRevision?.starterCode || '')
    : '';

  // Load submission history for selected exercise
  const loadHistory = useCallback(async (exerciseId: string) => {
    if (!exerciseId || !isEnrolled) return;
    setIsLoadingHistory(true);
    try {
      const res = await codingExerciseService.getSubmissionHistory(exerciseId, { limit: 10 });
      const rawData = res.data;
      if (Array.isArray(rawData)) {
        setSubmissions(rawData);
      } else if (rawData && Array.isArray((rawData as { items?: CodingSubmissionItem[] }).items)) {
        setSubmissions((rawData as { items: CodingSubmissionItem[] }).items);
      } else {
        setSubmissions([]);
      }
    } catch {
      // Non-fatal
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isEnrolled]);

  useEffect(() => {
    if (currentExerciseId && activeSubTab === 'history') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadHistory(currentExerciseId);
    }
  }, [currentExerciseId, activeSubTab, loadHistory]);

  // Code change handler
  const handleCodeChange = (newCode: string) => {
    if (!currentExerciseId) return;
    setCodeMap((prev) => ({
      ...prev,
      [currentExerciseId]: newCode,
    }));
  };

  // Reset code handler
  const handleResetCode = () => {
    if (!currentExercise || !currentExerciseId) return;
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn đặt lại mã nguồn về đoạn mã khởi tạo ban đầu? Mọi chỉnh sửa hiện tại sẽ bị xóa.'
    );
    if (!confirmed) return;
    setCodeMap((prev) => ({
      ...prev,
      [currentExerciseId]: currentExercise.starterCode || currentExercise.currentRevision?.starterCode || '',
    }));
    toast.info('Đã đặt lại mã nguồn về starter code ban đầu.');
  };

  // Check language support
  const normalizedLang = (currentExercise?.programmingLanguage || 'javascript').toLowerCase();
  const isSupportedLanguage = ['javascript', 'js', 'typescript', 'ts', 'python', 'py'].includes(
    normalizedLang
  );

  // Run Code (Practice ephemeral run against public tests)
  const handleRunCode = async () => {
    if (!currentExerciseId) return;
    if (!isEnrolled) {
      toast.warning('Vui lòng ghi danh khóa học để chạy thử mã nguồn.');
      return;
    }
    if (!isSupportedLanguage) {
      toast.error(
        `Ngôn ngữ ${currentExercise?.programmingLanguage} hiện chưa hỗ trợ thực thi trên môi trường Sandbox.`
      );
      return;
    }

    setIsRunning(true);
    setRunResult(null);
    setSubmissionResult(null);

    try {
      const res = await codingExerciseService.runCode(currentExerciseId, {
        sourceCode: currentCode,
      });
      setRunResult(res.data);
      if (res.data.status === 'PASSED') {
        toast.success(
          `🎉 Chạy thử thành công! Vượt qua ${res.data.passedTests}/${res.data.totalTests} test case công khai.`
        );
      } else if (res.data.status === 'FAILED') {
        toast.warning(
          `Chạy thử chưa đạt yêu cầu: ${res.data.passedTests}/${res.data.totalTests} test case vượt qua.`
        );
      } else {
        toast.error('Mã nguồn gặp lỗi trong quá trình thực thi.');
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Lỗi khi thực thi mã nguồn.';
      toast.error(msg);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code (Official graded submission via E2B)
  const handleSubmitCode = async () => {
    if (!currentExerciseId) return;
    if (!isEnrolled) {
      toast.warning('Vui lòng ghi danh khóa học để nộp bài tập.');
      return;
    }
    if (!isSupportedLanguage) {
      toast.error(
        `Ngôn ngữ ${currentExercise?.programmingLanguage} hiện chưa hỗ trợ chấm điểm trên môi trường Sandbox.`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await codingExerciseService.submitCode(currentExerciseId, {
        sourceCode: currentCode,
      });
      setSubmissionResult(res.data);
      if (res.data.status === 'PASSED') {
        toast.success(
          `🎉 Chúc mừng! Bạn đã hoàn thành bài tập với điểm số ${res.data.score}/${res.data.maxScore}!${
            res.data.awardedXp ? ` (+${res.data.awardedXp} XP)` : ''
          }`
        );
        onCompleted?.();
      } else {
        toast.warning(
          `Bài nộp chưa đạt: Vượt qua ${res.data.passedTests}/${res.data.totalTests} test case. Điểm: ${res.data.score}/${res.data.maxScore}.`
        );
      }
      // Refresh history in background
      void loadHistory(currentExerciseId);
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Lỗi nộp bài tập.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lines calculation for code editor
  const lines = currentCode.split('\n');

  if (isLoading) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-[#282136]" />
        <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
          Đang tải bài tập lập trình...
        </span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-8 text-center rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300">
          Không thể tải bài tập lập trình
        </h3>
        <p className="text-xs text-rose-600 dark:text-rose-400 max-w-sm mx-auto">
          {errorMessage}
        </p>
        <button
          type="button"
          onClick={() => void loadExercises()}
          className="px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (exercises.length === 0 || !currentExercise) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
          <Code2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
          Bài học này chưa có bài tập lập trình
        </h3>
        <p className="text-xs text-[#635a72] dark:text-[#b4a9c7] max-w-sm">
          Giảng viên chưa xuất bản bài tập thực hành code cho bài học này. Bạn có thể tiếp tục học bài tiếp theo hoặc đọc phần tóm tắt bài học.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Multiple Exercises Bar (if > 1) */}
      {exercises.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#eceaf3] dark:border-[#352e43]">
          <span className="text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] shrink-0">
            Danh sách bài tập:
          </span>
          {exercises.map((ex, idx) => {
            const exId = ex.id || (ex as { _id?: string })._id || `ex-${idx}`;
            const isSelected = exId === currentExerciseId;
            return (
              <button
                key={exId}
                type="button"
                onClick={() => {
                  setSelectedExerciseId(exId);
                  setRunResult(null);
                  setSubmissionResult(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#7240b8] text-white shadow-xs'
                    : 'bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#ede3fc]'
                }`}
              >
                <span>Bài {idx + 1}: {ex.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Exercise Header & Problem Statement */}
      <div className="rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-[#fdf8ff] dark:bg-[#1a1625] p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {currentExercise.title}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 uppercase">
                {currentExercise.programmingLanguage}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  currentExercise.difficulty === 'EASY'
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    : currentExercise.difficulty === 'HARD'
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                }`}
              >
                {currentExercise.difficulty}
              </span>
            </div>
            {currentExercise.description && (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-1">
                {currentExercise.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('editor')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'editor'
                  ? 'bg-white dark:bg-[#252030] text-[#7240b8] dark:text-[#a87ffb] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Trình soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-white dark:bg-[#252030] text-[#7240b8] dark:text-[#a87ffb] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử nộp</span>
            </button>
          </div>
        </div>

        {/* Public Test Cases Preview */}
        {(currentExercise.testCases || []).length > 0 && (
          <div className="pt-2 border-t border-[#eceaf3] dark:border-[#352e43]">
            <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Ví dụ mẫu (Public Test Cases):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {(currentExercise.testCases || [])
                .filter((tc: CodingTestCase) => !tc.isHidden)
                .slice(0, 2)
                .map((tc: CodingTestCase, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white dark:bg-[#161220] border border-[#eceaf3] dark:border-[#352e43] text-xs font-mono space-y-1"
                  >
                    <div className="text-slate-500 text-[11px]">Test #{idx + 1}:</div>
                    <div className="truncate">
                      <span className="text-slate-400">Đầu vào: </span>
                      <span className="text-[#1c192c] dark:text-slate-200">
                        {JSON.stringify(tc.input)}
                      </span>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400">Kỳ vọng: </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {JSON.stringify(tc.expectedOutput)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Sub-Tab Body */}
      {activeSubTab === 'history' ? (
        /* SUBMISSION HISTORY */
        <div className="rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-2">
              <History className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
              <span>Lịch sử các lần nộp bài của bạn</span>
            </h4>
            <button
              type="button"
              onClick={() => void loadHistory(currentExerciseId)}
              disabled={isLoadingHistory}
              className="inline-flex items-center gap-1 text-xs text-[#7240b8] dark:text-[#a87ffb] hover:underline cursor-pointer"
            >
              <RotateCcw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
              Đang tải lịch sử nộp bài...
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Bạn chưa có lần nộp bài nào cho bài tập này. Hãy hoàn thiện mã nguồn và nhấn &quot;Nộp bài&quot;.
            </div>
          ) : (
            <div className="divide-y divide-[#eceaf3] dark:divide-[#352e43] border border-[#eceaf3] dark:border-[#352e43] rounded-xl overflow-hidden">
              {submissions.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        sub.status === 'PASSED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {sub.status === 'PASSED' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      <span>{sub.status}</span>
                    </span>
                    <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Điểm: {sub.score}/{sub.maxScore || 100}
                    </span>
                    <span className="text-slate-500">
                      ({sub.passedTests}/{sub.totalTests} tests)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    {sub.totalExecutionTimeMs > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{sub.totalExecutionTimeMs} ms</span>
                      </span>
                    )}
                    <span>{new Date(sub.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* CODE EDITOR & RUNNER */
        <div className="space-y-4">
          {!isSupportedLanguage && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                Hiện tại hệ thống chỉ hỗ trợ thực thi trên E2B Cloud Sandbox cho JavaScript, TypeScript và Python.
              </span>
            </div>
          )}

          {/* Code Editor Header Bar */}
          <div className="rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-[#1a1625] overflow-hidden shadow-md">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#221c30] border-b border-[#2d2540] text-slate-300">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#a87ffb]" />
                <span className="font-mono text-xs font-bold text-slate-200 uppercase">
                  {currentExercise.programmingLanguage}
                </span>
                <span className="text-[11px] text-slate-500">
                  ({lines.length} dòng)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-[#2e2642] transition-colors cursor-pointer"
                  title="Đặt lại mã nguồn ban đầu"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>

            {/* Code Textarea with line numbers */}
            <div className="relative flex min-h-[280px] max-h-[500px]">
              <div className="w-12 select-none bg-[#161220] py-3 text-right pr-2 text-slate-600 font-mono text-xs border-r border-[#2d2540] overflow-hidden">
                {lines.map((_, idx) => (
                  <div key={idx} className="leading-5">
                    {idx + 1}
                  </div>
                ))}
              </div>
              <textarea
                value={currentCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                spellCheck={false}
                rows={Math.max(14, lines.length)}
                className="flex-1 bg-transparent p-3 font-mono text-xs leading-5 text-slate-200 outline-hidden resize-none overflow-auto focus:ring-1 focus:ring-[#7240b8]"
                placeholder="Viết mã giải của bạn tại đây..."
              />
            </div>
          </div>

          {/* Action Buttons: Run Code & Submit Code */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Thực thi an toàn trên môi trường E2B Sandbox
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting || !isSupportedLanguage}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f7f1ff] dark:bg-[#282234] hover:bg-[#ebe0fa] dark:hover:bg-[#342a46] text-[#7240b8] dark:text-[#a87ffb] border border-[#eceaf3] dark:border-[#352e43] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang chạy thử...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Chạy thử (Run Code)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting || !isSupportedLanguage}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#7240b8] hover:bg-[#5e3299] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang chấm điểm...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Nộp bài (Submit)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. Execution / Submission Results Display */}
          {(runResult || submissionResult) && (
            <div className="rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceaf3] dark:border-[#352e43] pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      (runResult?.status || submissionResult?.status) === 'PASSED'
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {(runResult?.status || submissionResult?.status) === 'PASSED' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{runResult ? 'KẾT QUẢ CHẠY THỬ' : 'KẾT QUẢ CHẤM ĐIỂM'}</span>
                  </span>

                  <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                    {runResult
                      ? `Đạt: ${runResult.passedTests}/${runResult.totalTests} tests`
                      : `Điểm: ${submissionResult?.score}/${submissionResult?.maxScore || 100} (${submissionResult?.passedTests}/${submissionResult?.totalTests} tests)`}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {runResult?.totalExecutionTimeMs || submissionResult?.totalExecutionTimeMs || 0} ms
                    </span>
                  </span>
                  {submissionResult?.awardedXp ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Award className="w-3.5 h-3.5" />
                      <span>+{submissionResult.awardedXp} XP</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Compilation / Infrastructure Error */}
              {(runResult?.compilationError || runResult?.infrastructureError) && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 font-mono text-xs text-rose-700 dark:text-rose-300 leading-relaxed whitespace-pre-wrap">
                  {runResult.compilationError || runResult.infrastructureError}
                </div>
              )}

              {/* Individual Test Cases Results */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Chi tiết từng trường hợp kiểm thử:
                </span>
                <div className="space-y-2">
                  {(runResult?.results || submissionResult?.results || []).map((r, idx) => (
                    <div
                      key={r.testCaseId || idx}
                      className={`p-3 rounded-xl border text-xs font-mono transition-colors ${
                        r.status === 'PASSED'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {r.status === 'PASSED' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          )}
                          <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                            Test #{idx + 1}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                              r.status === 'PASSED'
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        {r.executionTimeMs !== undefined && (
                          <span className="text-[11px] text-slate-500">
                            {r.executionTimeMs} ms
                          </span>
                        )}
                      </div>

                      {/* Details if available (only public tests show inputs/expected) */}
                      {!r.isHidden && (
                        <div className="mt-2 space-y-1 text-[11px] text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                          {r.actualOutput !== undefined && (
                            <div>
                              <span className="text-slate-500">Kết quả thực tế: </span>
                              <span className="font-bold">{JSON.stringify(r.actualOutput)}</span>
                            </div>
                          )}
                          {r.expectedOutput !== undefined && (
                            <div>
                              <span className="text-slate-500">Kỳ vọng: </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                {JSON.stringify(r.expectedOutput)}
                              </span>
                            </div>
                          )}
                          {r.stdout && (
                            <div>
                              <span className="text-slate-500">Standard Output: </span>
                              <pre className="inline text-slate-600 dark:text-slate-400">{r.stdout}</pre>
                            </div>
                          )}
                          {r.errorMessage && (
                            <div className="text-rose-600 dark:text-rose-400 font-sans">
                              {r.errorMessage}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
