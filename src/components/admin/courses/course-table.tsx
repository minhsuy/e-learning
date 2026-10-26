'use client';

import React from 'react';
import Image from 'next/image';
import {
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  User,
  Tag,
  Clock,
  Trash2,
} from 'lucide-react';
import { AdminCourseItem } from '@/types/admin-course';
import { cn } from '@/lib/utils';

interface CourseTableProps {
  courses: AdminCourseItem[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onViewDetail: (course: AdminCourseItem) => void;
  onApprove: (course: AdminCourseItem) => void;
  onReject: (course: AdminCourseItem) => void;
  onDelete: (course: AdminCourseItem) => void;
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

export function CourseTable({
  courses,
  loading,
  error,
  onRetry,
  onViewDetail,
  onApprove,
  onReject,
  onDelete,
  onResetFilters,
  isFiltered = false,
}: CourseTableProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null || price === 0) {
      return 'Miễn phí';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusBadge = (status?: string) => {
    const norm = (status || '').toLowerCase();
    switch (norm) {
      case 'approved':
        return {
          label: 'Đã duyệt',
          icon: CheckCircle2,
          className:
            'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
          dot: 'bg-emerald-500',
        };
      case 'rejected':
        return {
          label: 'Bị từ chối',
          icon: XCircle,
          className:
            'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
          dot: 'bg-rose-500',
        };
      case 'pending':
      default:
        return {
          label: 'Chờ duyệt',
          icon: Clock,
          className:
            'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
          dot: 'bg-amber-500',
        };
    }
  };

  const getLevelBadge = (level?: string) => {
    const norm = (level || '').toLowerCase();
    switch (norm) {
      case 'beginner':
        return { label: 'Cơ bản', className: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200' };
      case 'intermediate':
        return { label: 'Trung cấp', className: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200' };
      case 'advanced':
        return { label: 'Nâng cao', className: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' };
      default:
        return { label: level || 'Mọi cấp độ', className: 'text-[#635a72] dark:text-[#a9a0b2] bg-gray-50 dark:bg-gray-800/40 border-gray-200' };
    }
  };

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-xs">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] animate-pulse"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-16 h-10 rounded-lg bg-[#f1ebff] dark:bg-[#2b2438] shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded w-1/3" />
                  <div className="h-3 bg-[#f1ebff] dark:bg-[#2b2438] rounded w-1/4" />
                </div>
              </div>
              <div className="h-6 w-24 bg-[#f1ebff] dark:bg-[#2b2438] rounded-full shrink-0" />
              <div className="h-6 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-full shrink-0" />
              <div className="h-7 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-12 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Không thể tải danh sách khóa học
          </h3>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1 max-w-md mx-auto">
            {error || 'Đã có lỗi xảy ra trong quá trình kết nối với máy chủ.'}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#7240b8] hover:bg-[#5f339d] transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử tải lại</span>
          </button>
        )}
      </div>
    );
  }

  // 3. Empty State
  if (courses.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-12 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mx-auto shadow-xs">
          <BookOpen className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            {isFiltered
              ? 'Không tìm thấy khóa học phù hợp'
              : 'Hệ thống chưa có khóa học nào'}
          </h3>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1 max-w-sm mx-auto">
            {isFiltered
              ? 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn các điều kiện lọc trạng thái, danh mục, giảng viên.'
              : 'Khi Giảng viên đăng tải khóa học mới, danh sách sẽ hiển thị tại đây để bạn kiểm duyệt.'}
          </p>
        </div>
        {isFiltered && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ede3ff] transition-colors"
          >
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>
    );
  }

  // 4. Data Table (Desktop) & Cards (Mobile)
  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-xs overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f] text-[11px] font-bold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider">
              <th className="py-3.5 px-5">Khóa học</th>
              <th className="py-3.5 px-4">Giảng viên</th>
              <th className="py-3.5 px-4">Danh mục</th>
              <th className="py-3.5 px-4">Giá bán</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4">Ngày tạo</th>
              <th className="py-3.5 px-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1ebff] dark:divide-[#2b2438] text-xs">
            {courses.map((course) => {
              const statusBadge = getStatusBadge(course.status);
              const levelBadge = getLevelBadge(course.level);
              const isPending = (course.status || '').toLowerCase() === 'pending';

              return (
                <tr
                  key={course.id || course._id}
                  className="hover:bg-[#fdf8ff] dark:hover:bg-[#1c1825] transition-colors"
                >
                  {/* Course Info */}
                  <td className="py-3.5 px-5 max-w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-center">
                        {course.image ? (
                          <Image
                            src={course.image}
                            alt={course.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <BookOpen className="w-5 h-5 text-[#7240b8] dark:text-[#a87ffb]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 leading-tight hover:text-[#7240b8] dark:hover:text-[#a87ffb] cursor-pointer"
                          onClick={() => onViewDetail(course)}
                          title={course.title}
                        >
                          {course.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded text-[10px] font-semibold border',
                              levelBadge.className
                            )}
                          >
                            {levelBadge.label}
                          </span>
                          {course.sold !== undefined && course.sold > 0 && (
                            <span className="text-[10px] text-[#635a72] dark:text-[#a9a0b2]">
                              • {course.sold} đã bán
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Teacher Info */}
                  <td className="py-3.5 px-4 text-[#635a72] dark:text-[#a9a0b2]">
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 flex items-center justify-center">
                        {course.author?.avatar ? (
                          <Image
                            src={course.author.avatar}
                            alt={course.author.username || 'Giảng viên'}
                            fill
                            sizes="28px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                          {course.author?.username || 'Chưa cập nhật'}
                        </p>
                        {course.author?.email && (
                          <p className="text-[10px] text-[#635a72] dark:text-[#a9a0b2] truncate max-w-[140px]">
                            {course.author.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]">
                      <Tag className="w-3 h-3" />
                      <span>{course.category?.name || 'Chung'}</span>
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        {formatPrice(course.price)}
                      </span>
                      {course.oldPrice && course.oldPrice > course.price && (
                        <span className="text-[10px] line-through text-[#635a72] dark:text-[#a9a0b2]">
                          {formatPrice(course.oldPrice)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border w-fit',
                          statusBadge.className
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusBadge.dot)} />
                        <span>{statusBadge.label}</span>
                      </span>
                      {course.rejectionReason && (
                        <p
                          className="text-[10px] text-rose-600 dark:text-rose-400 max-w-[170px] truncate"
                          title={`Lý do: ${course.rejectionReason}`}
                        >
                          Lý do: {course.rejectionReason}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="py-3.5 px-4 text-[#635a72] dark:text-[#a9a0b2]">
                    {formatDate(course.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Detail */}
                      <button
                        onClick={() => onViewDetail(course)}
                        data-testid={`view-course-btn-${course.id}`}
                        className="p-1.5 rounded-lg text-[#635a72] dark:text-[#a9a0b2] hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors"
                        title="Xem chi tiết & thẩm định giáo trình"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Quick Approve (Only for pending) */}
                      {isPending && (
                        <button
                          onClick={() => onApprove(course)}
                          data-testid={`approve-course-btn-${course.id}`}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="Phê duyệt khóa học"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Quick Reject (Only for pending) */}
                      {isPending && (
                        <button
                          onClick={() => onReject(course)}
                          data-testid={`reject-course-btn-${course.id || course._id}`}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Từ chối khóa học"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete Course (Admin can soft-delete any course) */}
                      <button
                        onClick={() => onDelete(course)}
                        data-testid={`delete-course-btn-${course.id || course._id}`}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa khóa học (Admin)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
        {courses.map((course) => {
          const statusBadge = getStatusBadge(course.status);
          const levelBadge = getLevelBadge(course.level);
          const isPending = (course.status || '').toLowerCase() === 'pending';

          return (
            <div key={course.id || course._id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-center">
                  {course.image ? (
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <BookOpen className="w-6 h-6 text-[#7240b8] dark:text-[#a87ffb]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                        statusBadge.className
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', statusBadge.dot)} />
                      <span>{statusBadge.label}</span>
                    </span>
                    {course.rejectionReason && (
                      <span
                        className="text-[10px] text-rose-600 dark:text-rose-400 max-w-[180px] truncate"
                        title={`Lý do: ${course.rejectionReason}`}
                      >
                        (Lý do: {course.rejectionReason})
                      </span>
                    )}
                  </div>

                  <h4
                    className="font-bold text-xs text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 leading-snug cursor-pointer"
                    onClick={() => onViewDetail(course)}
                  >
                    {course.title}
                  </h4>

                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                    GV: <strong>{course.author?.username || '—'}</strong>
                  </p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between text-[11px] text-[#635a72] dark:text-[#a9a0b2] pt-1">
                <span className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                  {formatPrice(course.price)}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
                  {course.category?.name || 'Chung'} • {levelBadge.label}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
                <button
                  type="button"
                  onClick={() => onViewDetail(course)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#ede3ff] transition-colors"
                >
                  Xem chi tiết
                </button>

                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => onReject(course)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 transition-colors"
                    >
                      Từ chối
                    </button>
                    <button
                      type="button"
                      onClick={() => onApprove(course)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      Duyệt
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => onDelete(course)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
