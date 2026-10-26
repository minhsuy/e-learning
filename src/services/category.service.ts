import { apiClient } from '@/lib/api/client';
import { GetCategoriesParams, GetCategoriesResponse } from '@/types/category';

/**
 * Public Category Service
 * Giao tiếp với endpoint công khai theo đặc tả api/CATEGORY_API.md
 */
export const categoryService = {
  /**
   * Lấy danh sách danh mục khóa học đang hoạt động
   * GET /api/categories/
   */
  async getCategories(params?: GetCategoriesParams): Promise<GetCategoriesResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.search !== undefined && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.sortBy !== undefined) queryParams.sortBy = params.sortBy;

    return apiClient.get<GetCategoriesResponse>('/api/categories/', {
      params: queryParams,
      skipAuth: true,
    });
  },
};
