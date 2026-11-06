import { apiClient } from '@/lib/api/client';
import {
  PauseSchedulesResponse,
  TeacherTelegramSchedulesResponse,
  UpdateDailySchedulePayload,
  UpdateDailyScheduleResponse,
  UpdateWeeklySchedulePayload,
  UpdateWeeklyScheduleResponse,
} from '@/types/telegram-schedule';

/**
 * Teacher Telegram Report Scheduling Service (TG-05)
 *
 * Communicates with the TMdemy Node.js Backend for Daily and Weekly report scheduling.
 * Endpoints: docs/telegram/TG05_TELEGRAM_SCHEDULING_API.md
 */
export const telegramScheduleService = {
  /**
   * Retrieves schedules and Telegram link status for the authenticated teacher.
   * GET /api/teacher/telegram/schedules
   */
  async getSchedules(options?: { signal?: AbortSignal }): Promise<TeacherTelegramSchedulesResponse> {
    return apiClient.get<TeacherTelegramSchedulesResponse>('/api/teacher/telegram/schedules', {
      signal: options?.signal,
    });
  },

  /**
   * Configures or toggles the Daily Report schedule.
   * PUT /api/teacher/telegram/schedules/daily
   */
  async updateDailySchedule(
    payload: UpdateDailySchedulePayload,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateDailyScheduleResponse> {
    return apiClient.put<UpdateDailyScheduleResponse>(
      '/api/teacher/telegram/schedules/daily',
      payload,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Configures or toggles the Weekly Report schedule.
   * PUT /api/teacher/telegram/schedules/weekly
   */
  async updateWeeklySchedule(
    payload: UpdateWeeklySchedulePayload,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateWeeklyScheduleResponse> {
    return apiClient.put<UpdateWeeklyScheduleResponse>(
      '/api/teacher/telegram/schedules/weekly',
      payload,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Pauses all automated schedules for the authenticated teacher.
   * POST /api/teacher/telegram/schedules/pause
   */
  async pauseAllSchedules(options?: { signal?: AbortSignal }): Promise<PauseSchedulesResponse> {
    return apiClient.post<PauseSchedulesResponse>(
      '/api/teacher/telegram/schedules/pause',
      {},
      {
        signal: options?.signal,
      }
    );
  },
};

