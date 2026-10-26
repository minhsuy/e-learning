'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { certificateService } from '@/services/certificate.service';
import { ApiCertificatePublicVerification } from '@/types/certificate';
import { AppApiError } from '@/types/api';
import {
  downloadCertificateFile,
  downloadRichCertificatePdf,
  printCertificateDocument,
  getDirectPdfViewerUrl,
} from '@/lib/certificate-url';

interface VerifyPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function CertificateVerifyPage({ params }: VerifyPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? decodeURIComponent(resolvedParams.code).trim() : '';

  const [verificationData, setVerificationData] = useState<ApiCertificatePublicVerification | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(code));
  const [isNotFound, setIsNotFound] = useState(!code);
  const [networkError, setNetworkError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    let isMounted = true;
    const controller = new AbortController();

    async function verify() {
      try {
        const res = await certificateService.verifyCertificate(code, {
          signal: controller.signal,
        });

        if (isMounted) {
          if (res?.success && res.data) {
            setVerificationData(res.data);
          } else {
            setIsNotFound(true);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        if (err instanceof AppApiError && err.statusCode === 404) {
          setIsNotFound(true);
        } else {
          const msg =
            err instanceof AppApiError
              ? err.message
              : 'Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại kết nối mạng.';
          setNetworkError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [code]);

  const handleDownload = () => {
    if (!verificationData) return;
    downloadRichCertificatePdf({
      certCode: verificationData.code,
      studentName: verificationData.student.name || 'Học viên TMdemy',
      courseTitle: verificationData.course.title || 'Khóa học TMdemy',
      grade: verificationData.grade,
      issuedDate: new Date(verificationData.issueDate).toLocaleDateString('vi-VN'),
    });
  };

  const handlePrint = () => {
    if (!verificationData) return;
    printCertificateDocument({
      certCode: verificationData.code,
      studentName: verificationData.student.name || 'Học viên TMdemy',
      courseTitle: verificationData.course.title || 'Khóa học TMdemy',
      grade: verificationData.grade,
      issuedDate: new Date(verificationData.issueDate).toLocaleDateString('vi-VN'),
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#120e1a] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* 1. TOP PUBLIC BRAND HEADER */}
      <header className="w-full border-b border-zinc-200 dark:border-[#2f2742] bg-white dark:bg-[#1a1528] sticky top-0 z-20 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight leading-none text-zinc-900 dark:text-zinc-100">
                TMdemy
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                Cổng Xác Thực Chứng Chỉ Số
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/courses"
              className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-100 dark:hover:bg-[#282136] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Xem khóa học
            </Link>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN VERIFICATION CONTENT */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-10 flex flex-col items-center justify-center">
        {isLoading ? (
          /* SKELETON LOADING */
          <div className="w-full max-w-2xl bg-white dark:bg-[#1a1528] rounded-3xl p-8 border border-zinc-200 dark:border-[#2f2742] shadow-xl animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-[#2f2742]">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
            </div>
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mt-6" />
          </div>
        ) : isNotFound ? (
          /* INVALID / NOT FOUND STATE */
          <div className="w-full max-w-xl bg-white dark:bg-[#1a1528] rounded-3xl p-8 sm:p-10 border border-rose-200 dark:border-rose-900/60 shadow-xl text-center flex flex-col items-center gap-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[44px]">cancel</span>
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-500/20">
                KHÔNG TÌM THẤY CHỨNG CHỈ
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 pt-2">
                Mã chứng chỉ không tồn tại hoặc không hợp lệ
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto pt-1 leading-relaxed">
                Hệ thống xác thực TMdemy không tìm thấy hồ sơ tốt nghiệp tương ứng với mã truy vấn:
              </p>
              <div className="pt-2">
                <code className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-mono text-sm font-bold text-rose-600 dark:text-rose-400 border border-zinc-200 dark:border-zinc-700">
                  {code || 'KHÔNG CÓ MÃ'}
                </code>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#201930] border border-zinc-200 dark:border-[#2f2742] text-xs text-zinc-600 dark:text-zinc-400 text-left w-full space-y-1.5">
              <p className="font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">
                  help
                </span>
                <span>Lưu ý khi tra cứu:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <li>Kiểm tra lại từng ký tự trong đường link hoặc mã QR trên chứng chỉ gốc.</li>
                <li>Mã chứng chỉ TMdemy phân biệt chữ hoa, chữ thường và có dạng chuỗi ký tự chuẩn.</li>
                <li>Nếu nghi ngờ chứng chỉ giả mạo, vui lòng liên hệ ban kiểm định TMdemy.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/courses"
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs"
              >
                Khám phá khóa học TMdemy
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-100 dark:hover:bg-[#282136] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        ) : networkError ? (
          /* NETWORK OR SERVER ERROR STATE */
          <div className="w-full max-w-xl bg-white dark:bg-[#1a1528] rounded-3xl p-8 sm:p-10 border border-amber-200 dark:border-amber-900/60 shadow-xl text-center flex flex-col items-center gap-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[44px]">cloud_off</span>
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/20">
                LỖI KẾT NỐI MÁY CHỦ
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 pt-2">
                Không thể tải dữ liệu xác thực lúc này
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto pt-1 leading-relaxed">
                {networkError}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Thử lại</span>
            </button>
          </div>
        ) : verificationData ? (
          /* VALID CERTIFICATE STATE */
          <div className="w-full max-w-2xl bg-white dark:bg-[#1a1528] rounded-3xl border border-zinc-200 dark:border-[#2f2742] shadow-2xl overflow-hidden animate-in fade-in duration-300">
            {/* Top Verified Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border-b border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                  <span className="material-symbols-outlined text-[32px]">verified</span>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black tracking-wider uppercase shadow-xs">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>CHỨNG CHỈ HỢP LỆ</span>
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1.5">
                    Hồ Sơ Chứng Nhận Hoàn Thành
                  </h1>
                </div>
              </div>

              <div className="self-start sm:self-center text-right">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-semibold">
                  MÃ CHỨNG CHỈ CHÍNH THỨC
                </span>
                <code className="text-xs sm:text-sm font-mono font-bold text-primary dark:text-[#a87ffb]">
                  {verificationData.code}
                </code>
              </div>
            </div>

            {/* Information Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Student & Course Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Student */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#201930] border border-zinc-200 dark:border-[#2f2742] space-y-2">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                    <span>Học viên tốt nghiệp</span>
                  </span>
                  <div className="flex items-center gap-3 pt-1">
                    {verificationData.student.avatar ? (
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                        <Image
                          src={verificationData.student.avatar}
                          alt={verificationData.student.name || 'Ảnh đại diện học viên'}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-base shrink-0">
                        {(verificationData.student.name || 'H').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                        {verificationData.student.name || 'Học viên TMdemy'}
                      </h3>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Học viên chính thức TMdemy
                      </p>
                    </div>
                  </div>
                </div>

                {/* Course Grade & Date */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#201930] border border-zinc-200 dark:border-[#2f2742] space-y-2">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                    <span>Kết quả thẩm định</span>
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {verificationData.grade}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400"> / 100 điểm</span>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Điểm tốt nghiệp</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {new Date(verificationData.issueDate).toLocaleDateString('vi-VN')}
                      </span>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Ngày cấp chứng chỉ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Info Banner */}
              <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-[#2f2742] bg-white dark:bg-[#1a1528] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Khóa học đào tạo
                  </span>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {verificationData.course.title}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ký duyệt bởi: <strong className="text-zinc-700 dark:text-zinc-300">Hệ thống TMdemy (TMdemy / Chữ ký số)</strong>
                  </p>
                </div>

                {verificationData.course.slug && (
                  <Link
                    href={`/courses/${verificationData.course.slug}`}
                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-[#282136] text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors shrink-0"
                  >
                    Xem khóa học
                  </Link>
                )}
              </div>

              {/* Public Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Tải tệp PDF về máy</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-[#282136] text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>In chứng chỉ</span>
                </button>

                {verificationData.certificateUrl && (
                  <a
                    href={getDirectPdfViewerUrl(verificationData.certificateUrl, verificationData.code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-3 px-4 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-[#282136] text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    <span>Xem bản gốc</span>
                  </a>
                )}
              </div>
            </div>

            {/* Zero-Leak Security Notice */}
            <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#201930] border-t border-zinc-200 dark:border-[#2f2742] text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                security
              </span>
              <p className="leading-relaxed">
                <strong>Chuẩn an toàn Zero-Leak Security:</strong> Cổng xác thực công khai TMdemy chỉ hiển thị các dữ liệu đã được học viên cho phép công khai (họ tên, khóa học, điểm tốt nghiệp và ngày cấp). Mọi thông tin định danh nội bộ, mật khẩu và dữ liệu tài chính đều được bảo vệ nghiêm ngặt.
              </p>
            </div>
          </div>
        ) : null}
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full border-t border-zinc-200 dark:border-[#2f2742] bg-white dark:bg-[#1a1528] py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 TMdemy Inc. Cổng xác thực chứng chỉ tốt nghiệp trực tuyến.</span>
          <span>Bảo mật bằng mã QR & Mã băm SHA-256</span>
        </div>
      </footer>
    </div>
  );
}
