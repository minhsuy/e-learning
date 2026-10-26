'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, User, AlertTriangle, RefreshCw, Shield, GraduationCap } from 'lucide-react';
import { AdminUserSummary } from '@/types/admin-dashboard';
import { cn } from '@/lib/utils';

interface RecentUsersCardProps {
  users: AdminUserSummary[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function RecentUsersCard({
  users,
  loading,
  error,
  onRetry,
}: RecentUsersCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getRoleBadge = (role?: string) => {
    const normalized = (role || '').toLowerCase();
    switch (normalized) {
      case 'admin':
        return {
          label: 'Admin',
          icon: Shield,
          className:
            'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
        };
      case 'teacher':
        return {
          label: 'Giảng viên',
          icon: GraduationCap,
          className:
            'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
        };
      default:
        return {
          label: 'Học viên',
          icon: User,
          className:
            'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
        };
    }
  };

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 md:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Người dùng mới đăng ký
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Tài khoản mới tham gia nền tảng TMdemy
            </p>
          </div>
        </div>

        <Link
          href="/admin/users"
          className="text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:text-[#5a3294] dark:hover:text-[#c4a5ff] inline-flex items-center gap-1 transition-colors"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content Area */}
      <div className="my-3 min-h-[260px] flex flex-col justify-center">
        {loading ? (
          <div className="space-y-3 py-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-[#f1ebff] dark:bg-[#2b2438] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded w-2/3" />
                  <div className="h-3 bg-[#f1ebff] dark:bg-[#2b2438] rounded w-1/2" />
                </div>
                <div className="h-5 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1c192c] dark:text-[#f4eeff]">
                Không thể tải danh sách người dùng mới
              </p>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                {error}
              </p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7240b8] text-white hover:bg-[#5f339d] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            )}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-[#1c192c] dark:text-[#f4eeff]">
              Chưa có người dùng mới đăng ký
            </p>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Hệ thống sẽ cập nhật ngay khi có tài khoản mới.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {users.slice(0, 5).map((user) => {
              const roleBadge = getRoleBadge(user.role);
              const RoleIcon = roleBadge.icon;
              return (
                <div
                  key={user.id || user._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] hover:border-[#7240b8]/30 dark:hover:border-[#a87ffb]/30 transition-colors"
                >
                  {/* Avatar & User Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-center">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.username || 'User'}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <User className="w-5 h-5 text-[#7240b8] dark:text-[#a87ffb]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                          {user.username || 'Người dùng'}
                        </span>
                        {user.status?.toLowerCase() === 'active' && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                            title="Đang hoạt động"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                        <span className="truncate max-w-[160px]" title={user.email}>
                          {user.email}
                        </span>
                        <span>•</span>
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="shrink-0 pl-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                        roleBadge.className
                      )}
                    >
                      <RoleIcon className="w-2.5 h-2.5" />
                      <span>{roleBadge.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
        <span>Hiển thị tối đa 5 người dùng mới</span>
        <Link
          href="/admin/users"
          className="font-medium hover:text-[#7240b8] dark:hover:text-[#a87ffb] underline-offset-2 hover:underline"
        >
          Quản lý tài khoản
        </Link>
      </div>
    </div>
  );
}
