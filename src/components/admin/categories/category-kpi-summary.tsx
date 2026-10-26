'use client';

import React from 'react';
import { FolderTree, CheckCircle2, BookOpen, ShieldCheck } from 'lucide-react';
import { AdminCategoryKpis } from '@/types/admin-category';
import { cn } from '@/lib/utils';

interface CategoryKpiSummaryProps {
  kpis: AdminCategoryKpis;
  loading: boolean;
}

export function CategoryKpiSummary({ kpis, loading }: CategoryKpiSummaryProps) {
  const cards = [
    {
      id: 'total',
      label: 'Tổng số danh mục',
      value: kpis.totalCategories,
      icon: FolderTree,
      iconBg: 'bg-[#f7f1ff] dark:bg-[#2b2438]',
      iconColor: 'text-[#7240b8] dark:text-[#a87ffb]',
      borderColor: 'hover:border-[#7240b8]/40 dark:hover:border-[#a87ffb]/40',
      badge: 'Hệ thống',
      badgeColor: 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]',
    },
    {
      id: 'active',
      label: 'Danh mục hoạt động',
      value: kpis.activeCategories,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'hover:border-emerald-300 dark:hover:border-emerald-700/50',
      badge: 'Công khai',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
    },
    {
      id: 'courses',
      label: 'Tổng khóa học toàn sàn',
      value: kpis.totalCoursesAttached,
      icon: BookOpen,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'hover:border-indigo-300 dark:hover:border-indigo-700/50',
      badge: 'Phân loại',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300',
    },
    {
      id: 'standard',
      label: 'Chuẩn hóa đường dẫn',
      value: '100%',
      icon: ShieldCheck,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'hover:border-amber-300 dark:hover:border-amber-700/50',
      badge: 'SEO Slug',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className={cn(
              'p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-left transition-all duration-200 group relative overflow-hidden shadow-xs',
              card.borderColor
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0',
                  card.iconBg,
                  card.iconColor
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0',
                  card.badgeColor
                )}
              >
                {card.badge}
              </span>
            </div>

            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2] line-clamp-1">
              {card.label}
            </p>

            <div className="flex items-baseline justify-between mt-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                {loading && typeof card.value !== 'string' ? (
                  <div className="h-8 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse my-0.5" />
                ) : card.value !== null ? (
                  typeof card.value === 'number' ? (
                    card.value.toLocaleString('vi-VN')
                  ) : (
                    card.value
                  )
                ) : (
                  '—'
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
