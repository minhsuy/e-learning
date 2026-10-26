'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  RotateCcw,
  Filter,
  BookOpen,
  MessageSquare,
  CornerDownRight,
  ShieldCheck,
  EyeOff,
  Flag,
  Clock,
} from 'lucide-react';
import { CommentFilterType, CommentModerationStatus } from '@/types/admin-comment';
import { cn } from '@/lib/utils';

interface CommentFiltersBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  courseFilter: string;
  onCourseFilterChange: (val: string) => void;
  typeFilter: CommentFilterType;
  onTypeFilterChange: (val: CommentFilterType) => void;
  statusFilter?: CommentModerationStatus;
  onStatusFilterChange?: (val: CommentModerationStatus) => void;
  courses: Array<{ id: string; title: string }>;
  onResetFilters: () => void;
  loading: boolean;
}

export function CommentFiltersBar({
  search,
  onSearchChange,
  courseFilter,
  onCourseFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  courses,
  onResetFilters,
  loading,
}: CommentFiltersBarProps) {
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
    search.trim() !== '' || courseFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all';

  const typeOptions = [
    { value: 'all' as CommentFilterType, label: 'Tất cả thảo luận', icon: Filter },
    { value: 'root' as CommentFilterType, label: 'Bình luận gốc', icon: MessageSquare, activeClass: 'text-blue-600 dark:text-blue-400' },
    { value: 'reply' as CommentFilterType, label: 'Câu trả lời', icon: CornerDownRight, activeClass: 'text-amber-600 dark:text-amber-400' },
  ];

  const statusOptions = [
    { value: 'all' as CommentModerationStatus, label: 'Tất cả trạng thái', icon: Filter },
    { value: 'approved' as CommentModerationStatus, label: 'Đã duyệt', icon: ShieldCheck, activeClass: 'text-emerald-600 dark:text-emerald-400' },
    { value: 'hidden' as CommentModerationStatus, label: 'Đã ẩn', icon: EyeOff, activeClass: 'text-rose-600 dark:text-rose-400' },
    { value: 'flagged' as CommentModerationStatus, label: 'Bị cắm cờ', icon: Flag, activeClass: 'text-amber-600 dark:text-amber-400' },
    { value: 'pending' as CommentModerationStatus, label: 'Chờ duyệt', icon: Clock, activeClass: 'text-purple-600 dark:text-purple-400' },
  ];

  return (
    <div className="bg-white dark:bg-[#1d1926] p-4 rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] space-y-3 shadow-xs">
      {/* Top row: Search input, Course Select & Reset button */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8e849e] dark:text-[#8d8299] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm theo nội dung bình luận, tên học viên..."
            className="w-full pl-10 pr-9 py-2 text-sm rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#8e849e] dark:placeholder:text-[#8d8299] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 transition-all"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e849e] hover:text-[#1c192c] dark:hover:text-[#f4eeff] transition-colors cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Course Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px] max-w-[300px]">
            <BookOpen className="w-4 h-4 text-[#8e849e] dark:text-[#8d8299] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={courseFilter}
              onChange={(e) => onCourseFilterChange(e.target.value)}
              disabled={loading}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden cursor-pointer truncate"
            >
              <option value="all">Tất cả khóa học</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button if any filter is active */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Type selector pill tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
        <span className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2] mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
          Phân loại:
        </span>

        {typeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = typeFilter === opt.value;

          return (
            <button
              key={opt.value}
              onClick={() => onTypeFilterChange(opt.value)}
              disabled={loading}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
                isSelected
                  ? 'bg-[#7240b8] text-white shadow-xs'
                  : 'bg-[#fdf8ff] dark:bg-[#17141f] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] border border-[#f1ebff] dark:border-[#2b2438]'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', !isSelected && opt.activeClass)} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Moderation Status selector pill tabs (BE-F9.11-003) */}
      {onStatusFilterChange && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
          <span className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2] mr-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
            Kiểm duyệt:
          </span>

          {statusOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = statusFilter === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => onStatusFilterChange(opt.value)}
                disabled={loading}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
                  isSelected
                    ? 'bg-[#7240b8] text-white shadow-xs'
                    : 'bg-[#fdf8ff] dark:bg-[#17141f] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] border border-[#f1ebff] dark:border-[#2b2438]'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', !isSelected && opt.activeClass)} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
