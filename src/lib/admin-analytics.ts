import {
  AdminFinancialStatsData,
  AdminPaymentMethodBreakdownItem,
  AdminRevenueTimelineItem,
  AdminSalesGroupBy,
  AdminSalesSortBy,
  AnalyticsPaymentMethodFilter,
  AnalyticsTimeBasis,
  AnalyticsTimeRange,
  AnalyticsTimezone,
  GetAdminFinancialStatsParams,
  GetAdminSalesBreakdownParams,
} from '@/types/admin-order';

export interface AdminAnalyticsFilterState {
  timeRange: AnalyticsTimeRange;
  startDate: string;
  endDate: string;
  timeBasis: AnalyticsTimeBasis;
  timezone: AnalyticsTimezone;
  paymentMethod: AnalyticsPaymentMethodFilter;
  teacherId: string;
  courseId: string;
}

export const DEFAULT_ANALYTICS_FILTERS: AdminAnalyticsFilterState = {
  timeRange: '30days',
  startDate: '',
  endDate: '',
  timeBasis: 'recognizedAt',
  timezone: 'Asia/Ho_Chi_Minh',
  paymentMethod: 'all',
  teacherId: '',
  courseId: '',
};

const VALID_TIME_RANGES: readonly AnalyticsTimeRange[] = [
  '7days',
  '30days',
  '12months',
  '1year',
  'custom',
  'all',
];
const VALID_TIME_BASES: readonly AnalyticsTimeBasis[] = ['recognizedAt', 'createdAt', 'paidAt'];
const VALID_TIMEZONES: readonly AnalyticsTimezone[] = ['Asia/Ho_Chi_Minh', 'UTC'];
const VALID_PAYMENT_METHODS: readonly AnalyticsPaymentMethodFilter[] = [
  'all',
  'sepay_bank_transfer',
  'manual_bank_transfer',
  'free',
  'legacy_unknown',
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_CUSTOM_RANGE_DAYS = 1826;

/**
 * Checks whether a YYYY-MM-DD string is a real calendar date (e.g. rejects 2026-02-31).
 */
export function isValidCalendarDate(dateStr: string): boolean {
  const trimmed = dateStr.trim();
  const match = DATE_ONLY_REGEX.exec(trimmed);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export interface DateValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates custom date range before making API requests (mirrors Backend STEP 08.2 constraints).
 */
export function validateAnalyticsDateRange(
  timeRange: AnalyticsTimeRange,
  startDate?: string,
  endDate?: string
): DateValidationResult {
  if (timeRange !== 'custom') {
    return { valid: true };
  }

  const start = (startDate || '').trim();
  const end = (endDate || '').trim();

  if (!start || !end) {
    return {
      valid: false,
      error: 'Vui lòng chọn đầy đủ cả ngày bắt đầu và ngày kết thúc cho khoảng tùy chỉnh.',
    };
  }

  if (!isValidCalendarDate(start)) {
    return {
      valid: false,
      error: 'Ngày bắt đầu không hợp lệ (định dạng YYYY-MM-DD và phải tồn tại trên lịch).',
    };
  }

  if (!isValidCalendarDate(end)) {
    return {
      valid: false,
      error: 'Ngày kết thúc không hợp lệ (định dạng YYYY-MM-DD và phải tồn tại trên lịch).',
    };
  }

  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);

  if (startMs > endMs) {
    return {
      valid: false,
      error: 'Ngày bắt đầu không được lớn hơn ngày kết thúc.',
    };
  }

  const diffDays = Math.floor((endMs - startMs) / 86_400_000);
  if (diffDays > MAX_CUSTOM_RANGE_DAYS) {
    return {
      valid: false,
      error: 'Khoảng thời gian tùy chỉnh không được vượt quá 5 năm (1.826 ngày).',
    };
  }

  return { valid: true };
}

/**
 * Parses URL search parameters into safe AdminAnalyticsFilterState values.
 */
export function parseAnalyticsFiltersFromSearchParams(
  searchParams: { get(name: string): string | null }
): AdminAnalyticsFilterState {
  const rawRange = searchParams.get('timeRange');
  const timeRange = VALID_TIME_RANGES.includes(rawRange as AnalyticsTimeRange)
    ? (rawRange as AnalyticsTimeRange)
    : DEFAULT_ANALYTICS_FILTERS.timeRange;

  const rawBasis = searchParams.get('timeBasis');
  const timeBasis = VALID_TIME_BASES.includes(rawBasis as AnalyticsTimeBasis)
    ? (rawBasis as AnalyticsTimeBasis)
    : DEFAULT_ANALYTICS_FILTERS.timeBasis;

  const rawTimezone = searchParams.get('timezone');
  const timezone = VALID_TIMEZONES.includes(rawTimezone as AnalyticsTimezone)
    ? (rawTimezone as AnalyticsTimezone)
    : DEFAULT_ANALYTICS_FILTERS.timezone;

  const rawMethod = searchParams.get('paymentMethod');
  const paymentMethod = VALID_PAYMENT_METHODS.includes(rawMethod as AnalyticsPaymentMethodFilter)
    ? (rawMethod as AnalyticsPaymentMethodFilter)
    : DEFAULT_ANALYTICS_FILTERS.paymentMethod;

  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const rawTeacher = searchParams.get('teacherId') || '';
  const rawCourse = searchParams.get('courseId') || '';

  return {
    timeRange,
    startDate: isValidCalendarDate(startDate) ? startDate : '',
    endDate: isValidCalendarDate(endDate) ? endDate : '',
    timeBasis,
    timezone,
    paymentMethod,
    teacherId: UUID_REGEX.test(rawTeacher) ? rawTeacher : '',
    courseId: UUID_REGEX.test(rawCourse) ? rawCourse : '',
  };
}

/**
 * Serializes filter state into URL query string parameters.
 */
export function serializeAnalyticsFiltersToSearchParams(
  filters: AdminAnalyticsFilterState
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('timeRange', filters.timeRange);
  params.set('timeBasis', filters.timeBasis);
  params.set('timezone', filters.timezone);
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    params.set('paymentMethod', filters.paymentMethod);
  }
  if (filters.timeRange === 'custom') {
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
  }
  if (filters.teacherId && UUID_REGEX.test(filters.teacherId)) {
    params.set('teacherId', filters.teacherId);
  }
  if (filters.courseId && UUID_REGEX.test(filters.courseId)) {
    params.set('courseId', filters.courseId);
  }
  return params;
}

/**
 * Builds exact query parameters for GET /api/admin/statistics/financial.
 */
export function buildFinancialQueryParams(
  filters: AdminAnalyticsFilterState
): GetAdminFinancialStatsParams {
  const params: GetAdminFinancialStatsParams = {
    timeRange: filters.timeRange,
    timeBasis: filters.timeBasis,
    timezone: filters.timezone,
    paymentMethod: filters.paymentMethod,
  };

  if (filters.timeRange === 'custom') {
    params.startDate = filters.startDate.trim();
    params.endDate = filters.endDate.trim();
  }

  if (filters.teacherId && UUID_REGEX.test(filters.teacherId)) {
    params.teacherId = filters.teacherId;
  }

  if (filters.courseId && UUID_REGEX.test(filters.courseId)) {
    params.courseId = filters.courseId;
  }

  return params;
}

/**
 * Builds exact query parameters for GET /api/admin/statistics/sales.
 */
export function buildSalesQueryParams(
  filters: AdminAnalyticsFilterState,
  options: {
    groupBy: AdminSalesGroupBy;
    page?: number;
    limit?: number;
    sortBy?: AdminSalesSortBy;
    order?: 'asc' | 'desc';
  }
): GetAdminSalesBreakdownParams {
  const params: GetAdminSalesBreakdownParams = {
    groupBy: options.groupBy,
    timeRange: filters.timeRange,
    timeBasis: filters.timeBasis,
    timezone: filters.timezone,
    paymentMethod: filters.paymentMethod,
    page: options.page ?? 1,
    limit: options.limit ?? 10,
    sortBy: options.sortBy ?? 'revenue',
    order: options.order ?? 'desc',
  };

  if (filters.timeRange === 'custom') {
    params.startDate = filters.startDate.trim();
    params.endDate = filters.endDate.trim();
  }

  return params;
}

export interface NormalizedTimelinePoint {
  date: string;
  label: string;
  revenue: number;
  orderCount: number;
}

/**
 * Formats YYYY-MM-DD or YYYY-MM axis labels in Vietnamese convention.
 */
export function formatTimelineAxisLabel(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  if (parts.length === 2) {
    return `T${parts[1]}/${parts[0].slice(-2)}`;
  }
  return dateStr;
}

/**
 * Extracts chronological zero-filled timeline points from Financial Stats response.
 */
export function normalizeRevenueTimeline(
  stats: AdminFinancialStatsData | null | undefined
): NormalizedTimelinePoint[] {
  if (!stats) return [];

  const source: AdminRevenueTimelineItem[] =
    Array.isArray(stats.revenueTimeline) && stats.revenueTimeline.length > 0
      ? stats.revenueTimeline
      : (stats.revenueByMonth || []).map((m) => ({
          date: m.month,
          revenue: m.revenue,
          orderCount: m.orderCount,
        }));

  return [...source]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      label: formatTimelineAxisLabel(item.date),
      revenue: Number(item.revenue) || 0,
      orderCount: Number(item.orderCount ?? item.ordersCount ?? 0) || 0,
    }));
}

export interface NormalizedMethodBreakdownItem {
  paymentMethod: string;
  label: string;
  shortLabel: string;
  color: string;
  bgClass: string;
  completedOrders: number;
  revenue: number;
  isFree: boolean;
  /** Share of monetary revenue (null for free orders or when total revenue is 0). */
  revenueSharePercent: number | null;
  /** Share of total completed orders. */
  orderSharePercent: number;
}

const METHOD_VISUALS: Record<
  string,
  { label: string; shortLabel: string; color: string; bgClass: string }
> = {
  sepay_bank_transfer: {
    label: 'Chuyển khoản SePay / VietQR',
    shortLabel: 'SePay / VietQR',
    color: '#7240b8',
    bgClass: 'bg-[#7240b8]',
  },
  manual_bank_transfer: {
    label: 'Chuyển khoản thủ công',
    shortLabel: 'Thủ công',
    color: '#0ea5e9',
    bgClass: 'bg-sky-500',
  },
  free: {
    label: 'Đơn hàng miễn phí (0 ₫)',
    shortLabel: 'Miễn phí',
    color: '#10b981',
    bgClass: 'bg-emerald-500',
  },
  legacy_unknown: {
    label: 'Phương thức cũ / Chưa phân loại',
    shortLabel: 'Dữ liệu cũ',
    color: '#f59e0b',
    bgClass: 'bg-amber-500',
  },
};

export function getPaymentMethodDisplayLabel(method: string | null | undefined): string {
  if (!method) return METHOD_VISUALS.legacy_unknown.label;
  const key = method.toLowerCase();
  return METHOD_VISUALS[key]?.label ?? 'Phương thức khác';
}

/**
 * Normalizes methodBreakdown[] while ensuring Free orders (0 VND) never fabricate monetary slices.
 */
export function normalizeMethodBreakdown(
  items: AdminPaymentMethodBreakdownItem[] | undefined
): {
  allItems: NormalizedMethodBreakdownItem[];
  monetaryItems: NormalizedMethodBreakdownItem[];
  freeItem: NormalizedMethodBreakdownItem | null;
  totalRevenue: number;
  totalOrders: number;
} {
  const safeItems = Array.isArray(items) ? items : [];
  const totalOrders = safeItems.reduce((sum, item) => sum + (Number(item.completedOrders) || 0), 0);
  const totalRevenue = safeItems.reduce((sum, item) => {
    const isFree = item.paymentMethod?.toLowerCase() === 'free';
    return sum + (isFree ? 0 : Number(item.revenue) || 0);
  }, 0);

  const allItems: NormalizedMethodBreakdownItem[] = safeItems.map((item) => {
    const key = (item.paymentMethod || 'legacy_unknown').toLowerCase();
    const visual = METHOD_VISUALS[key] || {
      label: key,
      shortLabel: key,
      color: '#94a3b8',
      bgClass: 'bg-slate-400',
    };
    const isFree = key === 'free';
    const revenue = isFree ? 0 : Number(item.revenue) || 0;
    const completedOrders = Number(item.completedOrders) || 0;

    return {
      paymentMethod: key,
      label: visual.label,
      shortLabel: visual.shortLabel,
      color: visual.color,
      bgClass: visual.bgClass,
      completedOrders,
      revenue,
      isFree,
      revenueSharePercent: !isFree && totalRevenue > 0 ? (revenue / totalRevenue) * 100 : null,
      orderSharePercent: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
    };
  });

  const monetaryItems = allItems.filter((i) => !i.isFree && i.revenue > 0);
  const freeItem = allItems.find((i) => i.isFree) || null;

  return {
    allItems,
    monetaryItems,
    freeItem,
    totalRevenue,
    totalOrders,
  };
}

export function formatCompactVND(amount: number): string {
  if (!amount || isNaN(amount)) return '0 ₫';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')} tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${Math.round(abs / 1_000)}k`;
  }
  return `${sign}${Math.round(abs)} ₫`;
}

export function getTimeBasisLabel(basis: string | undefined): string {
  switch (basis) {
    case 'recognizedAt':
      return 'Ngày ghi nhận doanh thu (COALESCE(paidAt, createdAt))';
    case 'paidAt':
      return 'Ngày xác nhận thanh toán (paidAt)';
    case 'createdAt':
    default:
      return 'Ngày tạo đơn hàng (createdAt)';
  }
}

export function getTimeRangeLabel(range: AnalyticsTimeRange): string {
  switch (range) {
    case '7days':
      return '7 ngày gần nhất';
    case '30days':
      return '30 ngày gần nhất';
    case '12months':
    case '1year':
      return '12 tháng gần nhất';
    case 'custom':
      return 'Khoảng tùy chỉnh';
    case 'all':
    default:
      return 'Toàn thời gian';
  }
}

export interface ReconciliationFindingMeta {
  label: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

export function getReconciliationFindingMeta(kind: string): ReconciliationFindingMeta {
  switch (kind) {
    case 'COMPLETED_WITHOUT_PAYMENT':
      return {
        label: 'Hoàn tất thiếu giao dịch',
        severity: 'critical',
        description: 'Đơn SePay đã hoàn tất nhưng chưa tìm thấy giao dịch SUCCESS tương ứng.',
      };
    case 'SUCCESS_ORDER_NOT_COMPLETED':
      return {
        label: 'Giao dịch SUCCESS chưa kích hoạt đơn',
        severity: 'critical',
        description: 'Có giao dịch SUCCESS nhưng trạng thái đơn hàng SePay chưa chuyển COMPLETED.',
      };
    case 'COMPLETED_WITHOUT_ENROLLMENT':
      return {
        label: 'Hoàn tất thiếu ghi danh',
        severity: 'critical',
        description: 'Đơn đã hoàn tất nhưng thiếu bản ghi ghi danh (Enrollment) hợp lệ.',
      };
    case 'DUPLICATE_INCOMING':
      return {
        label: 'Chuyển khoản trùng lặp',
        severity: 'warning',
        description: 'Có nhiều giao dịch tiền vào riêng biệt cùng nhắm tới một đơn hàng.',
      };
    case 'MANUAL_REVIEW':
      return {
        label: 'Cần rà soát thủ công',
        severity: 'warning',
        description: 'Giao dịch đang ở trạng thái PENDING_MANUAL_REVIEW (sai lệch số tiền hoặc bất thường).',
      };
    case 'UNMATCHED_INCOMING':
      return {
        label: 'Tiền vào chưa khớp đơn',
        severity: 'warning',
        description: 'Nhận được tiền chuyển khoản nhưng không gắn với mã đơn hàng nào.',
      };
    case 'LATE_TRANSFER':
      return {
        label: 'Chuyển khoản sau hạn',
        severity: 'warning',
        description: 'Thời điểm giao dịch ngân hàng xảy ra sau hạn thanh toán của đơn hàng.',
      };
    case 'EXPIRED_UNPAID':
      return {
        label: 'Hết hạn chưa thanh toán',
        severity: 'info',
        description: 'Đơn PENDING đã quá hạn và chưa ghi nhận giao dịch nội bộ (không khẳng định ngân hàng không nhận tiền).',
      };
    case 'STALLED_INBOX':
      return {
        label: 'Webhook bị nghẽn',
        severity: 'warning',
        description: 'Sự kiện webhook chưa được xử lý quá ngưỡng thời gian chờ.',
      };
    case 'RETRY_EXHAUSTED':
      return {
        label: 'Webhook hết lượt thử lại',
        severity: 'critical',
        description: 'Sự kiện webhook thất bại vĩnh viễn và không còn lịch thử lại tự động.',
      };
    case 'INVALID_COUPON_CAPACITY':
      return {
        label: 'Lượt dùng mã giảm giá bất thường',
        severity: 'warning',
        description: 'Số lượt sử dụng coupon âm hoặc vượt giới hạn cấu hình.',
      };
    case 'PROVIDER_CORRELATION':
      return {
        label: 'Đối chiếu nhà cung cấp SePay',
        severity: 'info',
        description: 'Kết quả so khớp dữ liệu giao dịch nội bộ với dữ liệu từ SePay API v2.',
      };
    default:
      return {
        label: kind,
        severity: 'info',
        description: 'Phát hiện đối soát từ hệ thống kiểm tra tự động.',
      };
  }
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} giây`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} phút`;
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.round((ms % 3_600_000) / 60_000);
  return `${hours}g ${mins}p`;
}
