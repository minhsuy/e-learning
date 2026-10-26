'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw, Plus, Filter, Tag, Globe, Calendar } from 'lucide-react';
import {
  CouponFilterStatus,
  CouponFilterType,
  CouponFilterScope,
  CouponFilterValidity,
} from '@/types/admin-coupon';

interface CouponFiltersBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: CouponFilterStatus;
  onStatusFilterChange: (val: CouponFilterStatus) => void;
  typeFilter: CouponFilterType;
  onTypeFilterChange: (val: CouponFilterType) => void;
  scopeFilter: CouponFilterScope;
  onScopeFilterChange: (val: CouponFilterScope) => void;
  validityFilter: CouponFilterValidity;
  onValidityFilterChange: (val: CouponFilterValidity) => void;
  onResetFilters: () => void;
  onCreateOpen: () => void;
  loading: boolean;
}

export function CouponFiltersBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  scopeFilter,
  onScopeFilterChange,
  validityFilter,
  onValidityFilterChange,
  onResetFilters,
  onCreateOpen,
  loading,
}: CouponFiltersBarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  if (prevSearch !== search) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    scopeFilter !== 'all' ||
    validityFilter !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#1d1926] p-3 sm:p-4 rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-xs">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#635a72] dark:text-[#a9a0b2] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm theo mã code hoặc tiêu đề ưu đãi..."
            disabled={loading}
            className="w-full h-10 pl-9 pr-9 text-xs sm:text-sm rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#635a72] dark:placeholder:text-[#a9a0b2] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 transition-all"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff] transition-colors"
              title="Xóa tìm kiếm"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Controls & Create Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as CouponFilterStatus)}
              disabled={loading}
              className="h-10 px-3 pr-8 text-xs font-medium rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer appearance-none"
              aria-label="Lọc theo trạng thái kích hoạt"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang kích hoạt</option>
              <option value="inactive">Đã vô hiệu hóa</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Discount Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value as CouponFilterType)}
              disabled={loading}
              className="h-10 px-3 pr-8 text-xs font-medium rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer appearance-none"
              aria-label="Lọc theo loại chiết khấu"
            >
              <option value="all">Tất cả loại giảm</option>
              <option value="percentage">Phần trăm (%)</option>
              <option value="number">Số tiền cố định (VNĐ)</option>
            </select>
            <Tag className="w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Scope Dropdown */}
          <div className="relative">
            <select
              value={scopeFilter}
              onChange={(e) => onScopeFilterChange(e.target.value as CouponFilterScope)}
              disabled={loading}
              className="h-10 px-3 pr-8 text-xs font-medium rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer appearance-none"
              aria-label="Lọc theo phạm vi áp dụng"
            >
              <option value="all">Tất cả phạm vi</option>
              <option value="global">Toàn sàn (Tất cả khóa học)</option>
              <option value="specific">Khóa học chỉ định</option>
            </select>
            <Globe className="w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Validity Dropdown */}
          <div className="relative">
            <select
              value={validityFilter}
              onChange={(e) => onValidityFilterChange(e.target.value as CouponFilterValidity)}
              disabled={loading}
              className="h-10 px-3 pr-8 text-xs font-medium rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer appearance-none"
              aria-label="Lọc theo thời hạn hiệu lực"
            >
              <option value="all">Tất cả thời hạn</option>
              <option value="valid">Đang hiệu lực</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="expired">Đã hết hạn</option>
              <option value="exhausted">Hết lượt dùng</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setLocalSearch('');
                onResetFilters();
              }}
              disabled={loading}
              className="h-10 px-3 text-xs font-medium flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}

          {/* Create Coupon Button */}
          <button
            onClick={onCreateOpen}
            className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-xl bg-[#7240b8] hover:bg-[#5d3299] text-white shadow-sm flex items-center gap-1.5 transition-all duration-200 hover:shadow-md shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo mã giảm giá</span>
          </button>
        </div>
      </div>
    </div>
  );
}
