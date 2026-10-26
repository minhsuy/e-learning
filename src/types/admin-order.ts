/**
 * TMDEMY — Admin Order Types
 * Strictly reflects api/ORDER_API.md and api/API_ENUM_REFERENCE.md
 */
import { OrderStatus } from './order';

export interface AdminOrderCourse {
  id?: string;
  _id?: string;
  title: string;
  slug?: string;
  image?: string;
  price?: number;
}

export interface AdminOrderCoupon {
  id?: string;
  _id?: string;
  code?: string;
  title?: string;
  value?: number;
  type?: string;
}

export interface AdminOrderUser {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface AdminOrderItem {
  id: string;
  _id?: string;
  code: string;
  amount: number;
  discount: number;
  total: number;
  status: OrderStatus;
  couponId?: string | null;
  courseId?: string | null;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  rejectedReason?: string | null;
  rejectedAt?: string | null;
  course?: AdminOrderCourse;
  coupon?: AdminOrderCoupon | null;
  user?: AdminOrderUser;
}

export interface AdminOrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminOrdersListResponse {
  success: boolean;
  message?: string;
  data: {
    orders: AdminOrderItem[];
    pagination: AdminOrdersPagination;
  };
}

export interface UpdateAdminOrderStatusPayload {
  status: 'completed' | 'rejected';
  rejectedReason?: string;
}

export interface AdminOrderMutationResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    code?: string;
    status: string;
    rejectedReason?: string | null;
    rejectedAt?: string | null;
  };
}

export interface AdminOrderKpis {
  totalOrders: number | null;
  completedOrders: number | null;
  pendingOrders: number | null;
  rejectedOrders: number | null;
  totalRevenue: number | null;
  grossRevenue?: number | null;
  netRevenue?: number | null;
  averageOrderValue?: number | null;
}

export interface AdminFinancialMonthlyRevenue {
  month: string;
  revenue: number;
  orderCount: number;
}

export interface AdminFinancialStatsData {
  grossRevenue: number;
  netRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  rejectedOrders: number;
  averageOrderValue: number;
  revenueByMonth: AdminFinancialMonthlyRevenue[];
}

export interface AdminFinancialStatsResponse {
  success: boolean;
  message?: string;
  data: AdminFinancialStatsData;
}

export interface GetAdminOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
}

export interface GetAdminFinancialStatsParams {
  timeRange?: 'all' | '7days' | '30days' | '1year' | string;
  startDate?: string;
  endDate?: string;
}

export type OrderFilterStatus = 'all' | 'completed' | 'pending' | 'rejected';
