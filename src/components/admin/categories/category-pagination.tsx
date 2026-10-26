'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface CategoryPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  loading: boolean;
}

export function CategoryPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  loading,
}: CategoryPaginationProps) {
  if (total === 0) return null;

  const startRecord = Math.min((page - 1) * limit + 1, total);
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#635a72] dark:text-[#a9a0b2]">
      {/* Records info & Limit selector */}
      <div className="flex items-center gap-3">
        <span>
          Hiển thị{' '}
          <strong className="text-[#1c192c] dark:text-[#f4eeff]">
            {startRecord} - {endRecord}
          </strong>{' '}
          trong tổng số{' '}
          <strong className="text-[#1c192c] dark:text-[#f4eeff]">
            {new Intl.NumberFormat('vi-VN').format(total)}
          </strong>{' '}
          danh mục
        </span>

        <div className="hidden sm:flex items-center gap-1.5 ml-2">
          <span>/ trang:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={loading}
            className="h-8 px-2 py-1 text-xs rounded-lg bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5 self-center sm:self-auto">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1 || loading}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f1ebff] dark:border-[#2b2438] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#1c192c] dark:text-[#f4eeff]"
          title="Trang đầu"
          aria-label="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f1ebff] dark:border-[#2b2438] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#1c192c] dark:text-[#f4eeff]"
          title="Trang trước"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="h-8 px-3 flex items-center justify-center text-xs font-semibold rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
          Trang {page} / {Math.max(1, totalPages)}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f1ebff] dark:border-[#2b2438] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#1c192c] dark:text-[#f4eeff]"
          title="Trang sau"
          aria-label="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages || loading}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f1ebff] dark:border-[#2b2438] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#1c192c] dark:text-[#f4eeff]"
          title="Trang cuối"
          aria-label="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
