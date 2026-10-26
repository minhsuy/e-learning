import { apiClient } from '@/lib/api/client';
import {
  GetNotificationsParams,
  GetNotificationsResponse,
  MarkNotificationReadResponse,
} from '@/types/notification';

/**
 * TMDEMY — Notification Service
 *
 * Source of Truth: api/NOTIFICATION_API.md
 *
 * Endpoints:
 * - GET   /api/notifications/          : Lấy danh sách thông báo của người dùng (Bearer JWT required, phân trang, lọc theo type)
 * - PATCH /api/notifications/read/:id  : Đánh dấu một thông báo là đã đọc (Bearer JWT required)
 */
export const notificationService = {
  /**
   * Lấy danh sách thông báo của người dùng hiện tại
   * GET /api/notifications/
   */
  async getNotifications(
    params?: GetNotificationsParams,
    options?: { signal?: AbortSignal }
  ): Promise<GetNotificationsResponse> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.type !== undefined) queryParams.type = String(params.type).toUpperCase();

    const response = await apiClient.get<GetNotificationsResponse>(
      '/api/notifications/',
      {
        params: queryParams,
        signal: options?.signal,
      }
    );
    return response;
  },

  /**
   * Đánh dấu một thông báo là đã đọc
   * PATCH /api/notifications/read/:id
   */
  async markAsRead(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<MarkNotificationReadResponse> {
    const response = await apiClient.patch<MarkNotificationReadResponse>(
      `/api/notifications/read/${id}`,
      {},
      { signal: options?.signal }
    );
    return response;
  },
};
