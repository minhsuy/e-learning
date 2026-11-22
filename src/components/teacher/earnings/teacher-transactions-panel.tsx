'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import {
  extractCommissionApiError,
  formatCommissionDateTime,
  getLedgerEntryTypeLabel,
  NormalizedCommissionError,
} from '@/lib/commission-earnings';
import { formatVnd, isNegativeVnd, isPositiveVnd } from '@/lib/vndCurrency';
import { teacherEarningsService } from '@/services/teacher-earnings.service';
import { LedgerEntryType, TeacherTransactionsData } from '@/types/commission-earnings';

export function TeacherTransactionsPanel() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [entryType, setEntryType] = useState<'' | LedgerEntryType>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [data, setData] = useState<TeacherTransactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedCommissionError | null>(null);

  const fetchTransactions = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await teacherEarningsService.getTransactions(
          {
            page,
            limit,
            entryType: entryType || undefined,
            from: from || undefined,
            to: to || undefined,
            timezone: 'Asia/Ho_Chi_Minh',
          },
          { signal }
        );
        setData(res.data);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setError(extractCommissionApiError(err, 'Không thể tải lịch sử sổ cái.'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, limit, entryType, from, to]
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void fetchTransactions(controller.signal);
    });
    return () => controller.abort();
  }, [fetchTransactions]);

  const totalPages = data?.pagination.totalPages || 0;
  const total = data?.pagination.total || 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Loại bút toán sổ cái
            </label>
            <select
              value={entryType}
              onChange={(e) => {
                setEntryType(e.target.value as '' | LedgerEntryType);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff]"
            >
              <option value="">Tất cả loại bút toán</option>
              <option value="earning_recognized">Ghi nhận thu nhập (EARNING_RECOGNIZED)</option>
              <option value="earning_released">Mở khóa khả dụng (EARNING_RELEASED)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs text-[#1c192c] dark:text-[#f4eeff]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs text-[#1c192c] dark:text-[#f4eeff]"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEntryType('');
                setFrom('');
                setTo('');
                setPage(1);
              }}
              className="flex-1 h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] cursor-pointer"
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={() => fetchTransactions()}
              aria-label="Làm mới lịch sử sổ cái"
              className="h-9 px-3 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 dark:text-rose-200">{error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchTransactions()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1c1826] text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2]">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-3">Loại bút toán</th>
                <th className="py-3 px-3 text-right">Biến động Tạm giữ</th>
                <th className="py-3 px-3 text-right">Biến động Khả dụng</th>
                <th className="py-3 px-4">Diễn giải / Mã thu nhập</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f1ff] dark:divide-[#2b2438] text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-4 px-4">
                      <div className="h-5 w-full rounded bg-[#f7f1ff] dark:bg-[#221d2d]" />
                    </td>
                  </tr>
                ))
              ) : !data || data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center text-[#7c7483] dark:text-[#968e9e]">
                    Chưa có bút toán sổ cái nào phát sinh.
                  </td>
                </tr>
              ) : (
                data.transactions.map((tx) => {
                  const meta = getLedgerEntryTypeLabel(tx.entryType);
                  return (
                    <tr key={tx.id} className="hover:bg-[#fdfbff] dark:hover:bg-[#1f1b29]">
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums text-[#4b4452] dark:text-[#cdc3d4]">
                        {formatCommissionDateTime(tx.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-bold tabular-nums whitespace-nowrap ${
                          isNegativeVnd(tx.pendingDelta)
                            ? 'text-rose-600 dark:text-rose-400'
                            : isPositiveVnd(tx.pendingDelta)
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-[#7c7483] dark:text-[#968e9e]'
                        }`}
                      >
                        {formatVnd(tx.pendingDelta, { showPlusSign: true })}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-bold tabular-nums whitespace-nowrap ${
                          isPositiveVnd(tx.availableDelta)
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isNegativeVnd(tx.availableDelta)
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-[#7c7483] dark:text-[#968e9e]'
                        }`}
                      >
                        {formatVnd(tx.availableDelta, { showPlusSign: true })}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-[#1c192c] dark:text-[#f4eeff] font-medium">
                          {tx.reason || 'Ghi nhận tự động bởi hệ thống hoa hồng'}
                        </p>
                        <p className="text-[11px] font-mono text-[#7c7483] dark:text-[#968e9e] mt-0.5">
                          Earning: {tx.earningId}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-wrap items-center justify-between gap-3 text-xs text-[#635a72] dark:text-[#a9a0b2]">
          <span>
            Tổng cộng <strong className="text-[#1c192c] dark:text-[#f4eeff]">{total}</strong> bút toán
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#e5daf7] dark:border-[#342c44] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold tabular-nums">
              Trang {totalPages === 0 ? 0 : page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-[#e5daf7] dark:border-[#342c44] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
