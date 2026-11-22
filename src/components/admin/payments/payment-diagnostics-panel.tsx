'use client';

import React from 'react';
import { Activity, AlertCircle, RotateCcw, Clock, CheckCircle2, Info } from 'lucide-react';
import { PaymentDiagnosticsData } from '@/types/payment';
import { formatDurationMs } from '@/lib/admin-analytics';

interface PaymentDiagnosticsPanelProps {
  data: PaymentDiagnosticsData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('vi-VN').format(n);
}

export function PaymentDiagnosticsPanel({
  data,
  loading,
  error,
  onRetry,
}: PaymentDiagnosticsPanelProps) {
  const isHealthy =
    data &&
    data.inbox.retryExhausted === 0 &&
    data.manualReviewTransactions === 0 &&
    data.unmatchedIncomingTransactions === 0;

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Chẩn đoán hệ thống Webhook &amp; Worker
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Dữ liệu tổng hợp thời gian thực từ <code className="font-mono text-[11px]">GET /api/payments/admin/diagnostics</code> (Chỉ đọc)
            </p>
          </div>
        </div>

        {data && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              isHealthy
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isHealthy ? 'Ổn định — không có cảnh báo' : 'Có mục cần theo dõi'}</span>
          </span>
        )}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Webhook Inbox Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Tổng webhook đã nhận</p>
              <p className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                {fmt(data.inbox.totalReceived)}
              </p>
              <p className="text-[10px] text-[#8e849e] dark:text-[#8d8299]">
                Đã xử lý: {fmt(data.inbox.processed)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Đang chờ / Đang xử lý</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {fmt(data.inbox.pending)}
              </p>
              <p className="text-[10px] text-[#8e849e] dark:text-[#8d8299]">
                Received: {fmt(data.inbox.received)} • Processing: {fmt(data.inbox.processing)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Webhook lỗi / Hết lượt</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {fmt(data.inbox.failed)} / {fmt(data.inbox.retryExhausted)}
              </p>
              <p className="text-[10px] text-[#8e849e] dark:text-[#8d8299]">
                Hết lượt thử lại: {fmt(data.inbox.retryExhausted)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Rà soát / Tiền vào lạ</p>
              <p className="text-lg font-bold text-[#7240b8] dark:text-[#a87ffb] mt-0.5">
                {fmt(data.manualReviewTransactions)} / {fmt(data.unmatchedIncomingTransactions)}
              </p>
              <p className="text-[10px] text-[#8e849e] dark:text-[#8d8299]">
                Chưa khớp đơn: {fmt(data.unmatchedIncomingTransactions)}
              </p>
            </div>
          </div>

          {/* Latency & Pending Age Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                <Clock className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>Tuổi sự kiện chờ lâu nhất</span>
              </div>
              <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {data.oldestPendingAgeMs !== null
                  ? formatDurationMs(data.oldestPendingAgeMs)
                  : 'Không có hàng đợi'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1">
              <p className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                Độ trễ xử lý Worker (TB)
              </p>
              <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {data.processingLatency.averageMs !== null
                  ? formatDurationMs(data.processingLatency.averageMs)
                  : 'Chưa có mẫu'}
              </p>
              <p className="text-[10px] text-[#8e849e] dark:text-[#8d8299]">
                {fmt(data.processingLatency.samples)} mẫu ({data.processingLatency.scope})
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1">
              <p className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                Độ trễ tiếp nhận Webhook (TB)
              </p>
              <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {data.ingestionLatency.averageMs !== null
                  ? formatDurationMs(data.ingestionLatency.averageMs)
                  : 'Chưa có mẫu'}
              </p>
              <p className="text-[10px] text-[#8e849e] dark:text-[#8d8299]">
                Tiến trình hiện tại • Nhận: {fmt(data.ingestionLatency.accepted)} / Lỗi: {fmt(data.ingestionLatency.failed)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-[#8e849e] dark:text-[#8d8299]">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>
              Chẩn đoán độ trễ tiếp nhận (<code className="font-mono">ingestionLatency</code>) đo trên tiến trình backend đang chạy và sẽ đặt lại khi máy chủ khởi động lại. API hoàn toàn chỉ đọc, không kích hoạt retry hay sửa đổi dữ liệu.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
