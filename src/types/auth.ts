import { UserRole } from './api';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  phone?: string;
  bio?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  message: string;
}

export interface GoogleLoginRequest {
  idToken?: string;
  credential?: string;
  code?: string;
  redirectUri?: string;
  accessToken?: string;
}

export interface GoogleLoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  message: string;
  data: UserProfile;
  user: UserProfile;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  access_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface UserSocialLinks {
  facebook?: string;
  instagram?: string;
  github?: string;
}

export interface UserProfile {
  id: string;
  _id?: string;
  username: string;
  email: string;
  status: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  bio?: string;
  socialLinks?: UserSocialLinks;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetCurrentUserResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

export interface UpdateProfileRequest {
  username?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: UserSocialLinks;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'locked';
