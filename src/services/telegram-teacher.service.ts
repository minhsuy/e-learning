import { apiClient } from '@/lib/api/client';
import {
  TeacherTelegramLinkTokenResponse,
  TeacherTelegramStatusResponse,
  TeacherTelegramUnlinkResponse,
} from '@/types/telegram';

/**
 * Teacher Telegram Service (TG-02B)
 *
 * Communicates with the TMdemy Node.js Backend for Telegram teacher bot linking.
 * Endpoints: docs/telegram/tg02_account_linking_api.md
 */
export const telegramTeacherService = {
  /**
   * Check current Telegram linking status for the authenticated teacher.
   * GET /api/teacher/telegram/status
   */
  async getStatus(options?: { signal?: AbortSignal }): Promise<TeacherTelegramStatusResponse> {
    return apiClient.get<TeacherTelegramStatusResponse>('/api/teacher/telegram/status', {
      signal: options?.signal,
    });
  },

  /**
   * Generate a 15-minute secure linking token and Telegram bot deep link.
   * POST /api/teacher/telegram/link-token
   */
  async generateLinkToken(options?: { signal?: AbortSignal }): Promise<TeacherTelegramLinkTokenResponse> {
    return apiClient.post<TeacherTelegramLinkTokenResponse>(
      '/api/teacher/telegram/link-token',
      {},
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Unlink the currently linked Telegram account.
   * DELETE /api/teacher/telegram/unlink
   */
  async unlinkAccount(options?: { signal?: AbortSignal }): Promise<TeacherTelegramUnlinkResponse> {
    return apiClient.delete<TeacherTelegramUnlinkResponse>('/api/teacher/telegram/unlink', {
      signal: options?.signal,
    });
  },
};

