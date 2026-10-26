import { apiClient } from '@/lib/api/client';
import {
  AdminChaptersResponse,
  AdminCourseDeleteResponse,
  AdminCourseKpis,
  AdminCourseMutationResponse,
  AdminCoursesListResponse,
  GetAdminCoursesParams,
} from '@/types/admin-course';

type KpiSettledResponse = {
  data?: {
    pagination?: {
      total?: number | string;
    };
  };
};

export const adminCourseService = {
  /**
   * Lấy danh sách khóa học phân trang, hỗ trợ tìm kiếm và lọc đa điều kiện
   * GET /api/admin/courses
   */
  async getCourses(
    params?: GetAdminCoursesParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCoursesListResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.status && params.status !== 'all') queryParams.status = params.status.toLowerCase();
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.category && params.category !== 'all') queryParams.category = params.category;
    if (params?.author && params.author !== 'all') queryParams.author = params.author;
    if (params?._destroy !== undefined) queryParams._destroy = params._destroy;

    return apiClient.get<AdminCoursesListResponse>('/api/admin/courses', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Lấy danh sách chương học và bài học của khóa học để thẩm định nội dung
   * GET /api/chapters/course/:id
   */
  async getCourseChapters(
    courseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminChaptersResponse> {
    return apiClient.get<AdminChaptersResponse>(
      `/api/chapters/course/${encodeURIComponent(courseId)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Cập nhật trạng thái duyệt khóa học (approved / rejected)
   * PATCH /api/admin/courses/teacher/:id
   */
  async updateCourseStatus(
    courseId: string,
    status: 'approved' | 'rejected',
    reason?: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCourseMutationResponse> {
    const body: Record<string, string> = { status };
    if (reason && reason.trim()) {
      body.reason = reason.trim();
      body.rejectionReason = reason.trim();
    }

    return apiClient.patch<AdminCourseMutationResponse>(
      `/api/admin/courses/teacher/${encodeURIComponent(courseId)}`,
      body,
      { signal: options?.signal }
    );
  },

  /**
   * Phê duyệt khóa học của Giảng viên (status = approved)
   */
  async approveCourse(
    courseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCourseMutationResponse> {
    return this.updateCourseStatus(courseId, 'approved', undefined, options);
  },

  /**
   * Từ chối khóa học của Giảng viên (status = rejected)
   */
  async rejectCourse(
    courseId: string,
    reason?: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCourseMutationResponse> {
    return this.updateCourseStatus(courseId, 'rejected', reason, options);
  },

  /**
   * Soft-delete khóa học (đặt isDestroyed = true)
   * DELETE /api/admin/courses/:id
   */
  async deleteCourse(
    courseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCourseDeleteResponse> {
    return apiClient.delete<AdminCourseDeleteResponse>(
      `/api/admin/courses/${encodeURIComponent(courseId)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Lấy tổng hợp 4 chỉ số KPI khóa học chính xác từ pagination.total
   */
  async getCourseKpis(options?: { signal?: AbortSignal }): Promise<AdminCourseKpis> {
    const results = await Promise.allSettled([
      // 1. Tổng số khóa học
      this.getCourses({ limit: 1 }, options),
      // 2. Chờ phê duyệt (Pending)
      this.getCourses({ limit: 1, status: 'pending' }, options),
      // 3. Đã duyệt (Approved)
      this.getCourses({ limit: 1, status: 'approved' }, options),
      // 4. Bị từ chối (Rejected)
      this.getCourses({ limit: 1, status: 'rejected' }, options),
    ]);

    const extractTotal = (res: PromiseSettledResult<KpiSettledResponse>): number | null => {
      if (res.status === 'fulfilled' && res.value?.data?.pagination?.total !== undefined) {
        return Number(res.value.data.pagination.total);
      }
      return null;
    };

    return {
      totalCourses: extractTotal(results[0]),
      pendingCourses: extractTotal(results[1]),
      approvedCourses: extractTotal(results[2]),
      rejectedCourses: extractTotal(results[3]),
    };
  },
};
