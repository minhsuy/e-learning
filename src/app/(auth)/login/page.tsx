'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getDefaultRolePath } from '@/components/auth/route-guard';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';
import { GoogleLoginButton } from '@/components/auth/google-login-button';
import {
  GraduationCap,
  ShieldCheck,
  Award,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const redirectUrl = searchParams.get('redirect');
  const isVerified = searchParams.get('verified') === 'true';
  const isReset = searchParams.get('reset') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      const msg = 'Vui lòng nhập địa chỉ email của bạn.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!password) {
      const msg = 'Vui lòng nhập mật khẩu.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);

    try {
      const user = await login({ email: email.trim(), password });
      toast.success('Đăng nhập thành công! Chào mừng bạn trở lại.');
      const target = redirectUrl || getDefaultRolePath(user.role);
      router.push(target);
    } catch (err: unknown) {
      let msg = 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
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
    <div className="relative w-full max-w-5xl rounded-xl bg-white shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-[#f1ebff]">
      {/* Left Decorative Column: TMdemy Scholarly Identity */}
      <div className="lg:col-span-5 bg-gradient-to-br from-[#ebe5ff] via-[#f1ebff] to-[#e6dffa] p-6 lg:p-10 flex flex-col justify-between relative overflow-hidden">
        {/* Ambient light effects */}
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#7240b8]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-[#eddcff]/40 blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#7240b8] flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-[#1c192c] tracking-tight">TMdemy</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eddcff]/80 text-[#5b27a1] self-start border border-[#7240b8]/15">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#7240b8]" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Hệ thống E-learning Đại học & Công nghệ
            </span>
          </div>
        </div>

        {/* Mid Visual Quote & Stats Showcase */}
        <div className="relative z-10 my-8 flex flex-col gap-5">
          <div className="relative rounded-xl overflow-hidden shadow-md h-48 w-full group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Giảng đường công nghệ TMdemy"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkZipGdXDh0XXpa6XB9Vs4QSAcre1fM6l9Aj1VUyuXBNYGkXBguTMeHf7nsxsSXkfRB9UdV3pnW7Y8FjSgn9G3AG9oFU6B62cCC5NlZpNdmBjSe8u-FOW2XiWPjrE-hdd-7Z-uamTPr_GwV0aBdmm2hnA5lPKko7TdTV-L8k3vHE3wtKafUa7LEDs_c5xXqP0siZcg3SnkXvq1RZ5U7RSNvo0WkBTp3MsFi_-BvbAmopc9_0WpblN_"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#312e42]/90 via-[#312e42]/35 to-transparent flex flex-col justify-end p-4">
              <span className="text-[13px] text-white font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#6ffbbe]" />
                Môi trường học thuật đỉnh cao
              </span>
              <p className="text-xs text-[#e6dffa]/90 line-clamp-2 mt-0.5">
                Truy cập hơn 450+ học phần chuyên sâu từ giảng viên hàng đầu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/85 shadow-sm flex flex-col border border-white/60">
              <span className="text-2xl font-bold text-[#7240b8]">98.4%</span>
              <span className="text-[11px] text-[#4b4452] mt-0.5">Tỷ lệ hoàn thành chứng chỉ</span>
            </div>
            <div className="p-3 rounded-lg bg-white/85 shadow-sm flex flex-col border border-white/60">
              <span className="text-2xl font-bold text-[#006947]">120K+</span>
              <span className="text-[11px] text-[#4b4452] mt-0.5">Sinh viên & Chuyên viên</span>
            </div>
          </div>
        </div>

        {/* Trust Footprint */}
        <div className="relative z-10 flex items-center gap-2 text-[#4b4452]">
          <ShieldCheck className="w-4 h-4 text-[#7240b8]" />
          <span className="text-xs">Được chứng nhận bởi Hiệp hội Học thuật Quốc tế</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center relative">
        <div className="flex flex-col gap-4 w-full">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1c192c] tracking-tight">
              Chào mừng trở lại!
            </h1>
            <p className="text-sm text-[#4b4452] mt-1">
              Đăng nhập để tiếp tục hành trình học tập của bạn tại TMdemy
            </p>
          </div>

          {/* Success Banner if redirected from verify OTP */}
          {isVerified && (
            <div className="p-3.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-start gap-2 shadow-sm animate-in fade-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold block">Xác thực email thành công!</span>
                <span>Tài khoản của bạn đã được kích hoạt. Hãy đăng nhập để bắt đầu.</span>
              </div>
            </div>
          )}

          {/* Success Banner if redirected from reset password */}
          {isReset && (
            <div className="p-3.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-start gap-2 shadow-sm animate-in fade-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold block">Đặt lại mật khẩu thành công!</span>
                <span>Vui lòng đăng nhập với mật khẩu mới vừa tạo.</span>
              </div>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMessage && (() => {
            const isAccountLockedError =
              errorMessage.toLowerCase().includes('khóa') ||
              errorMessage.toLowerCase().includes('inactive');

            return (
              <div
                className={`p-4 rounded-xl flex items-start gap-3 shadow-sm border animate-in fade-in duration-200 ${
                  isAccountLockedError
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                    : 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/20'
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isAccountLockedError ? 'text-rose-600' : 'text-[#ba1a1a]'
                  }`}
                />
                <div className="flex-1 flex flex-col">
                  <span className="text-sm font-bold">
                    {isAccountLockedError
                      ? 'Tài khoản của bạn đã bị khóa'
                      : 'Đăng nhập không thành công'}
                  </span>
                  <span className="text-xs mt-1 leading-relaxed">{errorMessage}</span>
                  {isAccountLockedError && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200 dark:border-rose-800/60 text-xs">
                      <span>Cần hỗ trợ? Vui lòng gửi email đến: </span>
                      <a
                        href="mailto:support@tmdemy.vn"
                        className="font-bold underline hover:text-rose-700 dark:hover:text-rose-300"
                      >
                        support@tmdemy.vn
                      </a>
                    </div>
                  )}
                </div>
                <button
                  className="text-inherit hover:opacity-70 p-0.5"
                  onClick={() => setErrorMessage(null)}
                  type="button"
                  aria-label="Đóng thông báo lỗi"
                >
                  ×
                </button>
              </div>
            );
          })()}

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold text-[#1c192c] flex items-center justify-between"
                htmlFor="login-email"
              >
                <span>Email công vụ hoặc học đường</span>
                <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn (vd: student@tmdemy.edu.vn)"
                  className="w-full h-11 pl-11 pr-4 rounded-lg bg-[#f7f1ff] text-[#1c192c] placeholder:text-[#7c7483] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold text-[#1c192c] flex items-center justify-between"
                htmlFor="login-password"
              >
                <span>Mật khẩu truy cập</span>
                <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full h-11 pl-11 pr-11 rounded-lg bg-[#f7f1ff] text-[#1c192c] placeholder:text-[#7c7483] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#7240b8] accent-[#7240b8] cursor-pointer"
                />
                <span className="text-xs text-[#4b4452] font-medium">Ghi nhớ đăng nhập</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#7240b8] hover:text-[#5b27a1] font-semibold underline-offset-4 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-[#7240b8]/20 transition-all mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="w-full h-px bg-[#e6dffa]" />
            <span className="absolute px-3 bg-white text-[11px] text-[#7c7483] uppercase tracking-wider font-semibold">
              Hoặc đăng nhập với
            </span>
          </div>

          {/* Google SSO Button */}
          <GoogleLoginButton
            mode="signin"
            redirectUrl={redirectUrl}
            buttonText="Tiếp tục với tài khoản Google"
            onError={(msg) => setErrorMessage(msg)}
          />

          {/* Registration Link */}
          <div className="text-center pt-2">
            <span className="text-sm text-[#4b4452]">Chưa có tài khoản học viên?</span>
            <Link
              href="/register"
              className="text-sm text-[#7240b8] font-bold ml-1.5 hover:underline underline-offset-4"
            >
              Đăng ký ngay
            </Link>
          </div>

          {/* Security Footprint */}
          <div className="mt-4 pt-3 flex items-center justify-center gap-2 text-center text-[#7c7483] border-t border-[#f1ebff]">
            <Shield className="w-4 h-4 text-[#7240b8]" />
            <span className="text-[11px] tracking-wide">
              Được bảo vệ bởi TMdemy Shield 256-bit SSL • 100% Bảo mật dữ liệu học tập
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-[#fdf8ff]">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-8 text-[#7240b8]">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm text-[#4b4452]">Đang tải trang đăng nhập...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
