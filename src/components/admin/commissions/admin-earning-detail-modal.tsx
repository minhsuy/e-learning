'use client';

import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Layers, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  extractCommissionApiError,
  formatCommissionDateTime,
  getLedgerEntryTypeLabel,
  NormalizedCommissionError,
} from '@/lib/commission-earnings';
import { formatBpsPercent, formatVnd, isNegativeVnd, isPositiveVnd } from '@/lib/vndCurrency';
import { adminCommissionService } from '@/services/admin-commission.service';
import { AdminEarningDetailData } from '@/types/commission-earnings';

interface AdminEarningDetailModalProps {
  earningId: string | null;
  onClose: () => void;
  onInspectTeacher?: (teacherId: string) => void;
}

export function AdminEarningDetailModal({
  earningId,
  onClose,
  onInspectTeacher,
}: AdminEarningDetailModalProps) {
  const [data, setData] = useState<AdminEarningDetailData | null>(null);
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
        const res = await adminCommissionService.getEarningById(earningId, {
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
      aria-label="Chi tiết khoản thu nhập hoa hồng (Admin)"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full bg-white dark:bg-[#17141f] shadow-2xl border-l border-[#f1ebff] dark:border-[#2b2438] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Chi tiết khoản thu nhập & Bằng chứng thanh toán
            </h3>
            <p className="text-[11px] font-mono text-[#7c7483] dark:text-[#968e9e] mt-0.5">
              Earning ID: {earningId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-xl text-[#635a72] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 rounded-2xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
              <div className="h-28 rounded-2xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
              <div className="h-36 rounded-2xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
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
              {/* Earning Summary + Teacher Link */}
              <div className="rounded-2xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#e5daf7] dark:border-[#342c44] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      {data.earning.courseTitle}
                    </p>
                    <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e] mt-0.5">
                      Đơn hàng:{' '}
                      <span className="font-mono font-semibold text-[#4b4452] dark:text-[#cdc3d4]">
                        {data.earning.orderCode || data.earning.orderId}
                      </span>
                    </p>
                    {data.earning.teacher && (
                      <div className="mt-1.5 flex items-center gap-2 text-xs">
                        <span className="text-[#7c7483] dark:text-[#968e9e]">Giảng viên:</span>
                        <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                          {data.earning.teacher.username} ({data.earning.teacher.email})
                        </span>
                        {onInspectTeacher && (
                          <button
                            type="button"
                            onClick={() => onInspectTeacher(data.earning.teacherId)}
                            className="text-[11px] font-bold text-[#7240b8] dark:text-[#c4a6ff] hover:underline cursor-pointer"
                          >
                            Xem ví GV
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${
                      data.earning.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
                        : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50'
                    }`}
                  >
                    {data.earning.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438] text-xs tabular-nums">
                  <div>
                    <p className="text-[#7c7483]">Gross / Discount</p>
                    <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      {formatVnd(data.earning.grossAmount)} / {formatVnd(data.earning.discountAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483]">Commission Base</p>
                    <p className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      {formatVnd(data.earning.commissionBase)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483]">Tỷ lệ / Tạm giữ</p>
                    <p className="font-bold text-[#7240b8] dark:text-[#c4a6ff]">
                      {formatBpsPercent(data.earning.teacherRateBps)} ({data.earning.holdingPeriodDays}d)
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483]">Thu nhập GV</p>
                    <p className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      {formatVnd(data.earning.teacherAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483]">Phần Nền tảng</p>
                    <p className="font-bold text-sky-600 dark:text-sky-400">
                      {formatVnd(data.earning.platformAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7c7483]">Nguồn hoàn tất</p>
                    <p className="font-mono text-[11px] text-[#4b4452] dark:text-[#cdc3d4]">
                      {data.earning.completionSource}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sanitized Payment Evidence */}
              <div className="rounded-2xl bg-white dark:bg-[#1c1826] border border-[#f1ebff] dark:border-[#2b2438] p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <CreditCard className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c192c] dark:text-[#f4eeff]">
                    Bằng chứng giao dịch thanh toán (Sanitized Payment Evidence)
                  </h4>
                </div>
                {data.paymentEvidence ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[#7c7483]">Payment Transaction ID</p>
                      <p className="font-mono font-semibold text-[#1c192c] dark:text-[#f4eeff] break-all">
                        {data.paymentEvidence.paymentTransactionId}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7c7483]">Trạng thái giao dịch</p>
                      <p className="font-bold uppercase text-emerald-700 dark:text-emerald-400">
                        {data.paymentEvidence.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7c7483]">Số tiền chuyển khoản xác thực</p>
                      <p className="font-extrabold text-[#1c192c] dark:text-[#f4eeff] tabular-nums">
                        {formatVnd(data.paymentEvidence.transferAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7c7483]">Thời điểm xử lý</p>
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] tabular-nums">
                        {formatCommissionDateTime(data.paymentEvidence.processedAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Không có bản ghi PaymentTransaction gắn kèm.
                  </p>
                )}
              </div>

              {/* Policy Snapshot */}
              {data.policy && (
                <div className="rounded-2xl bg-white dark:bg-[#1c1826] border border-[#f1ebff] dark:border-[#2b2438] p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c192c] dark:text-[#f4eeff]">
                      Bản chụp Chính sách hoa hồng
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-[#7c7483]">Tên</p>
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {data.policy.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7c7483]">Phiên bản</p>
                      <p className="font-bold text-[#7240b8] dark:text-[#c4a6ff]">
                        v{data.policy.version}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7c7483]">Tỷ lệ GV / Nền tảng</p>
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {formatBpsPercent(data.policy.teacherRateBps)} /{' '}
                        {formatBpsPercent(data.policy.platformRateBps)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7c7483]">Tạm giữ</p>
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {data.policy.holdingPeriodDays} ngày
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ledger Rows */}
              <div className="rounded-2xl bg-white dark:bg-[#1c1826] border border-[#f1ebff] dark:border-[#2b2438] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c192c] dark:text-[#f4eeff]">
                    Bút toán sổ cái ({data.ledgerEntries.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {data.ledgerEntries.map((entry) => {
                    const meta = getLedgerEntryTypeLabel(entry.entryType);
                    return (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-[#f1ebff] dark:border-[#2b2438] p-3 bg-[#fdfbff] dark:bg-[#17141f] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-[11px] text-[#7c7483] tabular-nums">
                            {formatCommissionDateTime(entry.createdAt)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 tabular-nums">
                          <div>
                            Pending:{' '}
                            <strong
                              className={
                                isNegativeVnd(entry.pendingDelta)
                                  ? 'text-rose-600'
                                  : isPositiveVnd(entry.pendingDelta)
                                  ? 'text-amber-700'
                                  : 'text-[#7c7483]'
                              }
                            >
                              {formatVnd(entry.pendingDelta, { showPlusSign: true })}
                            </strong>
                          </div>
                          <div>
                            Available:{' '}
                            <strong
                              className={
                                isPositiveVnd(entry.availableDelta)
                                  ? 'text-emerald-700'
                                  : isNegativeVnd(entry.availableDelta)
                                  ? 'text-rose-600'
                                  : 'text-[#7c7483]'
                              }
                            >
                              {formatVnd(entry.availableDelta, { showPlusSign: true })}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
