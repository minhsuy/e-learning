'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, X, AlertTriangle, Loader2, BookOpen, FolderTree } from 'lucide-react';
import { AdminCategoryItem } from '@/types/admin-category';
import { adminCategoryService, normalizeCategoryApiError } from '@/services/admin-category.service';
import { toast } from '@/lib/toast';

interface DeleteCategoryModalProps {
  category: AdminCategoryItem | null;
  courseCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export function DeleteCategoryModal({
  category,
  courseCount = 0,
  isOpen,
  onClose,
  onSuccess,
}: DeleteCategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !category) return null;

  const categoryId = category.id || category._id;

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!categoryId || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await adminCategoryService.deleteCategory(categoryId);
      toast.success(res?.message || `Đã xóa danh mục "${category.name}" thành công!`);
      onSuccess(categoryId);
      onClose();
    } catch (err: unknown) {
      const msg = normalizeCategoryApiError(err, 'Không thể xóa danh mục. Vui lòng thử lại sau.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="delete-category-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Xác nhận xóa danh mục
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Thao tác xóa mềm (Soft-delete) trong cơ sở dữ liệu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#635a72] dark:text-[#a9a0b2] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Category Preview Card */}
          <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
              <FolderTree className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Danh mục sẽ bị xóa:
              </p>
              <h4 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                {category.name}
              </h4>
              <p className="text-[11px] font-mono text-[#7240b8] dark:text-[#a87ffb]">
                /{category.slug}
              </p>
            </div>
          </div>

          {/* Courses Association Warning */}
          {courseCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Cảnh báo liên kết khóa học ({courseCount} khóa)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                Hiện có <strong>{courseCount}</strong> khóa học đang được phân loại vào danh mục này. Danh mục sẽ chuyển trạng thái ẩn khỏi bộ lọc công khai.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] leading-relaxed">
              Danh mục này hiện chưa có khóa học nào liên kết. Thao tác xóa mềm sẽ đưa trạng thái danh mục về ẩn.
            </p>
          )}

          <div className="text-xs text-muted-foreground">
            Bạn có chắc chắn muốn tiếp tục không?
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
