'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';
import {
  GraduationCap,
  MailCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp } = useAuth();

  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otp.trim();
    if (!email.trim()) {
      const msg = 'Vui lòng cung cấp địa chỉ email.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      const msg = 'Mã OTP phải bao gồm đúng 6 chữ số.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);

    try {
      await verifyOtp({
        email: email.trim(),
        otp: cleanOtp,
      });

      toast.success('Xác thực tài khoản thành công! Vui lòng đăng nhập.');
      // Redirect to login with verified notice
      router.push('/login?verified=true');
    } catch (err: unknown) {
      let msg = 'Xác thực OTP không thành công. Vui lòng kiểm tra lại mã số.';
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
            Xác thực tài khoản
          </span>
        </div>
      </div>

      {/* Visual Icon & Heading */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#eddcff] text-[#7240b8] flex items-center justify-center mb-3 shadow-sm">
          <MailCheck className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1c192c]">Kiểm tra hộp thư của bạn</h1>
        <p className="text-xs sm:text-sm text-[#4b4452] mt-1.5 leading-relaxed">
          Chúng tôi đã gửi mã xác thực 6 chữ số đến địa chỉ:{' '}
          <strong className="text-[#1c192c] font-semibold block mt-0.5 break-all">
            {email || 'email của bạn'}
          </strong>
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-[#ffdad6] text-[#93000a] flex items-start gap-2 shadow-sm border border-[#ba1a1a]/20 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
          <div className="flex-1 flex flex-col">
            <span className="text-xs font-bold">Xác thực không thành công</span>
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
        {!emailParam && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1c192c]" htmlFor="otp-email">
              Địa chỉ Email
            </label>
            <input
              id="otp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email đã đăng ký"
              className="w-full h-11 px-3.5 bg-[#f7f1ff] text-[#1c192c] text-sm rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1c192c]" htmlFor="otp-code">
            Mã OTP (6 chữ số)
          </label>
          <div className="relative flex items-center">
            <KeyRound className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full h-12 pl-11 pr-4 bg-[#f7f1ff] text-[#1c192c] text-center tracking-[0.4em] font-mono text-lg font-bold rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-[#7c7483]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.length !== 6}
          className="w-full h-12 bg-[#7240b8] hover:bg-[#8b5ad3] active:scale-[0.99] text-white text-sm sm:text-base font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Xác thực tài khoản</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Backend Policy Notice */}
      <div className="mt-5 p-3 rounded-lg bg-[#f7f1ff] border border-[#e6dffa] text-xs text-[#4b4452] leading-relaxed">
        <p>
          <span className="font-semibold text-[#1c192c]">Lưu ý:</span> Mã OTP có hiệu lực trong vòng
          10 phút. Nếu mã hết hạn hoặc chưa nhận được email, vui lòng quay lại trang Đăng ký để đăng
          ký lại tài khoản.
        </p>
      </div>

      {/* Navigation Links */}
      <div className="mt-5 flex items-center justify-between text-xs">
        <Link
          href="/register"
          className="text-[#635a72] hover:text-[#1c192c] inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Đăng ký lại</span>
        </Link>
        <Link
          href="/login"
          className="text-[#7240b8] font-bold hover:underline underline-offset-4"
        >
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-[#fdf8ff]">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-8 text-[#7240b8]">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm text-[#4b4452]">Đang tải trang xác thực...</p>
          </div>
        }
      >
        <VerifyOtpForm />
      </Suspense>
    </main>
  );
}
