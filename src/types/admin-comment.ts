/**
 * TMDEMY — Admin Comment Types
 * Strictly reflects api/COMMENT_API.md and api/ADMIN_API.md
 */

export interface AdminCommentUser {
  id?: string;
  _id?: string;
  username: string;
  avatar?: string;
  email?: string;
  role?: string;
}

export interface AdminCommentLesson {
  id?: string;
  _id?: string;
  title: string;
}

export interface AdminCommentCourse {
  id?: string;
  _id?: string;
  title: string;
  slug?: string;
}

export interface AdminCommentItem {
  id: string;
  _id?: string;
  content: string;
  lesson?: AdminCommentLesson | null;
  course?: AdminCommentCourse | null;
  user: AdminCommentUser;
  status?: 'PENDING' | 'APPROVED' | 'HIDDEN' | 'FLAGGED' | string;
  moderationNote?: string | null;
  parentId?: string | null;
  level?: number;
  likes?: string[];
  dislikes?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AdminCommentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminCommentsListResponse {
  success: boolean;
  message?: string;
  data: {
    comments: AdminCommentItem[];
    pagination: AdminCommentsPagination;
  };
}

export interface UpdateCommentStatusPayload {
  status: 'PENDING' | 'APPROVED' | 'HIDDEN' | 'FLAGGED' | string;
  moderationNote?: string;
}

export interface AdminCommentStatusResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    status: string;
    moderationNote?: string | null;
    updatedAt?: string;
  };
}

export interface AdminCommentDeleteResponse {
  success: boolean;
  message: string;
}

export interface AdminCommentKpis {
  totalComments: number | null;
  approvedComments: number | null;
  hiddenComments?: number | null;
  flaggedComments?: number | null;
  pendingComments?: number | null;
  rootComments: number | null;
  repliesCount: number | null;
}

export interface GetAdminCommentsParams {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: string;
  status?: string;
}

export type CommentFilterType = 'all' | 'root' | 'reply';
export type CommentModerationStatus = 'all' | 'approved' | 'hidden' | 'flagged' | 'pending';
