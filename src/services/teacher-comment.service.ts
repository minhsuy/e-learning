import { apiClient } from '@/lib/api/client';
import { AppApiError } from '@/types/api';
import {
  TeacherCommentDeleteResponse,
  TeacherCommentsListResponse,
  GetTeacherCommentsParams,
} from '@/types/teacher-comment';

/**
 * Normalizes error messages for Teacher Comment operations
 * Strictly handles HTTP 400, 401, 403, 404, 500, Network and Timeout errors
 */
export function normalizeTeacherCommentError(err: unknown, defaultMsg: string): string {
  if (err instanceof AppApiError) {
    switch (err.statusCode) {
      case 400:
        return err.message || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại ID bình luận.';
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn chỉ có quyền quản lý và gỡ bỏ bình luận thuộc các khóa học do bạn sở hữu.';
      case 404:
        return 'Bình luận không tồn tại hoặc đã bị gỡ bỏ từ trước.';
      case 409:
        return 'Xung đột trạng thái dữ liệu. Vui lòng tải lại trang và thử lại.';
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

export const teacherCommentService = {
  /**
   * Lấy danh sách bình luận trong các khóa học của Giảng viên hiện tại
   * GET /api/comments/ (backend tự động lọc theo khóa học của teacher khi gọi bằng token teacher)
   */
  async getComments(
    params?: GetTeacherCommentsParams,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherCommentsListResponse> {
    const queryParams: Record<string, string | number | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.courseId && params.courseId !== 'all') queryParams.courseId = params.courseId;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;

    return apiClient.get<TeacherCommentsListResponse>('/api/comments/', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Giảng viên xóa bình luận vi phạm trong khóa học của mình
   * DELETE /api/comments/teacher/:id
   */
  async deleteComment(
    commentId: string,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherCommentDeleteResponse> {
    return apiClient.delete<TeacherCommentDeleteResponse>(
      `/api/comments/teacher/${encodeURIComponent(commentId)}`,
      {
        signal: options?.signal,
      }
    );
  },

  /**
   * Lấy danh sách khóa học của Giảng viên để hỗ trợ bộ lọc bình luận
   * GET /api/teacher/courses/?limit=100
   */
  async getTeacherCourses(
    options?: { signal?: AbortSignal }
  ): Promise<Array<{ id: string; title: string }>> {
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { courses: Array<{ id: string; title: string }> };
      }>('/api/teacher/courses/', {
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
