'use client';

import React from 'react';
import { Search, X, RotateCcw, Filter } from 'lucide-react';

interface UserFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onReset: () => void;
  totalFiltered: number | null;
  loading: boolean;
}

export function UserFiltersBar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  onReset,
  totalFiltered,
  loading,
}: UserFiltersBarProps) {
  const isFiltered = Boolean(
    search.trim() || role !== 'all' || status !== 'all' || sortBy !== 'createdAt'
  );

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-4 md:p-5 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input with icon and clear button */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#635a72] dark:text-[#a9a0b2]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên, email..."
            className="w-full pl-10 pr-9 py-2 text-xs md:text-sm rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#635a72]/60 dark:placeholder:text-[#a9a0b2]/60 focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] focus:ring-2 focus:ring-[#7240b8]/10 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] hidden sm:inline">
              Vai trò:
            </span>
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:border-[#7240b8] transition-colors cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="teacher">Giảng viên (Teacher)</option>
              <option value="user">Học viên (User)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] hidden sm:inline">
              Trạng thái:
            </span>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:border-[#7240b8] transition-colors cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã bị khóa</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] hidden sm:inline">
              Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:border-[#7240b8] transition-colors cursor-pointer"
            >
              <option value="createdAt">Mới nhất</option>
              <option value="username">Tên người dùng</option>
              <option value="email">Email tài khoản</option>
            </select>
          </div>

          {/* Reset button */}
          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ede3ff] dark:hover:bg-[#342b45] transition-colors"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Info Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#635a72] dark:text-[#a9a0b2]">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
          <span>
            {loading ? (
              'Đang tra cứu dữ liệu...'
            ) : totalFiltered !== null ? (
              <>
                Tìm thấy{' '}
                <strong className="text-[#1c192c] dark:text-[#f4eeff]">
                  {new Intl.NumberFormat('vi-VN').format(totalFiltered)}
                </strong>{' '}
                tài khoản phù hợp
              </>
            ) : (
              'Chưa có dữ liệu'
            )}
          </span>
        </div>

        {isFiltered && (
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Đang áp dụng bộ lọc
          </span>
        )}
      </div>
    </div>
  );
}
