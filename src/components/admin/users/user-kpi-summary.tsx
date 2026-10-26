'use client';

import React from 'react';
import {
  Users,
  GraduationCap,
  Shield,
  User,
  CheckCircle,
  Ban,
  RefreshCw,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';
import { AdminUserKpis } from '@/types/admin-user';
import { cn } from '@/lib/utils';

interface KpiItemProps {
  title: string;
  value: number | null | undefined;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  loading: boolean;
  error?: string | null;
  badge?: string;
  badgeColor?: string;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
  error,
  badge,
  badgeColor,
}: KpiItemProps) {
  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-4 md:p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            iconBg,
            iconColor
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
              badgeColor
            )}
          >
            {badge}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2] mb-1">
          {title}
        </p>
        {loading ? (
          <div className="h-7 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse my-0.5" />
        ) : error ? (
          <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium py-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Lỗi tải</span>
          </div>
        ) : (
          <h3 className="text-xl md:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
            {value !== null && value !== undefined
              ? new Intl.NumberFormat('vi-VN').format(value)
              : '—'}
          </h3>
        )}
      </div>
    </div>
  );
}

interface UserKpiSummaryProps {
  kpis: AdminUserKpis;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function UserKpiSummary({
  kpis,
  loading,
  error,
  onRetry,
}: UserKpiSummaryProps) {
  return (
    <div className="space-y-2">
      {error && onRetry && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Không thể tải dữ liệu tổng hợp chỉ số người dùng
          </span>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-semibold transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Tổng người dùng */}
        <KpiCard
          title="Tổng người dùng"
          value={kpis.totalUsers}
          loading={loading}
          error={error}
          icon={Users}
          iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />

        {/* 2. Học viên */}
        <KpiCard
          title="Học viên"
          value={kpis.totalStudents}
          loading={loading}
          error={error}
          icon={User}
          iconBg="bg-sky-50 dark:bg-sky-950/40"
          iconColor="text-sky-600 dark:text-sky-400"
        />

        {/* 3. Giảng viên */}
        <KpiCard
          title="Giảng viên"
          value={kpis.totalTeachers}
          loading={loading}
          error={error}
          icon={GraduationCap}
          iconBg="bg-purple-50 dark:bg-purple-950/40"
          iconColor="text-purple-600 dark:text-purple-400"
        />

        {/* 4. Quản trị viên */}
        <KpiCard
          title="Quản trị viên"
          value={kpis.totalAdmins}
          loading={loading}
          error={error}
          icon={Shield}
          iconBg="bg-[#f7f1ff] dark:bg-[#2b2438]"
          iconColor="text-[#7240b8] dark:text-[#a87ffb]"
        />

        {/* 5. Đang hoạt động */}
        <KpiCard
          title="Đang hoạt động"
          value={kpis.activeAccounts}
          loading={loading}
          error={error}
          badge="Active"
          badgeColor="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
          icon={CheckCircle}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />

        {/* 6. Bị khóa */}
        <KpiCard
          title="Tài khoản bị khóa"
          value={kpis.inactiveAccounts}
          loading={loading}
          error={error}
          badge="Inactive"
          badgeColor="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
          icon={Ban}
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          iconColor="text-rose-600 dark:text-rose-400"
        />
      </div>
    </div>
  );
}
