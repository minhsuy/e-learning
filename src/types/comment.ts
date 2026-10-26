/**
 * TMDEMY — Comment & Discussion API Contract Types (api/COMMENT_API.md)
 */

export interface ApiCommentUser {
  id?: string;
  _id?: string;
  username: string;
  avatar?: string;
  role?: string;
}

export interface ApiCommentItem {
  id: string;
  _id?: string;
  content: string;
  lesson?: string | { id: string; title: string };
  course?: string | { id: string; title: string; slug: string };
  user: ApiCommentUser;
  status?: string;
  parentId?: string | null;
  level?: number;
  likes?: string[];
  dislikes?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface GetLessonCommentsResponse {
  success: boolean;
  message?: string;
  data: ApiCommentItem[];
}

export interface CreateCommentPayload {
  content: string;
  lesson: string;
  course: string;
  parentId?: string;
}

export interface CreateCommentResponse {
  success: boolean;
  message?: string;
  data: ApiCommentItem;
}

export interface UpdateCommentPayload {
  content: string;
}

export interface UpdateCommentResponse {
  success: boolean;
  message?: string;
  data: ApiCommentItem;
}

export interface DeleteCommentResponse {
  success: boolean;
  message?: string;
}

export interface CommentReactionResponse {
  success: boolean;
  message?: string;
  data?: {
    commentId: string;
    action: string;
  };
}
