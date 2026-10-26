import { apiClient } from '@/lib/api/client';
import { CreateRatingPayload, CreateRatingResponse, GetCourseRatingsResponse } from '@/types/rating';

/**
 * Public Rating Service
 * Giao tiếp với endpoint đánh giá theo đặc tả api/RATING_API.md
 */
export const ratingService = {
  /**
   * Lấy danh sách đánh giá công khai của một khóa học theo courseId
   * GET /api/ratings/course/:id
   */
  async getCourseRatings(courseId: string, options?: { signal?: AbortSignal }): Promise<GetCourseRatingsResponse> {
    return apiClient.get<GetCourseRatingsResponse>(`/api/ratings/course/${encodeURIComponent(courseId)}`, {
      skipAuth: true,
      signal: options?.signal,
    });
  },

  /**
   * Tạo đánh giá mới cho khóa học (Học viên đã ghi danh)
   * POST /api/ratings/
   */
  async createRating(payload: CreateRatingPayload): Promise<CreateRatingResponse> {
    return apiClient.post<CreateRatingResponse>('/api/ratings', payload);
  },
};
