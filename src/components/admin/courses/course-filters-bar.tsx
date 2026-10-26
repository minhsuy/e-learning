'use client';

import React, { useEffect, useState } from 'react';
import { Search, X, Filter, RotateCcw, User, Tag } from 'lucide-react';
import { categoryService } from '@/services/category.service';
import { adminUserService } from '@/services/admin-user.service';
import { Category } from '@/types/category';
import { AdminUserItem } from '@/types/admin-user';
import { cn } from '@/lib/utils';

interface CourseFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  category: string;
  onCategoryChange: (categoryId: string) => void;
  author: string;
  onAuthorChange: (authorId: string) => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  totalFiltered?: number;
}

export function CourseFiltersBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  author,
  onAuthorChange,
  onResetFilters,
  isFiltered,
  totalFiltered,
}: CourseFiltersBarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teachers, setTeachers] = useState<AdminUserItem[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Sync external search value changes during render
  if (search !== prevSearch) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  // Debounce search 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, search]);

  // Load categories and teachers for select dropdowns
  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      categoryService.getCategories({ limit: 100 }),
      adminUserService.getUsers({ role: 'teacher', limit: 100 }),
    ]).then(([catRes, teacherRes]) => {
      if (!isMounted) return;
      if (catRes.status === 'fulfilled' && catRes.value?.data?.categories) {
        setCategories(catRes.value.data.categories);
      }
      if (teacherRes.status === 'fulfilled' && teacherRes.value?.data?.users) {
        setTeachers(teacherRes.value.data.users);
      }
      setLoadingFilters(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ duyệt (Pending)' },
    { value: 'approved', label: 'Đã duyệt (Approved)' },
    { value: 'rejected', label: 'Bị từ chối (Rejected)' },
  ];

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Search & Status Quick Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#635a72] dark:text-[#a9a0b2] pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề khóa học..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#635a72]/60 dark:placeholder:text-[#a9a0b2]/60 focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 transition-all"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#635a72] hover:text-[#1c192c] dark:text-[#a9a0b2] dark:hover:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/10"
              title="Xóa từ khóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Pills for fast desktop switching */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] overflow-x-auto shrink-0">
          {statusOptions.map((opt) => {
            const isSelected = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150',
                  isSelected
                    ? 'bg-[#7240b8] text-white shadow-xs'
                    : 'text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                )}
              >
                {opt.label.split(' (')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Dropdown Filters (Category & Teacher) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <span className="text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Bộ lọc chi tiết:
          </span>

          {/* Category Select */}
          <div className="relative min-w-[160px] max-w-[220px]">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2] pointer-events-none" />
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              disabled={loadingFilters}
              className="w-full h-8.5 pl-8.5 pr-8 rounded-lg bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-1 focus:ring-[#7240b8]/40 transition-colors cursor-pointer truncate"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id || cat._id} value={cat.id || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Select */}
          <div className="relative min-w-[170px] max-w-[240px]">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2] pointer-events-none" />
            <select
              value={author}
              onChange={(e) => onAuthorChange(e.target.value)}
              disabled={loadingFilters}
              className="w-full h-8.5 pl-8.5 pr-8 rounded-lg bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-1 focus:ring-[#7240b8]/40 transition-colors cursor-pointer truncate"
            >
              <option value="all">Tất cả giảng viên</option>
              {teachers.map((tc) => (
                <option key={tc.id || tc._id} value={tc.id || tc._id}>
                  {tc.username} {tc.email ? `(${tc.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset & Status counter */}
        <div className="flex items-center gap-3 shrink-0">
          {totalFiltered !== undefined && (
            <span className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Tìm thấy <strong className="text-[#1c192c] dark:text-[#f4eeff]">{totalFiltered}</strong> khóa học
            </span>
          )}

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors border border-rose-200 dark:border-rose-800/40"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
