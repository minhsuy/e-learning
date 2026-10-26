'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearTokens, getAccessToken, setTokens } from '@/lib/api/token';
import { authService } from '@/services/auth.service';
import { AppApiError } from '@/types/api';
import {
  AuthStatus,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  UserProfile,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/types/auth';

export interface AuthContextType {
  status: AuthStatus;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (credentials: LoginRequest) => Promise<UserProfile>;
  loginWithGoogle: (payload: GoogleLoginRequest) => Promise<UserProfile>;
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  verifyOtp: (data: VerifyOtpRequest) => Promise<VerifyOtpResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
}

export function isUserAccountLocked(profile: UserProfile | null | undefined): boolean {
  if (!profile || !profile.status) return false;
  return profile.status.toUpperCase() === 'INACTIVE';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      try {
        const profile = await authService.getMe();
        if (isMounted) {
          if (isUserAccountLocked(profile)) {
            setUser(profile);
            setStatus('locked');
          } else {
            setUser(profile);
            setStatus('authenticated');
          }
        }
      } catch {
        clearTokens();
        if (isMounted) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    };

    void checkSession();

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && getAccessToken()) {
        void checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<UserProfile> => {
    const loginRes = await authService.login(credentials);
    setTokens(loginRes.access_token, loginRes.refresh_token);

    try {
      const profile = await authService.getMe();
      if (isUserAccountLocked(profile)) {
        clearTokens();
        setUser(null);
        setStatus('unauthenticated');
        throw new AppApiError({
          statusCode: 403,
          message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên. Bạn không có quyền truy cập vào hệ thống.',
        });
      }
      setUser(profile);
      setStatus('authenticated');
      return profile;
    } catch (err) {
      clearTokens();
      if (err instanceof AppApiError && err.statusCode === 403) {
        throw err;
      }
      setUser(null);
      setStatus('unauthenticated');
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(async (payload: GoogleLoginRequest): Promise<UserProfile> => {
    const res = await authService.googleLogin(payload);
    setTokens(res.access_token, res.refresh_token);

    try {
      const profile = await authService.getMe();
      if (isUserAccountLocked(profile)) {
        clearTokens();
        setUser(null);
        setStatus('unauthenticated');
        throw new AppApiError({
          statusCode: 403,
          message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên. Bạn không có quyền truy cập vào hệ thống.',
        });
      }
      setUser(profile);
      setStatus('authenticated');
      return profile;
    } catch (err) {
      clearTokens();
      if (err instanceof AppApiError && err.statusCode === 403) {
        throw err;
      }
      setUser(null);
      setStatus('unauthenticated');
      throw err;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<RegisterResponse> => {
    return authService.register(data);
  }, []);

  const verifyOtp = useCallback(async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    return authService.verifyOtp(data);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Fail-safe: Local session must be cleared even if remote call fails
    } finally {
      clearTokens();
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const profile = await authService.getMe();
      if (isUserAccountLocked(profile)) {
        setUser(profile);
        setStatus('locked');
        return profile;
      }
      setUser(profile);
      setStatus('authenticated');
      return profile;
    } catch {
      clearTokens();
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      status,
      user,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      isLocked: status === 'locked' || isUserAccountLocked(user),
      login,
      loginWithGoogle,
      register,
      verifyOtp,
      logout,
      refreshUser,
    }),
    [status, user, login, loginWithGoogle, register, verifyOtp, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export const useAuth = useAuthContext;
