import { apiClient } from '@/lib/api/client';
import { ApiPagination } from '@/types/api';
import {
  AdminCourseSummary,
  AdminOrderSummary,
  AdminUserSummary,
} from '@/types/admin-dashboard';

export interface AdminUsersApiResponse {
  success: boolean;
  message?: string;
  data: {
    users: AdminUserSummary[];
    pagination: ApiPagination;
  };
}

export interface AdminCoursesApiResponse {
  success: boolean;
  message?: string;
  data: {
    courses: AdminCourseSummary[];
    pagination: ApiPagination;
  };
}

export interface AdminOrdersApiResponse {
  success: boolean;
  message?: string;
  data: {
    orders: AdminOrderSummary[];
    pagination: ApiPagination;
  };
}

export interface AdminKpiTotals {
  totalUsers: number | null;
  totalTeachers: number | null;
  totalStudents?: number | null;
  totalCourses: number | null;
  pendingCourses: number | null;
  approvedCourses?: number | null;
  totalOrders: number | null;
  pendingOrders: number | null;
  completedOrders?: number | null;
  totalComments?: number | null;
  totalCoupons?: number | null;
  totalRevenue?: number | null;
  conversionRate?: number | null;
}

export const adminDashboardService = {
  /**
   * Lấy dữ liệu tổng quan Admin Dashboard tập trung trong 1 API call (BE-F9.11-007)
   * GET /api/admin/dashboard/summary
   */
  async getDashboardSummary(
    options?: { signal?: AbortSignal }
  ): Promise<import('@/types/admin-dashboard').AdminDashboardSummaryResponse> {
    return apiClient.get<import('@/types/admin-dashboard').AdminDashboardSummaryResponse>(
      '/api/admin/dashboard/summary',
      { signal: options?.signal }
    );
  },
  /**
   * Lấy danh sách người dùng phân trang (cho Admin)
   */
  async getUsers(
    params?: {
      page?: number;
      limit?: number;
      role?: string;
      search?: string;
      status?: string;
      sortBy?: string;
    },
    options?: { signal?: AbortSignal }
  ): Promise<AdminUsersApiResponse> {
    return apiClient.get<AdminUsersApiResponse>('/api/admin/users', {
      params: {
        page: params?.page,
        limit: params?.limit,
        role: params?.role,
        search: params?.search,
        status: params?.status,
        sortBy: params?.sortBy,
      },
      signal: options?.signal,
    });
  },

  /**
   * Lấy danh sách khóa học phân trang (cho Admin)
   */
  async getCourses(
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      categoryId?: string;
      sortBy?: string;
    },
    options?: { signal?: AbortSignal }
  ): Promise<AdminCoursesApiResponse> {
    return apiClient.get<AdminCoursesApiResponse>('/api/admin/courses', {
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
        search: params?.search,
        categoryId: params?.categoryId,
        sortBy: params?.sortBy,
      },
      signal: options?.signal,
    });
  },

  /**
   * Lấy danh sách đơn hàng phân trang
   */
  async getOrders(
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      sortBy?: string;
    },
    options?: { signal?: AbortSignal }
  ): Promise<AdminOrdersApiResponse> {
    return apiClient.get<AdminOrdersApiResponse>('/api/orders/', {
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
        search: params?.search,
        sortBy: params?.sortBy,
      },
      signal: options?.signal,
    });
  },

  /**
   * Lấy danh sách bình luận (cho Admin giám sát)
   */
  async getComments(
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    },
    options?: { signal?: AbortSignal }
  ): Promise<{ success: boolean; data: { comments: unknown[]; pagination: ApiPagination } }> {
    return apiClient.get('/api/comments/', {
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
        search: params?.search,
      },
      signal: options?.signal,
    });
  },

  /**
   * Lấy danh sách mã giảm giá (cho Admin thống kê)
   */
  async getCoupons(
    params?: {
      page?: number;
      limit?: number;
      search?: string;
    },
    options?: { signal?: AbortSignal }
  ): Promise<{ success: boolean; data: { coupons: unknown[]; pagination: ApiPagination } }> {
    return apiClient.get('/api/coupons/', {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
      },
      signal: options?.signal,
    });
  },

  /**
   * Lấy toàn bộ KPI counts cùng lúc một cách an toàn
   * Ưu tiên gọi API tổng hợp GET /api/admin/dashboard/summary (BE-F9.11-007)
   */
  async getAllKpiTotals(options?: { signal?: AbortSignal }): Promise<AdminKpiTotals> {
    try {
      const summaryRes = await this.getDashboardSummary(options);
      if (summaryRes.success && summaryRes.data) {
        const { counts, financials } = summaryRes.data;
        return {
          totalUsers: counts.totalUsers ?? null,
          totalTeachers: counts.totalTeachers ?? null,
          totalStudents: counts.totalStudents ?? null,
          totalCourses: counts.totalCourses ?? null,
          pendingCourses: counts.pendingCourses ?? null,
          approvedCourses: counts.approvedCourses ?? null,
          totalOrders: counts.totalOrders ?? null,
          pendingOrders: counts.pendingOrders ?? null,
          completedOrders: counts.completedOrders ?? null,
          totalComments: counts.totalComments ?? null,
          totalCoupons: null,
          totalRevenue: financials?.totalRevenue ?? null,
          conversionRate: financials?.conversionRate ?? null,
        };
      }
    } catch {
      // Fallback nếu API summary gặp sự cố
    }

    // Fallback: Gọi đa truy vấn song song độc lập
    const results = await Promise.allSettled([
      // 0. Tổng người dùng
      this.getUsers({ limit: 1 }, options),
      // 1. Tổng giảng viên
      this.getUsers({ limit: 1, role: 'teacher' }, options),
      // 2. Tổng học viên
      this.getUsers({ limit: 1, role: 'user' }, options),
      // 3. Tổng khóa học
      this.getCourses({ limit: 1 }, options),
      // 4. Khóa học chờ duyệt
      this.getCourses({ limit: 1, status: 'pending' }, options),
      // 5. Khóa học đã duyệt
      this.getCourses({ limit: 1, status: 'approved' }, options),
      // 6. Tổng đơn hàng
      this.getOrders({ limit: 1 }, options),
      // 7. Đơn hàng chờ xử lý
      this.getOrders({ limit: 1, status: 'pending' }, options),
      // 8. Đơn hàng hoàn tất
      this.getOrders({ limit: 1, status: 'completed' }, options),
      // 9. Tổng bình luận
      this.getComments({ limit: 1 }, options),
      // 10. Tổng mã giảm giá
      this.getCoupons({ limit: 1 }, options),
    ]);

    type KpiSettledResponse = {
      data?: {
        pagination?: {
          total?: number | string;
        };
      };
    };

    const extractTotal = (res: PromiseSettledResult<KpiSettledResponse>): number | null => {
      if (res.status === 'fulfilled' && res.value?.data?.pagination?.total !== undefined) {
        return Number(res.value.data.pagination.total);
      }
      return null;
    };

    return {
      totalUsers: extractTotal(results[0]),
      totalTeachers: extractTotal(results[1]),
      totalStudents: extractTotal(results[2]),
      totalCourses: extractTotal(results[3]),
      pendingCourses: extractTotal(results[4]),
      approvedCourses: extractTotal(results[5]),
      totalOrders: extractTotal(results[6]),
      pendingOrders: extractTotal(results[7]),
      completedOrders: extractTotal(results[8]),
      totalComments: extractTotal(results[9]),
      totalCoupons: extractTotal(results[10]),
      totalRevenue: null,
      conversionRate: null,
    };
  },

  /**
   * Lấy top 5 khóa học đang chờ phê duyệt
   */
  async getPendingCourses(limit = 5, options?: { signal?: AbortSignal }): Promise<AdminCourseSummary[]> {
    const res = await this.getCourses({ limit, status: 'pending', sortBy: 'createdAt' }, options);
    return res.data?.courses || [];
  },

  /**
   * Lấy top 5 người dùng mới đăng ký
   */
  async getRecentUsers(limit = 5, options?: { signal?: AbortSignal }): Promise<AdminUserSummary[]> {
    const res = await this.getUsers({ limit, sortBy: 'createdAt' }, options);
    return res.data?.users || [];
  },

  /**
   * Lấy top 5 đơn hàng chờ xử lý
   */
  async getPendingOrders(limit = 5, options?: { signal?: AbortSignal }): Promise<AdminOrderSummary[]> {
    const res = await this.getOrders({ limit, status: 'pending', sortBy: 'createdAt' }, options);
    return res.data?.orders || [];
  },
};
