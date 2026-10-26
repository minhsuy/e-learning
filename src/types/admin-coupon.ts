/**
 * TMDEMY — Admin Coupon Types
 * Strictly reflects api/COUPON_API.md and verified backend contract
 */
import { CouponType, CouponCourseInfo, CouponAuthorInfo } from './coupon';

export interface AdminCouponItem {
  id: string;
  _id?: string;
  title: string;
  code: string;
  type: CouponType;
  value: number;
  limit?: number | null;
  used?: number;
  startDate?: string | null;
  endDate?: string | null;
  active: boolean;
  courses?: Array<CouponCourseInfo | string>;
  courseIds?: string[];
  authorId?: string;
  author?: CouponAuthorInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCouponsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminCouponsListResponse {
  success: boolean;
  message?: string;
  data: {
    coupons: AdminCouponItem[];
    pagination: AdminCouponsPagination;
  };
}

export interface AdminCouponDetailResponse {
  success: boolean;
  message?: string;
  data: AdminCouponItem;
}

export interface AdminCouponMutationResponse {
  success: boolean;
  message: string;
  data?: AdminCouponItem;
}

export interface AdminCouponKpis {
  totalCoupons: number | null;
  activeCoupons: number | null;
  inactiveCoupons: number | null;
  totalUsed: number | null;
  totalLimit: number | null;
  expiredCoupons?: number | null;
  disabledCoupons?: number | null;
  totalDiscountAmount?: number | null;
}

export interface AdminCouponStatisticsData {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  disabledCoupons: number;
  totalUsageCount: number;
  totalDiscountAmount: number;
}

export interface AdminCouponStatisticsResponse {
  success: boolean;
  message?: string;
  data: AdminCouponStatisticsData;
}

export interface GetAdminCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export interface CreateAdminCouponDto {
  title: string;
  code: string;
  type: 'percentage' | 'number';
  value: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  courses: string[]; // empty [] indicates platform-wide (all courses)
}

export interface UpdateAdminCouponDto {
  title?: string;
  code?: string;
  type?: 'percentage' | 'number';
  value?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  courses?: string[];
}

export type CouponValidityStatus =
  | 'active'
  | 'upcoming'
  | 'expired'
  | 'exhausted'
  | 'disabled';

export type CouponFilterStatus = 'all' | 'active' | 'inactive';
export type CouponFilterType = 'all' | 'percentage' | 'number';
export type CouponFilterScope = 'all' | 'global' | 'specific';
export type CouponFilterValidity = 'all' | 'valid' | 'upcoming' | 'expired' | 'exhausted';
