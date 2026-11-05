import { apiClient } from '@/lib/api/client';
import {
  LessonAiContentResponse,
  UpdateLessonAiContentPayload,
  TriggerAiProcessPayload,
  AiJobStatusResponse,
} from '@/types/lesson-ai-content';

/**
 * TMDEMY — Lesson AI Content & Summary Service
 * Connects to:
 * - GET /api/lessons/:id/ai-content (Read summary & transcript)
 * - PUT /api/lessons/:id/ai-content (Teacher/Admin edit & save)
 * - POST /api/lessons/:id/ai-process (Trigger/Regenerate AI processing)
 * - GET /api/lessons/:id/ai-job (Get latest AI job status)
 */
export const lessonAiContentService = {
  /**
   * Fetch lesson AI content (transcript & Markdown summary)
   * GET /api/lessons/:id/ai-content
   */
  async getLessonAiContent(
    lessonId: string,
    options?: { signal?: AbortSignal }
  ): Promise<LessonAiContentResponse> {
    return apiClient.get<LessonAiContentResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-content`,
      { signal: options?.signal }
    );
  },

  /**
   * Teacher / Admin updates Lesson AI Content (e.g. saves edited Summary)
   * PUT /api/lessons/:id/ai-content
   */
  async updateLessonAiContent(
    lessonId: string,
    payload: UpdateLessonAiContentPayload,
    options?: { signal?: AbortSignal }
  ): Promise<LessonAiContentResponse> {
    return apiClient.put<LessonAiContentResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-content`,
      payload,
      { signal: options?.signal }
    );
  },

  /**
   * Trigger or regenerate AI processing for a lesson
   * POST /api/lessons/:id/ai-process
   */
  async triggerLessonAiProcess(
    lessonId: string,
    payload?: TriggerAiProcessPayload,
    options?: { signal?: AbortSignal }
  ): Promise<AiJobStatusResponse> {
    return apiClient.post<AiJobStatusResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-process`,
      payload || { jobType: 'TRANSCRIBE_AND_SUMMARIZE' },
      { signal: options?.signal }
    );
  },

  /**
   * Get the latest AI processing job for a lesson
   * GET /api/lessons/:id/ai-job
   */
  async getLatestLessonAiJob(
    lessonId: string,
    options?: { signal?: AbortSignal }
  ): Promise<AiJobStatusResponse> {
    return apiClient.get<AiJobStatusResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-job`,
      { signal: options?.signal }
    );
  },

  /**
   * Phục hồi hoặc tạo tóm tắt trực tiếp từ transcript mà không cần chạy lại Whisper
   * POST /api/lessons/:id/ai-summary/generate
   */
  async recoverOrGenerateSummary(
    lessonId: string,
    payload?: { model?: string },
    options?: { signal?: AbortSignal }
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      summary: string;
      modelUsed?: string;
      persisted: boolean;
      recoveredFromArtifact?: boolean;
    };
  }> {
    return apiClient.post(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-summary/generate`,
      payload || {},
      { signal: options?.signal }
    );
  },

  /**
   * Thử lại tạo tóm tắt cho bài học
   * POST /api/lessons/:id/ai-summary/retry
   */
  async retrySummary(
    lessonId: string,
    payload?: { model?: string },
    options?: { signal?: AbortSignal }
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      summary: string;
      modelUsed?: string;
      persisted: boolean;
    };
  }> {
    return apiClient.post(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-summary/retry`,
      payload || {},
      { signal: options?.signal }
    );
  },
};

