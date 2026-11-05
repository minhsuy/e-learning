'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Sparkles,
  Edit3,
  Eye,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { ApiLessonItem } from '@/types/lesson';
import { LessonAiContentData, AiProcessingStatus } from '@/types/lesson-ai-content';
import { lessonAiContentService } from '@/services/lesson-ai-content.service';
import { LessonSummaryViewer } from '@/components/common/lesson-summary-viewer';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface LessonSummaryModalProps {
  courseId: string;
  lesson: ApiLessonItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSummarySaved?: (summary: string) => void;
}

export function LessonSummaryModal({
  lesson,
  isOpen,
  onClose,
  onSummarySaved,
}: LessonSummaryModalProps) {
  if (!isOpen || !lesson) return null;

  return (
    <LessonSummaryContent
      lesson={lesson}
      onClose={onClose}
      onSummarySaved={onSummarySaved}
    />
  );
}

function getStatusBadge(status?: AiProcessingStatus | string | null, hasSummary?: boolean) {
  if (status === 'PROCESSING') {
    return {
      label: 'Đang tạo tóm tắt',
      color: 'bg-purple-100 dark:bg-purple-950/70 text-[#7240b8] dark:text-[#a87ffb] border-purple-200 dark:border-purple-800',
      icon: Loader2,
      animate: true,
    };
  }
  if (status === 'PENDING') {
    return {
      label: 'Đang chờ video sẵn sàng',
      color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: Clock,
      animate: true,
    };
  }
  if (status === 'FAILED') {
    return {
      label: 'Tạo tóm tắt thất bại',
      color: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      icon: AlertCircle,
      animate: false,
    };
  }
  if (hasSummary) {
    return {
      label: 'Đã có tóm tắt',
      color: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
      animate: false,
    };
  }
  if (status === 'COMPLETED' && !hasSummary) {
    return {
      label: 'Chưa có tóm tắt (Cần phục hồi)',
      color: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: AlertCircle,
      animate: false,
    };
  }
  return {
    label: 'Chưa có tóm tắt',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    icon: FileText,
    animate: false,
  };
}

function LessonSummaryContent({
  lesson,
  onClose,
  onSummarySaved,
}: {
  lesson: ApiLessonItem;
  onClose: () => void;
  onSummarySaved?: (summary: string) => void;
}) {
  const lessonId = lesson.id || lesson._id || '';

  const [aiData, setAiData] = useState<LessonAiContentData | null>(null);
  const [summaryText, setSummaryText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const fetchAiContent = useCallback(async (isPolling = false) => {
    if (!lessonId) return;
    if (!isPolling) setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await lessonAiContentService.getLessonAiContent(lessonId);
      if (!isMountedRef.current) return;

      const data = res?.data;
      if (data) {
        setAiData(data);
        if (data.summary) {
          setSummaryText(data.summary);
          if (isPolling) {
            onSummarySaved?.(data.summary);
          }
        }

        // If job completed or failed, stop polling
        if (data.aiProcessingStatus === 'COMPLETED' || data.aiProcessingStatus === 'FAILED') {
          stopPolling();
        }
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const msg = err instanceof AppApiError ? err.message : 'Không thể tải nội dung tóm tắt.';
      setErrorMessage(msg);
      stopPolling();
    } finally {
      if (isMountedRef.current && !isPolling) {
        setIsLoading(false);
      }
    }
  }, [lessonId, onSummarySaved, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollTimerRef.current = setInterval(() => {
      void fetchAiContent(true);
    }, 3000);
  }, [fetchAiContent, stopPolling]);

  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAiContent();

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [fetchAiContent, stopPolling]);

  // If initial load shows processing/pending, initiate polling
  useEffect(() => {
    if (aiData?.aiProcessingStatus === 'PROCESSING' || aiData?.aiProcessingStatus === 'PENDING') {
      startPolling();
    }
  }, [aiData?.aiProcessingStatus, startPolling]);

  // Save edited summary
  const handleSaveSummary = async () => {
    if (!lessonId) return;
    setIsSaving(true);
    try {
      await lessonAiContentService.updateLessonAiContent(lessonId, {
        summary: summaryText.trim(),
      });
      toast.success('Đã lưu nội dung tóm tắt bài học thành công!');
      onSummarySaved?.(summaryText.trim());
      setActiveTab('preview');
      void fetchAiContent();
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Lỗi lưu tóm tắt bài học.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Safe recovery / direct generation without re-running Whisper
  const handleDirectRecovery = async () => {
    if (!lessonId) return;
    setIsRecovering(true);
    setErrorMessage(null);
    try {
      const res = await lessonAiContentService.recoverOrGenerateSummary(lessonId, {});
      const newSummary = res?.data?.summary || '';
      if (newSummary) {
        setSummaryText(newSummary);
        setAiData((prev) =>
          prev
            ? { ...prev, summary: newSummary, aiProcessingStatus: 'COMPLETED', aiProcessingError: null }
            : {
                id: lessonId,
                summary: newSummary,
                aiProcessingStatus: 'COMPLETED',
                aiProcessingError: null,
              }
        );
        onSummarySaved?.(newSummary);
        toast.success(
          res.data?.recoveredFromArtifact
            ? 'Đã phục hồi bản tóm tắt từ tệp kết quả AI trước đó!'
            : 'Đã sinh bản tóm tắt mới trực tiếp từ nội dung lời giảng thành công!'
        );
      } else {
        toast.error('Không tìm thấy nội dung tóm tắt để phục hồi.');
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể phục hồi tóm tắt bài học.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsRecovering(false);
    }
  };

  // Trigger / Regenerate AI Summary
  const handleTriggerGenerate = async () => {
    if (!lessonId) return;

    const hasExisting = Boolean(aiData?.summary && aiData.summary.trim());
    if (hasExisting) {
      const confirmed = window.confirm(
        'Bài học đã có nội dung tóm tắt. Bạn có chắc chắn muốn AI tạo lại tóm tắt mới? Nội dung chỉnh sửa thủ công có thể bị ghi đè.'
      );
      if (!confirmed) return;
    }

    // If transcript already exists and summary is missing, generate only missing summary without rerunning Whisper
    const hasTranscript = Boolean(
      (aiData?.transcriptRefined && aiData.transcriptRefined.trim()) ||
        (aiData?.transcriptOriginal && aiData.transcriptOriginal.trim()) ||
        (aiData?.transcript && aiData.transcript.trim())
    );
    if (!hasExisting && hasTranscript) {
      await handleDirectRecovery();
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    try {
      await lessonAiContentService.triggerLessonAiProcess(lessonId, {
        jobType: 'TRANSCRIBE_AND_SUMMARIZE',
      });
      toast.success('Đã gửi yêu cầu tạo tóm tắt AI. Hệ thống đang tiến hành xử lý video...');
      setAiData((prev) => ({
        ...prev,
        id: lessonId,
        aiProcessingStatus: 'PROCESSING',
        aiProcessingError: null,
      }));
      startPolling();
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể kích hoạt tiến trình AI.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasSummary = Boolean(aiData?.summary && aiData.summary.trim());
  const hasTranscript = Boolean(
    (aiData?.transcriptRefined && aiData.transcriptRefined.trim()) ||
      (aiData?.transcriptOriginal && aiData.transcriptOriginal.trim()) ||
      (aiData?.transcript && aiData.transcript.trim())
  );
  const statusInfo = getStatusBadge(aiData?.aiProcessingStatus, hasSummary);
  const StatusIcon = statusInfo.icon;
  const isBusy =
    isLoading ||
    isSaving ||
    isGenerating ||
    isRecovering ||
    aiData?.aiProcessingStatus === 'PROCESSING' ||
    aiData?.aiProcessingStatus === 'PENDING';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#eceaf3] dark:border-[#352e43] bg-[#fdf8ff] dark:bg-[#252030]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 border border-[#eceaf3] dark:border-[#352e43]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                  Tóm tắt bài học: {lesson.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.color}`}
                >
                  <StatusIcon
                    className={`w-3 h-3 ${statusInfo.animate ? 'animate-spin' : ''}`}
                  />
                  <span>{statusInfo.label}</span>
                </span>
                {aiData?.aiProcessedAt && (
                  <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                    Cập nhật: {new Date(aiData.aiProcessedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-[#181422] border-b border-[#eceaf3] dark:border-[#352e43]">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-[#252030] text-[#7240b8] dark:text-[#a87ffb] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước Markdown</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-[#252030] text-[#7240b8] dark:text-[#a87ffb] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa nội dung</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerGenerate}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#f7f1ff] dark:bg-[#282234] hover:bg-[#ece2fc] dark:hover:bg-[#342a46] text-[#7240b8] dark:text-[#a87ffb] border border-[#eceaf3] dark:border-[#352e43] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Kích hoạt tạo hoặc thử lại tóm tắt bài học bằng Gemini 3.1 Flash-Lite"
            >
              {isGenerating || isRecovering ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : aiData?.aiProcessingStatus === 'FAILED' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại (Retry)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{hasSummary ? 'Tạo lại (AI)' : 'Tạo bằng AI'}</span>
                </>
              )}
            </button>

            {activeTab === 'edit' && (
              <button
                type="button"
                onClick={handleSaveSummary}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#7240b8] hover:bg-[#5e3299] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[300px]">
          {(errorMessage || (aiData?.aiProcessingStatus === 'FAILED' && aiData?.aiProcessingError)) && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage || aiData?.aiProcessingError}</span>
              </div>
              <button
                type="button"
                onClick={hasTranscript && !hasSummary ? handleDirectRecovery : handleTriggerGenerate}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại ngay</span>
              </button>
            </div>
          )}

          {/* Recoverable state banner if transcript exists but summary is empty */}
          {!hasSummary &&
            (hasTranscript || aiData?.aiProcessingStatus === 'COMPLETED') && (
              <div className="mb-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Đã có lời giảng nhưng bản tóm tắt bài học đang trống</p>
                    <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                      Nội dung phụ đề bài học đã sẵn sàng. Bạn có thể tạo ngay bản tóm tắt từ lời giảng có sẵn mà không cần chạy lại Whisper.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDirectRecovery}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isRecovering ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo tóm tắt...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tạo tóm tắt từ lời giảng</span>
                    </>
                  )}
                </button>
              </div>
            )}

          {activeTab === 'preview' ? (
            <LessonSummaryViewer
              summary={summaryText}
              isLoading={isLoading || aiData?.aiProcessingStatus === 'PROCESSING' || aiData?.aiProcessingStatus === 'PENDING'}
              emptyTitle="Bài học này chưa có nội dung tóm tắt"
              emptyDescription="Khi bạn tải video bài giảng lên, hệ thống sẽ tự động bóc tách lời giảng và sinh tóm tắt sau khi video sẵn sàng. Bạn cũng có thể nhấn nút 'Tạo bằng AI' để thử lại thủ công."
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
                <span>Hỗ trợ định dạng GitHub Flavored Markdown (tiêu đề, danh sách, bảng, code block)</span>
                <span>{summaryText.length} ký tự</span>
              </div>
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Nhập nội dung tóm tắt bài học dưới định dạng Markdown (ví dụ: # Mục tiêu bài học, ## Các khái niệm chính...)"
                rows={16}
                className="w-full p-4 rounded-xl font-mono text-xs sm:text-sm bg-slate-50 dark:bg-[#161220] text-[#1c192c] dark:text-[#f4eeff] border border-[#eceaf3] dark:border-[#352e43] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8] leading-relaxed resize-y"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#eceaf3] dark:border-[#352e43] bg-slate-50/70 dark:bg-[#252030]/40 flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Nội dung tóm tắt tự động đồng bộ sang giao diện học tập của học viên</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
