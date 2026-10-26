export type AdminUserRole = 'admin' | 'teacher' | 'user';

export type AdminUserStatus = 'active' | 'inactive';

export interface AdminUserSocialLinks {
  facebook?: string;
  instagram?: string;
  github?: string;
}

export interface AdminUserItem {
  id: string;
  _id?: string;
  username: string;
  email: string;
  role: AdminUserRole | string;
  status: AdminUserStatus | string;
  avatar?: string;
  phone?: string;
  bio?: string;
  socialLinks?: AdminUserSocialLinks;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetAdminUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  sortBy?: 'createdAt' | 'username' | 'email' | string;
}

export interface AdminUsersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUsersListResponse {
  success: boolean;
  message?: string;
  data: {
    users: AdminUserItem[];
    pagination: AdminUsersPagination;
  };
}

export interface AdminUserDetailResponse {
  success: boolean;
  message?: string;
  data: AdminUserItem;
}

export interface UpdateAdminUserPayload {
  username?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  phone?: string;
  bio?: string;
  socialLinks?: AdminUserSocialLinks;
}

export interface UpdateAdminUserResponse {
  success: boolean;
  message: string;
  data: AdminUserItem;
}

export interface AdminUserKpis {
  totalUsers: number | null;
  totalStudents: number | null;
  totalTeachers: number | null;
  totalAdmins: number | null;
  activeAccounts: number | null;
  inactiveAccounts: number | null;
}
