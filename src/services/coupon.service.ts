import { apiClient } from '@/lib/api/client';
import {
  CheckCouponPayload,
  CheckCouponResponse,
  GetCouponsParams,
  GetCouponsResponse,
  GetCouponDetailResponse,
  CreateCouponDto,
  CreateCouponResponse,
  UpdateCouponDto,
  UpdateCouponResponse,
  DeleteCouponResponse,
} from '@/types/coupon';

/**
 * Coupon Service
 * Giao tiếp với các endpoint quản lý mã giảm giá theo api/COUPON_API.md
 */
export const couponService = {
  /**
   * Lấy danh sách mã giảm giá để quản lý
   * GET /api/coupons/
   * Business rule: Teacher chỉ xem được mã do chính mình tạo; Admin xem được toàn bộ.
   */
  async getCoupons(
    params?: GetCouponsParams,
    options?: { signal?: AbortSignal }
  ): Promise<GetCouponsResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.search !== undefined && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.active !== undefined) queryParams.active = params.active;

    return apiClient.get<GetCouponsResponse>('/api/coupons/', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Lấy thông tin chi tiết một mã giảm giá
   * GET /api/coupons/:id
   */
  async getCouponById(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<GetCouponDetailResponse> {
    return apiClient.get<GetCouponDetailResponse>(`/api/coupons/${encodeURIComponent(id)}`, {
      signal: options?.signal,
    });
  },

  /**
   * Tạo mã giảm giá mới
   * POST /api/coupons/
   * Business rule: Teacher bắt buộc phải chọn ít nhất 1 khóa học do chính mình sở hữu.
   */
  async createCoupon(
    data: CreateCouponDto,
    options?: { signal?: AbortSignal }
  ): Promise<CreateCouponResponse> {
    return apiClient.post<CreateCouponResponse>('/api/coupons/', data, {
      signal: options?.signal,
    });
  },

  /**
   * Cập nhật thông tin mã giảm giá
   * PUT /api/coupons/:id
   */
  async updateCoupon(
    id: string,
    data: UpdateCouponDto,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateCouponResponse> {
    return apiClient.put<UpdateCouponResponse>(`/api/coupons/${encodeURIComponent(id)}`, data, {
      signal: options?.signal,
    });
  },

  /**
   * Xóa mã giảm giá
   * DELETE /api/coupons/:id
   */
  async deleteCoupon(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<DeleteCouponResponse> {
    return apiClient.delete<DeleteCouponResponse>(`/api/coupons/${encodeURIComponent(id)}`, {
      signal: options?.signal,
    });
  },

  /**
   * Kiểm tra mã giảm giá trước khi đặt hàng
   * POST /api/coupons/use
   * @param payload { code, courseId }
   */
  async checkCoupon(
    payload: CheckCouponPayload,
    options?: { signal?: AbortSignal }
  ): Promise<CheckCouponResponse> {
    return apiClient.post<CheckCouponResponse>('/api/coupons/use', payload, {
      signal: options?.signal,
    });
  },
};

