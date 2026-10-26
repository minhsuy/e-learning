import { apiClient } from '@/lib/api/client';
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GetCurrentUserResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UserProfile,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/types/auth';

/**
 * Authentication API Service
 * Central abstraction for all TMDEMY authentication endpoints.
 * Strictly adheres to api/AUTH_API.md and api/AUTH_FLOW.md.
 */
export const authService = {
  /**
   * Register a new student account.
   * POST /api/users/register
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/api/users/register', data, {
      skipAuth: true,
    });
  },

  /**
   * Verify email using 6-digit OTP received via email.
   * POST /api/users/verify-otp
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    return apiClient.post<VerifyOtpResponse>('/api/users/verify-otp', data, {
      skipAuth: true,
    });
  },

  /**
   * Login with email and password.
   * POST /api/users/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/api/users/login', credentials, {
      skipAuth: true,
    });
  },

  /**
   * Login or auto-register using Google OAuth credentials / ID Token / Auth Code.
   * POST /api/users/google-login
   */
  async googleLogin(payload: GoogleLoginRequest): Promise<GoogleLoginResponse> {
    return apiClient.post<GoogleLoginResponse>('/api/users/google-login', payload, {
      skipAuth: true,
    });
  },

  /**
   * Get current authenticated user details.
   * GET /api/users/me
   */
  async getMe(): Promise<UserProfile> {
    const response = await apiClient.get<GetCurrentUserResponse>('/api/users/me');
    return response.data;
  },

  /**
   * Revoke session and refresh token on backend.
   * POST /api/users/logout
   */
  async logout(): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>('/api/users/logout');
  },

  /**
   * Request password reset link via email.
   * POST /api/users/forgot-password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>('/api/users/forgot-password', data, {
      skipAuth: true,
    });
  },

  /**
   * Reset password with token received in email link.
   * PUT /api/users/reset-password
   * Note: Backend contract specifies PUT method in api/AUTH_API.md and api/API_INDEX.md.
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return apiClient.put<ResetPasswordResponse>('/api/users/reset-password', data, {
      skipAuth: true,
    });
  },

  /**
   * Request fresh access token with current refresh token.
   * POST /api/users/access_token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return apiClient.post<RefreshTokenResponse>(
      '/api/users/access_token',
      { refresh_token: refreshToken },
      { skipAuth: true, skipRefresh: true }
    );
  },
};
