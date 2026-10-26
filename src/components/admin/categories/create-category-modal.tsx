'use client';

import React, { useEffect, useState } from 'react';
import { X, FolderPlus, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { adminCategoryService, slugifyVietnamese, normalizeCategoryApiError } from '@/services/admin-category.service';
import { toast } from '@/lib/toast';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateCategoryForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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

  const generatedSlug = slugifyVietnamese(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      setError('Vui lòng nhập tên danh mục.');
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
    if (trimmedDesc.length > 500) {
      setError('Mô tả danh mục không được vượt quá 500 ký tự.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminCategoryService.createCategory({
        name: trimmedName,
        description: trimmedDesc || undefined,
      });

      toast.success(res?.message || `Đã tạo danh mục "${trimmedName}" thành công!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = normalizeCategoryApiError(err, 'Không thể tạo danh mục. Vui lòng thử lại sau.');
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
        aria-labelledby="create-category-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 border border-[#7240b8]/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="create-category-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Thêm danh mục mới
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Tạo danh mục mới để phân loại các khóa học trong hệ thống
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
              htmlFor="category-name"
              className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
            >
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Lập trình Mobile Flutter, AI & Data Science..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#635a72]/60 dark:placeholder:text-[#a9a0b2]/60 focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] focus:ring-2 focus:ring-[#7240b8]/10 transition-all"
              required
            />
          </div>

          {/* Slug Preview */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2]">
              Đường dẫn (Slug tự động tạo)
            </label>
            <div className="px-3.5 py-2 rounded-xl text-xs font-mono bg-[#f7f1ff] dark:bg-[#2b2438] border border-[#7240b8]/10 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-between">
              <span>/{generatedSlug || 'chua-co-ten'}</span>
              <Sparkles className="w-3.5 h-3.5 opacity-60" />
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="category-description"
              className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
            >
              Mô tả chi tiết <span className="text-xs font-normal text-muted-foreground">(Tùy chọn)</span>
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nội dung, công nghệ hoặc định hướng các khóa học thuộc danh mục này..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#635a72]/60 dark:placeholder:text-[#a9a0b2]/60 focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] focus:ring-2 focus:ring-[#7240b8]/10 transition-all resize-none"
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
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#7240b8] hover:bg-[#60359d] dark:bg-[#7240b8] dark:hover:bg-[#834ecc] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <span>Tạo danh mục</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCategoryModalProps) {
  if (!isOpen) return null;
  return <CreateCategoryForm onClose={onClose} onSuccess={onSuccess} />;
}
