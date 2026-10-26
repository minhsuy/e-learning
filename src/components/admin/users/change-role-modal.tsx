'use client';

import React, { useState } from 'react';
import {
  X,
  Shield,
  GraduationCap,
  User,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { AdminUserItem, AdminUserRole } from '@/types/admin-user';
import { adminUserService } from '@/services/admin-user.service';
import { toast } from '@/lib/toast';

interface ChangeRoleModalProps {
  user: AdminUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId?: string;
}

export function ChangeRoleModal({
  user,
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
}: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<AdminUserRole>(
    (user?.role as AdminUserRole) || 'user'
  );
  const [loading, setLoading] = useState<boolean>(false);



  if (!isOpen || !user) return null;

  const isCurrentUser = currentUserId === user.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentUser) {
      toast.error('Bạn không thể tự thay đổi vai trò của tài khoản đang đăng nhập!');
      return;
    }

    if (selectedRole === user.role) {
      toast.info('Vai trò được chọn trùng với vai trò hiện tại của người dùng.');
      onClose();
      return;
    }

    setLoading(true);
    try {
      await adminUserService.changeRole(user.id, selectedRole);
      toast.success(
        `Đã cập nhật vai trò người dùng "${user.username}" thành công!`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể thay đổi vai trò người dùng';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-2 text-[#7240b8] dark:text-[#a87ffb]">
            <Shield className="w-5 h-5" />
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Thay đổi vai trò người dùng
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target user info */}
          <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1">
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Tài khoản mục tiêu:
            </p>
            <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {user.username}{' '}
              <span className="text-xs font-normal text-[#635a72] dark:text-[#a9a0b2]">
                ({user.email})
              </span>
            </p>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Vai trò hiện tại:{' '}
              <span className="font-semibold text-[#7240b8] dark:text-[#a87ffb] uppercase">
                {user.role}
              </span>
            </p>
          </div>

          {/* Warning if self */}
          {isCurrentUser ? (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Cảnh báo bảo mật:</strong> Đây là tài khoản Admin của bạn. Hệ thống nghiêm cấm tự thay đổi quyền hạn hoặc tự hạ quyền để đảm bảo an toàn truy cập.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] block">
                Chọn vai trò mới:
              </label>

              <div className="space-y-2">
                {/* 1. User */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === 'user'
                      ? 'border-[#7240b8] bg-[#f7f1ff] dark:bg-[#2b2438]/60 dark:border-[#a87ffb]'
                      : 'border-[#f1ebff] dark:border-[#2b2438] hover:bg-[#fdf8ff] dark:hover:bg-[#1c1825]'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={selectedRole === 'user'}
                    onChange={() => setSelectedRole('user')}
                    className="mt-1 text-[#7240b8] focus:ring-[#7240b8]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                      <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Học viên (User)</span>
                    </div>
                    <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                      Quyền học tập thông thường, tham gia khóa học, bình luận và đánh giá.
                    </p>
                  </div>
                </label>

                {/* 2. Teacher */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === 'teacher'
                      ? 'border-[#7240b8] bg-[#f7f1ff] dark:bg-[#2b2438]/60 dark:border-[#a87ffb]'
                      : 'border-[#f1ebff] dark:border-[#2b2438] hover:bg-[#fdf8ff] dark:hover:bg-[#1c1825]'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={selectedRole === 'teacher'}
                    onChange={() => setSelectedRole('teacher')}
                    className="mt-1 text-[#7240b8] focus:ring-[#7240b8]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Giảng viên (Teacher)</span>
                    </div>
                    <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                      Được phép truy cập Kênh Giảng Viên, tạo khóa học mới, quản lý học viên và doanh thu.
                    </p>
                  </div>
                </label>

                {/* 3. Admin */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === 'admin'
                      ? 'border-[#7240b8] bg-[#f7f1ff] dark:bg-[#2b2438]/60 dark:border-[#a87ffb]'
                      : 'border-[#f1ebff] dark:border-[#2b2438] hover:bg-[#fdf8ff] dark:hover:bg-[#1c1825]'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={selectedRole === 'admin'}
                    onChange={() => setSelectedRole('admin')}
                    className="mt-1 text-[#7240b8] focus:ring-[#7240b8]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                      <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Quản trị viên (Admin)</span>
                    </div>
                    <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                      Toàn quyền quản trị hệ thống, kiểm duyệt nội dung, phân quyền và giám sát tài chính.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading || isCurrentUser}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#7240b8] text-white hover:bg-[#5f339d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Xác nhận cập nhật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
