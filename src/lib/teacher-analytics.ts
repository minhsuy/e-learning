import { AppApiError } from '@/types/api';
import {
  TeacherEnrollmentStatsData,
  TeacherEnrollmentStatsParams,
  TeacherRevenueData,
  TeacherRevenueParams,
  TeacherRevenuePeriod,
  TeacherTimeBasis,
  TeacherTimezone,
} from '@/types/teacher-statistics';
import {
  DateValidationResult,
  formatCompactVND,
  formatTimelineAxisLabel,
  getTimeBasisLabel,
  isValidCalendarDate,
  normalizeMethodBreakdown,
  validateAnalyticsDateRange,
} from './admin-analytics';

export {
  formatCompactVND,
  formatTimelineAxisLabel,
  getTimeBasisLabel,
  isValidCalendarDate,
  normalizeMethodBreakdown,
};

export interface TeacherAnalyticsFilterState {
  period: TeacherRevenuePeriod;
  startDate: string;
  endDate: string;
  timeBasis: TeacherTimeBasis;
  timezone: TeacherTimezone;
  courseId: string;
}

export const DEFAULT_TEACHER_ANALYTICS_FILTERS: TeacherAnalyticsFilterState = {
  period: '30days',
  startDate: '',
  endDate: '',
  timeBasis: 'recognizedAt',
  timezone: 'Asia/Ho_Chi_Minh',
  courseId: '',
};

const VALID_PERIODS: readonly TeacherRevenuePeriod[] = ['7days', '30days', '12months', 'custom'];
const VALID_TIME_BASES: readonly TeacherTimeBasis[] = ['recognizedAt', 'paidAt', 'createdAt'];
const VALID_TIMEZONES: readonly TeacherTimezone[] = ['Asia/Ho_Chi_Minh', 'UTC'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidCourseUuid(value: string | undefined): boolean {
  return Boolean(value && UUID_REGEX.test(value.trim()));
}

/**
 * Validates custom date range before issuing GET /api/teacher/statistics/revenue.
 */
export function validateTeacherDateRange(
  period: TeacherRevenuePeriod,
  startDate?: string,
  endDate?: string
): DateValidationResult {
  return validateAnalyticsDateRange(period, startDate, endDate);
}

/**
 * Parses URL search parameters into safe TeacherAnalyticsFilterState.
 * Never accepts or forwards teacherId.
 */
export function parseTeacherFiltersFromSearchParams(
  searchParams: { get(name: string): string | null }
): TeacherAnalyticsFilterState {
  const rawPeriod = searchParams.get('period');
  const period = VALID_PERIODS.includes(rawPeriod as TeacherRevenuePeriod)
    ? (rawPeriod as TeacherRevenuePeriod)
    : DEFAULT_TEACHER_ANALYTICS_FILTERS.period;

  const rawBasis = searchParams.get('timeBasis');
  const timeBasis = VALID_TIME_BASES.includes(rawBasis as TeacherTimeBasis)
    ? (rawBasis as TeacherTimeBasis)
    : DEFAULT_TEACHER_ANALYTICS_FILTERS.timeBasis;

  const rawTz = searchParams.get('timezone');
  const timezone = VALID_TIMEZONES.includes(rawTz as TeacherTimezone)
    ? (rawTz as TeacherTimezone)
    : DEFAULT_TEACHER_ANALYTICS_FILTERS.timezone;

  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const rawCourseId = searchParams.get('courseId') || '';

  return {
    period,
    startDate: isValidCalendarDate(startDate) ? startDate : '',
    endDate: isValidCalendarDate(endDate) ? endDate : '',
    timeBasis,
    timezone,
    courseId: isValidCourseUuid(rawCourseId) ? rawCourseId.trim() : '',
  };
}

/**
 * Serializes TeacherAnalyticsFilterState into URLSearchParams.
 */
export function serializeTeacherFiltersToSearchParams(
  filters: TeacherAnalyticsFilterState
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('period', filters.period);
  params.set('timeBasis', filters.timeBasis);
  params.set('timezone', filters.timezone);
  if (filters.period === 'custom') {
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
  }
  if (isValidCourseUuid(filters.courseId)) {
    params.set('courseId', filters.courseId.trim());
  }
  return params;
}

/**
 * Builds exact query params for GET /api/teacher/statistics/revenue.
 * Strictly omits teacherId (extracted from Bearer JWT on Backend).
 */
export function buildTeacherRevenueQueryParams(
  filters: TeacherAnalyticsFilterState
): TeacherRevenueParams {
  const params: TeacherRevenueParams = {
    period: filters.period,
    timeBasis: filters.timeBasis,
    timezone: filters.timezone,
  };

  if (filters.period === 'custom') {
    params.startDate = filters.startDate.trim();
    params.endDate = filters.endDate.trim();
  }

  if (isValidCourseUuid(filters.courseId)) {
    params.courseId = filters.courseId.trim();
  }

  return params;
}

/**
 * Builds exact query params for GET /api/teacher/statistics/enrollments.
 * Backend validator accepts period in ('7days' | '30days' | '12months'), so custom maps safely to '30days'.
 */
export function buildTeacherEnrollmentQueryParams(
  filters: TeacherAnalyticsFilterState
): TeacherEnrollmentStatsParams {
  const period: '7days' | '30days' | '12months' =
    filters.period === '7days' || filters.period === '12months' ? filters.period : '30days';

  const params: TeacherEnrollmentStatsParams = { period };
  if (isValidCourseUuid(filters.courseId)) {
    params.courseId = filters.courseId.trim();
  }
  return params;
}

export interface NormalizedTeacherRevenuePoint {
  date: string;
  label: string;
  revenue: number;
  orderCount: number;
}

export function normalizeTeacherRevenueTimeline(
  data: TeacherRevenueData | null | undefined
): NormalizedTeacherRevenuePoint[] {
  if (!data || !Array.isArray(data.timeline)) return [];
  return [...data.timeline]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      label: formatTimelineAxisLabel(item.date),
      revenue: Number(item.revenue) || 0,
      orderCount: Number(item.orderCount ?? item.ordersCount ?? 0) || 0,
    }));
}

export interface NormalizedTeacherEnrollmentPoint {
  date: string;
  label: string;
  count: number;
}

export function normalizeTeacherEnrollmentTimeline(
  data: TeacherEnrollmentStatsData | null | undefined
): NormalizedTeacherEnrollmentPoint[] {
  if (!data || !Array.isArray(data.timeline)) return [];
  return [...data.timeline]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      label: formatTimelineAxisLabel(item.date),
      count: Number(item.count ?? item.enrollmentsCount ?? 0) || 0,
    }));
}

export function getTeacherPeriodLabel(period: TeacherRevenuePeriod): string {
  switch (period) {
    case '7days':
      return '7 ngày gần nhất';
    case '30days':
      return '30 ngày gần nhất';
    case '12months':
      return '12 tháng gần nhất';
    case 'custom':
      return 'Khoảng tùy chỉnh';
    default:
      return '30 ngày gần nhất';
  }
}

export function formatTeacherVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Normalizes Teacher Statistics API errors (400, 401, 403, 404, 500, network) into clean Vietnamese messages.
 */
export function normalizeTeacherApiError(err: unknown, fallback: string): {
  statusCode: number | null;
  message: string;
} {
  if (err instanceof AppApiError) {
    switch (err.statusCode) {
      case 401:
        return {
          statusCode: 401,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại tài khoản Giảng viên.',
        };
      case 403:
        return {
          statusCode: 403,
          message:
            'Bạn không có quyền truy cập số liệu thống kê này (yêu cầu tài khoản Giảng viên đang hoạt động và sở hữu khóa học).',
        };
      case 404:
        return {
          statusCode: 404,
          message: 'Không tìm thấy khóa học hoặc dữ liệu thống kê yêu cầu.',
        };
      case 400:
        return {
          statusCode: 400,
          message: err.message || 'Tham số bộ lọc không hợp lệ. Vui lòng kiểm tra lại khoảng ngày.',
        };
      default:
        return {
          statusCode: err.statusCode,
          message: err.message || fallback,
        };
    }
  }

  if (err instanceof Error) {
    return { statusCode: null, message: err.message || fallback };
  }

  return { statusCode: null, message: fallback };
}
