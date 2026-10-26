/**
 * Coupon API Contract Types
 * Strictly reflects api/COUPON_API.md and F7_1_ORDER_ENROLLMENT_BACKEND_VERIFICATION.md
 */
import { ApiResponse } from './api';

export type CouponType = 'percentage' | 'number' | 'PERCENTAGE' | 'NUMBER';

export interface ApiCouponItem {
  id?: string;
  _id?: string;
  title: string;
  code: string;
  type: CouponType;
  value: number;
  limit?: number;
  used?: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

export interface CouponCourseInfo {
  id: string;
  _id?: string;
  title: string;
  slug?: string;
  price?: number;
  thumbnail?: string;
}

export interface CouponAuthorInfo {
  id: string;
  _id?: string;
  username: string;
  role?: string;
  avatar?: string;
}

export interface CouponItem {
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

export interface GetCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export interface GetCouponsData {
  coupons: CouponItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type GetCouponsResponse = ApiResponse<GetCouponsData>;
export type GetCouponDetailResponse = ApiResponse<CouponItem>;

export interface CreateCouponDto {
  title: string;
  code: string;
  type: 'percentage' | 'number';
  value: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  courses: string[];
}

export type CreateCouponResponse = ApiResponse<CouponItem>;

export interface UpdateCouponDto {
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

export type UpdateCouponResponse = ApiResponse<CouponItem>;
export type DeleteCouponResponse = ApiResponse<void>;

export interface CheckCouponPayload {
  code: string;
  courseId: string;
}

export interface CheckCouponData {
  courseId: string;
  coursePrice: number;
  discount: number;
  finalPrice: number;
  coupon: ApiCouponItem;
}

export type CheckCouponResponse = ApiResponse<CheckCouponData>;
