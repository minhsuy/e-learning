/**
 * Order API Contract Types
 * Strictly reflects api/ORDER_API.md and F7_1_ORDER_ENROLLMENT_BACKEND_VERIFICATION.md
 */
import { ApiPagination, ApiResponse } from './api';

export type OrderStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'pending'
  | 'completed'
  | 'rejected';

export interface ApiOrderItem {
  id?: string;
  _id?: string;
  code?: string;
  amount: number;
  discount: number;
  total: number;
  status: OrderStatus;
  couponId?: string | null;
  courseId: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  course?: {
    id?: string;
    _id?: string;
    title: string;
    slug?: string;
    image?: string;
    price?: number;
  };
  coupon?: {
    id?: string;
    code?: string;
    title?: string;
  } | null;
  user?: {
    id?: string;
    _id?: string;
    username?: string;
    email?: string;
  };
}

export interface CreateOrderPayload {
  courseId: string;
  couponCode?: string;
}

export interface CreateOrderResponse extends ApiResponse<ApiOrderItem> {
  statusCode?: number;
}

export interface GetMyOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface GetMyOrdersData {
  orders: ApiOrderItem[];
  pagination: ApiPagination;
}

export type GetMyOrdersResponse = ApiResponse<GetMyOrdersData>;

/**
 * Teacher / Admin Orders Listing
 * GET /api/orders/
 */
export interface GetTeacherOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
}

export interface GetTeacherOrdersData {
  orders: ApiOrderItem[];
  pagination: ApiPagination;
}

export type GetTeacherOrdersResponse = ApiResponse<GetTeacherOrdersData>;

/**
 * Update Order Status
 * PUT /api/orders/:id
 */
export interface UpdateOrderStatusPayload {
  status: 'completed' | 'rejected';
}

export interface UpdateOrderStatusData {
  id: string;
  status: string;
}

export type UpdateOrderStatusResponse = ApiResponse<UpdateOrderStatusData>;
