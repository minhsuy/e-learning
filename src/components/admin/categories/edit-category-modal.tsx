'use client';

import React, { useEffect, useState } from 'react';
import { X, Edit2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { AdminCategoryItem } from '@/types/admin-category';
import { adminCategoryService, slugifyVietnamese, normalizeCategoryApiError } from '@/services/admin-category.service';
import { toast } from '@/lib/toast';

interface EditCategoryModalProps {
  category: AdminCategoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCategory?: Partial<AdminCategoryItem>) => void;
}

function EditCategoryForm({
  category,
  onClose,
  onSuccess,
}: {
  category: AdminCategoryItem;
  onClose: () => void;
  onSuccess: (updatedCategory?: Partial<AdminCategoryItem>) => void;
}) {
  const [name, setName] = useState(category.name || '');
  const [slug, setSlug] = useState(category.slug || '');
  const [description, setDescription] = useState(category.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose]);

  const categoryId = category.id || category._id;

  const handleRegenerateSlug = () => {
    if (name.trim()) {
      setSlug(slugifyVietnamese(name.trim()));
    }
  };

  const trimmedName = name.trim();
  const trimmedSlug = slug.trim();
  const trimmedDesc = description.trim();

  const isNameChanged = trimmedName !== (category.name || '').trim();
  const isSlugChanged = trimmedSlug !== (category.slug || '').trim();
  const isDescChanged = trimmedDesc !== (category.description || '').trim();
  const hasChanges = isNameChanged || isSlugChanged || isDescChanged;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;

    if (!hasChanges) {
      setError('Bạn chưa thay đổi thông tin nào của danh mục.');
      return;
    }

    if (!trimmedName) {
      setError('Tên danh mục không được để trống.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Tên danh mục phải có ít nhất 2 ký tự.');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Tên danh mục không được vượt quá 100 ký tự.');
      return;
    }
    if (!trimmedSlug) {
      setError('Đường dẫn (slug) không được để trống.');
      return;
    }
    if (trimmedDesc.length > 500) {
      setError('Mô tả danh mục không được vượt quá 500 ký tự.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminCategoryService.updateCategory(categoryId, {
        name: trimmedName,
        slug: trimmedSlug,
        description: trimmedDesc || undefined,
      });

      toast.success(res?.message || `Cập nhật danh mục "${trimmedName}" thành công!`);
      onSuccess({
        id: categoryId,
        name: trimmedName,
        slug: trimmedSlug,
        description: trimmedDesc || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = normalizeCategoryApiError(err, 'Không thể cập nhật danh mục. Vui lòng kiểm tra lại.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-category-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/40 dark:border-blue-800/40">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="edit-category-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Chỉnh sửa danh mục
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Cập nhật tên danh mục, đường dẫn URL hoặc mô tả chuyên ngành
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#635a72] dark:text-[#a9a0b2] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-category-name"
              className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
            >
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên danh mục..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              required
            />
          </div>

          {/* Slug Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-category-slug"
                className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Đường dẫn (Slug) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleRegenerateSlug}
                className="text-[11px] font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline flex items-center gap-1"
                title="Tạo lại slug từ tên hiện tại"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tạo lại theo tên</span>
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground select-none">
                /
              </span>
              <input
                id="edit-category-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug-danh-muc"
                disabled={loading}
                className="w-full pl-7 pr-3.5 py-2.5 rounded-xl text-xs font-mono bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                required
              />
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-category-description"
              className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
            >
              Mô tả chi tiết <span className="text-xs font-normal text-muted-foreground">(Tùy chọn)</span>
            </label>
            <textarea
              id="edit-category-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nội dung chuyên ngành..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f1ebff] dark:border-[#2b2438]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !slug.trim() || !hasChanges}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditCategoryModal({
  category,
  isOpen,
  onClose,
  onSuccess,
}: EditCategoryModalProps) {
  if (!isOpen || !category) return null;
  const key = category.id || category._id || 'edit-category';
  return (
    <EditCategoryForm
      key={key}
      category={category}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
