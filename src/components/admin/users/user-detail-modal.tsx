'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  User,
  Shield,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  FileText,
  Lock,
  Unlock,
  ShieldAlert,
  Globe,
  Loader2,
} from 'lucide-react';
import { AdminUserItem } from '@/types/admin-user';
import { adminUserService } from '@/services/admin-user.service';
import { cn } from '@/lib/utils';

interface UserDetailModalProps {
  user: AdminUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onChangeRole: (user: AdminUserItem) => void;
  onToggleStatus: (user: AdminUserItem) => void;
  currentUserId?: string;
}

export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onChangeRole,
  onToggleStatus,
  currentUserId,
}: UserDetailModalProps) {
  const [freshUser, setFreshUser] = useState<AdminUserItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const detailUser = freshUser || user;

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchFreshDetail = async () => {
      setLoading(true);
      try {
        const fresh = await adminUserService.getUserById(user.id, {
          signal: controller.signal,
        });
        if (isMounted && fresh) {
          setFreshUser(fresh);
        }
      } catch {
        // Fallback to existing user item already set
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFreshDetail();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isOpen, user?.id]);

  if (!isOpen || !detailUser) return null;

  const isCurrentUser = currentUserId === detailUser.id;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa có thông tin';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

  const roleInfo = getRoleBadge(detailUser.role);
  const RoleIcon = roleInfo.icon;
  const isInactive = detailUser.status?.toLowerCase() === 'inactive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Hồ sơ người dùng
            </h2>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7240b8]" />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Avatar & Main identities */}
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] border border-[#f1ebff] dark:border-[#2b2438] shrink-0 flex items-center justify-center">
              {detailUser.avatar ? (
                <Image
                  src={detailUser.avatar}
                  alt={detailUser.username || 'Avatar'}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <User className="w-8 h-8 text-[#7240b8] dark:text-[#a87ffb]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                  {detailUser.username || 'Chưa đặt tên'}
                </h3>
                {isCurrentUser && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    Bạn (Tài khoản hiện tại)
                  </span>
                )}
              </div>

              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{detailUser.email}</span>
              </p>

              <div className="flex items-center gap-2 mt-2.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                    roleInfo.className
                  )}
                >
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleInfo.label}</span>
                </span>

                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                    isInactive
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                  )}
                >
                  {isInactive ? 'Đã bị khóa' : 'Đang hoạt động'}
                </span>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3 pt-4 border-t border-[#f1ebff] dark:border-[#2b2438] text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Số điện thoại:
              </span>
              <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                {detailUser.phone || 'Chưa cập nhật'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Ngày đăng ký:
              </span>
              <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                {formatDate(detailUser.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Cập nhật lần cuối:
              </span>
              <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                {formatDate(detailUser.updatedAt)}
              </span>
            </div>

            {/* Bio */}
            <div className="py-2">
              <span className="text-[#635a72] dark:text-[#a9a0b2] block mb-1">
                Giới thiệu bản thân (Bio):
              </span>
              <p className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] italic leading-relaxed">
                {detailUser.bio || 'Chưa có thông tin giới thiệu.'}
              </p>
            </div>

            {/* Social links if any */}
            {(detailUser.socialLinks?.facebook ||
              detailUser.socialLinks?.instagram ||
              detailUser.socialLinks?.github) && (
              <div className="py-1">
                <span className="text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Liên kết mạng xã hội:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {detailUser.socialLinks?.facebook && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200">
                      Facebook: {detailUser.socialLinks.facebook}
                    </span>
                  )}
                  {detailUser.socialLinks?.github && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200">
                      GitHub: {detailUser.socialLinks.github}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-[#fdf8ff] dark:bg-[#17141f] border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={() => {
              onClose();
              onChangeRole(detailUser);
            }}
            disabled={isCurrentUser}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={isCurrentUser ? 'Không thể đổi quyền tài khoản của chính mình' : undefined}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Đổi vai trò</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onToggleStatus(detailUser);
            }}
            disabled={isCurrentUser}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
              isInactive
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            )}
            title={isCurrentUser ? 'Không thể tự khóa tài khoản của chính mình' : undefined}
          >
            {isInactive ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở khóa tài khoản</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa tài khoản</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
