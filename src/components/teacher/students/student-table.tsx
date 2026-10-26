'use client';

import React from 'react';
import {
  Search,
  X,
  Users,
  Eye,
  UserX,
  Mail,
  Calendar,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CourseStudentItem } from '@/types/enrollment';
import { StudentStatusBadge } from './student-status-badge';

interface StudentTableProps {
  students: CourseStudentItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (newPage: number) => void;
  onRefresh: () => void;
  onViewDetail: (student: CourseStudentItem) => void;
  onRemoveStudent: (student: CourseStudentItem) => void;
}

export function StudentTable({
  students,
  isLoading,
  isError,
  errorMessage,
  searchTerm,
  onSearchChange,
  pagination,
  onPageChange,
  onRefresh,
  onViewDetail,
  onRemoveStudent,
}: StudentTableProps) {
  return (
    <div className="space-y-4">
      {/* Search & Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] shadow-xs">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên học viên hoặc email..."
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Counter & Stats */}
        <div className="flex items-center gap-2 text-xs text-[#635a72] dark:text-[#a9a0b2] shrink-0">
          <span className="font-medium">
            {searchTerm ? (
              <>
                Kết quả tìm kiếm:{' '}
                <span className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                  {pagination.total}
                </span>{' '}
                học viên
              </>
            ) : (
              <>
                Tổng cộng:{' '}
                <span className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                  {pagination.total}
                </span>{' '}
                học viên
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] shadow-xs overflow-hidden">
        {/* Error State */}
        {isError && (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/40">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Không thể tải danh sách học viên
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {errorMessage || 'Đã có lỗi xảy ra trong quá trình nạp dữ liệu từ máy chủ.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading && !isError && (
          <div className="p-4 space-y-3 animate-pulse">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-50 dark:bg-[#252030] rounded-xl border border-slate-100 dark:border-slate-800"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && students.length === 0 && (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {searchTerm ? 'Không tìm thấy học viên' : 'Chưa có học viên ghi danh'}
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                {searchTerm
                  ? `Không có học viên nào khớp với từ khóa "${searchTerm}". Vui lòng thử từ khóa khác.`
                  : 'Khóa học này hiện chưa có học viên nào đăng ký. Danh sách sẽ xuất hiện ngay khi có học viên ghi danh.'}
              </p>
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa từ khóa tìm kiếm</span>
              </button>
            )}
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !isError && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#eceaf3] dark:border-[#352e43] bg-[#fdf8ff] dark:bg-[#221c2d] text-[11px] font-bold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Học viên</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Ngày đăng ký</th>
                  <th className="py-3.5 px-4">Tiến độ</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceaf3] dark:divide-[#352e43] text-xs">
                {students.map((student, idx) => {
                  const studentId = student.id || student._id || `s-${idx}`;
                  const username = student.user?.username || 'Học viên';
                  const email = student.user?.email || 'Chưa có email';
                  const avatar = student.user?.avatar;
                  const progress = typeof student.progress === 'number' ? student.progress : 0;
                  const userId = student.userId || student.user?.id || student.user?._id || '';

                  // Format enrollment date
                  let dateFormatted = 'Không rõ';
                  const rawDate = student.enrolledAt || student.createdAt;
                  if (rawDate) {
                    try {
                      const d = new Date(rawDate);
                      dateFormatted = new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }).format(d);
                    } catch {
                      dateFormatted = rawDate;
                    }
                  }

                  // Progress Bar color
                  const progressColor =
                    progress >= 80
                      ? 'bg-emerald-500'
                      : progress >= 40
                      ? 'bg-[#7240b8] dark:bg-[#a87ffb]'
                      : 'bg-amber-500';

                  return (
                    <tr
                      key={studentId}
                      className="hover:bg-[#f7f1ff]/40 dark:hover:bg-[#252030] transition-colors group"
                    >
                      {/* Column 1: Student Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-[#f0e6ff] dark:bg-[#342a45] text-[#7240b8] dark:text-[#c4a4fc] flex items-center justify-center font-bold text-xs shrink-0 border border-[#e2d5f8] dark:border-[#4d3c67]">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[#1c192c] dark:text-[#f4eeff] hover:text-[#7240b8] transition-colors truncate block">
                              {username}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate block">
                              {userId ? `ID: ${userId.slice(0, 8)}...` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs truncate max-w-[220px]">{email}</span>
                        </div>
                      </td>

                      {/* Column 3: Enrolled Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dateFormatted}</span>
                        </div>
                      </td>

                      {/* Column 4: Progress */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 5: Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <StudentStatusBadge status={student.status} />
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => onViewDetail(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#7240b8] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors"
                            title="Xem chi tiết ghi danh"
                            aria-label={`Xem chi tiết ghi danh của ${username}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Gỡ học viên */}
                          <button
                            type="button"
                            onClick={() => onRemoveStudent(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Gỡ học viên khỏi khóa học"
                            aria-label={`Gỡ học viên ${username} khỏi khóa học`}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && !isError && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#eceaf3] dark:border-[#352e43] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#635a72] dark:text-[#a9a0b2]">
            <div>
              Trang <span className="font-semibold">{pagination.page}</span> /{' '}
              <span className="font-semibold">{pagination.totalPages}</span> (Tổng cộng{' '}
              <span className="font-semibold">{pagination.total}</span> học viên)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-[#eceaf3] dark:border-[#352e43] text-slate-600 dark:text-slate-300 hover:bg-[#f7f1ff] dark:hover:bg-[#282234] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // If lots of pages, only show around current
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    Math.abs(pageNum - pagination.page) <= 1
                  ) {
                    const isCurrent = pageNum === pagination.page;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => onPageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          isCurrent
                            ? 'bg-[#7240b8] text-white shadow-xs'
                            : 'border border-[#eceaf3] dark:border-[#352e43] text-slate-700 dark:text-slate-300 hover:bg-[#f7f1ff] dark:hover:bg-[#282234]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                    return (
                      <span key={pageNum} className="px-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg border border-[#eceaf3] dark:border-[#352e43] text-slate-600 dark:text-slate-300 hover:bg-[#f7f1ff] dark:hover:bg-[#282234] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
