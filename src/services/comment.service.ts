import { apiClient } from '@/lib/api/client';
import {
  GetLessonCommentsResponse,
  CreateCommentPayload,
  CreateCommentResponse,
  UpdateCommentPayload,
  UpdateCommentResponse,
  DeleteCommentResponse,
  CommentReactionResponse,
} from '@/types/comment';

/**
 * TMDEMY — Comment & Discussion Service (api/COMMENT_API.md)
 */
export const commentService = {
  /**
   * Lấy danh sách bình luận của bài học theo cây phân cấp
   * GET /api/comments/lesson/:lessonId
   */
  async getLessonComments(lessonId: string, options?: { signal?: AbortSignal }): Promise<GetLessonCommentsResponse> {
    return apiClient.get<GetLessonCommentsResponse>(`/api/comments/lesson/${encodeURIComponent(lessonId)}`, {
      skipAuth: true,
      signal: options?.signal,
    });
  },

  /**
   * Đăng bình luận gốc hoặc trả lời trong bài học
   * POST /api/comments/
   */
  async createComment(payload: CreateCommentPayload, options?: { signal?: AbortSignal }): Promise<CreateCommentResponse> {
    return apiClient.post<CreateCommentResponse>('/api/comments/', payload, {
      signal: options?.signal,
    });
  },

  /**
   * Tác giả cập nhật nội dung bình luận của chính mình
   * PUT /api/comments/:id
   */
  async updateComment(commentId: string, payload: UpdateCommentPayload, options?: { signal?: AbortSignal }): Promise<UpdateCommentResponse> {
    return apiClient.put<UpdateCommentResponse>(`/api/comments/${encodeURIComponent(commentId)}`, payload, {
      signal: options?.signal,
    });
  },

  /**
   * Học viên tự xóa bình luận của chính mình
   * DELETE /api/comments/:id
   */
  async deleteComment(commentId: string, options?: { signal?: AbortSignal }): Promise<DeleteCommentResponse> {
    return apiClient.delete<DeleteCommentResponse>(`/api/comments/${encodeURIComponent(commentId)}`, {
      signal: options?.signal,
    });
  },

  /**
   * Bày tỏ cảm xúc Thích (LIKE) đối với bình luận (toggle)
   * POST /api/comments/like/:commentId
   */
  async likeComment(commentId: string, options?: { signal?: AbortSignal }): Promise<CommentReactionResponse> {
    return apiClient.post<CommentReactionResponse>(`/api/comments/like/${encodeURIComponent(commentId)}`, {}, {
      signal: options?.signal,
    });
  },

  /**
   * Bày tỏ cảm xúc Không thích (DISLIKE) đối với bình luận (toggle)
   * POST /api/comments/dislike/:commentId
   */
  async dislikeComment(commentId: string, options?: { signal?: AbortSignal }): Promise<CommentReactionResponse> {
    return apiClient.post<CommentReactionResponse>(`/api/comments/dislike/${encodeURIComponent(commentId)}`, {}, {
      signal: options?.signal,
    });
  },
};
