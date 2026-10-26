'use client';

import React, { useState, useRef } from 'react';
import { toast } from '@/lib/toast';
import { certificateService } from '@/services/certificate.service';
import { ApiCertificate, CertificateEligibilityResult } from '@/types/certificate';
import { AppApiError } from '@/types/api';

interface CertificateEligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  courseSlug?: string;
  userId?: string;
  eligibility: CertificateEligibilityResult;
  onCertificateIssued: (cert: ApiCertificate) => void;
}

export const CertificateEligibilityModal: React.FC<CertificateEligibilityModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  eligibility,
  onCertificateIssued,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAlreadyIssuedByBackend, setIsAlreadyIssuedByBackend] = useState(false);
  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  const { criteria, isEligible, isPreliminary, missingRequirements } = eligibility;

  const handleRequestCertificate = async () => {
    if (!isEligible || isSubmitting || isSubmittingRef.current || isAlreadyIssuedByBackend) return;

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await certificateService.createCertificate({ courseId });

      if (res?.data) {
        toast.success('🎉 Chúc mừng bạn! Chứng chỉ tốt nghiệp đã được cấp thành công trên máy chủ TMdemy!');
        onCertificateIssued(res.data);
        onClose();
      } else {
        throw new Error(res?.message || 'Máy chủ không trả về dữ liệu chứng chỉ');
      }
    } catch (err: unknown) {
      let msg = 'Đã có lỗi xảy ra khi yêu cầu cấp chứng chỉ. Vui lòng kiểm tra lại kết nối mạng.';
      if (err instanceof AppApiError) {
        msg = err.message;
        // If already issued on backend, fetch existing certificate record
        if (err.message.includes('already have a certificate')) {
          msg = 'Khóa học này đã có chứng chỉ trên hệ thống TMdemy. Đang nạp chứng chỉ của bạn...';
          setIsAlreadyIssuedByBackend(true);
          try {
            const existing = await certificateService.getCertificateByCourse(courseId);
            if (existing) {
              toast.info('Đã tìm thấy chứng chỉ của bạn!');
              onCertificateIssued(existing);
              onClose();
              return;
            }
          } catch {
            // Keep error message
          }
        } else if (err.message.includes('Quiz submission percentage')) {
          msg = 'Chưa đạt yêu cầu: Bạn cần nộp bài cho ít nhất 60% số lượng bài kiểm tra Quiz trong khóa học trước khi nhận chứng chỉ.';
        } else if (err.message.includes('Progress is less than 70%')) {
          msg = 'Chưa đạt yêu cầu: Tiến độ bài học của bạn trên máy chủ chưa đạt mức tối thiểu 70%.';
        } else if (err.message.includes('Total score is less than 50%')) {
          msg = 'Chưa đạt yêu cầu: Điểm tổng kết kết hợp giữa tiến độ và bài tập chưa đạt mức tối thiểu 50%.';
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl flex flex-col bg-white dark:bg-[#1a1528] rounded-2xl shadow-2xl border border-zinc-200 dark:border-[#2f2742] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-[#2f2742] bg-zinc-50/70 dark:bg-[#201930] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isAlreadyIssuedByBackend
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : isEligible
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isAlreadyIssuedByBackend ? 'verified' : isEligible ? 'verified' : 'pending_actions'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Điều Kiện Cấp Chứng Chỉ
                </h3>
                {isPreliminary && isEligible && !isAlreadyIssuedByBackend && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-[#7240b8] dark:bg-purple-950/60 dark:text-[#c4a1ff]">
                    Sơ bộ
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {courseTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng"
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl hover:bg-zinc-200 dark:hover:bg-[#282136] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body Criteria Breakdown */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Transparency Notice */}
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
              info
            </span>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                Quy trình thẩm định tự động từ Máy chủ (Backend REST API)
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Khi bạn bấm nút yêu cầu, hệ thống sẽ kiểm tra trực tiếp trên cơ sở dữ liệu về việc ghi danh, tiến độ học bài giảng và nộp bài kiểm tra trắc nghiệm để sinh chứng chỉ PDF chính thức kèm mã xác thực công khai.
              </p>
            </div>
          </div>

          {/* Checklist of 5 criteria */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Danh mục 5 tiêu chuẩn tốt nghiệp:
            </h4>

            {/* 1. Enrollment */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] bg-white dark:bg-[#1f192f] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    criteria.enrollment.passed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {criteria.enrollment.passed ? 'check' : 'close'}
                  </span>
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    1. Ghi danh khóa học hợp lệ
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {criteria.enrollment.description}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                ĐẠT
              </span>
            </div>

            {/* 2. Progress >= 70% */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] bg-white dark:bg-[#1f192f] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    criteria.progress.passed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {criteria.progress.passed ? 'check' : 'close'}
                  </span>
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    2. Tiến độ học tập bài giảng
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Hiện tại: <strong className="text-zinc-900 dark:text-zinc-100">{criteria.progress.currentPercent}%</strong> (Yêu cầu: ≥ 70%)
                  </p>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold ${
                  criteria.progress.passed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {criteria.progress.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
              </span>
            </div>

            {/* 3. Quiz Completion >= 60% */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] bg-white dark:bg-[#1f192f] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    criteria.quizCompletion.passed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {criteria.quizCompletion.passed ? 'check' : 'hourglass_top'}
                  </span>
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    3. Tỷ lệ hoàn thành bài kiểm tra trắc nghiệm
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {criteria.quizCompletion.statusMessage || 'Khóa học có bài kiểm tra Quiz (Yêu cầu nộp: ≥ 60%)'}
                  </p>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold ${
                  criteria.quizCompletion.evaluationMode === 'ESTIMATED_PENDING_BACKEND'
                    ? 'text-purple-600 dark:text-purple-400'
                    : criteria.quizCompletion.passed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {criteria.quizCompletion.evaluationMode === 'ESTIMATED_PENDING_BACKEND'
                  ? 'Chờ thẩm định'
                  : criteria.quizCompletion.passed
                  ? 'ĐẠT'
                  : 'CHƯA ĐẠT'}
              </span>
            </div>

            {/* 4. Final Grade >= 50 */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] bg-white dark:bg-[#1f192f] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    criteria.finalGrade.passed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {criteria.finalGrade.passed ? 'check' : 'close'}
                  </span>
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    4. Điểm tổng kết tốt nghiệp (Final Grade)
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Điểm sơ bộ: <strong className="text-zinc-900 dark:text-zinc-100">{criteria.finalGrade.score}</strong> / 100 (Yêu cầu: ≥ 50 điểm)
                  </p>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold ${
                  criteria.finalGrade.passed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {criteria.finalGrade.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
              </span>
            </div>

            {/* 5. Unique Check */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] bg-white dark:bg-[#1f192f] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    5. Trạng thái cấp chứng chỉ
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Mỗi học viên được cấp 01 chứng chỉ tốt nghiệp duy nhất cho một khóa học.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                SẴN SÀNG
              </span>
            </div>
          </div>

          {/* Missing warnings if not eligible */}
          {!isEligible && missingRequirements.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Bạn cần hoàn thiện các mục sau:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-700 dark:text-amber-300">
                {missingRequirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Error Message banner from backend */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <div>
                <p className="font-bold">Máy chủ từ chối yêu cầu cấp:</p>
                <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-[#2f2742] bg-zinc-50 dark:bg-[#201930] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-100 dark:hover:bg-[#282136] text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Đóng
          </button>

          {isEligible && !isAlreadyIssuedByBackend && (
            <button
              type="button"
              onClick={handleRequestCertificate}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý & ký số chứng chỉ...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    workspace_premium
                  </span>
                  <span>Xác nhận & Gửi yêu cầu cấp bằng</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
