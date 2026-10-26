import { apiClient } from '@/lib/api/client';
import { AppApiError } from '@/types/api';
import {
  AdminCouponItem,
  AdminCouponKpis,
  AdminCouponsListResponse,
  AdminCouponDetailResponse,
  AdminCouponMutationResponse,
  GetAdminCouponsParams,
  CreateAdminCouponDto,
  UpdateAdminCouponDto,
  CouponValidityStatus,
} from '@/types/admin-coupon';

/**
 * Standardized error normalizer for Coupon API operations
 * Strictly handles HTTP 400, 401, 403, 404, 409, 422, 500, Network and Timeout errors
 */
export function normalizeCouponApiError(err: unknown, defaultMsg: string): string {
  if (err instanceof AppApiError) {
    switch (err.statusCode) {
      case 400: {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
          return 'Mã giảm giá này đã tồn tại trên hệ thống. Vui lòng chọn một mã khác.';
        }
        if (msg.toLowerCase().includes('date') || msg.toLowerCase().includes('start') || msg.toLowerCase().includes('end')) {
          return 'Thời gian áp dụng không hợp lệ (ngày kết thúc phải sau ngày bắt đầu).';
        }
        if (msg.toLowerCase().includes('limit')) {
          return 'Giới hạn số lượt sử dụng không hợp lệ.';
        }
        return err.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.';
      }
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này (yêu cầu quyền Quản trị viên).';
      case 404:
        return 'Mã giảm giá không tồn tại hoặc đã bị xóa khỏi hệ thống.';
      case 409:
        return 'Mã giảm giá đã tồn tại hoặc có xung đột dữ liệu trên hệ thống.';
      case 422:
        return err.message || 'Dữ liệu cấu hình mã giảm giá không hợp lệ.';
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
      return 'Lỗi kết nối mạng. Không thể liên lạc với máy chủ máy chủ TMdemy.';
    }
    if (err.message.includes('timeout') || err.message.includes('aborted')) {
      return 'Yêu cầu quá thời gian chờ (Timeout). Vui lòng kiểm tra lại mạng.';
    }
    return err.message;
  }

  return defaultMsg;
}

/**
 * Evaluates the actual business validity status of a coupon
 */
export function getCouponValidityStatus(coupon: AdminCouponItem): CouponValidityStatus {
  if (!coupon.active) return 'disabled';

  const now = new Date().getTime();

  if (coupon.startDate) {
    const start = new Date(coupon.startDate).getTime();
    if (!isNaN(start) && now < start) {
      return 'upcoming';
    }
  }

  if (coupon.endDate) {
    const end = new Date(coupon.endDate).getTime();
    if (!isNaN(end) && now > end) {
      return 'expired';
    }
  }

  if (
    typeof coupon.limit === 'number' &&
    coupon.limit > 0 &&
    typeof coupon.used === 'number' &&
    coupon.used >= coupon.limit
  ) {
    return 'exhausted';
  }

  return 'active';
}

/**
 * Formats coupon discount value
 */
export function formatCouponDiscount(type: string, value: number): string {
  const isPercentage = (type || '').toLowerCase() === 'percentage';
  if (isPercentage) {
    return `${value}%`;
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export const adminCouponService = {
  /**
   * Lấy danh sách mã giảm giá phân trang, hỗ trợ tìm kiếm và lọc trạng thái
   * GET /api/coupons/
   */
  async getCoupons(
    params?: GetAdminCouponsParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCouponsListResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.active !== undefined) queryParams.active = params.active;

    return apiClient.get<AdminCouponsListResponse>('/api/coupons/', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Lấy chi tiết thông tin một mã giảm giá kèm danh sách khóa học và tác giả
   * GET /api/coupons/:id
   */
  async getCouponById(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCouponDetailResponse> {
    return apiClient.get<AdminCouponDetailResponse>(`/api/coupons/${encodeURIComponent(id)}`, {
      signal: options?.signal,
    });
  },

  /**
   * Tạo mã giảm giá mới
   * POST /api/coupons/
   */
  async createCoupon(
    data: CreateAdminCouponDto,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCouponMutationResponse> {
    return apiClient.post<AdminCouponMutationResponse>('/api/coupons/', data, {
      signal: options?.signal,
    });
  },

  /**
   * Cập nhật thông tin mã giảm giá
   * PUT /api/coupons/:id
   */
  async updateCoupon(
    id: string,
    data: UpdateAdminCouponDto,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCouponMutationResponse> {
    return apiClient.put<AdminCouponMutationResponse>(
      `/api/coupons/${encodeURIComponent(id)}`,
      data,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Bật/Tắt nhanh trạng thái kích hoạt của mã giảm giá
   */
  async toggleCouponActive(
    id: string,
    currentActive: boolean,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCouponMutationResponse> {
    return this.updateCoupon(id, { active: !currentActive }, options);
  },

  /**
   * Xóa vĩnh viễn mã giảm giá khỏi hệ thống
   * DELETE /api/coupons/:id
   */
  async deleteCoupon(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/api/coupons/${encodeURIComponent(id)}`,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Lấy số liệu thống kê mã giảm giá toàn sàn cho Admin (BE-F9.11-005)
   * GET /api/coupons/admin/statistics
   */
  async getCouponStatistics(
    options?: { signal?: AbortSignal }
  ): Promise<import('@/types/admin-coupon').AdminCouponStatisticsResponse> {
    return apiClient.get<import('@/types/admin-coupon').AdminCouponStatisticsResponse>(
      '/api/coupons/admin/statistics',
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Lấy số liệu thống kê KPI tổng quan cho Admin
   * Ưu tiên sử dụng API Thống kê coupon aggregate toàn sàn (BE-F9.11-005)
   */
  async getCouponKpis(options?: { signal?: AbortSignal }): Promise<AdminCouponKpis> {
    try {
      const statsRes = await this.getCouponStatistics(options);
      if (statsRes.success && statsRes.data) {
        const d = statsRes.data;
        return {
          totalCoupons: d.totalCoupons ?? null,
          activeCoupons: d.activeCoupons ?? null,
          inactiveCoupons: d.disabledCoupons ?? null,
          totalUsed: d.totalUsageCount ?? null,
          totalLimit: null,
          expiredCoupons: d.expiredCoupons ?? null,
          disabledCoupons: d.disabledCoupons ?? null,
          totalDiscountAmount: d.totalDiscountAmount ?? null,
        };
      }
    } catch {
      // Fallback nếu API thống kê gặp sự cố
    }

    try {
      const [totalRes, activeRes, inactiveRes, listRes] = await Promise.allSettled([
        this.getCoupons({ limit: 1 }, options),
        this.getCoupons({ limit: 1, active: true }, options),
        this.getCoupons({ limit: 1, active: false }, options),
        this.getCoupons({ limit: 100 }, options),
      ]);

      const totalCoupons =
        totalRes.status === 'fulfilled' ? totalRes.value.data.pagination.total : null;
      const activeCoupons =
        activeRes.status === 'fulfilled' ? activeRes.value.data.pagination.total : null;
      const inactiveCoupons =
        inactiveRes.status === 'fulfilled' ? inactiveRes.value.data.pagination.total : null;

      let totalUsed: number | null = null;
      let totalLimit: number | null = null;

      if (listRes.status === 'fulfilled') {
        const coupons = listRes.value.data.coupons || [];
        totalUsed = coupons.reduce((sum, c) => sum + (c.used || 0), 0);
        totalLimit = coupons.reduce((sum, c) => sum + (c.limit || 0), 0);
      }

      return {
        totalCoupons,
        activeCoupons,
        inactiveCoupons,
        totalUsed,
        totalLimit,
      };
    } catch {
      return {
        totalCoupons: null,
        activeCoupons: null,
        inactiveCoupons: null,
        totalUsed: null,
        totalLimit: null,
      };
    }
  },
};
