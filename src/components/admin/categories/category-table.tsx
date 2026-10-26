'use client';

import React from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  FolderTree,
  BookOpen,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { AdminCategoryItem } from '@/types/admin-category';

interface CategoryTableProps {
  categories: AdminCategoryItem[];
  courseCounts: Record<string, number | undefined>;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onViewDetail: (category: AdminCategoryItem) => void;
  onEdit: (category: AdminCategoryItem) => void;
  onDelete: (category: AdminCategoryItem) => void;
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

export function CategoryTable({
  categories,
  courseCounts,
  loading,
  error,
  onRetry,
  onViewDetail,
  onEdit,
  onDelete,
  onResetFilters,
  isFiltered = false,
}: CategoryTableProps) {
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

  // 1. Loading Skeleton State
  if (loading && categories.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-6 shadow-xs space-y-4">
        <div className="h-4 w-48 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 w-full bg-[#fdf8ff] dark:bg-[#17141f] rounded-xl border border-[#f1ebff] dark:border-[#2b2438] animate-pulse flex items-center px-4 justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f1ebff] dark:bg-[#2b2438]" />
                <div className="space-y-1.5">
                  <div className="w-36 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-sm" />
                  <div className="w-24 h-3 bg-[#f1ebff] dark:bg-[#2b2438] rounded-sm" />
                </div>
              </div>
              <div className="w-20 h-6 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md hidden sm:block" />
              <div className="w-24 h-8 bg-[#f1ebff] dark:bg-[#2b2438] rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error && categories.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-rose-200 dark:border-rose-900/40 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1">
          Lỗi tải danh mục khóa học
        </h3>
        <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto mb-6">
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#7240b8] hover:bg-[#60359d] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Thử lại
          </button>
        )}
      </div>
    );
  }

  // 3. Empty State
  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-8 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mx-auto mb-4">
          <FolderTree className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1">
          {isFiltered ? 'Không tìm thấy danh mục phù hợp' : 'Chưa có danh mục nào'}
        </h3>
        <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto mb-6">
          {isFiltered
            ? 'Hãy thử tìm kiếm với từ khóa khác hoặc đặt lại bộ lọc tìm kiếm.'
            : 'Hệ thống hiện tại chưa có danh mục khóa học nào. Hãy nhấn Thêm danh mục để tạo mới.'}
        </p>
        {isFiltered && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ebdfff] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Đặt lại bộ lọc
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ========================================================
          DESKTOP TABLE (Hidden on Mobile)
         ======================================================== */}
      <div className="hidden lg:block bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f] text-[11px] font-bold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider">
                <th className="py-3.5 px-4">Tên danh mục & Đường dẫn (Slug)</th>
                <th className="py-3.5 px-4 min-w-[200px]">Mô tả</th>
                <th className="py-3.5 px-4 text-center">Khóa học</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Ngày tạo</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1ebff] dark:divide-[#2b2438] text-xs">
              {categories.map((category) => {
                const catId = category.id || category._id || '';
                const courseCount = courseCounts[catId];
                const isDestroyed = !!category.isDestroyed;

                return (
                  <tr
                    key={catId}
                    className="hover:bg-[#fcfaff] dark:hover:bg-[#221c2e] transition-colors group"
                  >
                    {/* Category Name & Slug */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 border border-[#7240b8]/10">
                          <FolderTree className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
                            {category.name}
                          </div>
                          <div className="text-[11px] font-mono text-[#7240b8] dark:text-[#a87ffb] flex items-center gap-1 mt-0.5">
                            <span>/{category.slug}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-[#635a72] dark:text-[#a9a0b2]">
                      <span className="line-clamp-2 max-w-sm">
                        {category.description || (
                          <span className="text-muted-foreground/60 italic">
                            Chưa có mô tả chi tiết
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Course Count */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 font-semibold text-[11px]">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          {courseCount !== undefined ? (
                            `${courseCount} khóa`
                          ) : (
                            <span className="inline-block w-4 h-3 bg-indigo-200 dark:bg-indigo-800 rounded-xs animate-pulse" />
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {isDestroyed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                          Đã xóa mềm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" />
                          Hoạt động
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-center text-[#635a72] dark:text-[#a9a0b2] text-[11px]">
                      {formatDate(category.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Detail */}
                        <button
                          type="button"
                          onClick={() => onViewDetail(category)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#635a72] dark:text-[#a9a0b2] hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors"
                          title="Xem chi tiết danh mục"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Category */}
                        <button
                          type="button"
                          onClick={() => onEdit(category)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Chỉnh sửa danh mục"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Category */}
                        <button
                          type="button"
                          onClick={() => onDelete(category)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Xóa danh mục"
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
      </div>

      {/* ========================================================
          MOBILE / TABLET CARDS (Shown on screens < lg)
         ======================================================== */}
      <div className="lg:hidden space-y-3">
        {categories.map((category) => {
          const catId = category.id || category._id || '';
          const courseCount = courseCounts[catId];
          const isDestroyed = !!category.isDestroyed;

          return (
            <div
              key={catId}
              className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-4 shadow-xs space-y-3"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 border border-[#7240b8]/10">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#1c192c] dark:text-[#f4eeff]">
                      {category.name}
                    </h4>
                    <p className="text-[11px] font-mono text-[#7240b8] dark:text-[#a87ffb]">
                      /{category.slug}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {isDestroyed ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200">
                    Đã xóa mềm
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                    Hoạt động
                  </span>
                )}
              </div>

              {/* Description */}
              {category.description && (
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] line-clamp-2">
                  {category.description}
                </p>
              )}

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-[#f1ebff] dark:border-[#2b2438]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {courseCount !== undefined ? `${courseCount} khóa học` : '...'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fdf8ff] dark:bg-[#17141f] text-[#635a72] dark:text-[#a9a0b2] text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(category.createdAt)}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
                <button
                  type="button"
                  onClick={() => onViewDetail(category)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ebdfff] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Chi tiết</span>
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(category)}
                  className="p-2 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors"
                  title="Sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(category)}
                  className="p-2 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
