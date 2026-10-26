/**
 * TMDEMY — Teacher Comment Management Types
 * Strictly reflects api/COMMENT_API.md (GET /api/comments/ and DELETE /api/comments/teacher/:id)
 */

export interface TeacherCommentUser {
  id?: string;
  _id?: string;
  username: string;
  avatar?: string;
  email?: string;
  role?: string;
}

export interface TeacherCommentLesson {
  id?: string;
  _id?: string;
  title: string;
}

export interface TeacherCommentCourse {
  id?: string;
  _id?: string;
  title: string;
  slug?: string;
}

export interface TeacherCommentItem {
  id: string;
  _id?: string;
  content: string;
  lesson?: TeacherCommentLesson | null;
  course?: TeacherCommentCourse | null;
  user: TeacherCommentUser;
  status?: string;
  parentId?: string | null;
  level?: number;
  likes?: string[];
  dislikes?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherCommentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TeacherCommentsListResponse {
  success: boolean;
  message?: string;
  data: {
    comments: TeacherCommentItem[];
    pagination: TeacherCommentsPagination;
  };
}

export interface TeacherCommentDeleteResponse {
  success: boolean;
  message: string;
}

export interface TeacherCommentKpis {
  totalComments: number | null;
  approvedComments: number | null;
  rootComments: number | null;
  repliesCount: number | null;
}

export interface GetTeacherCommentsParams {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: string;
  status?: string;
}

export type TeacherCommentFilterType = 'all' | 'root' | 'reply';
