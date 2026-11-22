/**
 * TMDEMY — Admin Order Types
 * Strictly reflects api/ORDER_API.md and api/API_ENUM_REFERENCE.md
 */
import { OrderStatus, GetTeacherOrdersParams } from './order';

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
  paymentMethod?: string | null;
  paymentCode?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
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

export type AnalyticsTimeRange = '7days' | '30days' | '12months' | '1year' | 'custom' | 'all';
export type AnalyticsTimeBasis = 'createdAt' | 'recognizedAt' | 'paidAt';
export type AnalyticsTimezone = 'Asia/Ho_Chi_Minh' | 'UTC';
export type AnalyticsPaymentMethodFilter =
  | 'all'
  | 'sepay_bank_transfer'
  | 'manual_bank_transfer'
  | 'free'
  | 'legacy_unknown';
export type AnalyticsGranularity = 'day' | 'month';

export interface AdminFinancialMonthlyRevenue {
  month: string;
  revenue: number;
  orderCount: number;
}

export interface AdminFinancialReportingMeta {
  timeBasis: AnalyticsTimeBasis | string;
  timezone: AnalyticsTimezone | string;
  startDate: string | null;
  endDate: string | null;
  granularity: AnalyticsGranularity | string;
  legacyEstimatedOrders: number;
  undatedLegacyOrders: number;
}

export interface AdminPaymentMethodBreakdownItem {
  paymentMethod: string;
  completedOrders: number;
  revenue: number;
}

export interface AdminRevenueTimelineItem {
  date: string;
  revenue: number;
  orderCount: number;
  ordersCount?: number;
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
  // Additive STEP 08.2 fields
  paidOrders?: number;
  freeOrders?: number;
  totalDiscount?: number;
  reporting?: AdminFinancialReportingMeta;
  methodBreakdown?: AdminPaymentMethodBreakdownItem[];
  revenueTimeline?: AdminRevenueTimelineItem[];
}

export interface AdminFinancialStatsResponse {
  success: boolean;
  message?: string;
  data: AdminFinancialStatsData;
}

export interface GetAdminOrdersParams extends GetTeacherOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  paymentMethod?: string;
  courseId?: string;
  createdFrom?: string;
  createdTo?: string;
  paidFrom?: string;
  paidTo?: string;
}

export interface GetAdminFinancialStatsParams {
  timeRange?: AnalyticsTimeRange | string;
  startDate?: string;
  endDate?: string;
  timeBasis?: AnalyticsTimeBasis;
  timezone?: AnalyticsTimezone;
  paymentMethod?: AnalyticsPaymentMethodFilter;
  granularity?: AnalyticsGranularity;
  teacherId?: string;
  courseId?: string;
}

export type AdminSalesGroupBy = 'course' | 'teacher';
export type AdminSalesSortBy = 'revenue' | 'completedOrders' | 'grossSales';

export interface GetAdminSalesBreakdownParams {
  groupBy?: AdminSalesGroupBy;
  timeRange?: AnalyticsTimeRange | string;
  startDate?: string;
  endDate?: string;
  timeBasis?: AnalyticsTimeBasis;
  timezone?: AnalyticsTimezone;
  paymentMethod?: AnalyticsPaymentMethodFilter;
  page?: number;
  limit?: number;
  sortBy?: AdminSalesSortBy;
  order?: 'asc' | 'desc';
}

export interface AdminSalesBreakdownRow {
  id: string | null;
  label: string;
  revenue: number;
  grossSales: number;
  discount: number;
  completedOrders: number;
  paidOrders: number;
  freeOrders: number;
  courseCount?: number;
  teacher?: {
    id: string;
    name: string;
  } | null;
}

export interface AdminSalesBreakdownReportingMeta {
  groupBy: AdminSalesGroupBy;
  timeBasis: AnalyticsTimeBasis | string;
  timezone: AnalyticsTimezone | string;
  startDate: string | null;
  endDate: string | null;
}

export interface AdminSalesBreakdownData {
  reporting: AdminSalesBreakdownReportingMeta;
  rows: AdminSalesBreakdownRow[];
  pagination: AdminOrdersPagination;
}

export interface AdminSalesBreakdownResponse {
  success: boolean;
  message?: string;
  data: AdminSalesBreakdownData;
}

export interface OrderPaymentSummary {
  paymentMethod: string | null;
  paymentCode: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  isPaid: boolean;
  transactionCount: number;
  totalTransferred: number;
}

export interface OrderPaymentTransaction {
  id: string;
  provider: string;
  gateway: string | null;
  transactionDate: string | null;
  transferType: string;
  transferAmount: number;
  paymentCode: string | null;
  status: string;
  createdAt: string;
  processedAt: string | null;
  referenceCode?: string | null;
}

export interface AdminOrderDetailData {
  order: AdminOrderItem;
  paymentSummary: OrderPaymentSummary;
  transactions: OrderPaymentTransaction[];
}

export interface AdminOrderDetailResponse {
  success: boolean;
  message?: string;
  data: AdminOrderDetailData;
}

export type OrderFilterStatus = 'all' | 'completed' | 'pending' | 'rejected';
