import { apiClient } from '@/lib/api/client';
import { AppApiError } from '@/types/api';
import {
  AdminFinancialStatsResponse,
  AdminOrderDetailResponse,
  AdminOrderKpis,
  AdminOrdersListResponse,
  AdminOrderMutationResponse,
  AdminSalesBreakdownResponse,
  GetAdminFinancialStatsParams,
  GetAdminOrdersParams,
  GetAdminSalesBreakdownParams,
  UpdateAdminOrderStatusPayload,
} from '@/types/admin-order';

/**
 * Standardized error normalizer for Order API operations
 * Strictly handles HTTP 400, 401, 403, 404, 409, 422, 500, Network and Timeout errors
 */
export function normalizeOrderApiError(err: unknown, defaultMsg: string): string {
  if (err instanceof AppApiError) {
    switch (err.statusCode) {
      case 400: {
        const msg = err.message || '';
        if (msg.includes('already enrolled')) {
          return 'Học viên đã được ghi danh vào khóa học này từ trước.';
        }
        if (msg.includes('pending order')) {
          return 'Đã có đơn hàng đang chờ xử lý cho khóa học này.';
        }
        return err.message || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin đơn hàng.';
      }
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này (yêu cầu quyền Quản trị viên).';
      case 404:
        return 'Đơn hàng không tồn tại hoặc đã bị hủy khỏi hệ thống.';
      case 409:
        return 'Xung đột trạng thái đơn hàng. Vui lòng tải lại trang và thử lại.';
      case 422:
        return err.message || 'Dữ liệu đơn hàng không thỏa mãn quy tắc ràng buộc.';
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
      return 'Lỗi kết nối mạng. Không thể liên lạc với máy chủ TMdemy.';
    }
    if (err.message.includes('timeout') || err.message.includes('aborted')) {
      return 'Yêu cầu quá thời gian chờ (Timeout). Vui lòng thử lại.';
    }
    return err.message;
  }

  return defaultMsg;
}

/**
 * Normalizes order status to standard uppercase
 */
export function normalizeOrderStatus(status: string | undefined): 'PENDING' | 'COMPLETED' | 'REJECTED' {
  if (!status) return 'PENDING';
  const upper = status.toUpperCase();
  if (upper === 'COMPLETED') return 'COMPLETED';
  if (upper === 'REJECTED') return 'REJECTED';
  return 'PENDING';
}

/**
 * Format currency VND
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const adminOrderService = {
  /**
   * Lấy danh sách toàn bộ đơn hàng trong hệ thống (dành cho Admin)
   * GET /api/orders/
   */
  async getOrders(
    params?: GetAdminOrdersParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminOrdersListResponse> {
    const queryParams: Record<string, string | number | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.status && params.status !== 'all') queryParams.status = params.status.toLowerCase();
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    for (const key of ['paymentMethod', 'courseId', 'createdFrom', 'createdTo', 'paidFrom', 'paidTo', 'sortOrder'] as const) {
      if (params?.[key]) queryParams[key] = params[key];
    }

    return apiClient.get<AdminOrdersListResponse>('/api/orders/', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * Xem chi tiết đơn hàng (chỉ đọc) kèm tóm tắt thanh toán và lịch sử giao dịch đã lọc an toàn
   * GET /api/orders/:id (STEP 08.2)
   */
  async getOrderDetail(
    orderId: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminOrderDetailResponse> {
    return apiClient.get<AdminOrderDetailResponse>(
      `/api/orders/${encodeURIComponent(orderId)}`,
      {
        signal: options?.signal,
        cache: 'no-store',
      }
    );
  },

  /**
   * Cập nhật trạng thái đơn hàng (xác nhận COMPLETED hoặc từ chối REJECTED)
   * PUT /api/orders/:id
   */
  async updateOrderStatus(
    orderId: string,
    payload: UpdateAdminOrderStatusPayload,
    options?: { signal?: AbortSignal }
  ): Promise<AdminOrderMutationResponse> {
    return apiClient.put<AdminOrderMutationResponse>(
      `/api/orders/${encodeURIComponent(orderId)}`,
      payload,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Lấy thống kê tài chính và doanh thu toàn sàn cho Admin (BE-F9.11-001 + STEP 08.2)
   * GET /api/admin/statistics/financial
   */
  async getFinancialStats(
    params?: GetAdminFinancialStatsParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminFinancialStatsResponse> {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.timeRange) queryParams.timeRange = params.timeRange;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.timeBasis) queryParams.timeBasis = params.timeBasis;
    if (params?.timezone) queryParams.timezone = params.timezone;
    if (params?.paymentMethod) queryParams.paymentMethod = params.paymentMethod;
    if (params?.granularity) queryParams.granularity = params.granularity;
    if (params?.teacherId) queryParams.teacherId = params.teacherId;
    if (params?.courseId) queryParams.courseId = params.courseId;

    return apiClient.get<AdminFinancialStatsResponse>(
      '/api/admin/statistics/financial',
      {
        params: queryParams,
        signal: options?.signal,
        cache: 'no-store',
      }
    );
  },

  /**
   * Báo cáo phân rã doanh số toàn sàn theo Khóa học hoặc Giảng viên (STEP 08.2)
   * GET /api/admin/statistics/sales
   */
  async getSalesBreakdown(
    params?: GetAdminSalesBreakdownParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminSalesBreakdownResponse> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.groupBy) queryParams.groupBy = params.groupBy;
    if (params?.timeRange) queryParams.timeRange = params.timeRange;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.timeBasis) queryParams.timeBasis = params.timeBasis;
    if (params?.timezone) queryParams.timezone = params.timezone;
    if (params?.paymentMethod) queryParams.paymentMethod = params.paymentMethod;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.order) queryParams.order = params.order;

    return apiClient.get<AdminSalesBreakdownResponse>(
      '/api/admin/statistics/sales',
      {
        params: queryParams,
        signal: options?.signal,
        cache: 'no-store',
      }
    );
  },

  /**
   * Lấy số liệu thống kê KPI tổng quan cho Admin
   * Ưu tiên sử dụng API Thống kê tài chính toàn sàn (BE-F9.11-001)
   */
  async getOrderKpis(options?: { signal?: AbortSignal }): Promise<AdminOrderKpis> {
    try {
      // 1. Thử gọi API thống kê tài chính aggregate chuẩn xác từ backend
      const statsRes = await this.getFinancialStats({ timeRange: 'all' }, options);
      if (statsRes.success && statsRes.data) {
        const d = statsRes.data;
        return {
          totalOrders: d.totalOrders ?? null,
          completedOrders: d.completedOrders ?? null,
          pendingOrders: d.pendingOrders ?? null,
          rejectedOrders: d.rejectedOrders ?? null,
          totalRevenue: d.netRevenue ?? d.grossRevenue ?? null,
          grossRevenue: d.grossRevenue ?? null,
          netRevenue: d.netRevenue ?? null,
          averageOrderValue: d.averageOrderValue ?? null,
        };
      }
    } catch {
      // Fallback nếu API thống kê gặp lỗi mạng
    }

    // Fallback: tính toán qua phân trang
    try {
      const [totalRes, completedRes, pendingRes, rejectedRes] =
        await Promise.allSettled([
          this.getOrders({ limit: 1 }, options),
          this.getOrders({ limit: 1, status: 'completed' }, options),
          this.getOrders({ limit: 1, status: 'pending' }, options),
          this.getOrders({ limit: 1, status: 'rejected' }, options),
        ]);

      const totalOrders =
        totalRes.status === 'fulfilled' ? totalRes.value.data.pagination.total : null;
      const completedOrders =
        completedRes.status === 'fulfilled' ? completedRes.value.data.pagination.total : null;
      const pendingOrders =
        pendingRes.status === 'fulfilled' ? pendingRes.value.data.pagination.total : null;
      const rejectedOrders =
        rejectedRes.status === 'fulfilled' ? rejectedRes.value.data.pagination.total : null;

      return {
        totalOrders,
        completedOrders,
        pendingOrders,
        rejectedOrders,
        totalRevenue: null,
      };
    } catch {
      return {
        totalOrders: null,
        completedOrders: null,
        pendingOrders: null,
        rejectedOrders: null,
        totalRevenue: null,
      };
    }
  },
};
