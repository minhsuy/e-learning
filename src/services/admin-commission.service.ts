import { apiClient } from '@/lib/api/client';
import {
  buildAdminEarningsListQuery,
  buildAdminEarningsStatsQuery,
  buildAdminReconciliationQuery,
  buildTeacherEarningsListQuery,
} from '@/lib/commission-earnings';
import {
  AdminCommissionActivationResponse,
  AdminCommissionPoliciesResponse,
  AdminEarningDetailResponse,
  AdminEarningsListParams,
  AdminEarningsListResponse,
  AdminEarningsStatsParams,
  AdminEarningsStatsResponse,
  AdminReconciliationParams,
  AdminReconciliationResponse,
  AdminTeacherEarningsResponse,
  CreateCommissionPolicyPayload,
  CreateCommissionPolicyResponse,
  SetCommissionActivationPayload,
  SetCommissionActivationResponse,
  TeacherEarningsListParams,
} from '@/types/commission-earnings';

/**
 * TMdemy Admin Commission, Earnings & Reconciliation Service (STEP 09.5)
 *
 * Covers all 9 Admin endpoints in api/TEACHER_COMMISSION_EARNINGS_API.md.
 * - Uses `cache: 'no-store'` on every request.
 * - Strips empty/undefined optional params to satisfy backend Zod `.strict()` validation.
 */
export const adminCommissionService = {
  /**
   * 6. GET /api/admin/commissions/policies
   */
  async getPolicies(options?: { signal?: AbortSignal }): Promise<AdminCommissionPoliciesResponse> {
    return apiClient.get<AdminCommissionPoliciesResponse>('/api/admin/commissions/policies', {
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 7. POST /api/admin/commissions/policies (Create & Activate)
   */
  async createPolicy(
    payload: CreateCommissionPolicyPayload,
    options?: { signal?: AbortSignal }
  ): Promise<CreateCommissionPolicyResponse> {
    const strictBody: CreateCommissionPolicyPayload = {
      name: payload.name.trim(),
      teacherRateBps: payload.teacherRateBps,
      platformRateBps: payload.platformRateBps,
      holdingPeriodDays: payload.holdingPeriodDays,
    };
    if (payload.expectedCurrentVersion !== undefined) {
      strictBody.expectedCurrentVersion = payload.expectedCurrentVersion;
    }
    if (payload.notes !== undefined && payload.notes !== null && payload.notes.trim()) {
      strictBody.notes = payload.notes.trim();
    } else if (payload.notes === null) {
      strictBody.notes = null;
    }

    return apiClient.post<CreateCommissionPolicyResponse>('/api/admin/commissions/policies', strictBody, {
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 8. GET /api/admin/commissions/activation
   */
  async getActivation(options?: { signal?: AbortSignal }): Promise<AdminCommissionActivationResponse> {
    return apiClient.get<AdminCommissionActivationResponse>('/api/admin/commissions/activation', {
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 9. POST /api/admin/commissions/activation
   */
  async setActivation(
    payload: SetCommissionActivationPayload,
    options?: { signal?: AbortSignal }
  ): Promise<SetCommissionActivationResponse> {
    return apiClient.post<SetCommissionActivationResponse>(
      '/api/admin/commissions/activation',
      {
        enabled: payload.enabled,
        reason: payload.reason.trim(),
      },
      {
        signal: options?.signal,
        cache: 'no-store',
      }
    );
  },

  /**
   * 10. GET /api/admin/earnings/statistics
   */
  async getEarningsStatistics(
    params?: AdminEarningsStatsParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminEarningsStatsResponse> {
    const queryParams = buildAdminEarningsStatsQuery(params as AdminEarningsStatsParams & Record<string, unknown>);
    return apiClient.get<AdminEarningsStatsResponse>('/api/admin/earnings/statistics', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 11. GET /api/admin/earnings
   */
  async getEarnings(
    params?: AdminEarningsListParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminEarningsListResponse> {
    const queryParams = buildAdminEarningsListQuery(params as AdminEarningsListParams & Record<string, unknown>);
    return apiClient.get<AdminEarningsListResponse>('/api/admin/earnings', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 12. GET /api/admin/earnings/:id
   */
  async getEarningById(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminEarningDetailResponse> {
    return apiClient.get<AdminEarningDetailResponse>(
      `/api/admin/earnings/${encodeURIComponent(id.trim())}`,
      {
        signal: options?.signal,
        cache: 'no-store',
      }
    );
  },

  /**
   * 13. GET /api/admin/teachers/:teacherId/earnings
   */
  async getTeacherEarnings(
    teacherId: string,
    params?: TeacherEarningsListParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminTeacherEarningsResponse> {
    const queryParams = buildTeacherEarningsListQuery(params as TeacherEarningsListParams & Record<string, unknown>);
    return apiClient.get<AdminTeacherEarningsResponse>(
      `/api/admin/teachers/${encodeURIComponent(teacherId.trim())}/earnings`,
      {
        params: queryParams,
        signal: options?.signal,
        cache: 'no-store',
      }
    );
  },

  /**
   * 14. GET /api/admin/earnings/reconciliation (Strictly Read-Only)
   */
  async getReconciliation(
    params?: AdminReconciliationParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminReconciliationResponse> {
    const queryParams = buildAdminReconciliationQuery(params as AdminReconciliationParams & Record<string, unknown>);
    return apiClient.get<AdminReconciliationResponse>('/api/admin/earnings/reconciliation', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },
};
