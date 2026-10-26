'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';
import {
  GraduationCap,
  KeyRound,
  Mail,
  Send,
  ArrowLeft,
  MailCheck,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      const msg = 'Vui lòng nhập địa chỉ email của bạn.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword({ email: email.trim() });
      toast.success('Đã gửi liên kết khôi phục mật khẩu đến email của bạn!');
      setIsSuccess(true);
    } catch (err: unknown) {
      let msg = 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại email.';
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
              Khôi phục quyền truy cập
            </span>
          </div>
        </div>

        {/* Back Link */}
        <Link
          href="/login"
          className="self-start inline-flex items-center gap-1.5 text-xs text-[#635a72] hover:text-[#1c192c] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại đăng nhập</span>
        </Link>

        {/* Visual Icon & Heading */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#eddcff] flex items-center justify-center text-[#7240b8] mb-3 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1c192c] tracking-tight">Khôi phục mật khẩu</h1>
          <p className="text-sm text-[#4b4452] mt-1 leading-relaxed">
            Nhập địa chỉ email liên kết với tài khoản TMdemy của bạn để nhận liên kết đặt lại mật
            khẩu bảo mật.
          </p>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[#ffdad6] text-[#93000a] flex items-start gap-2 shadow-sm border border-[#ba1a1a]/20 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
            <div className="flex-1 flex flex-col">
              <span className="text-xs font-bold">Lỗi khôi phục mật khẩu</span>
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

        {isSuccess ? (
          /* Success Box matching Stitch design */
          <div className="p-4 rounded-xl bg-[#6ffbbe]/25 border border-[#00855b]/20 text-[#002113] shadow-sm flex flex-col gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <MailCheck className="w-6 h-6 text-[#006947]" />
              <span className="text-sm font-bold text-[#002113]">Kiểm tra hộp thư của bạn!</span>
            </div>
            <p className="text-xs text-[#005236] leading-relaxed">
              Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến{' '}
              <strong className="font-bold text-[#002113] break-all">{email}</strong>. Vui lòng kiểm
              tra hộp thư đến (và cả thư mục rác / Spam) trong vòng 15 phút tới.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-[#006947] text-white text-xs font-semibold shadow-sm hover:opacity-90 inline-flex items-center justify-center"
              >
                Đã hiểu, quay về đăng nhập
              </Link>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="text-xs text-[#005236] underline underline-offset-4 hover:opacity-80 font-medium"
              >
                Gửi lại email khác
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1c192c]" htmlFor="recovery-email">
                Email sinh viên / tài khoản
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-[#635a72] w-5 h-5 pointer-events-none" />
                <input
                  id="recovery-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn (vd: student@tmdemy.edu.vn)"
                  className="w-full h-11 pl-11 pr-4 rounded-lg bg-[#f7f1ff] text-[#1c192c] placeholder:text-[#7c7483] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7240b8]/30 transition-all border border-transparent shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] active:scale-[0.99] text-white text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang gửi liên kết...</span>
                </>
              ) : (
                <>
                  <span>Gửi liên kết khôi phục</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Support Help Footnote */}
        <div className="mt-6 p-3 rounded-lg bg-[#f7f1ff] text-[#4b4452] flex items-center gap-2.5 border border-[#e6dffa]">
          <Info className="w-4 h-4 text-[#7240b8] shrink-0" />
          <span className="text-xs leading-relaxed">
            Cần hỗ trợ trực tiếp? Liên hệ phòng học vụ qua{' '}
            <a href="mailto:hotro@tmdemy.edu.vn" className="text-[#7240b8] font-semibold underline">
              hotro@tmdemy.edu.vn
            </a>
          </span>
        </div>
      </div>
    </main>
  );
}
