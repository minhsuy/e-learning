'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  X,
  FolderTree,
  Calendar,
  BookOpen,
  Edit2,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react';
import { AdminCategoryItem } from '@/types/admin-category';
import { AdminCourseItem } from '@/types/admin-course';
import { adminCategoryService } from '@/services/admin-category.service';

interface CategoryDetailModalProps {
  category: AdminCategoryItem | null;
  courseCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (category: AdminCategoryItem) => void;
  onDelete?: (category: AdminCategoryItem) => void;
}

export function CategoryDetailModal({
  category,
  courseCount,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: CategoryDetailModalProps) {
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [totalCourses, setTotalCourses] = useState<number>(courseCount ?? 0);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load associated courses
  useEffect(() => {
    if (!isOpen || !category) return;

    const categoryId = category.id || category._id;
    if (!categoryId) return;

    let isMounted = true;

    const loadCategoryCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await adminCategoryService.getCategoryCourses(categoryId, 5);
        if (isMounted) {
          setCourses(res.data.courses || []);
          if (res.data.pagination?.total !== undefined) {
            setTotalCourses(res.data.pagination.total);
          }
        }
      } catch {
        if (isMounted) setCourses([]);
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    };

    void loadCategoryCourses();

    return () => {
      isMounted = false;
    };
  }, [isOpen, category]);

  if (!isOpen || !category) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isDestroyed = !!category.isDestroyed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-detail-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 border border-[#7240b8]/20">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="category-detail-title"
                  className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
                >
                  {category.name}
                </h3>
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
              <p className="text-xs font-mono text-[#7240b8] dark:text-[#a87ffb]">
                /{category.slug}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#635a72] dark:text-[#a9a0b2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block mb-1">
                Tổng khóa học
              </span>
              <div className="flex items-center gap-1.5 font-bold text-sm text-[#1c192c] dark:text-[#f4eeff]">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>{totalCourses} khóa</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block mb-1">
                Ngày tạo
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                <Calendar className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>{formatDate(category.createdAt)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] col-span-2 sm:col-span-1">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block mb-1">
                Cập nhật lần cuối
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                <Clock className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>{formatDate(category.updatedAt || category.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Description Block */}
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1.5">
            <h4 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Mô tả chuyên ngành
            </h4>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] leading-relaxed whitespace-pre-line">
              {category.description || (
                <span className="text-muted-foreground/60 italic">
                  Chưa có mô tả chi tiết cho danh mục này.
                </span>
              )}
            </p>
          </div>

          {/* Associated Courses Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>Khóa học liên kết ({totalCourses})</span>
              </h4>
              {totalCourses > 5 && (
                <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                  Hiển thị 5 khóa tiêu biểu
                </span>
              )}
            </div>

            {loadingCourses ? (
              <div className="p-6 text-center text-xs text-[#635a72] dark:text-[#a9a0b2] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#7240b8]" />
                <span>Đang tải danh sách khóa học...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-muted-foreground">
                Chưa có khóa học nào thuộc danh mục này.
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between gap-3 hover:border-[#7240b8]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {course.image ? (
                        <div className="relative w-12 h-8 rounded-lg overflow-hidden shrink-0 border border-black/5">
                          <Image
                            src={course.image}
                            alt={course.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-8 rounded-lg bg-[#f1ebff] dark:bg-[#2b2438] flex items-center justify-center shrink-0 text-[#7240b8]">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                          {course.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                          <span>{course.author?.username || 'Giảng viên'}</span>
                          <span>•</span>
                          <span className="capitalize">{course.level || 'Cơ bản'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] shrink-0">
                      {course.status === 'approved'
                        ? 'Đã duyệt'
                        : course.status === 'pending'
                        ? 'Chờ duyệt'
                        : 'Từ chối'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f] shrink-0">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(category);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa danh mục</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Đóng
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(category);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
