import { apiClient } from '@/lib/api/client';
import {
  AiQuizGenerateRequest,
  AiQuizGenerateResponse,
  AiCodingExerciseGenerateRequest,
  AiCodingExerciseGenerateResponse,
  SaveApprovedAiQuizRequest,
  SaveApprovedAiQuizResponse,
  SaveApprovedAiCodingExerciseRequest,
  SaveApprovedAiCodingExerciseResponse,
} from '@/types/ai-assessment';

/**
 * TMDEMY — AI Assessment Service (api/LESSON_API.md Section 10 & STEP 7H)
 *
 * Provides typed methods for automated AI Quiz and AI Coding Exercise generation
 * using the single default model (gemini-3.1-flash-lite).
 * All requests route through the TMdemy Node.js backend.
 * No FastAPI or E2B sandbox keys or direct browser calls are used.
 */
export const aiAssessmentService = {
  /**
   * Tự động sinh trắc nghiệm bằng AI từ nội dung transcript/summary của bài học.
   * POST /api/lessons/:id/ai-quiz/generate
   *
   * @param lessonId UUID của bài học
   * @param payload Cấu hình số câu hỏi, độ khó, chỉ dẫn giảng viên, previewOnly, confirmOverwrite
   */
  async generateAiQuiz(
    lessonId: string,
    payload: AiQuizGenerateRequest = {},
    options?: { signal?: AbortSignal }
  ): Promise<AiQuizGenerateResponse> {
    return apiClient.post<AiQuizGenerateResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-quiz/generate`,
      payload,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Lưu chính xác bộ câu hỏi Quiz đã được duyệt (Atomic Batch Persistence - Phase 4)
   * POST /api/lessons/:id/ai-quiz/save-approved
   */
  async saveApprovedQuiz(
    lessonId: string,
    payload: SaveApprovedAiQuizRequest,
    options?: { signal?: AbortSignal }
  ): Promise<SaveApprovedAiQuizResponse> {
    return apiClient.post<SaveApprovedAiQuizResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-quiz/save-approved`,
      payload,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Tự động sinh bài tập lập trình bằng AI và tự động xác thực bằng E2B sandbox.
   * POST /api/lessons/:id/ai-coding-exercise/generate
   *
   * @param lessonId UUID của bài học
   * @param payload Cấu hình ngôn ngữ, độ khó, chỉ dẫn giảng viên, previewOnly
   */
  async generateAiCodingExercise(
    lessonId: string,
    payload: AiCodingExerciseGenerateRequest = {},
    options?: { signal?: AbortSignal }
  ): Promise<AiCodingExerciseGenerateResponse> {
    return apiClient.post<AiCodingExerciseGenerateResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-coding-exercise/generate`,
      payload,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Lưu bài tập lập trình đã duyệt chính xác từ preview token hoặc payload (Exact Preview Persistence - Phase 6)
   * POST /api/lessons/:id/ai-coding-exercise/save-approved
   */
  async saveApprovedCodingExercise(
    lessonId: string,
    payload: SaveApprovedAiCodingExerciseRequest,
    options?: { signal?: AbortSignal }
  ): Promise<SaveApprovedAiCodingExerciseResponse> {
    return apiClient.post<SaveApprovedAiCodingExerciseResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}/ai-coding-exercise/save-approved`,
      payload,
      {
        signal: options?.signal,
      }
    );
  },
};
