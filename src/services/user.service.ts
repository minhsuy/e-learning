import { apiClient } from '@/lib/api/client';
import {
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetCurrentUserResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserProfile,
} from '@/types/auth';

/**
 * User Service
 * Quản lý tương tác API liên quan đến thông tin người dùng theo api/USER_API.md và api/AUTH_API.md
 */
export const userService = {
  /**
   * Lấy thông tin cá nhân của người dùng hiện tại đang đăng nhập
   * GET /api/users/me
   */
  async getMe(options?: { signal?: AbortSignal }): Promise<UserProfile> {
    const response = await apiClient.get<GetCurrentUserResponse>('/api/users/me', {
      signal: options?.signal,
    });
    return response.data;
  },

  /**
   * Lấy thông tin hồ sơ công khai của người dùng theo ID
   * GET /api/users/profile/:id
   */
  async getPublicProfile(id: string, options?: { signal?: AbortSignal }): Promise<UserProfile> {
    const response = await apiClient.get<{ success: boolean; message: string; data: UserProfile }>(
      `/api/users/profile/${id}`,
      {
        signal: options?.signal,
        skipAuth: true,
      }
    );
    return response.data;
  },

  /**
   * Cập nhật thông tin hồ sơ của người dùng hiện tại
   * PUT /api/users/update-me
   */
  async updateMe(data: UpdateProfileRequest, options?: { signal?: AbortSignal }): Promise<UserProfile> {
    const response = await apiClient.put<UpdateProfileResponse>('/api/users/update-me', data, {
      signal: options?.signal,
    });
    return response.data;
  },

  /**
   * Đổi mật khẩu tài khoản cho người dùng đang đăng nhập
   * PUT /api/users/change-password
   */
  async changePassword(
    data: ChangePasswordRequest,
    options?: { signal?: AbortSignal }
  ): Promise<ChangePasswordResponse> {
    return apiClient.put<ChangePasswordResponse>('/api/users/change-password', data, {
      signal: options?.signal,
    });
  },
};
