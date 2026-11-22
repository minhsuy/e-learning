'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Star,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import {
  TeacherCoursesStatsData,
  TeacherOverviewCourses,
} from '@/types/teacher-statistics';
import { formatTeacherVND } from '@/lib/teacher-analytics';
import { cn } from '@/lib/utils';

export type TeacherCoursesSortBy = 'revenue' | 'students' | 'rating' | 'createdAt';
export type TeacherCourseStatusFilter = 'all' | 'approved' | 'pending' | 'rejected';

interface TeacherCoursesRankingProps {
  data: TeacherCoursesStatsData | null;
  overviewCourses?: TeacherOverviewCourses | null;
  loading: boolean;
  error: string | null;
  statusFilter: TeacherCourseStatusFilter;
  sortBy: TeacherCoursesSortBy;
  selectedCourseId: string;
  onStatusFilterChange: (status: TeacherCourseStatusFilter) => void;
  onSortByChange: (sortBy: TeacherCoursesSortBy) => void;
  onPageChange: (page: number) => void;
  onSelectCourseForPerformance: (courseId: string) => void;
  onRetry: () => void;
}

function fmt(n: number | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(n ?? 0);
}

function getCourseStatusBadge(status: string): { label: string; className: string } {
  switch (status?.toLowerCase()) {
    case 'approved':
      return {
        label: 'Đã duyệt',
        className: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
      };
    case 'pending':
      return {
        label: 'Chờ duyệt',
        className: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
      };
    case 'rejected':
      return {
        label: 'Từ chối',
        className: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
      };
    default:
      return {
        label: status || 'Khác',
        className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      };
  }
}

export function TeacherCoursesRanking({
  data,
  overviewCourses,
  loading,
  error,
  statusFilter,
  sortBy,
  selectedCourseId,
  onStatusFilterChange,
  onSortByChange,
  onPageChange,
  onSelectCourseForPerformance,
  onRetry,
}: TeacherCoursesRankingProps) {
  const courses = data?.courses ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 };
  const maxRevenue = Math.max(...courses.map((c) => c.totalRevenue), 1);

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Hiệu suất &amp; Xếp hạng Khóa học của tôi
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Doanh số ghi nhận, lượt mua trả phí / miễn phí, học viên và đánh giá theo từng khóa học
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Lọc trạng thái khóa học"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as TeacherCourseStatusFilter)}
            disabled={loading}
            className="h-8 px-2.5 rounded-lg bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] cursor-pointer"
          >
            <option value="all">
              Tất cả trạng thái{overviewCourses ? ` (${overviewCourses.total})` : ''}
            </option>
            <option value="approved">
              Đã duyệt{overviewCourses ? ` (${overviewCourses.approved})` : ''}
            </option>
            <option value="pending">
              Chờ duyệt{overviewCourses ? ` (${overviewCourses.pending})` : ''}
            </option>
            <option value="rejected">
              Bị từ chối{overviewCourses ? ` (${overviewCourses.rejected})` : ''}
            </option>
          </select>

          <div className="inline-flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <select
              aria-label="Sắp xếp bảng xếp hạng khóa học"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as TeacherCoursesSortBy)}
              disabled={loading}
              className="h-8 px-2.5 rounded-lg bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] cursor-pointer"
            >
              <option value="revenue">Doanh thu (cao → thấp)</option>
              <option value="students">Số học viên</option>
              <option value="rating">Đánh giá trung bình</option>
              <option value="createdAt">Ngày tạo mới nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Status Summary Pills */}
      {overviewCourses && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-full font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]">
            Tổng khóa học: {fmt(overviewCourses.total)}
          </span>
          <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
            Đã duyệt: {fmt(overviewCourses.approved)}
          </span>
          <span className="px-2.5 py-1 rounded-full font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
            Chờ duyệt: {fmt(overviewCourses.pending)}
          </span>
          <span className="px-2.5 py-1 rounded-full font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
            Từ chối: {fmt(overviewCourses.rejected)}
          </span>
        </div>
      )}

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
      ) : loading && courses.length === 0 ? (
        <div className="space-y-3 py-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="py-10 text-center rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-dashed border-[#e6dffa] dark:border-[#2b2438] text-xs text-[#635a72] dark:text-[#a9a0b2]">
          Không có khóa học nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <>
          {/* Top 5 Horizontal Sales Comparison Bar Chart */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c7483] dark:text-[#968e9e]">
              Top {Math.min(courses.length, 5)} khóa học theo doanh số (trang hiện tại)
            </p>
            <div className="space-y-2">
              {courses.slice(0, 5).map((course, idx) => {
                const widthPct =
                  maxRevenue > 0
                    ? Math.max((course.totalRevenue / maxRevenue) * 100, course.totalRevenue > 0 ? 4 : 0)
                    : 0;
                const rank = (pagination.page - 1) * pagination.limit + idx + 1;
                return (
                  <div key={course.id || course._id || idx} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-[#1c192c] dark:text-[#f4eeff]">
                        <span className="inline-block w-5 font-bold text-[#7240b8] dark:text-[#a87ffb]">
                          #{rank}
                        </span>
                        {course.title}
                      </span>
                      <span className="font-bold text-[#1c192c] dark:text-[#f4eeff] shrink-0">
                        {formatTeacherVND(course.totalRevenue)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#ece5fa] dark:bg-[#2b2438] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#7240b8] transition-all duration-300"
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
                  <th className="py-3 px-3.5">Khóa học</th>
                  <th className="py-3 px-3.5">Trạng thái</th>
                  <th className="py-3 px-3.5 text-right">Học viên</th>
                  <th className="py-3 px-3.5 text-right">Trả phí / Miễn phí</th>
                  <th className="py-3 px-3.5 text-right">Đánh giá</th>
                  <th className="py-3 px-3.5 text-right">Doanh thu</th>
                  <th className="py-3 px-3.5 text-right">Phân tích</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
                {courses.map((course, idx) => {
                  const id = course.id || course._id || '';
                  const rank = (pagination.page - 1) * pagination.limit + idx + 1;
                  const badge = getCourseStatusBadge(course.status);
                  const isSelected = selectedCourseId === id;

                  return (
                    <tr
                      key={id || idx}
                      className={cn(
                        'hover:bg-[#fcfaff] dark:hover:bg-[#231e2e] transition-colors',
                        isSelected && 'bg-[#f7f1ff]/60 dark:bg-[#2b2438]/60'
                      )}
                    >
                      <td className="py-3 px-3.5 font-bold text-[#7240b8] dark:text-[#a87ffb]">
                        {rank}
                      </td>
                      <td className="py-3 px-3.5 max-w-[260px]">
                        <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
                          {course.title}
                        </p>
                        <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299]">
                          Giá niêm yết: {formatTeacherVND(course.price)}
                        </p>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap',
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {fmt(course.totalStudents)}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        {course.paidOrders !== undefined || course.freeOrders !== undefined ? (
                          <>
                            <span className="font-semibold text-[#7240b8] dark:text-[#a87ffb]">
                              {fmt(course.paidOrders)}
                            </span>
                            <span className="text-[#8e849e] mx-1">/</span>
                            <span className="font-medium text-teal-600 dark:text-teal-400">
                              {fmt(course.freeOrders)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#635a72] dark:text-[#a9a0b2]">
                            {fmt(course.completedOrders)} đơn
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        {course.totalReviews > 0 ? (
                          <span className="inline-flex items-center justify-end gap-1 font-semibold text-amber-600 dark:text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{course.averageRating.toFixed(1)}</span>
                            <span className="text-[10px] text-[#8e849e]">({course.totalReviews})</span>
                          </span>
                        ) : (
                          <span className="text-[#8e849e]">Chưa có</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-[#1c192c] dark:text-[#f4eeff] whitespace-nowrap">
                        {formatTeacherVND(course.totalRevenue)}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectCourseForPerformance(id)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border',
                              isSelected
                                ? 'bg-[#7240b8] text-white border-[#7240b8]'
                                : 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border-[#7240b8]/20 hover:bg-[#ede5fa]'
                            )}
                          >
                            <BarChart3 className="w-3 h-3" />
                            <span>Xem nhanh</span>
                          </button>
                          <Link
                            href={`/teacher/courses/${id}/performance`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#17141f] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] border border-[#f1ebff] dark:border-[#2b2438] transition-colors"
                            title="Mở trang phân tích hiệu suất chi tiết"
                          >
                            <span>Chi tiết</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
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
                Hiển thị trang <strong>{pagination.page}</strong> /{' '}
                <strong>{Math.max(1, pagination.totalPages)}</strong> — Tổng{' '}
                <strong className="text-[#1c192c] dark:text-[#f4eeff]">{fmt(pagination.total)}</strong> khóa học
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
