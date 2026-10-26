'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';
import { GoogleLoginButton } from '@/components/auth/google-login-button';
import {
  GraduationCap,
  User,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  Loader2,
  Sparkles,
  Star,
  Clock,
  Rocket,
  BadgeCheck,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasUpperOrSpecial = /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  let strengthScore = 0;
  if (password.length >= 6) strengthScore += 1;
  if (hasMinLength) strengthScore += 1;
  if (hasNumber) strengthScore += 1;
  if (hasUpperOrSpecial) strengthScore += 1;

  const strengthLabels = ['Yếu', 'Trung bình', 'Khá (An toàn)', 'Rất mạnh'];
  const strengthText = password ? strengthLabels[Math.min(strengthScore, 3)] : 'Chưa nhập';

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (username.trim().length < 3) {
      const msg = 'Họ và tên / Tên đăng nhập phải có ít nhất 3 ký tự.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!email.trim()) {
      const msg = 'Vui lòng nhập địa chỉ email hợp lệ.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'Mật khẩu phải có tối thiểu 6 ký tự.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Xác nhận mật khẩu không khớp với mật khẩu.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!agreeTerms) {
      const msg = 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });

      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP.');
      // Redirect to OTP verification with user's email
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      let msg = 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
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
    <main className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-[#fdf8ff]">
      <div className="relative w-full max-w-6xl mx-auto my-auto flex flex-col lg:flex-row items-stretch justify-center gap-8 p-2 md:p-6">
        {/* Ambient glow effects */}
        <div className="absolute -top-16 -left-12 w-96 h-96 bg-[#eddcff]/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-20 -right-12 w-96 h-96 bg-[#eadefa]/50 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Left Column: Registration Card */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-10 border border-[#f1ebff]">
            {/* Header Brand */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#7240b8] flex items-center justify-center text-white shadow-sm shadow-[#7240b8]/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#1c192c] tracking-tight leading-none">
                  TMdemy
                </span>
                <span className="text-[10px] text-[#7240b8] uppercase font-bold tracking-widest mt-1">
                  Học tập đỉnh cao
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1c192c] tracking-tight">
                Tạo tài khoản TMdemy
              </h1>
              <p className="text-sm text-[#4b4452] mt-1 leading-relaxed">
                Bắt đầu hành trình học tập công nghệ, mở khóa hơn 200+ khóa học chuẩn quốc tế
              </p>
            </div>

            {/* Error Notice */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-[#ffdad6] text-[#93000a] flex items-start gap-2.5 shadow-sm border border-[#ba1a1a]/20 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col">
                  <span className="text-sm font-bold">Đăng ký không thành công</span>
                  <span className="text-xs mt-0.5 leading-relaxed">{errorMessage}</span>
                </div>
                <button
                  className="text-[#93000a] hover:opacity-70 p-0.5"
                  onClick={() => setErrorMessage(null)}
                  type="button"
                  aria-label="Đóng thông báo"
                >
                  ×
                </button>
              </div>
            )}

            {/* Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1c192c]" htmlFor="register-name">
                  Họ và tên / Tên người dùng <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Trần Minh Triết (hoặc triet_tran)"
                    className="w-full h-11 pl-11 pr-4 bg-[#f7f1ff] text-[#1c192c] text-sm rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm placeholder:text-[#7c7483]"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1c192c]" htmlFor="register-email">
                  Email học tập <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative flex items-center">
                  <AtSign className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="triet.tran@gmail.com"
                    className="w-full h-11 pl-11 pr-4 bg-[#f7f1ff] text-[#1c192c] text-sm rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm placeholder:text-[#7c7483]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1c192c]" htmlFor="register-password">
                  Mật khẩu <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự (khuyến nghị 8 ký tự, gồm số)"
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

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-1 flex flex-col gap-1.5 p-2.5 bg-[#f7f1ff]/80 rounded-lg border border-[#e6dffa]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#4b4452]">Độ bảo mật mật khẩu</span>
                      <span className="text-[#006947] font-bold">{strengthText}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 w-full h-1.5">
                      <div
                        className={`h-full rounded-full transition-colors ${
                          strengthScore >= 1 ? 'bg-[#7240b8]' : 'bg-[#e6dffa]'
                        }`}
                      />
                      <div
                        className={`h-full rounded-full transition-colors ${
                          strengthScore >= 2 ? 'bg-[#7240b8]' : 'bg-[#e6dffa]'
                        }`}
                      />
                      <div
                        className={`h-full rounded-full transition-colors ${
                          strengthScore >= 3 ? 'bg-[#006947]' : 'bg-[#e6dffa]'
                        }`}
                      />
                      <div
                        className={`h-full rounded-full transition-colors ${
                          strengthScore >= 4 ? 'bg-[#006947]' : 'bg-[#e6dffa]'
                        }`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5 text-xs text-[#4b4452]">
                      <span
                        className={`flex items-center gap-1 ${
                          hasMinLength ? 'text-[#006947]' : 'text-[#7c7483]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ít nhất 8 ký tự
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          hasUpperOrSpecial ? 'text-[#006947]' : 'text-[#7c7483]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Chứa chữ hoa & ký tự đặc biệt
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1c192c]" htmlFor="register-confirm">
                  Xác nhận mật khẩu <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative flex items-center">
                  <Shield className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
                  <input
                    id="register-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full h-11 pl-11 pr-11 bg-[#f7f1ff] text-[#1c192c] text-sm rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm placeholder:text-[#7c7483]"
                  />
                  {passwordsMatch && (
                    <div className="absolute right-3.5 text-[#006947] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none mt-1">
                <div className="relative flex items-center pt-0.5">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 bg-[#e6dffa] rounded peer-checked:bg-[#7240b8] transition-all flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 opacity-0 peer-checked:opacity-100 font-bold transition-opacity" />
                  </div>
                </div>
                <span className="text-xs text-[#4b4452] leading-relaxed">
                  Tôi đồng ý với{' '}
                  <span className="text-[#7240b8] font-semibold hover:underline">
                    Điều khoản sử dụng
                  </span>{' '}
                  và{' '}
                  <span className="text-[#7240b8] font-semibold hover:underline">
                    Chính sách bảo mật
                  </span>{' '}
                  của TMdemy
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-1 bg-[#7240b8] hover:bg-[#8b5ad3] active:scale-[0.99] text-white text-sm sm:text-base font-bold rounded-lg shadow-md hover:shadow-lg hover:shadow-[#7240b8]/20 transition-all flex items-center justify-center gap-2 tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng ký tài khoản</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full h-px bg-[#e6dffa]" />
              <span className="absolute bg-white px-4 text-xs text-[#635a72] font-medium">
                Hoặc đăng ký với
              </span>
            </div>

            {/* Google Button */}
            <GoogleLoginButton
              mode="signup"
              buttonText="Tiếp tục với Google"
              onError={(msg) => setErrorMessage(msg)}
            />


            {/* Back to Login Link */}
            <div className="mt-5 text-center">
              <p className="text-sm text-[#4b4452]">
                Đã có tài khoản?{' '}
                <Link href="/login" className="text-[#7240b8] font-bold hover:underline ml-1">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Benefit Cards */}
        <div className="w-full lg:w-5/12 flex flex-col justify-between gap-6">
          {/* Top Gradient Benefit Card */}
          <div className="relative bg-gradient-to-br from-[#7240b8] via-[#8b5ad3] to-[#635a72] text-white rounded-xl p-6 sm:p-8 shadow-xl overflow-hidden flex flex-col justify-between min-h-[380px]">
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#6ffbbe]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4">
              <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium">
                <Sparkles className="w-4 h-4 text-[#6ffbbe]" />
                <span>Ưu đãi đặc quyền học viên mới</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  Tham gia cùng hơn 48.500+ học viên
                </h2>
                <p className="text-sm text-[#eddcff] leading-relaxed">
                  Nhận ngay mã ưu đãi{' '}
                  <span className="font-bold text-[#6ffbbe] underline decoration-2">giảm 30%</span> cho
                  khóa học đầu tiên ngay sau khi hoàn tất xác thực tài khoản.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-4 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex -space-x-2 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inline-block h-9 w-9 rounded-full object-cover ring-2 ring-white"
                    alt="Học viên TMdemy"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSTW-FtHLlg9q9i3M8X4fz0KvnT3pY9i-j1wECdqMYibc_wGJTfBCtOzLt2C4FYUdPSOnRgQvItBLzpPyrRvz62BPv-3BqYZAGYSldivJAiAJWcdQ7KHLzSURzpuNkdQ-1ROgwu7RUku5Mf9Yss1eb4o5Mcc-qsFcIxm3TbToS6LLbS4S4NYCcVmVo3q4LlZfEXVQoEoUlwN3cqeTOvSXmBtyhuTqM_Jo0wGHXxc1pHwXAM6tquIAx"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inline-block h-9 w-9 rounded-full object-cover ring-2 ring-white"
                    alt="Học viên TMdemy"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtDGHcxdLFjwC7CRHX5DCDNZ_dha1jTiuGQXJsMZxrNwZacZ0Mie15t71nydJmaxLzbB_WBHw8i4YpqrmrOQHoMyFdeTjNoMCvHSdYi_XGx_xaGUkhE8ntnBuwl9usrcw4ASJXvy4R9ctgsACt09XZXAzMZOxNmDxu3xpKQ_8yWgstj0jBg5KdNSse9h3-Eubk9SqUwLuAz080okd8iL0rf6l1d3_qontpIVpLZAuRZObEUl8pYf0L"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inline-block h-9 w-9 rounded-full object-cover ring-2 ring-white"
                    alt="Học viên TMdemy"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2cQA7jJ8Yus2L5dnT6SPfB51dJYcizu5SRfwj6FN_MoQXzzatayR9mR7xChfMOsp6DA4pP9WLFdqSWdrPotTRHGCGK_HdX283js7Xr7mgwIRxq5WQhMA_xOgm3CjPpnc0J676WNGf6yfHz3o3c1SDqNH-Q5f_xcpaICyTIqONRZUJr_9PQst31ysV4OJslsH0_os_KHOHll2lMvH2qo8qI0B6atNIbvGbKxNPgZ0Bueir85hsBR7j"
                  />
                  <div className="h-9 w-9 rounded-full bg-[#eddcff] text-[#280056] flex items-center justify-center text-xs font-bold ring-2 ring-white">
                    +48k
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-xs text-[#fdf8ff]/90 mt-0.5 font-medium">
                    4.9/5 điểm chất lượng giảng dạy
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#eddcff]">
                <span className="flex items-center gap-1">
                  <BadgeCheck className="w-4 h-4 text-[#6ffbbe]" /> Chứng chỉ quốc tế
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[#6ffbbe]" /> Học theo tiến độ riêng
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Career Standardization Card */}
          <div className="bg-white rounded-xl p-5 shadow-md flex items-center gap-4 border border-[#f1ebff]">
            <div className="w-12 h-12 rounded-lg bg-[#ebe5ff] flex items-center justify-center text-[#7240b8] shrink-0">
              <Rocket className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#1c192c]">
                Lộ trình chuẩn hóa nghề nghiệp
              </span>
              <p className="text-xs text-[#4b4452] mt-0.5 leading-relaxed">
                Truy cập hơn 1.200 bài thực hành thực tế, giải đáp 1-1 cùng giảng viên chuyên gia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
