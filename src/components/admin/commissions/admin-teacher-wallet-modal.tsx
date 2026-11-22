'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { X, Wallet, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  extractCommissionApiError,
  formatCommissionDateTime,
  NormalizedCommissionError,
} from '@/lib/commission-earnings';
import { formatBpsPercent, formatVnd } from '@/lib/vndCurrency';
import { adminCommissionService } from '@/services/admin-commission.service';
import { AdminTeacherEarningsData, EarningStatus } from '@/types/commission-earnings';

interface AdminTeacherWalletModalProps {
  teacherId: string | null;
  onClose: () => void;
  onSelectEarning?: (earningId: string) => void;
}

export function AdminTeacherWalletModal({
  teacherId,
  onClose,
  onSelectEarning,
}: AdminTeacherWalletModalProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'' | EarningStatus>('');
  const [data, setData] = useState<AdminTeacherEarningsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NormalizedCommissionError | null>(null);

  const fetchTeacherWallet = useCallback(
    async (signal?: AbortSignal) => {
      if (!teacherId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await adminCommissionService.getTeacherEarnings(
          teacherId,
          {
            page,
            limit: 10,
            status: status || undefined,
            timezone: 'Asia/Ho_Chi_Minh',
          },
          { signal }
        );
        setData(res.data);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setError(extractCommissionApiError(err, 'Không thể tải ví thu nhập của giảng viên.'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [teacherId, page, status]
  );

  useEffect(() => {
    if (!teacherId) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void fetchTeacherWallet(controller.signal);
    });
    return () => controller.abort();
  }, [teacherId, fetchTeacherWallet]);

  if (!teacherId) return null;

  const totalPages = data?.pagination.totalPages || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Kiểm tra ví & thu nhập giảng viên"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Wallet className="w-5 h-5 text-[#7240b8] dark:text-[#a87ffb] shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                Ví & Thu nhập Giảng viên
                {data?.teacher ? ` — ${data.teacher.username}` : ''}
              </h3>
              <p className="text-[11px] font-mono text-[#7c7483] dark:text-[#968e9e] truncate">
                {data?.teacher ? `${data.teacher.email} • ` : ''}UUID: {teacherId}
              </p>
            </div>
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
          {error && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-800 dark:text-rose-200">{error.message}</p>
              </div>
              <button
                type="button"
                onClick={() => fetchTeacherWallet()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử lại
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Teacher Status & Balance Snapshot */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                    Trạng thái tài khoản:
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      data.teacher.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {data.teacher.status}
                  </span>
                </div>
                <span className="text-[11px] text-[#7c7483] tabular-nums">
                  Balance as of: {formatCommissionDateTime(data.balanceAsOf)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Khả dụng', value: data.currentBalances.availableBalance, cls: 'text-emerald-700 dark:text-emerald-400' },
                  { label: 'Tạm giữ', value: data.currentBalances.pendingBalance, cls: 'text-amber-700 dark:text-amber-300' },
                  { label: 'Tổng ghi nhận', value: data.currentBalances.lifetimeRecognized, cls: 'text-[#7240b8] dark:text-[#c4a6ff]' },
                  { label: 'Reserved', value: data.currentBalances.reservedBalance, cls: 'text-[#4b4452] dark:text-[#cdc3d4]' },
                  { label: 'Paid Out', value: data.currentBalances.paidOutBalance, cls: 'text-[#4b4452] dark:text-[#cdc3d4]' },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="rounded-xl border border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1f1b29] p-3"
                  >
                    <p className="text-[11px] text-[#7c7483]">{b.label}</p>
                    <p className={`text-sm font-extrabold tabular-nums mt-1 ${b.cls}`}>
                      {formatVnd(b.value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Filter & Earnings Table */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Danh sách khoản thu nhập ({data.counts.totalEarnings} tổng • {data.counts.pendingEarnings} pending • {data.counts.availableEarnings} available)
                </p>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as '' | EarningStatus);
                    setPage(1);
                  }}
                  className="h-8 px-2.5 rounded-lg border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">PENDING</option>
                  <option value="available">AVAILABLE</option>
                </select>
              </div>

              <div className="rounded-xl border border-[#f1ebff] dark:border-[#2b2438] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1c1826] text-[11px] font-bold uppercase text-[#635a72]">
                      <th className="py-2.5 px-3">Khóa học / Đơn</th>
                      <th className="py-2.5 px-3 text-right">Cơ sở</th>
                      <th className="py-2.5 px-3 text-center">Tỷ lệ</th>
                      <th className="py-2.5 px-3 text-right">GV nhận</th>
                      <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      <th className="py-2.5 px-3">Ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f7f1ff] dark:divide-[#2b2438]">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-[#7c7483]">
                          Đang tải...
                        </td>
                      </tr>
                    ) : data.earnings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#7c7483]">
                          Không có khoản thu nhập nào.
                        </td>
                      </tr>
                    ) : (
                      data.earnings.map((e) => (
                        <tr
                          key={e.id}
                          onClick={() => onSelectEarning?.(e.id)}
                          className="hover:bg-[#fdfbff] dark:hover:bg-[#1f1b29] cursor-pointer"
                        >
                          <td className="py-2.5 px-3 max-w-[200px]">
                            <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                              {e.courseTitle}
                            </p>
                            <p className="text-[10px] font-mono text-[#7c7483]">
                              {e.orderCode || e.orderId.slice(0, 8)}
                            </p>
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {formatVnd(e.commissionBase)}
                          </td>
                          <td className="py-2.5 px-3 text-center tabular-nums">
                            {formatBpsPercent(e.teacherRateBps)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {formatVnd(e.teacherAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                e.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {e.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] tabular-nums whitespace-nowrap text-[#635a72]">
                            {formatCommissionDateTime(e.recognizedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-[#635a72]">
                <span>Tổng: {data.pagination.total} khoản</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[#e5daf7] dark:border-[#342c44] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="tabular-nums font-semibold">
                    Trang {totalPages === 0 ? 0 : page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-[#e5daf7] dark:border-[#342c44] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
