'use client';

import React from 'react';
import {
  BookOpen,
  GraduationCap,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowUpDown,
} from 'lucide-react';
import {
  AdminSalesBreakdownData,
  AdminSalesGroupBy,
  AdminSalesSortBy,
} from '@/types/admin-order';
import { formatVND } from '@/services/admin-order.service';
import { cn } from '@/lib/utils';

interface SalesBreakdownCardProps {
  groupBy: AdminSalesGroupBy;
  data: AdminSalesBreakdownData | null;
  loading: boolean;
  error: string | null;
  sortBy: AdminSalesSortBy;
  order: 'asc' | 'desc';
  onSortChange: (sortBy: AdminSalesSortBy) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

function fmt(n: number | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(n ?? 0);
}

export function SalesBreakdownCard({
  groupBy,
  data,
  loading,
  error,
  sortBy,
  order,
  onSortChange,
  onPageChange,
  onRetry,
}: SalesBreakdownCardProps) {
  const isTeacher = groupBy === 'teacher';
  const rows = data?.rows ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 };
  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1);

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              isTeacher
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
            )}
          >
            {isTeacher ? <GraduationCap className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {isTeacher ? 'Doanh thu khóa học theo giảng viên' : 'Khóa học bán chạy nhất'}
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              {isTeacher
                ? 'Xếp hạng tổng doanh số khóa học theo giảng viên phụ trách (phân trang server-side)'
                : 'Xếp hạng doanh thu, chiết khấu và lượt mua hoàn tất theo từng khóa học'}
            </p>
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
          <select
            aria-label={isTeacher ? 'Sắp xếp giảng viên' : 'Sắp xếp khóa học'}
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as AdminSalesSortBy)}
            disabled={loading}
            className="h-8 px-2.5 rounded-lg bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden cursor-pointer"
          >
            <option value="revenue">Doanh thu ghi nhận ({order === 'desc' ? 'cao → thấp' : 'thấp → cao'})</option>
            <option value="completedOrders">Số đơn hoàn tất</option>
            <option value="grossSales">Doanh thu trước giảm giá</option>
          </select>
        </div>
      </div>

      {/* Explicit non-commission notice for Teacher Revenue */}
      {isTeacher && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200">
          <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <span>
            <strong>Phạm vi số liệu:</strong> Số tiền hiển thị là{' '}
            <strong>doanh thu khóa học theo giảng viên</strong> (sales attribution). TMdemy hiện chưa triển khai cơ chế tính hoa hồng, lương, ví hay rút tiền giảng viên.
          </span>
        </div>
      )}

      {/* Body */}
      {error ? (
        <div className="p-6 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-2.5">
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
      ) : loading && rows.length === 0 ? (
        <div className="space-y-3 py-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-dashed border-[#e6dffa] dark:border-[#2b2438] text-xs text-[#635a72] dark:text-[#a9a0b2]">
          Chưa ghi nhận đơn hàng hoàn tất nào trong khoảng thời gian và bộ lọc đã chọn.
        </div>
      ) : (
        <>
          {/* Horizontal Bar Preview for Top 5 on Current Page */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c7483] dark:text-[#968e9e]">
              So sánh trực quan (Top {Math.min(rows.length, 5)} trang hiện tại)
            </p>
            <div className="space-y-2">
              {rows.slice(0, 5).map((row, idx) => {
                const widthPct = maxRevenue > 0 ? Math.max((row.revenue / maxRevenue) * 100, row.revenue > 0 ? 4 : 0) : 0;
                const rank = (pagination.page - 1) * pagination.limit + idx + 1;
                return (
                  <div key={`${row.id ?? 'orphan'}-${idx}`} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-[#1c192c] dark:text-[#f4eeff]">
                        <span className="inline-block w-5 font-bold text-[#7240b8] dark:text-[#a87ffb]">
                          #{rank}
                        </span>
                        {row.label}
                      </span>
                      <span className="font-bold text-[#1c192c] dark:text-[#f4eeff] shrink-0">
                        {formatVND(row.revenue)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#ece5fa] dark:bg-[#2b2438] overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isTeacher ? 'bg-indigo-500' : 'bg-[#7240b8]'
                        )}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Responsive Ranked Table */}
          <div className="overflow-x-auto rounded-xl border border-[#f1ebff] dark:border-[#2b2438]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#fdf8ff] dark:bg-[#17141f] border-b border-[#f1ebff] dark:border-[#2b2438] text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-10">#</th>
                  <th className="py-3 px-3.5">{isTeacher ? 'Giảng viên' : 'Khóa học'}</th>
                  {isTeacher ? (
                    <th className="py-3 px-3.5 text-right">Số khóa học</th>
                  ) : (
                    <th className="py-3 px-3.5">Giảng viên</th>
                  )}
                  <th className="py-3 px-3.5 text-right">Hoàn tất</th>
                  <th className="py-3 px-3.5 text-right">Trả phí / Miễn phí</th>
                  <th className="py-3 px-3.5 text-right">Chiết khấu</th>
                  <th className="py-3 px-3.5 text-right">
                    {isTeacher ? 'Doanh thu khóa học' : 'Doanh thu'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
                {rows.map((row, idx) => {
                  const rank = (pagination.page - 1) * pagination.limit + idx + 1;
                  return (
                    <tr
                      key={`${row.id ?? 'orphan'}-${idx}`}
                      className="hover:bg-[#fcfaff] dark:hover:bg-[#231e2e] transition-colors"
                    >
                      <td className="py-3 px-3.5 font-bold text-[#7240b8] dark:text-[#a87ffb]">
                        {rank}
                      </td>
                      <td className="py-3 px-3.5">
                        <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
                          {row.label}
                        </p>
                        {row.id === null && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">
                            Đơn hàng mồ côi (không gắn khóa học)
                          </span>
                        )}
                      </td>
                      {isTeacher ? (
                        <td className="py-3 px-3.5 text-right font-medium text-[#1c192c] dark:text-[#f4eeff]">
                          {row.courseCount !== undefined ? fmt(row.courseCount) : '—'}
                        </td>
                      ) : (
                        <td className="py-3 px-3.5 text-[#635a72] dark:text-[#a9a0b2]">
                          {row.teacher?.name || '—'}
                        </td>
                      )}
                      <td className="py-3 px-3.5 text-right font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {fmt(row.completedOrders)}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <span className="font-semibold text-[#7240b8] dark:text-[#a87ffb]">
                          {fmt(row.paidOrders)}
                        </span>
                        <span className="text-[#8e849e] mx-1">/</span>
                        <span className="font-medium text-teal-600 dark:text-teal-400">
                          {fmt(row.freeOrders)}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {row.discount > 0 ? `- ${formatVND(row.discount)}` : '0 ₫'}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-[#1c192c] dark:text-[#f4eeff] whitespace-nowrap">
                        {formatVND(row.revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination */}
          {pagination.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-[#635a72] dark:text-[#a9a0b2]">
              <span>
                Tổng cộng{' '}
                <strong className="text-[#1c192c] dark:text-[#f4eeff]">{fmt(pagination.total)}</strong>{' '}
                {isTeacher ? 'giảng viên' : 'khóa học'} có doanh số
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  aria-label="Trang trước"
                  className="w-8 h-8 rounded-lg border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-center hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] font-semibold">
                  Trang {pagination.page} / {Math.max(1, pagination.totalPages)}
                </span>
                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  aria-label="Trang sau"
                  className="w-8 h-8 rounded-lg border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-center hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
