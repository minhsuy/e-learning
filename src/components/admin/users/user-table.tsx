'use client';

import React from 'react';
import Image from 'next/image';
import {
  User,
  Shield,
  GraduationCap,
  Eye,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { AdminUserItem } from '@/types/admin-user';
import { cn } from '@/lib/utils';

interface UserTableProps {
  users: AdminUserItem[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onViewDetail: (user: AdminUserItem) => void;
  onChangeRole: (user: AdminUserItem) => void;
  onToggleStatus: (user: AdminUserItem) => void;
  onResetFilters?: () => void;
  isFiltered?: boolean;
  currentUserId?: string;
}

export function UserTable({
  users,
  loading,
  error,
  onRetry,
  onViewDetail,
  onChangeRole,
  onToggleStatus,
  onResetFilters,
  isFiltered = false,
  currentUserId,
}: UserTableProps) {
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
    const norm = (role || '').toLowerCase();
    switch (norm) {
      case 'admin':
        return {
          label: 'Quản trị viên',
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
            'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/40',
        };
    }
  };

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-xs">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] animate-pulse"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#f1ebff] dark:bg-[#2b2438] shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded w-1/3" />
                  <div className="h-3 bg-[#f1ebff] dark:bg-[#2b2438] rounded w-1/2" />
                </div>
              </div>
              <div className="h-6 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-full shrink-0" />
              <div className="h-6 w-24 bg-[#f1ebff] dark:bg-[#2b2438] rounded-full shrink-0" />
              <div className="h-7 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-12 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Không thể tải danh sách người dùng
          </h3>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1 max-w-md mx-auto">
            {error}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#7240b8] text-white hover:bg-[#5f339d] transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại tải trang</span>
          </button>
        )}
      </div>
    );
  }

  // 3. Empty State
  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-12 text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mx-auto">
          <Users className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            {isFiltered
              ? 'Không tìm thấy người dùng phù hợp'
              : 'Hệ thống chưa có tài khoản nào'}
          </h3>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1 max-w-sm mx-auto">
            {isFiltered
              ? 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn các điều kiện lọc vai trò, trạng thái.'
              : 'Khi có học viên hoặc giảng viên đăng ký, danh sách sẽ được hiển thị tại đây.'}
          </p>
        </div>
        {isFiltered && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ede3ff] transition-colors"
          >
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>
    );
  }

  // 4. Data Table (Desktop) & Cards (Mobile)
  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-xs overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f] text-[11px] font-bold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider">
              <th className="py-3.5 px-5">Người dùng</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Vai trò</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4">Ngày đăng ký</th>
              <th className="py-3.5 px-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1ebff] dark:divide-[#2b2438] text-xs">
            {users.map((user) => {
              const roleBadge = getRoleBadge(user.role);
              const RoleIcon = roleBadge.icon;
              const isInactive = user.status?.toLowerCase() === 'inactive';
              const isCurrentUser = currentUserId === user.id;

              return (
                <tr
                  key={user.id || user._id}
                  className="hover:bg-[#fdf8ff] dark:hover:bg-[#1c1825] transition-colors"
                >
                  {/* User info */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-center">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.username || 'User'}
                            fill
                            sizes="36px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <User className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                            {user.username || 'Người dùng'}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              Bạn
                            </span>
                          )}
                        </div>
                        {user.phone && (
                          <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-4 text-[#635a72] dark:text-[#a9a0b2] max-w-[200px] truncate">
                    {user.email}
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                        roleBadge.className
                      )}
                    >
                      <RoleIcon className="w-3 h-3" />
                      <span>{roleBadge.label}</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                        isInactive
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isInactive ? 'bg-rose-500' : 'bg-emerald-500'
                        )}
                      />
                      <span>{isInactive ? 'Bị khóa' : 'Hoạt động'}</span>
                    </span>
                  </td>

                  {/* Created date */}
                  <td className="py-3.5 px-4 text-[#635a72] dark:text-[#a9a0b2]">
                    {formatDate(user.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Detail */}
                      <button
                        onClick={() => onViewDetail(user)}
                        className="p-1.5 rounded-lg text-[#635a72] dark:text-[#a9a0b2] hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors"
                        title="Xem chi tiết tài khoản"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Change Role */}
                      <button
                        onClick={() => onChangeRole(user)}
                        disabled={isCurrentUser}
                        className="p-1.5 rounded-lg text-[#635a72] dark:text-[#a9a0b2] hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          isCurrentUser
                            ? 'Không thể đổi quyền tài khoản của chính mình'
                            : 'Thay đổi vai trò'
                        }
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>

                      {/* Lock / Unlock */}
                      <button
                        onClick={() => onToggleStatus(user)}
                        disabled={isCurrentUser}
                        data-testid={`toggle-status-btn-${user.id}`}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
                          isInactive
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        )}
                        title={
                          isCurrentUser
                            ? 'Không thể tự khóa tài khoản của chính mình'
                            : isInactive
                            ? 'Mở khóa tài khoản'
                            : 'Khóa tài khoản'
                        }
                      >
                        {isInactive ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
        {users.map((user) => {
          const roleBadge = getRoleBadge(user.role);
          const RoleIcon = roleBadge.icon;
          const isInactive = user.status?.toLowerCase() === 'inactive';
          const isCurrentUser = currentUserId === user.id;

          return (
            <div key={user.id || user._id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#1c192c] dark:text-[#f4eeff] truncate">
                        {user.username}
                      </span>
                      {isCurrentUser && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0',
                    isInactive
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}
                >
                  {isInactive ? 'Bị khóa' : 'Hoạt động'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#635a72] dark:text-[#a9a0b2] pt-1">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border',
                    roleBadge.className
                  )}
                >
                  <RoleIcon className="w-2.5 h-2.5" />
                  <span>{roleBadge.label}</span>
                </span>

                <span>Đăng ký: {formatDate(user.createdAt)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
                <button
                  onClick={() => onViewDetail(user)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]"
                >
                  Chi tiết
                </button>
                <button
                  onClick={() => onChangeRole(user)}
                  disabled={isCurrentUser}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] disabled:opacity-40"
                >
                  Đổi vai trò
                </button>
                <button
                  onClick={() => onToggleStatus(user)}
                  disabled={isCurrentUser}
                  data-testid={`mobile-toggle-status-btn-${user.id}`}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-40',
                    isInactive ? 'bg-emerald-600' : 'bg-rose-600'
                  )}
                >
                  {isInactive ? 'Mở khóa' : 'Khóa'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
