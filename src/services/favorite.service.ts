import { apiClient } from '@/lib/api/client';
import {
  GetFavoritesParams,
  GetFavoritesResponse,
  AddFavoriteResponse,
  RemoveFavoriteResponse,
} from '@/types/favorite';

/**
 * TMDEMY — Favorite Service (Phase F7.2-D)
 * Communication layer for Favorite Courses according to api/FAVORITE_API.md
 */
export const favoriteService = {
  /**
   * Lấy danh sách khóa học yêu thích của người dùng hiện tại (có phân trang)
   * GET /api/favorites/?page=1&limit=10
   */
  async getFavorites(
    params?: GetFavoritesParams,
    options?: { signal?: AbortSignal }
  ): Promise<GetFavoritesResponse> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;

    return apiClient.get<GetFavoritesResponse>('/api/favorites/', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Thêm khóa học vào danh sách yêu thích
   * POST /api/favorites/:id
   */
  async addFavorite(
    courseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<AddFavoriteResponse> {
    return apiClient.post<AddFavoriteResponse>(
      `/api/favorites/${encodeURIComponent(courseId)}`,
      {},
      { signal: options?.signal }
    );
  },

  /**
   * Xóa khóa học khỏi danh sách yêu thích
   * DELETE /api/favorites/:id
   */
  async removeFavorite(
    courseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<RemoveFavoriteResponse> {
    return apiClient.delete<RemoveFavoriteResponse>(
      `/api/favorites/${encodeURIComponent(courseId)}`,
      { signal: options?.signal }
    );
  },
};
