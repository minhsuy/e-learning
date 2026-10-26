import { apiClient } from '@/lib/api/client';
import { AppApiError } from '@/types/api';
import {
  AdminCategoriesListResponse,
  AdminCategoryDetailResponse,
  AdminCategoryItem,
  AdminCategoryKpis,
  AdminCategoryMutationResponse,
  CreateCategoryDto,
  GetAdminCategoriesParams,
  UpdateCategoryDto,
} from '@/types/admin-category';
import { AdminCoursesListResponse } from '@/types/admin-course';

/**
 * Utility to convert Vietnamese text into URL-friendly slug
 */
export function slugifyVietnamese(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Standardized error normalizer for Category API operations
 * Strictly handles HTTP 400, 401, 403, 404, 409, 422, 500, Network and Timeout errors
 */
export function normalizeCategoryApiError(err: unknown, defaultMsg: string): string {
  if (err instanceof AppApiError) {
    switch (err.statusCode) {
      case 400:
        return err.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.';
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này (yêu cầu quyền Quản trị viên).';
      case 404:
        return 'Danh mục không tồn tại hoặc đã bị xóa khỏi hệ thống.';
      case 409:
        return 'Tên danh mục hoặc đường dẫn (slug) đã tồn tại trên hệ thống. Vui lòng chọn tên khác.';
      case 422:
        return err.message || 'Dữ liệu không hợp lệ (lỗi cú pháp hoặc quy tắc ràng buộc).';
      case 500:
        return 'Máy chủ gặp sự cố nội bộ. Vui lòng thử lại sau ít phút.';
      default:
        return err.message || defaultMsg;
    }
  }

  if (err instanceof Error) {
    if (
      err.message.includes('Network') ||
      err.message.includes('fetch') ||
      err.message.includes('Failed to fetch')
    ) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.';
    }
    if (err.message.includes('timeout') || err.message.includes('Timeout')) {
      return 'Yêu cầu quá thời gian phản hồi (Timeout). Vui lòng thử lại.';
    }
    return err.message;
  }

  return defaultMsg;
}

export const adminCategoryService = {
  /**
   * Lấy danh sách danh mục phân trang & tìm kiếm
   * GET /api/categories/
   */
  async getCategories(
    params?: GetAdminCategoriesParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCategoriesListResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.search !== undefined && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params?.sortBy !== undefined) queryParams.sortBy = params.sortBy;

    return apiClient.get<AdminCategoriesListResponse>('/api/categories/', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Lấy chi tiết danh mục theo Slug
   * GET /api/categories/:slug
   */
  async getCategoryBySlug(
    slug: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCategoryDetailResponse> {
    return apiClient.get<AdminCategoryDetailResponse>(
      `/api/categories/${encodeURIComponent(slug)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Tạo mới danh mục
   * POST /api/admin/categories/
   */
  async createCategory(
    dto: CreateCategoryDto
  ): Promise<AdminCategoryMutationResponse> {
    const payload: { name: string; description?: string } = {
      name: dto.name.trim(),
    };
    if (dto.description !== undefined && dto.description.trim()) {
      payload.description = dto.description.trim();
    }

    return apiClient.post<AdminCategoryMutationResponse>(
      '/api/admin/categories/',
      payload
    );
  },

  /**
   * Cập nhật danh mục theo ID
   * PUT /api/admin/categories/:id
   */
  async updateCategory(
    id: string,
    dto: UpdateCategoryDto
  ): Promise<AdminCategoryMutationResponse> {
    const payload: Record<string, string | undefined> = {};
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.slug !== undefined) payload.slug = dto.slug.trim();
    if (dto.description !== undefined) payload.description = dto.description.trim();

    return apiClient.put<AdminCategoryMutationResponse>(
      `/api/admin/categories/${encodeURIComponent(id)}`,
      payload
    );
  },

  /**
   * Xóa mềm danh mục (isDestroyed = true)
   * DELETE /api/admin/categories/:id
   */
  async deleteCategory(
    id: string
  ): Promise<AdminCategoryMutationResponse> {
    return apiClient.delete<AdminCategoryMutationResponse>(
      `/api/admin/categories/${encodeURIComponent(id)}`
    );
  },

  /**
   * Đếm số lượng khóa học đang liên kết với danh mục
   * GET /api/admin/courses?category=:id&limit=1
   */
  async getCategoryCourseCount(
    categoryId: string,
    options?: { signal?: AbortSignal }
  ): Promise<number> {
    try {
      const res = await apiClient.get<AdminCoursesListResponse>('/api/admin/courses', {
        params: {
          category: categoryId,
          limit: 1,
        },
        signal: options?.signal,
      });
      return Number(res?.data?.pagination?.total) || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Lấy danh sách khóa học mẫu thuộc danh mục để hiển thị trong Category Detail
   * GET /api/admin/courses?category=:id&limit=:limit
   */
  async getCategoryCourses(
    categoryId: string,
    limit = 5,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCoursesListResponse> {
    return apiClient.get<AdminCoursesListResponse>('/api/admin/courses', {
      params: {
        category: categoryId,
        limit,
      },
      signal: options?.signal,
    });
  },

  /**
   * Tính toán KPIs tổng quan cho trang Danh mục
   */
  async getCategoryKpis(): Promise<AdminCategoryKpis> {
    try {
      const [catRes, courseRes] = await Promise.allSettled([
        apiClient.get<AdminCategoriesListResponse>('/api/categories/', {
          params: { limit: 100 },
        }),
        apiClient.get<AdminCoursesListResponse>('/api/admin/courses', {
          params: { limit: 1 },
        }),
      ]);

      let totalCategories: number | null = null;
      let activeCategories: number | null = null;
      let totalCoursesAttached: number | null = null;

      if (catRes.status === 'fulfilled' && catRes.value?.data) {
        const catList: AdminCategoryItem[] = catRes.value.data.categories || [];
        totalCategories = catRes.value.data.pagination?.total ?? catList.length;
        activeCategories = catList.filter((c) => !c.isDestroyed).length;
      }

      if (courseRes.status === 'fulfilled' && courseRes.value?.data?.pagination) {
        totalCoursesAttached = Number(courseRes.value.data.pagination.total) || 0;
      }

      return {
        totalCategories,
        activeCategories,
        totalCoursesAttached,
      };
    } catch {
      return {
        totalCategories: null,
        activeCategories: null,
        totalCoursesAttached: null,
      };
    }
  },
};
