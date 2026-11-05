import { apiClient } from '@/lib/api/client';
import {
  CodingExerciseResponse,
  CodingExercisesListResponse,
  CreateCodingExerciseDto,
  UpdateCodingExerciseDto,
  PublishCodingExerciseResponse,
  UnpublishCodingExerciseResponse,
  DeleteCodingExerciseResponse,
  RunCodeResponse,
  SubmitCodeResponse,
  CodingSubmissionsListResponse,
  ReverifyCodingExerciseResponse,
} from '@/types/coding-exercise';

/**
 * TMDEMY — Coding Exercise Management Service (api/CODING_EXERCISE_API.md)
 */
export const codingExerciseService = {
  /**
   * Giảng viên lấy toàn bộ bài tập của bài học (bao gồm DRAFT, PUBLISHED, ARCHIVED).
   * GET /api/coding-exercises/lesson/:lessonId
   */
  async getExercisesByLesson(
    lessonId: string,
    options?: { signal?: AbortSignal }
  ): Promise<CodingExercisesListResponse> {
    return apiClient.get<CodingExercisesListResponse>(
      `/api/coding-exercises/lesson/${encodeURIComponent(lessonId)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Học viên lấy danh sách bài tập đã xuất bản (PUBLISHED) của bài học.
   * GET /api/coding-exercises/lesson/:lessonId/public
   */
  async getPublicExercisesByLesson(
    lessonId: string,
    options?: { signal?: AbortSignal }
  ): Promise<CodingExercisesListResponse> {
    return apiClient.get<CodingExercisesListResponse>(
      `/api/coding-exercises/lesson/${encodeURIComponent(lessonId)}/public`,
      { signal: options?.signal }
    );
  },

  /**
   * Giảng viên xem chi tiết quản lý (gồm mã giải mẫu referenceSolution và test cases ẩn).
   * GET /api/coding-exercises/:id/manage
   */
  async getExerciseManage(
    exerciseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<CodingExerciseResponse> {
    return apiClient.get<CodingExerciseResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}/manage`,
      { signal: options?.signal }
    );
  },

  /**
   * Học viên xem chi tiết đề bài để làm bài (Anti-cheat: che giấu referenceSolution và test ẩn).
   * GET /api/coding-exercises/:id
   */
  async getExerciseDetail(
    exerciseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<CodingExerciseResponse> {
    return apiClient.get<CodingExerciseResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Giảng viên tạo bài tập lập trình mới (mặc định DRAFT, Revision v1).
   * POST /api/coding-exercises
   */
  async createExercise(
    data: CreateCodingExerciseDto,
    options?: { signal?: AbortSignal }
  ): Promise<CodingExerciseResponse> {
    return apiClient.post<CodingExerciseResponse>('/api/coding-exercises', data, {
      signal: options?.signal,
    });
  },

  /**
   * Giảng viên cập nhật bài tập (tự động tạo Revision v(N+1) nếu bài tập đã xuất bản hoặc đã có submission).
   * PUT /api/coding-exercises/:id
   */
  async updateExercise(
    exerciseId: string,
    data: UpdateCodingExerciseDto,
    options?: { signal?: AbortSignal }
  ): Promise<CodingExerciseResponse> {
    return apiClient.put<CodingExerciseResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}`,
      data,
      { signal: options?.signal }
    );
  },

  /**
   * Giảng viên kiểm thử nghiệm thu (Re-verify) lời giải mẫu với Sandbox E2B mà không xuất bản.
   * POST /api/coding-exercises/:id/reverify
   */
  async reverifyExercise(
    exerciseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<ReverifyCodingExerciseResponse> {
    return apiClient.post<ReverifyCodingExerciseResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}/reverify`,
      undefined,
      { signal: options?.signal }
    );
  },

  /**
   * Cổng nghiệm thu tự động: chạy referenceSolution trong E2B Sandbox và xuất bản bài tập.
   * POST /api/coding-exercises/:id/publish
   */
  async publishExercise(
    exerciseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<PublishCodingExerciseResponse> {
    return apiClient.post<PublishCodingExerciseResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}/publish`,
      undefined,
      { signal: options?.signal }
    );
  },

  /**
   * Gỡ bài tập khỏi trạng thái xuất bản, đưa về lại DRAFT.
   * POST /api/coding-exercises/:id/unpublish
   */
  async unpublishExercise(
    exerciseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<UnpublishCodingExerciseResponse> {
    return apiClient.post<UnpublishCodingExerciseResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}/unpublish`,
      undefined,
      { signal: options?.signal }
    );
  },

  /**
   * Lưu trữ mềm (Soft Archive) bài tập lập trình.
   * DELETE /api/coding-exercises/:id
   */
  async deleteExercise(
    exerciseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<DeleteCodingExerciseResponse> {
    return apiClient.delete<DeleteCodingExerciseResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Chạy thử mã nguồn của học viên trong sandbox E2B đối với các test case công khai.
   * POST /api/coding-exercises/:id/run
   */
  async runCode(
    exerciseId: string,
    payload: { sourceCode: string },
    options?: { signal?: AbortSignal }
  ): Promise<RunCodeResponse> {
    return apiClient.post<RunCodeResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}/run`,
      payload,
      { signal: options?.signal }
    );
  },

  /**
   * Nộp bài tập lập trình chính thức và chấm điểm trong sandbox E2B.
   * POST /api/coding-exercises/:id/submit
   */
  async submitCode(
    exerciseId: string,
    payload: { sourceCode: string },
    options?: { signal?: AbortSignal }
  ): Promise<SubmitCodeResponse> {
    return apiClient.post<SubmitCodeResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}/submit`,
      payload,
      { signal: options?.signal }
    );
  },

  /**
   * Xem lịch sử các lần nộp bài của học viên.
   * GET /api/coding-exercises/:id/submissions
   */
  async getSubmissionHistory(
    exerciseId: string,
    params?: { page?: number; limit?: number },
    options?: { signal?: AbortSignal }
  ): Promise<CodingSubmissionsListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';

    return apiClient.get<CodingSubmissionsListResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}/submissions${qs}`,
      { signal: options?.signal }
    );
  },

  /**
   * Xem chi tiết một bài nộp bài tập lập trình.
   * GET /api/coding-exercises/:id/submissions/:submissionId
   */
  async getSubmissionDetail(
    exerciseId: string,
    submissionId: string,
    options?: { signal?: AbortSignal }
  ): Promise<SubmitCodeResponse> {
    return apiClient.get<SubmitCodeResponse>(
      `/api/coding-exercises/${encodeURIComponent(exerciseId)}/submissions/${encodeURIComponent(submissionId)}`,
      { signal: options?.signal }
    );
  },
};

