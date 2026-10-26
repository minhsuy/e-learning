import { apiClient } from '@/lib/api/client';
import {
  AdminUserDetailResponse,
  AdminUserItem,
  AdminUserKpis,
  AdminUserRole,
  AdminUsersListResponse,
  AdminUserStatus,
  GetAdminUsersParams,
  UpdateAdminUserPayload,
  UpdateAdminUserResponse,
} from '@/types/admin-user';

type KpiSettledResponse = {
  data?: {
    pagination?: {
      total?: number | string;
    };
  };
};

export const adminUserService = {
  /**
   * Lấy danh sách người dùng có phân trang, lọc và tìm kiếm
   * GET /api/admin/users
   */
  async getUsers(
    params?: GetAdminUsersParams,
    options?: { signal?: AbortSignal }
  ): Promise<AdminUsersListResponse> {
    const queryParams: Record<string, string | number | undefined> = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.role && params.role !== 'all') queryParams.role = params.role;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.sortBy) queryParams.sortBy = params.sortBy;

    return apiClient.get<AdminUsersListResponse>('/api/admin/users', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Xem thông tin chi tiết một người dùng
   * GET /api/admin/users/:id
   */
  async getUserById(
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<AdminUserItem> {
    const res = await apiClient.get<AdminUserDetailResponse>(
      `/api/admin/users/${encodeURIComponent(id)}`,
      { signal: options?.signal }
    );
    return res.data;
  },

  /**
   * Cập nhật thông tin, vai trò hoặc trạng thái của người dùng
   * PUT /api/admin/users/:id
   */
  async updateUser(
    id: string,
    payload: UpdateAdminUserPayload,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateAdminUserResponse> {
    return apiClient.put<UpdateAdminUserResponse>(
      `/api/admin/users/${encodeURIComponent(id)}`,
      payload,
      { signal: options?.signal }
    );
  },

  /**
   * Thay đổi vai trò người dùng (Admin, Teacher, User)
   */
  async changeRole(
    id: string,
    role: AdminUserRole,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateAdminUserResponse> {
    return this.updateUser(id, { role }, options);
  },

  /**
   * Thay đổi trạng thái tài khoản (active / inactive - Khóa / Mở khóa)
   */
  async updateStatus(
    id: string,
    status: AdminUserStatus,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateAdminUserResponse> {
    return this.updateUser(id, { status }, options);
  },

  /**
   * Lấy tổng hợp 6 chỉ số KPI người dùng chính xác từ pagination.total
   */
  async getUserKpis(options?: { signal?: AbortSignal }): Promise<AdminUserKpis> {
    const results = await Promise.allSettled([
      // 1. Tổng người dùng
      this.getUsers({ limit: 1 }, options),
      // 2. Học viên
      this.getUsers({ limit: 1, role: 'user' }, options),
      // 3. Giảng viên
      this.getUsers({ limit: 1, role: 'teacher' }, options),
      // 4. Quản trị viên
      this.getUsers({ limit: 1, role: 'admin' }, options),
      // 5. Đang hoạt động
      this.getUsers({ limit: 1, status: 'active' }, options),
      // 6. Bị khóa
      this.getUsers({ limit: 1, status: 'inactive' }, options),
    ]);

    const extractTotal = (res: PromiseSettledResult<KpiSettledResponse>): number | null => {
      if (res.status === 'fulfilled' && res.value?.data?.pagination?.total !== undefined) {
        return Number(res.value.data.pagination.total);
      }
      return null;
    };

    return {
      totalUsers: extractTotal(results[0]),
      totalStudents: extractTotal(results[1]),
      totalTeachers: extractTotal(results[2]),
      totalAdmins: extractTotal(results[3]),
      activeAccounts: extractTotal(results[4]),
      inactiveAccounts: extractTotal(results[5]),
    };
  },
};
