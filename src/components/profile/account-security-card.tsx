'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Info,
  LogOut,
} from 'lucide-react';
import { userService } from '@/services/user.service';
import { useAuth } from '@/hooks/use-auth';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';

export function AccountSecurityCard() {
  const router = useRouter();
  const { logout } = useAuth();

  // Form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Calculate password strength
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: 'Chưa nhập', color: 'bg-gray-200 dark:bg-gray-700' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 33, label: 'Yếu', color: 'bg-rose-500' };
    if (score <= 4) return { score: 66, label: 'Trung bình', color: 'bg-amber-500' };
    return { score: 100, label: 'Mạnh', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  // Client Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!oldPassword) {
      errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    } else if (oldPassword.length < 6) {
      errors.oldPassword = 'Mật khẩu hiện tại phải có tối thiểu 6 ký tự.';
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
    } else if (newPassword === oldPassword) {
      errors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp với mật khẩu mới.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      setFormError('Vui lòng kiểm tra lại thông tin mật khẩu bên dưới.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const res = await userService.changePassword({
        oldPassword,
        password: newPassword,
        confirm_password: confirmPassword,
      });

      // Clear sensitive inputs immediately
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSuccess(true);
      toast.success(res.message || 'Đổi mật khẩu thành công!');
    } catch (err: unknown) {
      setIsSuccess(false);
      if (err instanceof AppApiError) {
        if (err.validationErrors) {
          setFieldErrors(err.validationErrors);
        }
        if (err.message === 'Old password is incorrect') {
          setFieldErrors((prev) => ({
            ...prev,
            oldPassword: 'Mật khẩu hiện tại không chính xác.',
          }));
          setFormError('Mật khẩu hiện tại không chính xác. Vui lòng thử lại.');
        } else {
          setFormError(err.message || 'Không thể đổi mật khẩu.');
        }
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelogin = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1a1722] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs flex flex-col gap-6">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f7f1ff] dark:border-[#2b2438] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eddcff] dark:bg-[#342747] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Bảo mật tài khoản
            </h3>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Đổi mật khẩu đăng nhập định kỳ để nâng cao an toàn cho tài khoản
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Bảo vệ bằng mật khẩu
        </span>
      </div>

      {/* Security Notice */}
      <div className="p-3.5 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] flex items-start gap-2.5 text-xs text-[#4b4452] dark:text-[#cdc3d4]">
        <Info className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb] shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong>Chính sách bảo mật phiên làm việc:</strong> Sau khi đổi mật khẩu thành công, hệ thống backend TMDEMY sẽ tự động vô hiệu hóa token làm mới (<code className="px-1 py-0.2 rounded bg-[#ebe5ff] dark:bg-[#332b40] font-mono text-[10px]">refreshToken = null</code>) để đăng xuất các phiên đăng nhập trên các thiết bị khác.
        </p>
      </div>

      {/* Success Notification Banner */}
      {isSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex flex-col gap-3 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                Đổi mật khẩu thành công!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
                Mật khẩu của bạn đã được cập nhật thành công. Các phiên làm việc trên những thiết bị khác đã được vô hiệu hóa an toàn.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Đổi lại mật khẩu khác
            </button>
            <button
              type="button"
              onClick={handleRelogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1722] hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng nhập lại ngay
            </button>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {formError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{formError}</span>
        </div>
      )}

      {/* Change Password Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 1. Old Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            Mật khẩu hiện tại <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showOldPassword ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                if (fieldErrors.oldPassword) {
                  setFieldErrors((prev) => ({ ...prev, oldPassword: '' }));
                }
              }}
              placeholder="Nhập mật khẩu đang sử dụng"
              disabled={isSubmitting}
              autoComplete="current-password"
              className="w-full h-10 pl-3 pr-10 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#968e9e] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
            />
            <button
              type="button"
              onClick={() => setShowOldPassword((prev) => !prev)}
              disabled={isSubmitting}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c7483] hover:text-[#1c192c] dark:hover:text-[#f4eeff] transition-colors cursor-pointer"
              aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.oldPassword && (
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              {fieldErrors.oldPassword}
            </span>
          )}
        </div>

        {/* 2. New Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            {newPassword.length > 0 && (
              <span className="text-[10px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                Độ mạnh: <strong className="text-[#1c192c] dark:text-[#f4eeff]">{strength.label}</strong>
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                }
              }}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              disabled={isSubmitting}
              autoComplete="new-password"
              className="w-full h-10 pl-3 pr-10 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#968e9e] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              disabled={isSubmitting}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c7483] hover:text-[#1c192c] dark:hover:text-[#f4eeff] transition-colors cursor-pointer"
              aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Bar */}
          {newPassword.length > 0 && (
            <div className="w-full h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          )}

          {fieldErrors.newPassword && (
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              {fieldErrors.newPassword}
            </span>
          )}
        </div>

        {/* 3. Confirm New Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              placeholder="Nhập lại chính xác mật khẩu mới"
              disabled={isSubmitting}
              autoComplete="new-password"
              className="w-full h-10 pl-3 pr-10 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#968e9e] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              disabled={isSubmitting}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c7483] hover:text-[#1c192c] dark:hover:text-[#f4eeff] transition-colors cursor-pointer"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              {fieldErrors.confirmPassword}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-md shadow-[#7240b8]/20 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Cập nhật mật khẩu
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
