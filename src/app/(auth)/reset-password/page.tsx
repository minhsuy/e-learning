'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [token, setToken] = useState(tokenParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim()) {
      const msg = 'Mã token đặt lại mật khẩu không hợp lệ hoặc bị thiếu.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Xác nhận mật khẩu không khớp.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        token: token.trim(),
        password,
        confirm_password: confirmPassword,
      });

      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      // Redirect to login with reset success banner
      router.push('/login?reset=true');
    } catch (err: unknown) {
      let msg = 'Không thể đặt lại mật khẩu. Token có thể đã hết hạn.';
      if (err instanceof AppApiError) {
        msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 sm:p-8 border border-[#f1ebff]">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#7240b8] flex items-center justify-center text-white shadow-sm shadow-[#7240b8]/30">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-[#1c192c] tracking-tight leading-none">
            TMdemy
          </span>
          <span className="text-[10px] text-[#7240b8] uppercase font-bold tracking-widest mt-1">
            Đặt lại mật khẩu
          </span>
        </div>
      </div>

      {/* Visual Heading */}
      <div className="mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#eddcff] flex items-center justify-center text-[#7240b8] mb-3 shadow-sm">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#1c192c] tracking-tight">Thiết lập mật khẩu mới</h1>
        <p className="text-sm text-[#4b4452] mt-1 leading-relaxed">
          {emailParam ? (
            <>
              Đặt mật khẩu mới cho tài khoản{' '}
              <strong className="text-[#1c192c]">{emailParam}</strong>.
            </>
          ) : (
            'Nhập mật khẩu mới an toàn cho tài khoản học viên của bạn.'
          )}
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-[#ffdad6] text-[#93000a] flex items-start gap-2 shadow-sm border border-[#ba1a1a]/20 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
          <div className="flex-1 flex flex-col">
            <span className="text-xs font-bold">Lỗi đặt lại mật khẩu</span>
            <span className="text-xs mt-0.5">{errorMessage}</span>
          </div>
          <button
            className="text-[#93000a] hover:opacity-70 p-0.5 text-xs"
            onClick={() => setErrorMessage(null)}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!tokenParam && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1c192c]" htmlFor="reset-token">
              Mã Token đặt lại mật khẩu <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              id="reset-token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Dán token nhận được từ liên kết email"
              className="w-full h-11 px-3.5 bg-[#f7f1ff] text-[#1c192c] text-sm rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm"
            />
          </div>
        )}

        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1c192c]" htmlFor="reset-password">
            Mật khẩu mới <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full h-11 pl-11 pr-11 bg-[#f7f1ff] text-[#1c192c] text-sm rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm placeholder:text-[#7c7483]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 rounded-md text-[#635a72] hover:text-[#1c192c] transition-colors"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1c192c]" htmlFor="reset-confirm">
            Xác nhận mật khẩu mới <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative flex items-center">
            <Shield className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
            <input
              id="reset-confirm"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full h-11 pl-11 pr-11 bg-[#f7f1ff] text-[#1c192c] text-sm rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm placeholder:text-[#7c7483]"
            />
            {passwordsMatch && (
              <div className="absolute right-3.5 text-[#006947] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#7240b8] hover:bg-[#8b5ad3] active:scale-[0.99] text-white text-sm sm:text-base font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang lưu mật khẩu mới...</span>
            </>
          ) : (
            <>
              <span>Cập nhật mật khẩu</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Back to Login */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-xs text-[#7240b8] font-bold hover:underline underline-offset-4"
        >
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-[#fdf8ff]">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-8 text-[#7240b8]">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm text-[#4b4452]">Đang tải trang đặt lại mật khẩu...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
