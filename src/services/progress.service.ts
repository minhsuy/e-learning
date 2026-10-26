import { apiClient } from '@/lib/api/client';
import {
  GetCourseProgressResponse,
  CompleteLessonPayload,
  CompleteLessonResponse,
} from '@/types/progress';

/**
 * TMDEMY — Progress Tracking Service (api/PROGRESS_API.md)
 */
export const progressService = {
  /**
   * Lấy chi tiết tiến độ học tập của người dùng trong một khóa học
   * GET /api/progress/:courseId
   */
  async getCourseProgress(courseId: string, options?: { signal?: AbortSignal }): Promise<GetCourseProgressResponse> {
    return apiClient.get<GetCourseProgressResponse>(`/api/progress/${encodeURIComponent(courseId)}`, {
      signal: options?.signal,
    });
  },

  /**
   * Đánh dấu học viên đã hoàn thành một bài học cụ thể
   * POST /api/progress/complete
   */
  async completeLesson(payload: CompleteLessonPayload, options?: { signal?: AbortSignal }): Promise<CompleteLessonResponse> {
    return apiClient.post<CompleteLessonResponse>('/api/progress/complete', payload, {
      signal: options?.signal,
    });
  },

  /**
   * Hủy đánh dấu hoàn thành bài học
   * POST /api/progress/uncomplete
   */
  async uncompleteLesson(payload: CompleteLessonPayload, options?: { signal?: AbortSignal }): Promise<CompleteLessonResponse> {
    return apiClient.post<CompleteLessonResponse>('/api/progress/uncomplete', payload, {
      signal: options?.signal,
    });
  },
};
