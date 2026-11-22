'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Eye, RefreshCw } from 'lucide-react';
import {
  extractCommissionApiError,
  formatCommissionDateTime,
  NormalizedCommissionError,
} from '@/lib/commission-earnings';
import { formatBpsPercent, formatVnd } from '@/lib/vndCurrency';
import { teacherEarningsService } from '@/services/teacher-earnings.service';
import {
  EarningSortBy,
  EarningStatus,
  SortOrder,
  TeacherEarningsListData,
} from '@/types/commission-earnings';
import { TeacherEarningDetailModal } from './teacher-earning-detail-modal';

interface CourseOption {
  id: string;
  title: string;
}

interface TeacherEarningsTableProps {
  courses: CourseOption[];
}

export function TeacherEarningsTable({ courses }: TeacherEarningsTableProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState<'' | EarningStatus>('');
  const [courseId, setCourseId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortBy, setSortBy] = useState<EarningSortBy>('recognizedAt');
  const [order, setOrder] = useState<SortOrder>('desc');

  const [data, setData] = useState<TeacherEarningsListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedCommissionError | null>(null);
  const [selectedEarningId, setSelectedEarningId] = useState<string | null>(null);

  const fetchList = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await teacherEarningsService.getEarnings(
          {
            page,
            limit,
            status: status || undefined,
            courseId: courseId || undefined,
            from: from || undefined,
            to: to || undefined,
            timezone: 'Asia/Ho_Chi_Minh',
            sortBy,
            order,
          },
          { signal }
        );
        setData(res.data);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setError(extractCommissionApiError(err, 'Không thể tải danh sách khoản thu nhập.'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, limit, status, courseId, from, to, sortBy, order]
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void fetchList(controller.signal);
    });
    return () => controller.abort();
  }, [fetchList]);

  const totalPages = data?.pagination.totalPages || 0;
  const total = data?.pagination.total || 0;

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | EarningStatus);
                setPage(1);
              }}
              className="w-full h-9 px-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Đang tạm giữ (PENDING)</option>
              <option value="available">Khả dụng (AVAILABLE)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Khóa học
            </label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff]"
            >
              <option value="">Tất cả khóa học</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
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
              className="w-full h-9 px-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs text-[#1c192c] dark:text-[#f4eeff]"
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
              className="w-full h-9 px-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs text-[#1c192c] dark:text-[#f4eeff]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Sắp xếp theo
            </label>
            <select
              value={`${sortBy}:${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split(':') as [EarningSortBy, SortOrder];
                setSortBy(s);
                setOrder(o);
                setPage(1);
              }}
              className="w-full h-9 px-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff]"
            >
              <option value="recognizedAt:desc">Mới ghi nhận nhất</option>
              <option value="recognizedAt:asc">Ghi nhận cũ nhất</option>
              <option value="availableAt:asc">Sắp mở khóa sớm nhất</option>
              <option value="teacherAmount:desc">Thu nhập cao nhất</option>
              <option value="teacherAmount:asc">Thu nhập thấp nhất</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setStatus('');
                setCourseId('');
                setFrom('');
                setTo('');
                setSortBy('recognizedAt');
                setOrder('desc');
                setPage(1);
              }}
              className="flex-1 h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] cursor-pointer"
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={() => fetchList()}
              aria-label="Làm mới danh sách"
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
            onClick={() => fetchList()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1c1826] text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2]">
                <th className="py-3 px-4">Đơn hàng & Khóa học</th>
                <th className="py-3 px-3 text-right">Cơ sở tính (Gross / Giảm)</th>
                <th className="py-3 px-3 text-center">Tỷ lệ / Tạm giữ</th>
                <th className="py-3 px-3 text-right">Thu nhập GV</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3">Mốc thời gian</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f1ff] dark:divide-[#2b2438] text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-5 w-full rounded bg-[#f7f1ff] dark:bg-[#221d2d]" />
                    </td>
                  </tr>
                ))
              ) : !data || data.earnings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-[#7c7483] dark:text-[#968e9e]">
                    Chưa có khoản thu nhập hoa hồng nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                data.earnings.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedEarningId(item.id)}
                    className="hover:bg-[#fdfbff] dark:hover:bg-[#1f1b29] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <p className="font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                        {item.courseTitle}
                      </p>
                      <p className="text-[11px] font-mono text-[#7c7483] dark:text-[#968e9e] mt-0.5">
                        {item.orderCode || item.orderId.slice(0, 8)}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums">
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {formatVnd(item.commissionBase)}
                      </p>
                      <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e]">
                        Gốc {formatVnd(item.grossAmount)} • Giảm {formatVnd(item.discountAmount)}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block font-bold text-[#7240b8] dark:text-[#c4a6ff]">
                        {formatBpsPercent(item.teacherRateBps)}
                      </span>
                      <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e]">
                        {item.holdingPeriodDays} ngày
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums">
                      <p className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatVnd(item.teacherAmount)}
                      </p>
                      <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e]">
                        Nền tảng: {formatVnd(item.platformAmount)}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          item.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
                            : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50'
                        }`}
                      >
                        {item.status === 'available' ? 'AVAILABLE' : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-[#635a72] dark:text-[#a9a0b2] tabular-nums whitespace-nowrap">
                      <div>Ghi nhận: {formatCommissionDateTime(item.recognizedAt)}</div>
                      <div>Khả dụng: {formatCommissionDateTime(item.availableAt)}</div>
                      {item.releasedAt && (
                        <div className="text-emerald-700 dark:text-emerald-400">
                          Mở khóa: {formatCommissionDateTime(item.releasedAt)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEarningId(item.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#c4a6ff] hover:bg-[#ebdffa] dark:hover:bg-[#382f4a] text-[11px] font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-wrap items-center justify-between gap-3 text-xs text-[#635a72] dark:text-[#a9a0b2]">
          <span>
            Tổng cộng <strong className="text-[#1c192c] dark:text-[#f4eeff]">{total}</strong> khoản
            thu nhập
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

      <TeacherEarningDetailModal
        earningId={selectedEarningId}
        onClose={() => setSelectedEarningId(null)}
      />
    </div>
  );
}
