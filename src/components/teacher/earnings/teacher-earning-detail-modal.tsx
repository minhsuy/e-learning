'use client';

import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Layers, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  extractCommissionApiError,
  formatCommissionDateTime,
  getLedgerEntryTypeLabel,
  NormalizedCommissionError,
} from '@/lib/commission-earnings';
import { formatBpsPercent, formatVnd, isNegativeVnd, isPositiveVnd } from '@/lib/vndCurrency';
import { teacherEarningsService } from '@/services/teacher-earnings.service';
import { TeacherEarningDetailData } from '@/types/commission-earnings';

interface TeacherEarningDetailModalProps {
  earningId: string | null;
  onClose: () => void;
}

export function TeacherEarningDetailModal({
  earningId,
  onClose,
}: TeacherEarningDetailModalProps) {
  const [data, setData] = useState<TeacherEarningDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NormalizedCommissionError | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!earningId) return;
    const controller = new AbortController();

    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await teacherEarningsService.getEarningById(earningId, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setData(res.data);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setError(extractCommissionApiError(err, 'Không thể tải chi tiết khoản thu nhập.'));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });

    return () => controller.abort();
  }, [earningId, retryKey]);

  if (!earningId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết khoản thu nhập hoa hồng"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full bg-white dark:bg-[#17141f] shadow-2xl border-l border-[#f1ebff] dark:border-[#2b2438] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Chi tiết khoản thu nhập
            </h3>
            <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e] font-mono mt-0.5">
              ID: {earningId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết"
            className="p-2 rounded-xl text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-28 rounded-2xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
              <div className="h-32 rounded-2xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
              <div className="h-40 rounded-2xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-800 dark:text-rose-200">{error.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử lại
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Financial Summary */}
              <div className="rounded-2xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#e5daf7] dark:border-[#342c44] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      {data.earning.courseTitle}
                    </p>
                    <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e] mt-0.5">
                      Mã đơn hàng:{' '}
                      <span className="font-mono font-semibold text-[#4b4452] dark:text-[#cdc3d4]">
                        {data.earning.orderCode || data.earning.orderId}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${
                      data.earning.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
                        : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50'
                    }`}
                  >
                    {data.earning.status === 'available' ? 'AVAILABLE' : 'PENDING'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438] text-xs">
                  <div>
                    <p className="text-[#7c7483] dark:text-[#968e9e]">Giá gốc (Gross)</p>
                    <p className="font-bold text-[#1c192c] dark:text-[#f4eeff] tabular-nums mt-0.5">
                      {formatVnd(data.earning.grossAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483] dark:text-[#968e9e]">Giảm giá (Discount)</p>
                    <p className="font-bold text-[#1c192c] dark:text-[#f4eeff] tabular-nums mt-0.5">
                      {formatVnd(data.earning.discountAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483] dark:text-[#968e9e]">Cơ sở hoa hồng</p>
                    <p className="font-bold text-[#1c192c] dark:text-[#f4eeff] tabular-nums mt-0.5">
                      {formatVnd(data.earning.commissionBase)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483] dark:text-[#968e9e]">
                      Thu nhập Giảng viên ({formatBpsPercent(data.earning.teacherRateBps)})
                    </p>
                    <p className="font-extrabold text-[#7240b8] dark:text-[#c4a6ff] tabular-nums mt-0.5">
                      {formatVnd(data.earning.teacherAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483] dark:text-[#968e9e]">
                      Phần Nền tảng ({formatBpsPercent(data.earning.platformRateBps)})
                    </p>
                    <p className="font-bold text-sky-600 dark:text-sky-400 tabular-nums mt-0.5">
                      {formatVnd(data.earning.platformAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483] dark:text-[#968e9e]">Tạm giữ</p>
                    <p className="font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                      {data.earning.holdingPeriodDays} ngày
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438] text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                  <div>
                    Ghi nhận:{' '}
                    <strong className="text-[#1c192c] dark:text-[#f4eeff] tabular-nums">
                      {formatCommissionDateTime(data.earning.recognizedAt)}
                    </strong>
                  </div>
                  <div>
                    Dự kiến mở khóa:{' '}
                    <strong className="text-[#1c192c] dark:text-[#f4eeff] tabular-nums">
                      {formatCommissionDateTime(data.earning.availableAt)}
                    </strong>
                  </div>
                  <div>
                    Đã mở khóa:{' '}
                    <strong className="text-[#1c192c] dark:text-[#f4eeff] tabular-nums">
                      {formatCommissionDateTime(data.earning.releasedAt)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Immutable Policy Snapshot */}
              <div className="rounded-2xl bg-white dark:bg-[#1c1826] border border-[#f1ebff] dark:border-[#2b2438] p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c192c] dark:text-[#f4eeff]">
                    Bản chụp chính sách bất biến (Policy Snapshot)
                  </h4>
                </div>
                {data.policy ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-[#7c7483] dark:text-[#968e9e]">Tên chính sách</p>
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                        {data.policy.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7c7483] dark:text-[#968e9e]">Phiên bản</p>
                      <p className="font-semibold text-[#7240b8] dark:text-[#c4a6ff] mt-0.5">
                        v{data.policy.version}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7c7483] dark:text-[#968e9e]">Tỷ lệ GV / Nền tảng</p>
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                        {formatBpsPercent(data.policy.teacherRateBps)} /{' '}
                        {formatBpsPercent(data.policy.platformRateBps)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7c7483] dark:text-[#968e9e]">Holding period</p>
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                        {data.policy.holdingPeriodDays} ngày
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#7c7483] dark:text-[#968e9e]">
                    Tỷ lệ áp dụng: {formatBpsPercent(data.earning.teacherRateBps)} /{' '}
                    {formatBpsPercent(data.earning.platformRateBps)} • Tạm giữ{' '}
                    {data.earning.holdingPeriodDays} ngày.
                  </p>
                )}
              </div>

              {/* Append-Only Ledger Entries */}
              <div className="rounded-2xl bg-white dark:bg-[#1c1826] border border-[#f1ebff] dark:border-[#2b2438] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c192c] dark:text-[#f4eeff]">
                    Bút toán sổ cái bất biến ({data.ledgerEntries.length})
                  </h4>
                </div>
                {data.ledgerEntries.length === 0 ? (
                  <p className="text-xs text-[#7c7483] dark:text-[#968e9e]">
                    Chưa có bút toán sổ cái nào.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {data.ledgerEntries.map((entry) => {
                      const meta = getLedgerEntryTypeLabel(entry.entryType);
                      return (
                        <div
                          key={entry.id}
                          className="rounded-xl border border-[#f1ebff] dark:border-[#2b2438] p-3 bg-[#fdfbff] dark:bg-[#17141f] text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-[#7c7483] dark:text-[#968e9e] tabular-nums">
                              {formatCommissionDateTime(entry.createdAt)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 tabular-nums">
                            <div>
                              <span className="text-[#7c7483] dark:text-[#968e9e]">Biến động Tạm giữ: </span>
                              <strong
                                className={
                                  isNegativeVnd(entry.pendingDelta)
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : isPositiveVnd(entry.pendingDelta)
                                    ? 'text-amber-700 dark:text-amber-300'
                                    : 'text-[#635a72]'
                                }
                              >
                                {formatVnd(entry.pendingDelta, { showPlusSign: true })}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#7c7483] dark:text-[#968e9e]">Biến động Khả dụng: </span>
                              <strong
                                className={
                                  isPositiveVnd(entry.availableDelta)
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : isNegativeVnd(entry.availableDelta)
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-[#635a72]'
                                }
                              >
                                {formatVnd(entry.availableDelta, { showPlusSign: true })}
                              </strong>
                            </div>
                          </div>
                          {entry.reason && (
                            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                              Ghi chú: {entry.reason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
