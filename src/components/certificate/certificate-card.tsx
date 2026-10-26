'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ApiCertificate, CertificateEligibilityResult } from '@/types/certificate';
import { ApiEnrollmentItem } from '@/types/enrollment';
import { downloadCertificateFile, downloadRichCertificatePdf } from '@/lib/certificate-url';

interface CertificateCardProps {
  certificate?: ApiCertificate | null;
  enrollment?: ApiEnrollmentItem;
  eligibility?: CertificateEligibilityResult;
  studentName: string;
  onViewCertificate: (cert: ApiCertificate) => void;
  onCheckEligibility?: (courseId: string) => void;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600';

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  enrollment,
  eligibility,
  studentName,
  onViewCertificate,
  onCheckEligibility,
}) => {
  const isIssued = Boolean(certificate);
  const isEligible = !isIssued && eligibility?.isEligible;
  const progressPercent = eligibility?.criteria.progress.currentPercent ?? 0;

  // Determine course metadata from either certificate or enrollment
  const courseTitle =
    certificate?.course?.title ||
    enrollment?.course?.title ||
    'Khóa học TMdemy';
  const courseSlug =
    certificate?.course?.slug || enrollment?.course?.slug || '';
  const courseImage =
    certificate?.course?.thumbnail ||
    enrollment?.course?.image ||
    DEFAULT_IMAGE;
  const courseId =
    certificate?.courseId ||
    certificate?.course?.id ||
    enrollment?.course?.id ||
    enrollment?.courseId ||
    '';

  const certCode = certificate?.code || certificate?.id || '';

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!certificate) return;
    downloadRichCertificatePdf({
      certCode,
      studentName: studentName || 'Học viên TMdemy',
      courseTitle,
      grade: certificate.grade,
      issuedDate: certificate.createdAt
        ? new Date(certificate.createdAt).toLocaleDateString('vi-VN')
        : new Date().toLocaleDateString('vi-VN'),
    });
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        isIssued
          ? 'bg-white dark:bg-[#1f192f] border-zinc-200 dark:border-[#2f2742]'
          : isEligible
          ? 'bg-gradient-to-b from-purple-50/50 to-white dark:from-[#251e38] dark:to-[#1a1528] border-purple-200 dark:border-purple-800/60'
          : 'bg-white dark:bg-[#1a1528] border-zinc-200 dark:border-[#2f2742]'
      }`}
    >
      {/* Top Banner / Preview */}
      {isIssued && certificate ? (
        <div className="relative p-5 bg-gradient-to-br from-[#faf7ff] via-[#f4edff] to-[#f0e6ff] dark:from-[#261f38] dark:via-[#201830] dark:to-[#1a1329] border-b border-purple-100 dark:border-[#2f2742] flex flex-col justify-between aspect-[16/10] overflow-hidden select-none">
          {/* Border corners */}
          <div className="absolute inset-2 border border-[#7240b8]/20 dark:border-[#a87ffb]/20 rounded-lg pointer-events-none" />
          <div className="absolute inset-3 border border-[#7240b8]/10 dark:border-[#a87ffb]/10 rounded-md pointer-events-none" />

          {/* Top Seal */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-[#7240b8] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                T
              </div>
              <span className="text-[11px] font-black tracking-wider text-[#7240b8] dark:text-[#c4a1ff] uppercase">
                TMDEMY ACADEMY
              </span>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/25">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>ĐÃ CẤP CHỨNG CHỈ</span>
            </span>
          </div>

          {/* Center Diploma content */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto px-2">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              CHỨNG NHẬN TỐT NGHIỆP
            </span>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 leading-snug line-clamp-2">
              {courseTitle}
            </h3>
            <div className="mt-2 text-xs font-semibold text-[#7240b8] dark:text-[#c4a1ff]">
              Cấp cho: <span className="text-zinc-900 dark:text-zinc-100 underline">{studentName}</span>
            </div>
          </div>

          {/* Bottom Diploma Bar */}
          <div className="relative z-10 flex items-end justify-between pt-2 border-t border-[#7240b8]/10 dark:border-[#a87ffb]/15 text-[10px] text-zinc-500 dark:text-zinc-400">
            <div>
              <span>Điểm tốt nghiệp: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{certificate.grade}/100</strong>
            </div>
            <div>
              <span>Mã: </span>
              <strong className="font-mono text-[#7240b8] dark:text-[#c4a1ff]">
                {certCode.length > 20 ? `${certCode.slice(0, 18)}...` : certCode}
              </strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={courseImage}
            alt={courseTitle}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {isEligible ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold shadow-md">
                <span className="material-symbols-outlined text-[14px]">stars</span>
                <span>{eligibility?.isPreliminary ? 'ĐỦ ĐIỀU KIỆN SƠ BỘ' : 'ĐỦ ĐIỀU KIỆN CẤP'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-zinc-200 text-[11px] font-medium border border-white/10">
                <span className="material-symbols-outlined text-[14px]">school</span>
                <span>Đang học ({progressPercent}%)</span>
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="text-sm font-bold line-clamp-1 drop-shadow-sm">{courseTitle}</h3>
          </div>
        </div>
      )}

      {/* Body Details & Actions */}
      <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
        {isIssued && certificate ? (
          <>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Mã chứng chỉ:</span>
                <span className="font-mono font-semibold text-primary dark:text-[#a87ffb]">
                  {certCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Điểm tốt nghiệp (Grade):</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{certificate.grade} / 100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Ngày cấp:</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString('vi-VN') : 'Đã cấp'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-[#2f2742]">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onViewCertificate(certificate)}
                  className="w-full py-2.5 px-3 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Xem PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-[#282136] text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Tải PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/certificates/verify/${encodeURIComponent(certCode)}`}
                  className="w-full py-2 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>Trang xác thực</span>
                </Link>

                {courseSlug && (
                  <Link
                    href={`/learn/${encodeURIComponent(courseSlug)}`}
                    className="w-full py-2 px-2.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-[#282136] text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">replay</span>
                    <span>Ôn tập</span>
                  </Link>
                )}
              </div>
            </div>
          </>
        ) : isEligible ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-600 dark:text-zinc-300 font-semibold">Tiến độ bài học:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{progressPercent}% (Đạt)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {eligibility?.isPreliminary
                  ? '🎉 Tiến độ bài học đã đạt chuẩn. Hãy gửi yêu cầu để Backend TMdemy thẩm định điều kiện bài kiểm tra và cấp chứng chỉ!'
                  : '🎉 Bạn đã hoàn thành toàn bộ yêu cầu tốt nghiệp cho khóa học này. Hãy gửi yêu cầu để nhận chứng chỉ chính thức!'}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-[#2f2742]">
              <button
                type="button"
                onClick={() => onCheckEligibility && onCheckEligibility(courseId)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Yêu cầu cấp chứng chỉ ngay</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Tiến độ hoàn thành:</span>
                <span className="font-bold text-primary dark:text-[#a87ffb]">{progressPercent}% / 70%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Yêu cầu: Tối thiểu 70% bài giảng và 60% bài kiểm tra để đủ điều kiện cấp chứng chỉ.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-[#2f2742]">
              <button
                type="button"
                onClick={() => onCheckEligibility && onCheckEligibility(courseId)}
                className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-[#282136] text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">rule</span>
                <span>Xem điều kiện</span>
              </button>

              {courseSlug && (
                <Link
                  href={`/learn/${encodeURIComponent(courseSlug)}`}
                  className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Học tiếp</span>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
