'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import { telegramScheduleService } from '@/services/telegram-schedule.service';
import { AppApiError } from '@/types/api';
import {
  TeacherTelegramSchedulesData,
  UpdateDailySchedulePayload,
  UpdateWeeklySchedulePayload,
} from '@/types/telegram-schedule';

export interface UseTelegramSchedulesReturn {
  schedules: TeacherTelegramSchedulesData | null;
  isLoading: boolean;
  isSavingDaily: boolean;
  isSavingWeekly: boolean;
  isPausing: boolean;
  error: string | null;
  fetchSchedules: (silent?: boolean) => Promise<void>;
  updateDaily: (payload: UpdateDailySchedulePayload) => Promise<boolean>;
  updateWeekly: (payload: UpdateWeeklySchedulePayload) => Promise<boolean>;
  pauseAll: () => Promise<boolean>;
}

/**
 * Custom React hook managing TG-05 Telegram Report Scheduling state and mutations.
 *
 * Implements:
 * - Query current schedule status (Daily & Weekly)
 * - Configure Daily Report
 * - Configure Weekly Report
 * - Pause all schedules
 * - Reactive auto-sync when Telegram account linking changes
 */
export function useTelegramSchedules(): UseTelegramSchedulesReturn {
  const [schedules, setSchedules] = useState<TeacherTelegramSchedulesData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingDaily, setIsSavingDaily] = useState<boolean>(false);
  const [isSavingWeekly, setIsSavingWeekly] = useState<boolean>(false);
  const [isPausing, setIsPausing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  // Fetch schedules from backend
  const fetchSchedules = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const res = await telegramScheduleService.getSchedules();
      if (isMountedRef.current && res.success && res.data) {
        setSchedules(res.data);
        setError(null);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        if (err instanceof AppApiError) {
          setError(err.message || 'Không thể tải cấu hình lịch báo cáo.');
        } else {
          setError('Không thể kết nối đến máy chủ quản lý lịch báo cáo.');
        }
      }
    } finally {
      if (isMountedRef.current && !silent) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    let isCurrent = true;

    async function load() {
      await Promise.resolve();
      if (!isCurrent) return;
      await fetchSchedules();
    }

    void load();

    // Listen to TG-02B account link/unlink events for live synchronization
    const handleLinkEvent = () => {
      void fetchSchedules(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('tmdemy:telegram-linked', handleLinkEvent);
      window.addEventListener('tmdemy:telegram-unlinked', handleLinkEvent);
    }

    return () => {
      isCurrent = false;
      isMountedRef.current = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('tmdemy:telegram-linked', handleLinkEvent);
        window.removeEventListener('tmdemy:telegram-unlinked', handleLinkEvent);
      }
    };
  }, [fetchSchedules]);

  // Update Daily Report
  const updateDaily = useCallback(
    async (payload: UpdateDailySchedulePayload): Promise<boolean> => {
      setIsSavingDaily(true);
      try {
        const res = await telegramScheduleService.updateDailySchedule(payload);
        if (res.success && res.data) {
          toast.success(res.message || 'Cập nhật lịch báo cáo hàng ngày thành công.');
          // Update local state deterministically
          setSchedules((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              daily: {
                ...prev.daily,
                ...res.data,
              },
            };
          });
          return true;
        }
        return false;
      } catch (err: unknown) {
        if (err instanceof AppApiError) {
          if (err.statusCode === 400 && err.message.includes('chưa liên kết')) {
            toast.warning(err.message);
          } else {
            toast.error(err.message || 'Cập nhật lịch báo cáo hàng ngày thất bại.');
          }
        } else if (err instanceof Error) {
          toast.error(err.message);
        } else {
          toast.error('Lỗi kết nối khi cập nhật lịch báo cáo hàng ngày.');
        }
        return false;
      } finally {
        if (isMountedRef.current) {
          setIsSavingDaily(false);
        }
      }
    },
    []
  );

  // Update Weekly Report
  const updateWeekly = useCallback(
    async (payload: UpdateWeeklySchedulePayload): Promise<boolean> => {
      setIsSavingWeekly(true);
      try {
        const res = await telegramScheduleService.updateWeeklySchedule(payload);
        if (res.success && res.data) {
          toast.success(res.message || 'Cập nhật lịch báo cáo hàng tuần thành công.');
          // Update local state deterministically
          setSchedules((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              weekly: {
                ...prev.weekly,
                ...res.data,
              },
            };
          });
          return true;
        }
        return false;
      } catch (err: unknown) {
        if (err instanceof AppApiError) {
          if (err.statusCode === 400 && err.message.includes('chưa liên kết')) {
            toast.warning(err.message);
          } else {
            toast.error(err.message || 'Cập nhật lịch báo cáo hàng tuần thất bại.');
          }
        } else if (err instanceof Error) {
          toast.error(err.message);
        } else {
          toast.error('Lỗi kết nối khi cập nhật lịch báo cáo hàng tuần.');
        }
        return false;
      } finally {
        if (isMountedRef.current) {
          setIsSavingWeekly(false);
        }
      }
    },
    []
  );

  // Pause All Reports
  const pauseAll = useCallback(async (): Promise<boolean> => {
    setIsPausing(true);
    try {
      const res = await telegramScheduleService.pauseAllSchedules();
      if (res.success) {
        toast.success(res.message || 'Đã tạm dừng tất cả lịch báo cáo tự động.');
        // Update local state: set both to isEnabled = false, nextRunAt = null
        setSchedules((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            daily: {
              ...prev.daily,
              isEnabled: false,
              nextRunAt: null,
            },
            weekly: {
              ...prev.weekly,
              isEnabled: false,
              nextRunAt: null,
            },
          };
        });
        return true;
      }
      return false;
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        toast.error(err.message || 'Tạm dừng lịch báo cáo thất bại.');
      } else {
        toast.error('Lỗi kết nối khi tạm dừng lịch báo cáo.');
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsPausing(false);
      }
    }
  }, []);

  return {
    schedules,
    isLoading,
    isSavingDaily,
    isSavingWeekly,
    isPausing,
    error,
    fetchSchedules,
    updateDaily,
    updateWeekly,
    pauseAll,
  };
}

