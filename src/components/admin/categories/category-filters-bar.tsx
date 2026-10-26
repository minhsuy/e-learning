'use client';

import React, { useEffect, useState } from 'react';
import { Search, X, RotateCcw, Plus, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
  isFiltered: boolean;
  totalFiltered?: number;
  loading?: boolean;
}

export function CategoryFiltersBar({
  search,
  onSearchChange,
  onResetFilters,
  onRefresh,
  onOpenCreate,
  isFiltered,
  totalFiltered,
  loading = false,
}: CategoryFiltersBarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

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

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#635a72] dark:text-[#a9a0b2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên danh mục, mô tả..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#635a72]/60 dark:placeholder:text-[#a9a0b2]/60 focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] focus:ring-2 focus:ring-[#7240b8]/10 transition-all"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Reset button if active search */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] border border-[#f1ebff] dark:border-[#2b2438] transition-colors"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] border border-[#f1ebff] dark:border-[#2b2438] transition-colors"
            title="Làm mới danh sách"
            aria-label="Làm mới danh sách"
          >
            <RotateCcw className={cn('w-4 h-4', loading && 'animate-spin text-[#7240b8]')} />
          </button>

          {/* Create Category Button */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7240b8] hover:bg-[#60359d] dark:bg-[#7240b8] dark:hover:bg-[#834ecc] shadow-xs hover:shadow-md transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm danh mục</span>
          </button>
        </div>
      </div>

      {/* Filter summary badge if search active */}
      {isFiltered && (
        <div className="flex items-center gap-2 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#635a72] dark:text-[#a9a0b2]">
          <span className="flex items-center gap-1 text-[#7240b8] dark:text-[#a87ffb] font-medium">
            <FolderPlus className="w-3.5 h-3.5" />
            Kết quả tìm kiếm:
          </span>
          <span>
            Tìm thấy{' '}
            <strong className="text-[#1c192c] dark:text-[#f4eeff]">
              {totalFiltered ?? 0}
            </strong>{' '}
            danh mục phù hợp với từ khóa &ldquo;{search}&rdquo;
          </span>
        </div>
      )}
    </div>
  );
}
