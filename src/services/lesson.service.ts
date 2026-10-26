import { apiClient } from '@/lib/api/client';
import {
  GetLessonsByChapterResponse,
  CreateLessonDto,
  CreateLessonResponse,
  UpdateLessonDto,
  UpdateLessonResponse,
  DeleteLessonResponse,
} from '@/types/lesson';

/**
 * TMDEMY — Lesson Service (api/LESSON_API.md)
 */
export const lessonService = {
  /**
   * Lấy danh sách toàn bộ các bài học thuộc về một chương học theo thứ tự (order ASC)
   * GET /api/lessons/chapter/:chapterId
   */
  async getLessonsByChapter(
    chapterId: string,
    options?: { signal?: AbortSignal }
  ): Promise<GetLessonsByChapterResponse> {
    return apiClient.get<GetLessonsByChapterResponse>(
      `/api/lessons/chapter/${encodeURIComponent(chapterId)}`,
      {
        skipAuth: true,
        signal: options?.signal,
      }
    );
  },

  /**
   * Tạo bài học mới (Video hoặc Text) nằm trong một Chương học
   * POST /api/lessons/
   */
  async createLesson(
    data: CreateLessonDto,
    options?: { signal?: AbortSignal }
  ): Promise<CreateLessonResponse> {
    return apiClient.post<CreateLessonResponse>('/api/lessons/', data, {
      signal: options?.signal,
    });
  },

  /**
   * Cập nhật thông tin bài học (tiêu đề, thời lượng, videoUrl, nội dung, cờ học thử isDemo)
   * PUT /api/lessons/:id
   */
  async updateLesson(
    lessonId: string,
    data: UpdateLessonDto,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateLessonResponse> {
    return apiClient.put<UpdateLessonResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}`,
      data,
      { signal: options?.signal }
    );
  },

  /**
   * Xóa vĩnh viễn bài học khỏi chương học
   * DELETE /api/lessons/:id
   */
  async deleteLesson(
    lessonId: string,
    options?: { signal?: AbortSignal }
  ): Promise<DeleteLessonResponse> {
    return apiClient.delete<DeleteLessonResponse>(
      `/api/lessons/${encodeURIComponent(lessonId)}`,
      { signal: options?.signal }
    );
  },
};
