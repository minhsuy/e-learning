import { apiClient } from '@/lib/api/client';
import type {
  GetPaymentReconciliationParams,
  PaymentCheckoutResponse,
  PaymentDiagnosticsResponse,
  PaymentInstructionsResponse,
  PaymentReconciliationResponse,
  PaymentStatusResponse,
} from '@/types/payment';
import { AppApiError } from '@/types/api';

export function createPaymentCheckout(courseId: string, couponCode?: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(courseId)) {
    return Promise.reject(new AppApiError({
      statusCode: 400,
      message: 'Mã khóa học không hợp lệ. Vui lòng tải lại thông tin khóa học.',
      validationErrors: { courseId: 'Mã khóa học phải là UUID hợp lệ.' },
    }));
  }
  const selectedCoupon = couponCode?.trim();
  return apiClient.post<PaymentCheckoutResponse>('/api/payments/checkout', {
    courseId,
    ...(selectedCoupon ? { couponCode: selectedCoupon } : {}),
  }, { signal: AbortSignal.timeout(20000) });
}

export function getOrderPaymentStatus(orderId: string, signal?: AbortSignal) {
  return apiClient.get<PaymentStatusResponse>(`/api/payments/orders/${encodeURIComponent(orderId)}/status`, {
    signal, cache: 'no-store',
  });
}

/** Read-only recovery: the server preserves the original code, total and deadline. */
export function getOrderPaymentInstructions(orderId: string, signal?: AbortSignal) {
  return apiClient.get<PaymentInstructionsResponse>(`/api/payments/orders/${encodeURIComponent(orderId)}/instructions`, {
    signal, cache: 'no-store',
  });
}

/**
 * Read-only Admin payment reconciliation report (STEP 05 / STEP 08.3).
 * GET /api/payments/admin/reconciliation
 */
export function getAdminPaymentReconciliation(
  params?: GetPaymentReconciliationParams,
  options?: { signal?: AbortSignal }
) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params?.from) queryParams.from = params.from;
  if (params?.to) queryParams.to = params.to;
  if (params?.limit !== undefined) queryParams.limit = params.limit;
  if (params?.external !== undefined) queryParams.external = params.external;

  return apiClient.get<PaymentReconciliationResponse>('/api/payments/admin/reconciliation', {
    params: queryParams,
    signal: options?.signal,
    cache: 'no-store',
  });
}

/**
 * Read-only Admin payment webhook & transaction diagnostics (STEP 05 / STEP 08.3).
 * GET /api/payments/admin/diagnostics
 */
export function getAdminPaymentDiagnostics(options?: { signal?: AbortSignal }) {
  return apiClient.get<PaymentDiagnosticsResponse>('/api/payments/admin/diagnostics', {
    signal: options?.signal,
    cache: 'no-store',
  });
}
