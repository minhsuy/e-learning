/**
 * TMDEMY — TELEGRAM REPORT SCHEDULING TYPES (TG-05)
 *
 * Strict TypeScript types for automated Daily & Weekly Telegram report scheduling.
 * Source of Truth: docs/telegram/TG05_TELEGRAM_SCHEDULING_API.md
 */

export type TelegramReportType = 'DAILY' | 'WEEKLY';

export type TelegramReportStatus = 'SUCCESS' | 'FAILED' | null;

export interface TelegramReportSchedule {
  id: string;
  teacherId: string;
  reportType: TelegramReportType;
  isEnabled: boolean;
  deliveryTime: string; // 'HH:mm' e.g. '20:00', '08:00'
  dayOfWeek: number | null; // 1 (Mon) .. 7 (Sun), null for DAILY
  dayOfWeekLabel?: string | null; // e.g. "Thứ Hai"
  timezone: string; // 'Asia/Ho_Chi_Minh'
  nextRunAt: string | null; // ISO 8601 UTC string
  lastRunAt: string | null; // ISO 8601 UTC string
  lastStatus: TelegramReportStatus;
  failureReason: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface TeacherTelegramSchedulesData {
  teacherId: string;
  isTelegramLinked: boolean;
  telegramUsername: string | null;
  daily: TelegramReportSchedule;
  weekly: TelegramReportSchedule;
}

export interface TeacherTelegramSchedulesResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: TeacherTelegramSchedulesData;
}

export interface UpdateDailySchedulePayload {
  isEnabled?: boolean;
  deliveryTime?: string; // 'HH:mm'
}

export interface UpdateDailyScheduleResponse {
  success: boolean;
  statusCode?: number;
  message: string;
  data: TelegramReportSchedule;
}

export interface UpdateWeeklySchedulePayload {
  isEnabled?: boolean;
  deliveryTime?: string; // 'HH:mm'
  dayOfWeek?: number; // 1 (Mon) .. 7 (Sun)
}

export interface UpdateWeeklyScheduleResponse {
  success: boolean;
  statusCode?: number;
  message: string;
  data: TelegramReportSchedule;
}

export interface PauseSchedulesResponse {
  success: boolean;
  statusCode?: number;
  message: string;
  data?: {
    pausedCount: number;
  };
}

/**
 * Supported Day of Week mapping (1 = Thứ Hai, ..., 7 = Chủ Nhật)
 */
export interface DayOfWeekOption {
  value: number;
  label: string;
  shortLabel: string;
}

export const DAY_OF_WEEK_OPTIONS: DayOfWeekOption[] = [
  { value: 1, label: 'Thứ Hai', shortLabel: 'T2' },
  { value: 2, label: 'Thứ Ba', shortLabel: 'T3' },
  { value: 3, label: 'Thứ Tư', shortLabel: 'T4' },
  { value: 4, label: 'Thứ Năm', shortLabel: 'T5' },
  { value: 5, label: 'Thứ Sáu', shortLabel: 'T6' },
  { value: 6, label: 'Thứ Bảy', shortLabel: 'T7' },
  { value: 7, label: 'Chủ Nhật', shortLabel: 'CN' },
];

/**
 * Helper to get Vietnamese label for day of week
 */
export function formatDayOfWeek(day: number | null | undefined): string {
  if (!day) return '';
  const match = DAY_OF_WEEK_OPTIONS.find((opt) => opt.value === day);
  return match ? match.label : `Thứ ${day}`;
}

/**
 * Formats an ISO 8601 UTC timestamp to Vietnamese local time (Asia/Ho_Chi_Minh).
 * Example: '2026-11-09T01:00:00.000Z' -> '09/11/2026 lúc 08:00'
 */
export function formatNextRunDate(isoString?: string | null): string {
  if (!isoString) return 'Chưa có lịch';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Chưa có lịch';

  try {
    const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${dateFormatter.format(d)} lúc ${timeFormatter.format(d)}`;
  } catch {
    return isoString;
  }
}

