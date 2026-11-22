'use client';

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  Eye,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { PaymentReconciliationData } from '@/types/payment';
import { getReconciliationFindingMeta } from '@/lib/admin-analytics';
import { cn } from '@/lib/utils';

interface PaymentReconciliationPanelProps {
  data: PaymentReconciliationData | null;
  loading: boolean;
  error: string | null;
  windowDays: 7 | 14 | 30;
  onWindowDaysChange: (days: 7 | 14 | 30) => void;
  onInspectOrder: (orderId: string) => void;
  onRetry: () => void;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('vi-VN').format(n);
}

function getExternalStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'SePay API v2: Khả dụng',
        className: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
      };
    case 'NOT_CONFIGURED':
      return {
        label: 'SePay API v2: Chưa cấu hình token',
        className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      };
    case 'NOT_REQUESTED':
      return {
        label: 'SePay API v2: Chỉ đối soát nội bộ',
        className: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300',
      };
    case 'UNAVAILABLE':
      return {
        label: 'SePay API v2: Không khả dụng',
        className: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
      };
    default:
      return {
        label: status,
        className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      };
  }
}

export function PaymentReconciliationPanel({
  data,
  loading,
  error,
  windowDays,
  onWindowDaysChange,
  onInspectOrder,
  onRetry,
}: PaymentReconciliationPanelProps) {
  const externalBadge = data ? getExternalStatusBadge(data.external.status) : null;

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header & Window Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Đối soát thanh toán nội bộ (Reconciliation)
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Báo cáo chỉ đọc từ <code className="font-mono text-[11px]">GET /api/payments/admin/reconciliation</code> — Không tự động sửa đổi dữ liệu tài chính
            </p>
          </div>
        </div>

        {/* Window Pills (Max 31 days per Backend contract) */}
        <div
          role="group"
          aria-label="Chọn cửa sổ đối soát"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#f7f1ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] self-start sm:self-auto"
        >
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onWindowDaysChange(days)}
              disabled={loading}
              aria-pressed={windowDays === days}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                windowDays === days
                  ? 'bg-[#7240b8] text-white shadow-xs'
                  : 'text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              )}
            >
              {days} ngày
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="p-5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-2.5">
          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
          <p className="text-xs font-medium text-rose-800 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : loading && !data ? (
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
            ))}
          </div>
          <div className="h-28 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Status Pills Row */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold',
                data.internal.complete
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              )}
            >
              {data.internal.complete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Quét nội bộ đầy đủ (giới hạn {data.internal.limit}/nhóm)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Bản quét chạm giới hạn ({data.internal.limit}/nhóm) — hãy thu hẹp cửa sổ ngày
                </>
              )}
            </span>

            {externalBadge && (
              <span className={cn('px-2.5 py-1 rounded-full font-semibold', externalBadge.className)}>
                {externalBadge.label}
                {data.external.reason ? ` (${data.external.reason})` : ''}
              </span>
            )}

            <span className="px-2.5 py-1 rounded-full font-medium bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#635a72] dark:text-[#a9a0b2]">
              Tự động sửa lỗi: {data.automaticRepair ? 'Bật' : 'Tắt (Chỉ đọc)'}
            </span>
          </div>

          {/* Scanned & Excluded Aggregate Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Đơn SePay đã quét</p>
              <p className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                {fmt(data.internal.scanned.orders)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Giao dịch đã quét</p>
              <p className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                {fmt(data.internal.scanned.transactions)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Webhook chưa xong</p>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {fmt(data.internal.scanned.unresolvedEvents)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Loại trừ thủ công/cũ</p>
              <p className="text-base font-bold text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                {fmt(data.internal.excluded.legacyPaid)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Loại trừ miễn phí</p>
              <p className="text-base font-bold text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                {fmt(data.internal.excluded.free)}
              </p>
            </div>
          </div>

          {/* Findings List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <h3 className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Danh sách phát hiện đối soát ({fmt(data.findings.length)})
              </h3>
              <span className="text-[11px] text-[#8e849e] dark:text-[#8d8299]">
                Cửa sổ: {new Date(data.window.from).toLocaleDateString('vi-VN')} →{' '}
                {new Date(data.window.to).toLocaleDateString('vi-VN')}
              </span>
            </div>

            {data.findings.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold">Không ghi nhận bất thường đối soát nào trong {windowDays} ngày qua.</p>
                  <p className="text-[11px] opacity-85 mt-0.5">
                    Các đơn SePay hoàn tất, giao dịch nội bộ và trạng thái ghi danh đều nhất quán.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {data.findings.map((finding, idx) => {
                  const meta = getReconciliationFindingMeta(finding.kind);
                  return (
                    <div
                      key={`${finding.kind}-${finding.orderId || finding.transactionId || finding.eventId || idx}`}
                      className={cn(
                        'p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                        meta.severity === 'critical'
                          ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/40'
                          : meta.severity === 'warning'
                          ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/40'
                          : 'bg-[#fdf8ff] dark:bg-[#17141f] border-[#f1ebff] dark:border-[#2b2438]'
                      )}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                            {meta.label}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 dark:bg-[#1d1926] border border-black/5 dark:border-white/10 text-[#635a72] dark:text-[#a9a0b2]">
                            {finding.outcome}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                          {meta.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-[#8e849e] dark:text-[#8d8299]">
                          {finding.orderId && <span>Order: {finding.orderId}</span>}
                          {finding.transactionId && <span>Tx: {finding.transactionId}</span>}
                          {finding.eventId && <span>Event: {finding.eventId}</span>}
                          {finding.couponId && <span>Coupon: {finding.couponId}</span>}
                        </div>
                      </div>

                      {finding.orderId && (
                        <button
                          type="button"
                          onClick={() => onInspectOrder(finding.orderId!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] border border-[#e6dffa] dark:border-[#352e43] text-[#7240b8] dark:text-[#a87ffb] text-[11px] font-semibold shrink-0 cursor-pointer self-start sm:self-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem đơn</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-[11px] text-[#8e849e] dark:text-[#8d8299]">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>
              Chế độ giám sát chỉ đọc: giao diện không cung cấp nút ép đơn SePay sang SUCCESS, sửa số tiền, giả lập webhook hay xóa giao dịch tài chính.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
