'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Code2,
  RefreshCw,
  Sparkles,
  Edit,
  Trash2,
  Send,
  AlertCircle,
  Terminal,
  Loader2,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { CodingExercise, AiCodingExerciseVerification } from '@/types/ai-assessment';
import { ApiLessonItem } from '@/types/lesson';
import { codingExerciseService } from '@/services/coding-exercise.service';
import { VerificationBadge } from './verification-badge';
import { CodeSnippet } from './code-snippet';
import { AiCodingExerciseModal } from './ai-coding-exercise-modal';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface CodingExerciseStudioModalProps {
  courseId?: string;
  lesson: ApiLessonItem;
  isOpen: boolean;
  onClose: () => void;
  onExercisesChanged?: () => void;
}

export function CodingExerciseStudioModal({
  courseId,
  lesson,
  isOpen,
  onClose,
  onExercisesChanged,
}: CodingExerciseStudioModalProps) {
  if (!isOpen) return null;

  return (
    <CodingExerciseStudioContent
      courseId={courseId}
      lesson={lesson}
      onClose={onClose}
      onExercisesChanged={onExercisesChanged}
    />
  );
}

interface CodingExerciseStudioContentProps {
  courseId?: string;
  lesson: ApiLessonItem;
  onClose: () => void;
  onExercisesChanged?: () => void;
}

function CodingExerciseStudioContent({
  courseId,
  lesson,
  onClose,
  onExercisesChanged,
}: CodingExerciseStudioContentProps) {
  const lessonId = lesson.id || (lesson as { _id?: string })._id || '';

  // Data states
  const [exercises, setExercises] = useState<CodingExercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected exercise for inspection / editing
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exerciseDetail, setExerciseDetail] = useState<CodingExercise | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Edit form states for selected exercise
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStarterCode, setEditStarterCode] = useState('');
  const [editReferenceSolution, setEditReferenceSolution] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReverifying, setIsReverifying] = useState(false);
  const [verificationState, setVerificationState] = useState<AiCodingExerciseVerification | null>(null);

  // Sub-modal state for AI Generation
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const loadExercises = useCallback(async () => {
    if (!lessonId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await codingExerciseService.getExercisesByLesson(lessonId);
      setExercises(res.data || []);
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải danh sách bài tập lập trình.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    let isCurrent = true;
    if (!lessonId) return;

    codingExerciseService
      .getExercisesByLesson(lessonId)
      .then((res) => {
        if (isCurrent) {
          setExercises(res.data || []);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          if (err instanceof AppApiError) {
            setErrorMessage(err.message);
          } else if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Không thể tải danh sách bài tập lập trình.');
          }
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [lessonId]);

  const handleSelectExercise = async (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setIsLoadingDetail(true);
    setErrorMessage(null);
    try {
      const res = await codingExerciseService.getExerciseManage(exerciseId);
      const ex = res.data;
      setExerciseDetail(ex);
      setVerificationState(ex.verification || null);
      setEditTitle(ex.title || '');
      setEditDescription(ex.description || '');

      const activeRev = ex.activeRevision || ex.currentRevision;
      setEditStarterCode(activeRev?.starterCode || '');
      setEditReferenceSolution(activeRev?.referenceSolution || '');
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        toast.error(err.message);
      } else {
        toast.error('Không thể tải thông tin chi tiết bài tập.');
      }
      setSelectedExerciseId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleStarterCodeChange = (newCode: string) => {
    setEditStarterCode(newCode);
    if (verificationState?.status === 'VERIFIED') {
      setVerificationState({ status: 'UNVERIFIED' });
    }
  };

  const handleReferenceSolutionChange = (newCode: string) => {
    setEditReferenceSolution(newCode);
    if (verificationState?.status === 'VERIFIED') {
      setVerificationState({ status: 'UNVERIFIED' });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedExerciseId) return;
    setIsSavingEdit(true);
    try {
      await codingExerciseService.updateExercise(selectedExerciseId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        starterCode: editStarterCode,
        referenceSolution: editReferenceSolution.trim() || undefined,
      });

      toast.success('Đã lưu các thay đổi của bài tập lập trình thành công!');
      setVerificationState({ status: 'UNVERIFIED' });
      loadExercises();
      onExercisesChanged?.();

      // Refresh detail
      handleSelectExercise(selectedExerciseId);
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        toast.error(err.message);
      } else {
        toast.error('Không thể lưu thay đổi bài tập.');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleReverify = async () => {
    if (!selectedExerciseId) return;
    setIsReverifying(true);
    setErrorMessage(null);
    try {
      // Auto-save changes first to ensure sandbox runs exact editor content
      await codingExerciseService.updateExercise(selectedExerciseId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        starterCode: editStarterCode,
        referenceSolution: editReferenceSolution.trim() || undefined,
      });

      const res = await codingExerciseService.reverifyExercise(selectedExerciseId);
      const data = res?.data;
      if (data) {
        const newVerif: AiCodingExerciseVerification = {
          status: data.status,
          score: data.score,
          testPassRate: data.passRate,
          passedCount: data.passedTests,
          totalCount: data.totalTests,
          details: data.details,
        };
        setVerificationState(newVerif);

        if (data.status === 'VERIFIED') {
          toast.success('Kiểm thử nghiệm thu thành công! Lời giải mẫu đạt 100% test cases trong Sandbox E2B.');
        } else {
          const diagMsg = data.diagnostics || `Lời giải mẫu chỉ đạt ${data.passedTests}/${data.totalTests} bài test.`;
          setErrorMessage(diagMsg);
          toast.error(diagMsg);
        }
      }
      loadExercises();
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Kiểm thử nghiệm thu thất bại.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsReverifying(false);
    }
  };

  const handlePublish = async (exerciseId: string) => {
    if (verificationState?.status !== 'VERIFIED') {
      toast.error('Bài tập chưa vượt qua kiểm thử nghiệm thu Sandbox E2B (VERIFIED). Vui lòng nhấn "Kiểm thử nghiệm thu (Sandbox)" trước khi xuất bản.');
      return;
    }

    setIsPublishing(true);
    try {
      await codingExerciseService.publishExercise(exerciseId);
      toast.success('Xuất bản bài tập thành công! Lời giải mẫu đạt 100% trong sandbox E2B.');
      loadExercises();
      onExercisesChanged?.();
      if (selectedExerciseId === exerciseId) {
        handleSelectExercise(exerciseId);
      }
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        const diagMsg = err.message || 'Lời giải mẫu không vượt qua nghiệm thu Sandbox E2B. Không thể xuất bản.';
        setErrorMessage(diagMsg);
        toast.error(diagMsg);
      } else {
        toast.error('Không thể xuất bản bài tập. Vui lòng kiểm tra lại lời giải mẫu.');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async (exerciseId: string) => {
    try {
      await codingExerciseService.unpublishExercise(exerciseId);
      toast.success('Đã gỡ xuất bản, đưa bài tập về trạng thái DRAFT.');
      loadExercises();
      onExercisesChanged?.();
      if (selectedExerciseId === exerciseId) {
        handleSelectExercise(exerciseId);
      }
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        toast.error(err.message);
      } else {
        toast.error('Không thể gỡ xuất bản bài tập.');
      }
    }
  };

  const handleDelete = async (exerciseId: string) => {
    if (!confirm('Bạn có chắc chắn muốn lưu trữ (xóa) bài tập lập trình này không?')) return;
    try {
      await codingExerciseService.deleteExercise(exerciseId);
      toast.success('Đã lưu trữ bài tập thành công.');
      if (selectedExerciseId === exerciseId) {
        setSelectedExerciseId(null);
        setExerciseDetail(null);
      }
      loadExercises();
      onExercisesChanged?.();
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        toast.error(err.message);
      } else {
        toast.error('Không thể xóa bài tập.');
      }
    }
  };

  const handleAiExerciseCreated = (newExercise: CodingExercise) => {
    loadExercises();
    onExercisesChanged?.();
    setIsAiModalOpen(false);
    handleSelectExercise(newExercise.id || (newExercise as { _id?: string })._id || '');
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coding-studio-modal-title"
      >
        <div className="relative w-full max-w-5xl rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#eceaf3] dark:border-[#352e43] bg-[#f7f1ff]/50 dark:bg-[#252030]/60 shrink-0">
            <div className="flex items-center gap-3">
              {selectedExerciseId ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExerciseId(null);
                    setExerciseDetail(null);
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Quay lại danh sách bài tập"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[#7240b8] to-[#3b82f6] text-white flex items-center justify-center shadow-xs">
                  <Terminal className="w-5 h-5" />
                </div>
              )}

              <div>
                <h2
                  id="coding-studio-modal-title"
                  className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-2"
                >
                  <span>
                    {selectedExerciseId
                      ? exerciseDetail?.title || 'Chi tiết Bài tập Lập trình'
                      : 'Coding Exercise Studio'}
                  </span>
                  {!selectedExerciseId && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                      {exercises.length} bài tập
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate max-w-md sm:max-w-xl">
                  Bài học: <span className="font-semibold text-slate-700 dark:text-slate-200">{lesson.title}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!selectedExerciseId && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-linear-to-r from-[#7240b8] to-[#8d54e8] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sinh bằng AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadExercises}
                    disabled={isLoading}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Tải lại danh sách"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {errorMessage && (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Lỗi:</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* VIEW 1: EXERCISES LIST */}
            {!selectedExerciseId && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#7240b8] mx-auto" />
                    <p className="text-xs text-slate-500">Đang tải danh sách bài tập lập trình...</p>
                  </div>
                ) : exercises.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl border border-dashed border-[#eceaf3] dark:border-[#352e43] bg-[#fdf8ff] dark:bg-[#252030] p-8 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] mx-auto flex items-center justify-center">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        Chưa có bài tập lập trình nào
                      </h3>
                      <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto">
                        Tự động sinh bài tập lập trình hoàn chỉnh kèm test cases và nghiệm thu tự động bằng AI trong vài giây.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Tạo bài tập Coding bằng AI</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#eceaf3] dark:divide-[#352e43] border border-[#eceaf3] dark:border-[#352e43] rounded-2xl overflow-hidden bg-white dark:bg-[#252030]">
                    {exercises.map((ex, idx) => {
                      const exId = ex.id || (ex as { _id?: string })._id || `ex-${idx}`;
                      const isPublished = ex.status === 'PUBLISHED';
                      const rev = ex.activeRevision || ex.currentRevision || ex.revisions?.[0];

                      return (
                        <div
                          key={exId}
                          className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 hover:bg-[#f7f1ff]/40 dark:hover:bg-[#201a2c] transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-[#2e263d] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
                              <Code2 className="w-5 h-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                                  {ex.title}
                                </h4>

                                <span
                                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    isPublished
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                >
                                  {ex.status}
                                </span>

                                {ex.source === 'AI' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                                    AI
                                  </span>
                                )}

                                <VerificationBadge
                                  verification={ex.verification}
                                  compact
                                />
                              </div>

                              <div className="flex items-center gap-2 text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1">
                                <span className="uppercase font-semibold">
                                  {ex.programmingLanguage || ex.language || 'javascript'}
                                </span>
                                <span>•</span>
                                <span className="uppercase">{ex.difficulty}</span>
                                {rev && (
                                  <>
                                    <span>•</span>
                                    <span>Revision v{rev.version}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Publish / Unpublish */}
                            {isPublished ? (
                              <button
                                type="button"
                                onClick={() => handleUnpublish(exId)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
                              >
                                Gỡ xuất bản
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handlePublish(exId)}
                                disabled={isPublishing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                                title="Nghiệm thu Sandbox E2B và xuất bản bài tập"
                              >
                                {isPublishing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>Xuất bản</span>
                              </button>
                            )}

                            {/* View / Edit Detail */}
                            <button
                              type="button"
                              onClick={() => handleSelectExercise(exId)}
                              className="p-2 rounded-lg text-slate-500 hover:text-[#7240b8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Xem chi tiết & Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(exId)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Xóa bài tập"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: EXERCISE DETAIL & EDIT INSPECTOR */}
            {selectedExerciseId && (
              <div className="space-y-5">
                {isLoadingDetail ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#7240b8] mx-auto" />
                    <p className="text-xs text-slate-500">Đang tải dữ liệu chi tiết bài tập...</p>
                  </div>
                ) : exerciseDetail ? (
                  <div className="space-y-5">
                    {/* Status & Verification Header */}
                    <div className="p-4 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-[#f7f1ff]/50 dark:bg-[#201a2c] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          Trạng thái:
                        </span>
                        <span
                          className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            exerciseDetail.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {exerciseDetail.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          (Revision v
                          {exerciseDetail.activeRevision?.version ||
                            exerciseDetail.currentRevision?.version ||
                            1}
                          )
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {exerciseDetail.status === 'PUBLISHED' ? (
                          <button
                            type="button"
                            onClick={() => handleUnpublish(selectedExerciseId)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            Gỡ xuất bản về DRAFT
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={handleReverify}
                              disabled={isPublishing || isReverifying || isSavingEdit}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                              title="Chạy kiểm thử nghiệm thu lời giải mẫu qua Sandbox E2B"
                            >
                              {isReverifying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Terminal className="w-3.5 h-3.5" />
                              )}
                              <span>Kiểm thử nghiệm thu (Sandbox)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePublish(selectedExerciseId)}
                              disabled={
                                isPublishing ||
                                isReverifying ||
                                verificationState?.status !== 'VERIFIED'
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                              title={
                                verificationState?.status !== 'VERIFIED'
                                  ? 'Lời giải mẫu chưa đạt VERIFIED (100% test cases). Vui lòng nhấn "Kiểm thử nghiệm thu (Sandbox)" trước khi xuất bản.'
                                  : 'Nghiệm thu & Xuất bản bài tập lập trình'
                              }
                            >
                              {isPublishing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Nghiệm thu & Xuất bản</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Verification Component */}
                    <VerificationBadge
                      verification={verificationState || exerciseDetail.verification}
                    />

                    {/* Title & Description Form */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                          Tiêu đề bài tập
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] text-[#1c192c] dark:text-[#f4eeff]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                          Mô tả đề bài
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={4}
                          className="w-full p-3 text-xs sm:text-sm rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] text-[#1c192c] dark:text-[#f4eeff]"
                        />
                      </div>
                    </div>

                    {/* Starter Code vs Reference Solution Editable Viewers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          Mã khởi đầu (Starter Code)
                        </label>
                        <CodeSnippet
                          code={editStarterCode}
                          readOnly={false}
                          onChange={handleStarterCodeChange}
                          language={exerciseDetail.programmingLanguage || 'javascript'}
                          title="EDIT STARTER CODE"
                          maxHeight="240px"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                            Lời giải mẫu (Reference Solution)
                          </label>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Chỉ GV / Admin thấy
                          </span>
                        </div>
                        <CodeSnippet
                          code={editReferenceSolution}
                          readOnly={false}
                          onChange={handleReferenceSolutionChange}
                          language={exerciseDetail.programmingLanguage || 'javascript'}
                          title="EDIT REFERENCE SOLUTION"
                          maxHeight="240px"
                        />
                      </div>
                    </div>

                    {/* Test Cases Table */}
                    {exerciseDetail.activeRevision?.testCases && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          Danh sách Test Cases (
                          {exerciseDetail.activeRevision.testCases.length} bài test)
                        </h4>
                        <div className="rounded-xl border border-[#eceaf3] dark:border-[#352e43] overflow-hidden divide-y divide-[#eceaf3] dark:divide-[#352e43]">
                          {exerciseDetail.activeRevision.testCases.map((tc, idx) => (
                            <div
                              key={idx}
                              className="p-3 text-xs font-mono flex items-center justify-between gap-3 bg-white dark:bg-[#252030]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                                  #{idx + 1}
                                </span>
                                <span
                                  className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full ${
                                    tc.isPublic
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                >
                                  {tc.isPublic ? 'Công khai' : 'Bí mật (Ẩn)'}
                                </span>
                                <span className="text-slate-500">
                                  Output:{' '}
                                  <span className="text-emerald-600 font-bold">
                                    {JSON.stringify(tc.expectedOutput)}
                                  </span>
                                </span>
                              </div>
                              <span className="text-slate-400 font-sans text-[11px]">
                                Trọng số: {tc.weight || 50}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Save Changes Button */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={isSavingEdit}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all disabled:opacity-50"
                      >
                        {isSavingEdit ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Lưu bản sửa đổi bài tập</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Sub-Modal for AI Coding Exercise Generation */}
      {isAiModalOpen && (
        <AiCodingExerciseModal
          courseId={courseId}
          lesson={lesson}
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onSuccess={handleAiExerciseCreated}
        />
      )}
    </>
  );
}
