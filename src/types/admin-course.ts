export type AdminCourseStatus = 'approved' | 'pending' | 'rejected' | string;

export interface AdminCourseAuthor {
  id: string;
  _id?: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export interface AdminCourseCategory {
  id: string;
  _id?: string;
  name: string;
  slug?: string;
}

export interface AdminCourseItem {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  image?: string;
  price: number;
  oldPrice?: number;
  old_price?: number;
  level?: string;
  type?: string;
  status: AdminCourseStatus;
  sold?: number;
  view?: number;
  isDestroyed?: boolean;
  _destroy?: boolean;
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string | null;
  author?: AdminCourseAuthor;
  category?: AdminCourseCategory;
}

export interface GetAdminCoursesParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  category?: string;
  author?: string;
  _destroy?: boolean;
}

export interface AdminCoursesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminCoursesListResponse {
  success: boolean;
  message?: string;
  data: {
    courses: AdminCourseItem[];
    pagination: AdminCoursesPagination;
  };
}

export interface AdminLessonItem {
  id: string;
  _id?: string;
  title: string;
  duration?: number;
  type?: string;
  isDemo?: boolean;
  order: number;
}

export interface AdminChapterItem {
  id: string;
  _id?: string;
  title: string;
  order: number;
  course?: string;
  _destroy?: boolean;
  lessons: AdminLessonItem[];
}

export interface AdminChaptersResponse {
  success: boolean;
  message?: string;
  data: AdminChapterItem[];
}

export interface AdminCourseMutationResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    status: string;
  };
}

export interface AdminCourseDeleteResponse {
  success: boolean;
  message: string;
}

export interface AdminCourseKpis {
  totalCourses: number | null;
  pendingCourses: number | null;
  approvedCourses: number | null;
  rejectedCourses: number | null;
}
