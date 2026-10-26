import { apiClient } from '@/lib/api/client';
import {
  GetCoursesParams,
  GetCoursesResponse,
  GetCourseDetailResponse,
  GetTeacherCoursesParams,
  GetTeacherCoursesResponse,
  CreateTeacherCourseDto,
  CreateTeacherCourseResponse,
  UpdateTeacherCourseDto,
  UpdateTeacherCourseResponse,
  DeleteTeacherCourseResponse,
  TeacherCourseItem,
} from '@/types/course';

/**
 * Public & Teacher Course Service
 * Giao tiếp với endpoint công khai theo api/COURSE_API.md và giảng viên theo api/TEACHER_API.md
 */
export const courseService = {
  /**
   * Lấy danh sách khóa học công khai đã duyệt với các bộ lọc
   * GET /api/courses/
   */
  async getCourses(params?: GetCoursesParams, options?: { signal?: AbortSignal }): Promise<GetCoursesResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.search !== undefined && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.category !== undefined && params.category !== 'all') queryParams.category = params.category;
    if (params?.level !== undefined) queryParams.level = params.level;
    if (params?.type !== undefined) queryParams.type = params.type;
    if (params?.priceMin !== undefined) queryParams.priceMin = params.priceMin;
    if (params?.priceMax !== undefined) queryParams.priceMax = params.priceMax;
    if (params?.minRating !== undefined) queryParams.minRating = params.minRating;
    if (params?.durationRange !== undefined && params.durationRange !== 'all') queryParams.durationRange = params.durationRange;
    if (params?.durationMin !== undefined) queryParams.durationMin = params.durationMin;
    if (params?.durationMax !== undefined) queryParams.durationMax = params.durationMax;
    if (params?.sortBy !== undefined) queryParams.sortBy = params.sortBy;

    return apiClient.get<GetCoursesResponse>('/api/courses/', {
      params: queryParams,
      skipAuth: true,
      signal: options?.signal,
    });
  },

  /**
   * Lấy thông tin chi tiết khóa học công khai theo slug
   * GET /api/courses/:slug
   */
  async getCourseBySlug(slug: string, options?: { signal?: AbortSignal }): Promise<GetCourseDetailResponse> {
    return apiClient.get<GetCourseDetailResponse>(`/api/courses/${encodeURIComponent(slug)}`, {
      skipAuth: true,
      signal: options?.signal,
    });
  },

  /**
   * Lấy danh sách khóa học của giảng viên hiện tại
   * GET /api/teacher/courses/
   */
  async getTeacherCourses(
    params?: GetTeacherCoursesParams,
    options?: { signal?: AbortSignal }
  ): Promise<GetTeacherCoursesResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.search !== undefined && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.status !== undefined && params.status !== 'all') queryParams.status = params.status;

    return apiClient.get<GetTeacherCoursesResponse>('/api/teacher/courses/', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Giảng viên tạo khóa học mới
   * POST /api/teacher/courses/
   */
  async createTeacherCourse(
    data: CreateTeacherCourseDto,
    options?: { signal?: AbortSignal }
  ): Promise<CreateTeacherCourseResponse> {
    return apiClient.post<CreateTeacherCourseResponse>('/api/teacher/courses/', data, {
      signal: options?.signal,
    });
  },

  /**
   * Giảng viên cập nhật khóa học của chính mình
   * PUT /api/teacher/courses/:id
   */
  async updateTeacherCourse(
    id: string,
    data: UpdateTeacherCourseDto,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateTeacherCourseResponse> {
    return apiClient.put<UpdateTeacherCourseResponse>(`/api/teacher/courses/${encodeURIComponent(id)}`, data, {
      signal: options?.signal,
    });
  },

  /**
   * Giảng viên xóa khóa học của chính mình (chỉ cho phép khi status === 'pending')
   * DELETE /api/teacher/courses/:id
   */
  async deleteTeacherCourse(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<DeleteTeacherCourseResponse> {
    return apiClient.delete<DeleteTeacherCourseResponse>(`/api/teacher/courses/${encodeURIComponent(id)}`, {
      signal: options?.signal,
    });
  },

  /**
   * Lấy chi tiết khóa học cho trang chỉnh sửa (Edit)
   * Thử gọi GET /api/teacher/courses/:id trước. Nếu không hỗ trợ, lấy từ danh sách khóa học của giảng viên.
   */
  async getTeacherCourseById(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherCourseItem | null> {
    // 1. Search in teacher's courses first (established endpoint)
    try {
      const listRes = await this.getTeacherCourses({ limit: 100 }, options);
      const found = listRes.data?.courses?.find((c) => c.id === id || c._id === id || c.slug === id);
      if (found) return found;
    } catch {
      // Ignore and proceed to direct/slug fallback
    }

    // 2. Direct endpoint if supported by backend in future
    try {
      const res = await apiClient.get<{ success: boolean; data: TeacherCourseItem }>(
        `/api/teacher/courses/${encodeURIComponent(id)}`,
        { signal: options?.signal }
      );
      if (res?.data) return res.data;
    } catch {
      // Endpoint may not exist on backend; fallback to public lookup
    }

    // 3. Fallback: If id is a slug or public course exists, load from getCourseBySlug
    try {
      const publicDetail = await this.getCourseBySlug(id, options);
      if (publicDetail?.data) {
        const d = publicDetail.data;
        return {
          id: d.id || d._id || d.slug,
          _id: d._id || d.id,
          title: d.title,
          slug: d.slug,
          price: d.price,
          oldPrice: d.oldPrice ?? d.old_price,
          status: d.status || 'pending',
          level: d.level,
          type: d.type,
          view: d.view,
          sold: d.sold,
          image: d.image,
          intro_url: d.intro_url || d.introUrl,
          description: d.description,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          category: d.category,
          info: d.info,
        };
      }
    } catch {
      // Not found
    }

    return null;
  },
};

export const teacherCourseService = courseService;
