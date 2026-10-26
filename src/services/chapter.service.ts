import { apiClient } from '@/lib/api/client';
import {
  GetChaptersByCourseResponse,
  CreateChapterDto,
  CreateChapterResponse,
  UpdateChapterDto,
  UpdateChapterResponse,
  DeleteChapterResponse,
} from '@/types/chapter';

/**
 * TMDEMY — Chapter Management Service (api/CHAPTER_API.md)
 */
export const chapterService = {
  /**
   * Lấy danh sách các chương học thuộc một khóa học (kèm bài học con)
   * GET /api/chapters/course/:id
   */
  async getChaptersByCourse(
    courseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<GetChaptersByCourseResponse> {
    return apiClient.get<GetChaptersByCourseResponse>(
      `/api/chapters/course/${encodeURIComponent(courseId)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Thêm một chương học mới vào khóa học
   * POST /api/chapters/:courseId
   */
  async createChapter(
    courseId: string,
    data: CreateChapterDto,
    options?: { signal?: AbortSignal }
  ): Promise<CreateChapterResponse> {
    return apiClient.post<CreateChapterResponse>(
      `/api/chapters/${encodeURIComponent(courseId)}`,
      data,
      { signal: options?.signal }
    );
  },

  /**
   * Cập nhật tiêu đề, số thứ tự hiển thị hoặc cờ xóa mềm của chương học
   * PUT /api/chapters/:id
   */
  async updateChapter(
    chapterId: string,
    data: UpdateChapterDto,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateChapterResponse> {
    return apiClient.put<UpdateChapterResponse>(
      `/api/chapters/${encodeURIComponent(chapterId)}`,
      data,
      { signal: options?.signal }
    );
  },

  /**
   * Xóa mềm chương học
   * DELETE /api/chapters/:id
   */
  async deleteChapter(
    chapterId: string,
    options?: { signal?: AbortSignal }
  ): Promise<DeleteChapterResponse> {
    return apiClient.delete<DeleteChapterResponse>(
      `/api/chapters/${encodeURIComponent(chapterId)}`,
      { signal: options?.signal }
    );
  },
};
