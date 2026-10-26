import { apiClient } from '@/lib/api/client';
import { AppApiError } from '@/types/api';
import {
  GetQuizByLessonResponse,
  QuizSubmissionPayload,
  SubmitQuizResponse,
  GetQuizSubmissionResponse,
  GetTeacherQuizAnalyticsResponse,
  ApiQuizSubmissionData,
  CreateQuizDto,
  CreateQuizResponse,
  UpdateQuizDto,
  UpdateQuizResponse,
  DeleteQuizResponse,
} from '@/types/quiz';

/**
 * TMDEMY — Quiz & Question Service (api/QUIZ_API.md, api/QUIZ_SUBMISSION_API.md)
 */
export const quizService = {
  /**
   * Lấy thông tin bài kiểm tra và câu hỏi theo mã bài học
   * GET /api/quiz/lesson/:lessonId
   */
  async getQuizByLesson(
    lessonId: string,
    options?: { signal?: AbortSignal }
  ): Promise<GetQuizByLessonResponse> {
    try {
      return await apiClient.get<GetQuizByLessonResponse>(
        `/api/quiz/lesson/${encodeURIComponent(lessonId)}`,
        {
          skipAuth: true,
          signal: options?.signal,
        }
      );
    } catch (err: unknown) {
      if (err instanceof AppApiError && err.statusCode === 404) {
        // 404 means no quiz has been created for this lesson yet
        return {
          success: true,
          message: 'No quizzes found for this lesson',
          data: [],
        };
      }
      throw err;
    }
  },

  /**
   * Học viên lấy kết quả bài nộp của chính mình cho một Quiz
   * GET /api/submissions/:quizId
   */
  async getMySubmission(
    quizId: string,
    options?: { signal?: AbortSignal }
  ): Promise<GetQuizSubmissionResponse | null> {
    try {
      const res = await apiClient.get<{
        success: boolean;
        message?: string;
        data: ApiQuizSubmissionData | { submission: ApiQuizSubmissionData };
      }>(`/api/submissions/${encodeURIComponent(quizId)}`, {
        signal: options?.signal,
      });

      if (res?.data) {
        // Unpack if backend wraps in { submission: { ... } }
        const raw = res.data as { submission?: ApiQuizSubmissionData } & ApiQuizSubmissionData;
        const subData: ApiQuizSubmissionData = raw.submission || raw;
        return {
          success: res.success ?? true,
          message: res.message,
          data: subData,
        };
      }
      return null;
    } catch (err: unknown) {
      if (err instanceof AppApiError && err.statusCode === 404) {
        // 404 means the student has not submitted this quiz yet
        return null;
      }
      throw err;
    }
  },

  /**
   * Học viên nộp bài làm Quiz
   * POST /api/submissions/
   */
  async submitQuiz(
    payload: QuizSubmissionPayload,
    options?: { signal?: AbortSignal }
  ): Promise<SubmitQuizResponse> {
    return apiClient.post<SubmitQuizResponse>('/api/submissions/', payload, {
      signal: options?.signal,
    });
  },

  /**
   * Giảng viên xem báo cáo thống kê phân tích của Quiz
   * GET /api/submissions/teacher/analytics/:quizId
   */
  async getTeacherAnalytics(
    quizId: string,
    options?: { signal?: AbortSignal }
  ): Promise<GetTeacherQuizAnalyticsResponse> {
    return apiClient.get<GetTeacherQuizAnalyticsResponse>(
      `/api/submissions/teacher/analytics/${encodeURIComponent(quizId)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Giảng viên tạo bài kiểm tra mới cho bài học
   * POST /api/quiz/
   */
  async createQuiz(
    data: CreateQuizDto,
    options?: { signal?: AbortSignal }
  ): Promise<CreateQuizResponse> {
    return apiClient.post<CreateQuizResponse>('/api/quiz/', data, {
      signal: options?.signal,
    });
  },

  /**
   * Giảng viên cập nhật thông tin bài kiểm tra
   * PUT /api/quiz/:quizId
   */
  async updateQuiz(
    quizId: string,
    data: UpdateQuizDto,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateQuizResponse> {
    return apiClient.put<UpdateQuizResponse>(
      `/api/quiz/${encodeURIComponent(quizId)}`,
      data,
      { signal: options?.signal }
    );
  },

  /**
   * Giảng viên xóa bài kiểm tra và toàn bộ câu hỏi liên quan
   * DELETE /api/quiz/:quizId
   */
  async deleteQuiz(
    quizId: string,
    options?: { signal?: AbortSignal }
  ): Promise<DeleteQuizResponse> {
    return apiClient.delete<DeleteQuizResponse>(
      `/api/quiz/${encodeURIComponent(quizId)}`,
      { signal: options?.signal }
    );
  },
};
