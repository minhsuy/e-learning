import { apiClient } from '@/lib/api/client';
import {
  CreateOrderPayload,
  CreateOrderResponse,
  GetMyOrdersParams,
  GetMyOrdersResponse,
  GetTeacherOrdersParams,
  GetTeacherOrdersResponse,
  UpdateOrderStatusPayload,
  UpdateOrderStatusResponse,
} from '@/types/order';

/**
 * Order Service
 * Giao tiếp với endpoint đơn hàng theo đặc tả api/ORDER_API.md và F8.8 Teacher Orders
 */
export const orderService = {
  /**
   * Tạo đơn hàng mới cho học viên
   * POST /api/orders
   * @param payload { courseId, couponCode? }
   */
  async createOrder(
    payload: CreateOrderPayload,
    options?: { signal?: AbortSignal }
  ): Promise<CreateOrderResponse> {
    return apiClient.post<CreateOrderResponse>('/api/orders', payload, {
      signal: options?.signal,
    });
  },

  /**
   * Lấy lịch sử các đơn hàng của học viên hiện tại
   * GET /api/orders/my
   */
  async getMyOrders(
    params?: GetMyOrdersParams,
    options?: { signal?: AbortSignal }
  ): Promise<GetMyOrdersResponse> {
    return apiClient.get<GetMyOrdersResponse>('/api/orders/my', {
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
      },
      signal: options?.signal,
    });
  },

  /**
   * Lấy danh sách đơn hàng cho Giảng viên (chỉ các khóa học do giảng viên sở hữu)
   * GET /api/orders/
   */
  async getTeacherOrders(
    params?: GetTeacherOrdersParams,
    options?: { signal?: AbortSignal }
  ): Promise<GetTeacherOrdersResponse> {
    const queryParams: Record<string, string | number | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.sortBy) queryParams.sortBy = params.sortBy;

    return apiClient.get<GetTeacherOrdersResponse>('/api/orders/', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Cập nhật trạng thái đơn hàng (xác nhận hoặc từ chối)
   * PUT /api/orders/:id
   */
  async updateOrderStatus(
    orderId: string,
    payload: UpdateOrderStatusPayload,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateOrderStatusResponse> {
    return apiClient.put<UpdateOrderStatusResponse>(`/api/orders/${encodeURIComponent(orderId)}`, payload, {
      signal: options?.signal,
    });
  },
};
