import { apiClient } from '@/lib/api/client';
import { AppApiError } from '@/types/api';
import {
  AdminCommentDeleteResponse,
  AdminCommentsListResponse,
  GetAdminCommentsParams,
} from '@/types/admin-comment';

/**
 * Standardized error normalizer for Admin Comment moderation operations
 * Strictly handles HTTP 400, 401, 403, 404, 409, 422, 500, Network and Timeout errors
 */
export function normalizeCommentApiError(err: unknown, defaultMsg: string): string {
  if (err instanceof AppApiError) {
    switch (err.statusCode) {
      case 400:
        return err.message || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại ID bình luận.';
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác kiểm duyệt này (yêu cầu quyền Quản trị viên).';
      case 404:
        return 'Bình luận không tồn tại hoặc đã bị xóa khỏi hệ thống từ trước.';
      case 409:
        return 'Xung đột trạng thái bình luận. Vui lòng tải lại trang và thử lại.';
      case 422:
        return err.message || 'Dữ liệu không thỏa mãn quy tắc kiểm duyệt.';
      case 500:
        return 'Máy chủ gặp sự cố nội bộ khi xử lý bình luận. Vui lòng thử lại sau.';
      default:
        return err.message || defaultMsg;
    }
  }

  if (err instanceof Error) {
    if (
      err.message.includes('Network') ||
      err.message.includes('fetch') ||
      err.message.includes('Failed to fetch')
    ) {
      return 'Lỗi kết nối mạng. Không thể liên lạc với máy chủ TMdemy.';
    }
    if (err.message.includes('timeout') || err.message.includes('aborted')) {
      return 'Yêu cầu quá thời gian chờ (Timeout). Vui lòng thử lại.';
    }
    return err.message;
  }

  return defaultMsg;
}

export const adminCommentService = {
  /**
   * Lấy danh sách toàn bộ bình luận trong hệ thống (dành cho Admin)
   * GET /api/comments/
   */
  async getComments(
    params?: GetAdminCommentsParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCommentsListResponse> {
    const queryParams: Record<string, string | number | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.courseId && params.courseId !== 'all') queryParams.courseId = params.courseId;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;

    return apiClient.get<AdminCommentsListResponse>('/api/comments/', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Cập nhật trạng thái kiểm duyệt bình luận (APPROVED, HIDDEN, FLAGGED, PENDING) (BE-F9.11-003)
   * PATCH /api/comments/admin/:id/status
   */
  async updateCommentStatus(
    commentId: string,
    payload: import('@/types/admin-comment').UpdateCommentStatusPayload,
    options?: { signal?: AbortSignal }
  ): Promise<import('@/types/admin-comment').AdminCommentStatusResponse> {
    return apiClient.patch<import('@/types/admin-comment').AdminCommentStatusResponse>(
      `/api/comments/admin/${encodeURIComponent(commentId)}/status`,
      payload,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Quản trị viên gỡ bỏ bình luận vi phạm
   * DELETE /api/comments/admin/:id
   */
  async deleteComment(
    commentId: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminCommentDeleteResponse> {
    return apiClient.delete<AdminCommentDeleteResponse>(
      `/api/comments/admin/${encodeURIComponent(commentId)}`,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Lấy danh sách khóa học để hỗ trợ bộ lọc bình luận
   * GET /api/admin/courses?limit=100
   */
  async getCoursesForFilter(
    options?: { signal?: AbortSignal }
  ): Promise<Array<{ id: string; title: string }>> {
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { courses: Array<{ id: string; title: string }> };
      }>('/api/admin/courses', {
        params: { limit: 100 },
        signal: options?.signal,
      });

      if (res.success && res.data?.courses) {
        return res.data.courses.map((c) => ({ id: c.id, title: c.title }));
      }
      return [];
    } catch {
      return [];
    }
  },
};
