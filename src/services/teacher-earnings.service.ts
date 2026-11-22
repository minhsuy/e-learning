import { apiClient } from '@/lib/api/client';
import {
  buildTeacherEarningsListQuery,
  buildTeacherEarningsStatsQuery,
  buildTeacherTransactionsQuery,
} from '@/lib/commission-earnings';
import {
  TeacherEarningDetailResponse,
  TeacherEarningsListParams,
  TeacherEarningsListResponse,
  TeacherEarningsOverviewResponse,
  TeacherEarningsStatsParams,
  TeacherEarningsStatsResponse,
  TeacherTransactionsParams,
  TeacherTransactionsResponse,
} from '@/types/commission-earnings';

/**
 * TMdemy Teacher Commission & Wallet Earnings Service (STEP 09.5)
 *
 * Covers all 5 Teacher endpoints in api/TEACHER_COMMISSION_EARNINGS_API.md.
 * - Uses `cache: 'no-store'` on every request.
 * - Strictly strips empty optional parameters and NEVER transmits `teacherId`
 *   (backend validates via Zod `.strict()` and derives identity solely from JWT).
 */
export const teacherEarningsService = {
  /**
   * 1. GET /api/teacher/earnings/overview
   * Strictly sends zero query parameters.
   */
  async getOverview(options?: { signal?: AbortSignal }): Promise<TeacherEarningsOverviewResponse> {
    return apiClient.get<TeacherEarningsOverviewResponse>('/api/teacher/earnings/overview', {
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 2. GET /api/teacher/earnings/statistics
   */
  async getStatistics(
    params?: TeacherEarningsStatsParams,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherEarningsStatsResponse> {
    const queryParams = buildTeacherEarningsStatsQuery(params as TeacherEarningsStatsParams & Record<string, unknown>);
    return apiClient.get<TeacherEarningsStatsResponse>('/api/teacher/earnings/statistics', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 3. GET /api/teacher/earnings
   */
  async getEarnings(
    params?: TeacherEarningsListParams,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherEarningsListResponse> {
    const queryParams = buildTeacherEarningsListQuery(params as TeacherEarningsListParams & Record<string, unknown>);
    return apiClient.get<TeacherEarningsListResponse>('/api/teacher/earnings', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 4. GET /api/teacher/earnings/:id
   */
  async getEarningById(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherEarningDetailResponse> {
    return apiClient.get<TeacherEarningDetailResponse>(
      `/api/teacher/earnings/${encodeURIComponent(id.trim())}`,
      {
        signal: options?.signal,
        cache: 'no-store',
      }
    );
  },

  /**
   * 5. GET /api/teacher/earnings/transactions
   */
  async getTransactions(
    params?: TeacherTransactionsParams,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherTransactionsResponse> {
    const queryParams = buildTeacherTransactionsQuery(params as TeacherTransactionsParams & Record<string, unknown>);
    return apiClient.get<TeacherTransactionsResponse>('/api/teacher/earnings/transactions', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },
};
