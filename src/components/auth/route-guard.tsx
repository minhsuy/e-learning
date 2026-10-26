'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/api';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Loader2 } from 'lucide-react';

export interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  guestOnly?: boolean;
  fallbackUrl?: string;
}

/**
 * Returns default dashboard route according to user role.
 */
export function getDefaultRolePath(role?: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'teacher':
      return '/teacher/dashboard';
    case 'user':
    default:
      return '/';
  }
}

/**
 * RouteGuard protects views against unauthorized access while avoiding flash of unauthenticated content.
 */
export function RouteGuard({
  children,
  allowedRoles,
  requireAuth = false,
  guestOnly = false,
  fallbackUrl,
}: RouteGuardProps) {
  const { user, isLoading, isAuthenticated, isLocked } = useAuth();
  const router = useRouter();

  const isRoleAllowed = !allowedRoles || (user && allowedRoles.includes(user.role));
  const isAccountBlocked = isLocked || Boolean(user && user.status?.toUpperCase() === 'INACTIVE');

  useEffect(() => {
    if (isLoading) return;

    if (isAccountBlocked) {
      return; // Completely blocked by AccountLockedModal
    }

    if (guestOnly && isAuthenticated) {
      const target = fallbackUrl || getDefaultRolePath(user?.role);
      router.replace(target);
      return;
    }

    if (requireAuth && !isAuthenticated) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const loginUrl = currentPath && currentPath !== '/' 
        ? `/login?redirect=${encodeURIComponent(currentPath)}` 
        : '/login';
      router.replace(loginUrl);
    }
  }, [isLoading, isAccountBlocked, guestOnly, requireAuth, isAuthenticated, user, router, fallbackUrl]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Đang xác thực thông tin...</p>
      </div>
    );
  }

  // Account locked guard: user is banned/inactive
  if (isAccountBlocked) {
    return null;
  }

  // Guest only guard: already logged in
  if (guestOnly && isAuthenticated) {
    return null;
  }

  // Auth guard: not logged in
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Role guard: logged in but forbidden role
  if (requireAuth && isAuthenticated && !isRoleAllowed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Không có quyền truy cập (403)</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Tài khoản của bạn ({user?.role}) không có quyền truy cập vào phân hệ này. Vui lòng quay về khu vực được cấp quyền.
        </p>
        <Button onClick={() => router.push(getDefaultRolePath(user?.role))}>
          Đến trang tổng quan
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
