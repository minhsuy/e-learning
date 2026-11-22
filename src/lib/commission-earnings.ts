import { AppApiError } from '@/types/api';
import { isValidCalendarDate } from '@/lib/admin-analytics';
import {
  AdminEarningsListParams,
  AdminEarningsStatsParams,
  AdminReconciliationParams,
  HistoricalOrderClassification,
  TeacherEarningsListParams,
  TeacherEarningsStatsParams,
  TeacherTransactionsParams,
} from '@/types/commission-earnings';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_COMMISSION_RANGE_DAYS = 1826;
export const MAX_RECONCILIATION_SPAN_DAYS = 31;

export function isValidUuid(value: string | undefined | null): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value.trim());
}

/**
 * Strips undefined, null, and empty/whitespace strings and restricts keys strictly to `allowedKeys`.
 * Guarantees backend Zod `.strict()` validators never fail on empty optional fields or forbidden keys.
 */
export function buildStrictQueryParams(
  input: Record<string, unknown> | undefined,
  allowedKeys: readonly string[]
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (!input) return result;

  const allowedSet = new Set(allowedKeys);
  for (const [key, raw] of Object.entries(input)) {
    if (!allowedSet.has(key)) continue;
    if (raw === undefined || raw === null) continue;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      result[key] = trimmed;
    } else if (typeof raw === 'number' && Number.isFinite(raw)) {
      result[key] = raw;
    }
  }
  return result;
}

// ==========================================
// STRICT QUERY BUILDERS (TEACHER — NEVER INCLUDES teacherId)
// ==========================================

const TEACHER_STATS_KEYS = ['period', 'startDate', 'endDate', 'timezone', 'courseId'] as const;
const TEACHER_EARNINGS_KEYS = [
  'page',
  'limit',
  'status',
  'courseId',
  'from',
  'to',
  'timezone',
  'sortBy',
  'order',
] as const;
const TEACHER_TX_KEYS = ['page', 'limit', 'entryType', 'from', 'to', 'timezone'] as const;

export function buildTeacherEarningsStatsQuery(
  params?: TeacherEarningsStatsParams & Record<string, unknown>
): Record<string, string | number> {
  const cleaned = buildStrictQueryParams(params as Record<string, unknown>, TEACHER_STATS_KEYS);
  if (cleaned.period !== 'custom') {
    delete cleaned.startDate;
    delete cleaned.endDate;
  }
  return cleaned;
}

export function buildTeacherEarningsListQuery(
  params?: TeacherEarningsListParams & Record<string, unknown>
): Record<string, string | number> {
  return buildStrictQueryParams(params as Record<string, unknown>, TEACHER_EARNINGS_KEYS);
}

export function buildTeacherTransactionsQuery(
  params?: TeacherTransactionsParams & Record<string, unknown>
): Record<string, string | number> {
  return buildStrictQueryParams(params as Record<string, unknown>, TEACHER_TX_KEYS);
}

// ==========================================
// STRICT QUERY BUILDERS (ADMIN)
// ==========================================

const ADMIN_STATS_KEYS = ['period', 'startDate', 'endDate', 'timezone', 'courseId', 'teacherId'] as const;
const ADMIN_EARNINGS_KEYS = [
  'page',
  'limit',
  'status',
  'teacherId',
  'courseId',
  'from',
  'to',
  'timezone',
  'sortBy',
  'order',
] as const;
const ADMIN_RECON_KEYS = ['from', 'to', 'limit'] as const;

export function buildAdminEarningsStatsQuery(
  params?: AdminEarningsStatsParams & Record<string, unknown>
): Record<string, string | number> {
  const cleaned = buildStrictQueryParams(params as Record<string, unknown>, ADMIN_STATS_KEYS);
  if (cleaned.period !== 'custom') {
    delete cleaned.startDate;
    delete cleaned.endDate;
  }
  return cleaned;
}

export function buildAdminEarningsListQuery(
  params?: AdminEarningsListParams & Record<string, unknown>
): Record<string, string | number> {
  return buildStrictQueryParams(params as Record<string, unknown>, ADMIN_EARNINGS_KEYS);
}

export function buildAdminReconciliationQuery(
  params?: AdminReconciliationParams & Record<string, unknown>
): Record<string, string | number> {
  return buildStrictQueryParams(params as Record<string, unknown>, ADMIN_RECON_KEYS);
}

// ==========================================
// DATE RANGE VALIDATORS
// ==========================================

export interface CommissionDateRangeValidation {
  valid: boolean;
  error?: string;
}

export function validateCommissionCustomRange(
  period: string,
  startDate?: string,
  endDate?: string
): CommissionDateRangeValidation {
  if (period !== 'custom') return { valid: true };
  const s = (startDate || '').trim();
  const e = (endDate || '').trim();
  if (!s || !e) {
    return { valid: false, error: 'Vui lòng chọn đầy đủ cả ngày bắt đầu và ngày kết thúc.' };
  }
  if (!isValidCalendarDate(s) || !isValidCalendarDate(e)) {
    return { valid: false, error: 'Định dạng ngày không hợp lệ (YYYY-MM-DD).' };
  }
  const startMs = Date.parse(`${s}T00:00:00Z`);
  const endMs = Date.parse(`${e}T00:00:00Z`);
  if (startMs > endMs) {
    return { valid: false, error: 'Ngày bắt đầu không được lớn hơn ngày kết thúc.' };
  }
  const diffDays = Math.floor((endMs - startMs) / 86_400_000);
  if (diffDays > MAX_COMMISSION_RANGE_DAYS) {
    return { valid: false, error: 'Khoảng thời gian tùy chỉnh không được vượt quá 5 năm (1.826 ngày).' };
  }
  return { valid: true };
}

export function validateReconciliationDateSpan(
  from?: string,
  to?: string
): CommissionDateRangeValidation {
  const f = (from || '').trim();
  const t = (to || '').trim();
  if (!f && !t) return { valid: true };

  if (f && !isValidCalendarDate(f)) {
    return { valid: false, error: 'Ngày bắt đầu (from) không hợp lệ (YYYY-MM-DD).' };
  }
  if (t && !isValidCalendarDate(t)) {
    return { valid: false, error: 'Ngày kết thúc (to) không hợp lệ (YYYY-MM-DD).' };
  }
  if (f && t) {
    const fMs = Date.parse(`${f}T00:00:00Z`);
    const tMs = Date.parse(`${t}T00:00:00Z`);
    if (fMs > tMs) {
      return { valid: false, error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.' };
    }
    // Backend converts YYYY-MM-DD `to` into exclusive next-day midnight, so inclusive calendar diff is (tMs - fMs)/86400000 + 1
    const inclusiveDays = Math.floor((tMs - fMs) / 86_400_000) + 1;
    if (inclusiveDays > MAX_RECONCILIATION_SPAN_DAYS) {
      return {
        valid: false,
        error: `Khoảng đối soát tối đa là ${MAX_RECONCILIATION_SPAN_DAYS} ngày (hiện chọn ${inclusiveDays} ngày).`,
      };
    }
  }
  return { valid: true };
}

// ==========================================
// ERROR NORMALIZATION (INCLUDING BACKEND errorCode)
// ==========================================

export interface NormalizedCommissionError {
  statusCode: number;
  errorCode?: string;
  message: string;
}

const COMMISSION_ERROR_MESSAGES: Record<string, string> = {
  POLICY_VERSION_CONFLICT:
    'Chính sách hoa hồng vừa được cập nhật bởi quản trị viên khác (xung đột phiên bản). Vui lòng tải lại trang trước khi tạo chính sách mới.',
  COMMISSION_POLICY_MISSING:
    'Chưa có chính sách hoa hồng đang hoạt động. Vui lòng tạo và kích hoạt một chính sách hoa hồng trước khi bật tính năng.',
  INCOMPATIBLE_PENDING_ORDERS_EXIST:
    'Không thể bật tính năng hoa hồng vì vẫn còn đơn hàng SePay đang chờ thanh toán không tương thích. Vui lòng đợi hoàn tất hoặc hết hạn trước khi bật.',
  TEACHER_ACCESS_FORBIDDEN:
    'Yêu cầu tài khoản Giảng viên đang hoạt động (ACTIVE) để truy cập Ví & Thu nhập hoa hồng.',
  ADMIN_ACCESS_FORBIDDEN:
    'Yêu cầu tài khoản Quản trị viên đang hoạt động (ACTIVE) để truy cập trang Quản lý Hoa hồng.',
  EARNING_ACCESS_FORBIDDEN: 'Bạn không có quyền xem chi tiết khoản thu nhập này.',
  EARNING_NOT_FOUND: 'Không tìm thấy khoản thu nhập tương ứng.',
  TEACHER_NOT_FOUND: 'Không tìm thấy tài khoản giảng viên với mã UUID này.',
  DATE_RANGE_TOO_LARGE: 'Khoảng thời gian truy vấn vượt quá giới hạn cho phép của hệ thống.',
  INVALID_DATE_RANGE: 'Khoảng ngày không hợp lệ: ngày bắt đầu phải nhỏ hơn ngày kết thúc.',
  INVALID_STATISTICS_DATE_RANGE: 'Khoảng thời gian thống kê không hợp lệ. Vui lòng kiểm tra lại.',
  WALLET_EARNING_CONSERVATION_MISMATCH:
    'Hệ thống phát hiện bất nhất bảo toàn sổ cái. Vui lòng chạy công cụ Đối soát tài chính để kiểm tra.',
  NEGATIVE_WALLET_BALANCE:
    'Hệ thống phát hiện số dư ví bất thường. Vui lòng liên hệ kỹ thuật và chạy đối soát.',
};

export function extractCommissionApiError(
  error: unknown,
  fallbackMessage = 'Không thể tải dữ liệu hoa hồng & thu nhập. Vui lòng thử lại.'
): NormalizedCommissionError {
  if (error instanceof AppApiError) {
    const rawObj =
      error.raw && typeof error.raw === 'object' ? (error.raw as Record<string, unknown>) : null;
    const errorCode =
      typeof rawObj?.errorCode === 'string' && rawObj.errorCode.trim()
        ? rawObj.errorCode.trim()
        : undefined;

    if (errorCode && COMMISSION_ERROR_MESSAGES[errorCode]) {
      return {
        statusCode: error.statusCode,
        errorCode,
        message: COMMISSION_ERROR_MESSAGES[errorCode],
      };
    }

    if (error.statusCode === 401) {
      return {
        statusCode: 401,
        errorCode,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      };
    }
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        errorCode,
        message: error.message || 'Bạn không có quyền truy cập tài nguyên tài chính này.',
      };
    }
    if (error.statusCode === 404) {
      return {
        statusCode: 404,
        errorCode,
        message: error.message || 'Không tìm thấy dữ liệu yêu cầu.',
      };
    }
    if (error.statusCode === 409) {
      return {
        statusCode: 409,
        errorCode,
        message: error.message || 'Xung đột trạng thái dữ liệu. Vui lòng tải lại và thử lại.',
      };
    }
    if (error.statusCode >= 500) {
      return {
        statusCode: error.statusCode,
        errorCode,
        message: error.message || 'Lỗi máy chủ khi xử lý dữ liệu tài chính. Vui lòng thử lại sau.',
      };
    }

    return {
      statusCode: error.statusCode,
      errorCode,
      message: error.message || fallbackMessage,
    };
  }

  if (error instanceof Error) {
    return { statusCode: 0, message: error.message || fallbackMessage };
  }

  return { statusCode: 0, message: fallbackMessage };
}

// ==========================================
// DISPLAY LABELS & DATE FORMATTERS
// ==========================================

export function formatCommissionDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(dt);
}

export function formatCommissionDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(dt);
}

export function getLedgerEntryTypeLabel(entryType: string): { label: string; badgeClass: string } {
  switch (entryType.toLowerCase()) {
    case 'earning_recognized':
      return {
        label: 'Ghi nhận thu nhập',
        badgeClass:
          'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50',
      };
    case 'earning_released':
      return {
        label: 'Mở khóa khả dụng',
        badgeClass:
          'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50',
      };
    default:
      return {
        label: entryType,
        badgeClass:
          'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      };
  }
}

export function getClassificationLabel(key: HistoricalOrderClassification): {
  label: string;
  tone: 'success' | 'danger' | 'warning' | 'neutral';
} {
  switch (key) {
    case 'RECOGNIZED_VALID':
      return { label: 'Ghi nhận hợp lệ', tone: 'success' };
    case 'CONFIRMED_MISSING_EARNING':
      return { label: 'Thiếu bản ghi thu nhập', tone: 'danger' };
    case 'INVALID_EARNING':
      return { label: 'Bản ghi thu nhập lỗi', tone: 'danger' };
    case 'INSUFFICIENT_HISTORICAL_EVIDENCE':
      return { label: 'Thiếu bằng chứng lịch sử', tone: 'warning' };
    case 'INTENTIONALLY_EXCLUDED_FEATURE_DISABLED':
      return { label: 'Loại trừ (tính năng đang tắt)', tone: 'neutral' };
    case 'CONFIRMED_INELIGIBLE':
    default:
      return { label: 'Không thuộc diện hoa hồng', tone: 'neutral' };
  }
}
