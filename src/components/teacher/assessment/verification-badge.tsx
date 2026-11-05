'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { AiCodingExerciseVerification, AiVerificationStatus } from '@/types/ai-assessment';

interface VerificationBadgeProps {
  verification?: AiCodingExerciseVerification | null;
  compact?: boolean;
}

export function VerificationBadge({ verification, compact = false }: VerificationBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const status: AiVerificationStatus = verification?.status || 'UNVERIFIED';
  const passRate =
    typeof verification?.testPassRate === 'number'
      ? verification.testPassRate
      : typeof verification?.score === 'number'
      ? verification.score
      : null;

  const passed =
    typeof verification?.passedCount === 'number'
      ? verification.passedCount
      : typeof verification?.passedTests === 'number'
      ? verification.passedTests
      : 0;

  const total =
    typeof verification?.totalCount === 'number'
      ? verification.totalCount
      : typeof verification?.totalTests === 'number'
      ? verification.totalTests
      : 0;

  const details = verification?.details || [];

  if (compact) {
    if (status === 'VERIFIED') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
          title="Đã nghiệm thu 100% test case trong sandbox E2B"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>VERIFIED {passRate !== null ? `(${passRate}%)` : ''}</span>
        </span>
      );
    }

    if (status === 'FAILED') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
          title="Nghiệm thu Sandbox E2B thất bại"
        >
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>FAILED {passRate !== null ? `(${passRate}%)` : ''}</span>
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
        title="Chưa nghiệm thu sandbox (cần kiểm thử thủ công)"
      >
        <HelpCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>UNVERIFIED</span>
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-3.5 space-y-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {status === 'VERIFIED' && (
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-4 h-4" />
            </div>
          )}
          {status === 'FAILED' && (
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800/60">
              <XCircle className="w-4 h-4" />
            </div>
          )}
          {status === 'UNVERIFIED' && (
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Trạng thái Nghiệm thu Sandbox E2B:
              </span>
              <span
                className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  status === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : status === 'FAILED'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {status}
              </span>
            </div>

            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              {status === 'VERIFIED' && (
                <>
                  Đã vượt qua 100% test cases (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {passed}/{total || passed} test cases đạt
                  </span>
                  ) trong môi trường microVM độc lập.
                </>
              )}
              {status === 'FAILED' && (
                <>
                  Lời giải mẫu không vượt qua bài kiểm thử (
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    Đạt {passRate ?? 0}%
                  </span>
                  ). Giảng viên cần điều chỉnh mã giải trước khi xuất bản.
                </>
              )}
              {status === 'UNVERIFIED' && (
                <>
                  Chưa xác thực tự động qua Sandbox E2B (ngôn ngữ cần runner bổ sung hoặc dịch vụ offline). Yêu cầu Giảng viên kiểm tra thủ công.
                </>
              )}
            </p>
          </div>
        </div>

        {details.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline"
          >
            <span>{showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {showDetails && details.length > 0 && (
        <div className="pt-2 border-t border-[#eceaf3] dark:border-[#352e43] space-y-2">
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Chi tiết kết quả từng bài kiểm thử:
          </p>
          <div className="space-y-1.5 max-h-48 overflow-auto text-xs font-mono">
            {details.map((d, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-[11px] ${
                  d.passed
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Test #{idx + 1}</span>
                  <span>{d.passed ? '✓ PASS' : '✗ FAIL'}</span>
                </div>
                {d.errorMessage && (
                  <div className="mt-1 text-rose-600 dark:text-rose-400 font-sans">
                    Lỗi: {d.errorMessage}
                  </div>
                )}
                {d.actualOutput !== undefined && (
                  <div className="mt-0.5 text-slate-600 dark:text-slate-300">
                    Thực tế: {JSON.stringify(d.actualOutput)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
