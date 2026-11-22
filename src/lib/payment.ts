import type { PaymentCheckoutData, OrderPaymentStatus } from '@/types/payment';
import { AppApiError } from '@/types/api';
import type { ApiEnrollmentItem } from '@/types/enrollment';
import type { PaymentInstructions } from '@/types/payment';

export function hasLearningEnrollment(enrollments: ApiEnrollmentItem[], courseId: string, slug?: string) {
  return enrollments.some(enrollment =>
    ['active', 'completed'].includes(enrollment.status?.toLowerCase() || '') &&
    (enrollment.courseId === courseId || Boolean(slug && enrollment.course?.slug === slug))
  );
}

/** Guard only the instructions we display; never reconstruct missing bank data. */
export function isPaymentInstructions(value: unknown): value is PaymentInstructions {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (!['paymentCode', 'transferContent', 'qrUrl', 'expiresAt'].every(key => typeof record[key] === 'string' && record[key].trim())) return false;
  if (typeof record.amount !== 'string' || !/^\d+$/.test(record.amount)) return false;
  if (!record.bankAccount || typeof record.bankAccount !== 'object') return false;
  const bank = record.bankAccount as Record<string, unknown>;
  return ['bankName', 'accountNumber', 'accountName'].every(key => typeof bank[key] === 'string' && bank[key].trim());
}

export interface CheckoutFailure {
  category: 'network' | 'timeout' | 'authentication' | 'validation' | 'conflict' | 'unavailable' | 'unexpected';
  httpStatus: number | null;
  message: string;
  safeServerMessage?: string;
}

/** Payment-only presentation; the original API error/status remains unchanged. */
export function describeCheckoutFailure(error: unknown): CheckoutFailure {
  const httpStatus = error instanceof AppApiError && error.statusCode > 0 ? error.statusCode : null;
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
    return { category: 'timeout', httpStatus, message: 'Chưa nhận được phản hồi thanh toán đúng hạn. Vui lòng kiểm tra lịch sử đơn hàng trước khi thử lại.' };
  }
  if (error instanceof AppApiError && error.statusCode === 0) {
    return { category: 'network', httpStatus, message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và lịch sử đơn hàng trước khi thử lại.' };
  }
  switch (httpStatus) {
    case 400:
      return { category: 'validation', httpStatus, message: 'Thông tin thanh toán hoặc mã giảm giá không hợp lệ. Vui lòng kiểm tra và thử lại.' };
    case 401:
      return { category: 'authentication', httpStatus, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' };
    case 403:
      return { category: 'authentication', httpStatus, message: 'Tài khoản của bạn không có quyền thực hiện thanh toán này.' };
    case 404:
      return { category: 'validation', httpStatus, message: 'Không tìm thấy khóa học để thanh toán. Vui lòng quay lại danh sách khóa học.' };
    case 409:
      return { category: 'conflict', httpStatus, message: 'Bạn đã có quyền học hoặc có đơn hàng xung đột. Vui lòng kiểm tra lịch sử đơn hàng trước khi thử lại.' };
    case 503:
      return {
        category: 'unavailable', httpStatus,
        message: 'Dịch vụ thanh toán trên máy chủ tạm thời không khả dụng (HTTP 503). Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
        // Only this known public message is safe to repeat in development details.
        safeServerMessage: error instanceof AppApiError && error.message === 'Payment service temporarily unavailable'
          ? error.message : undefined,
      };
    default:
      return { category: 'unexpected', httpStatus, message: 'Không thể tạo thanh toán. Vui lòng kiểm tra lịch sử đơn hàng trước khi thử lại hoặc liên hệ hỗ trợ.' };
  }
}

// Ephemeral navigation handoff only. Never persisted or used as payment confirmation.
let handoff: { userId: string; data: PaymentCheckoutData } | null = null;
export function rememberCheckout(userId: string, data: PaymentCheckoutData) {
  handoff = { userId, data };
}
export function recallCheckout(userId: string, orderId: string) {
  return handoff?.userId === userId && handoff.data.order.id === orderId ? handoff.data : null;
}
export function paymentAccessReady(status: OrderPaymentStatus | null) {
  return status?.status === 'completed' && status.paymentState === 'completed' && status.courseAccessGranted === true;
}
export function remainingPaymentSeconds(expiresAt: string | null | undefined, now = Date.now()) {
  const deadline = expiresAt ? Date.parse(expiresAt) : NaN;
  return Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}
export function formatPaymentTime(seconds: number | null) {
  if (seconds === null) return 'Chưa có thời hạn';
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
export function formatVnd(amount: number | string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
}
