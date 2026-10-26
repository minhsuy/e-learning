'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AdminUserItem, AdminUserStatus } from '@/types/admin-user';
import { adminUserService } from '@/services/admin-user.service';
import { toast } from '@/lib/toast';

interface LockUserModalProps {
  user: AdminUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId?: string;
}

export function LockUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
}: LockUserModalProps) {
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const isCurrentUser = currentUserId === user.id;
  const isCurrentlyInactive = user.status?.toLowerCase() === 'inactive';
  const nextStatus: AdminUserStatus = isCurrentlyInactive ? 'active' : 'inactive';

  const handleConfirm = async () => {
    if (isCurrentUser) {
      toast.error('Bạn không thể tự khóa tài khoản Admin đang đăng nhập của chính mình!');
      return;
    }

    setLoading(true);
    try {
      await adminUserService.updateStatus(user.id, nextStatus);
      toast.success(
        isCurrentlyInactive
          ? `Đã mở khóa tài khoản "${user.username}" thành công!`
          : `Đã khóa tài khoản "${user.username}" thành công!`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái tài khoản';
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
          <div
            className={`flex items-center gap-2 font-bold text-base ${
              isCurrentlyInactive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isCurrentlyInactive ? (
              <Unlock className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
            <h2>
              {isCurrentlyInactive ? 'Mở khóa tài khoản' : 'Khóa tài khoản người dùng'}
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

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Target user info */}
          <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1">
            <p className="text-[#635a72] dark:text-[#a9a0b2]">Người dùng:</p>
            <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {user.username}{' '}
              <span className="text-xs font-normal text-[#635a72] dark:text-[#a9a0b2]">
                ({user.email})
              </span>
            </p>
            <p className="text-[#635a72] dark:text-[#a9a0b2]">
              Trạng thái hiện tại:{' '}
              <span
                className={`font-semibold ${
                  isCurrentlyInactive ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {isCurrentlyInactive ? 'Đã bị khóa (inactive)' : 'Đang hoạt động (active)'}
              </span>
            </p>
          </div>

          {/* Warning notice */}
          {isCurrentUser ? (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Cấm thao tác:</strong> Không thể tự khóa tài khoản Admin đang sử dụng để ngăn ngừa nguy cơ mất quyền truy cập quản trị hệ thống.
              </span>
            </div>
          ) : isCurrentlyInactive ? (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Sau khi mở khóa, người dùng có thể đăng nhập bình thường vào hệ thống và tiếp tục tham gia học tập hoặc giảng dạy.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Khi bị khóa, người dùng sẽ lập tức bị chặn đăng nhập và không thể thực hiện bất kỳ giao dịch hoặc thao tác nào trên nền tảng TMdemy.
              </span>
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
              type="button"
              id="confirm-lock-user-btn"
              data-testid="confirm-lock-user-btn"
              onClick={handleConfirm}
              disabled={loading || isCurrentUser}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
                isCurrentlyInactive
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : isCurrentlyInactive ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Xác nhận mở khóa</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Xác nhận khóa</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
