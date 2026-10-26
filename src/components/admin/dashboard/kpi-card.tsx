'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string | number | null | undefined;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  badge?: string;
  badgeColor?: string;
  href?: string;
  subtitle?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  loading = false,
  error = null,
  onRetry,
  badge,
  badgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
  href,
  subtitle,
}: KpiCardProps) {
  const cardContent = (
    <div className="group relative bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-xs hover:shadow-md hover:border-[#7240b8]/30 dark:hover:border-[#a87ffb]/30 transition-all duration-200 flex flex-col justify-between h-full">
      {/* Top row: Icon + optional badge */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105',
            iconBg,
            iconColor
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {badge && (
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-semibold border',
              badgeColor
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Metric value and label */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2] tracking-wide">
            {title}
          </p>
          {error && onRetry && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRetry();
              }}
              title="Thử lại tải chỉ số"
              className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="h-8 w-24 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse my-1" />
        ) : error ? (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium py-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Không thể tải</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            <h3 className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight group-hover:text-[#7240b8] dark:group-hover:text-[#a87ffb] transition-colors">
              {typeof value === 'number'
                ? new Intl.NumberFormat('vi-VN').format(value)
                : value !== null && value !== undefined
                ? value
                : '—'}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full transition-transform hover:-translate-y-0.5">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
