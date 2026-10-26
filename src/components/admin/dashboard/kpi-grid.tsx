'use client';

import React from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  ShoppingBag,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { KpiCard } from './kpi-card';
import { AdminKpiTotals } from '@/services/admin-dashboard.service';
import { formatVND } from '@/services/admin-order.service';

interface KpiGridProps {
  totals: AdminKpiTotals;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function KpiGrid({ totals, loading, error, onRetry }: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Tổng người dùng */}
      <KpiCard
        title="Tổng người dùng"
        value={totals.totalUsers}
        loading={loading}
        error={error}
        onRetry={onRetry}
        href="/admin/users"
        subtitle={
          totals.totalStudents !== null && totals.totalStudents !== undefined
            ? `${totals.totalTeachers || 0} giảng viên • ${totals.totalStudents} học viên`
            : 'Tất cả tài khoản hệ thống'
        }
        icon={Users}
        iconBg="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
        iconColor="text-indigo-600 dark:text-indigo-400"
      />

      {/* 2. Tổng giảng viên */}
      <KpiCard
        title="Tổng giảng viên"
        value={totals.totalTeachers}
        loading={loading}
        error={error}
        onRetry={onRetry}
        href="/admin/users"
        subtitle="Tài khoản đào tạo & giảng dạy"
        icon={GraduationCap}
        iconBg="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
        iconColor="text-purple-600 dark:text-purple-400"
      />

      {/* 3. Tổng khóa học */}
      <KpiCard
        title="Tổng khóa học"
        value={totals.totalCourses}
        loading={loading}
        error={error}
        onRetry={onRetry}
        href="/admin/courses"
        subtitle={
          totals.approvedCourses !== null && totals.approvedCourses !== undefined
            ? `${totals.approvedCourses} khóa đã phát hành`
            : 'Nội dung đào tạo trên sàn'
        }
        icon={BookOpen}
        iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />

      {/* 4. Khóa học chờ duyệt */}
      <KpiCard
        title="Chờ phê duyệt"
        value={totals.pendingCourses}
        loading={loading}
        error={error}
        onRetry={onRetry}
        href="/admin/courses"
        subtitle="Cần thẩm định nội dung bài giảng"
        badge={
          totals.pendingCourses && totals.pendingCourses > 0
            ? `${totals.pendingCourses} khóa`
            : undefined
        }
        badgeColor="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
        icon={Clock}
        iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
        iconColor="text-amber-600 dark:text-amber-400"
      />

      {/* 5. Doanh thu hệ thống / Tổng đơn hàng */}
      <KpiCard
        title={totals.totalRevenue !== null && totals.totalRevenue !== undefined ? 'Doanh thu hệ thống' : 'Tổng đơn hàng'}
        value={
          totals.totalRevenue !== null && totals.totalRevenue !== undefined
            ? formatVND(totals.totalRevenue)
            : totals.totalOrders
        }
        loading={loading}
        error={error}
        onRetry={onRetry}
        href="/admin/orders"
        subtitle={
          totals.totalRevenue !== null && totals.totalRevenue !== undefined
            ? `${totals.totalOrders || 0} đơn hàng • ${totals.completedOrders || 0} hoàn tất`
            : totals.completedOrders !== null && totals.completedOrders !== undefined
            ? `${totals.completedOrders} giao dịch thành công`
            : 'Lịch sử mua khóa học'
        }
        icon={totals.totalRevenue !== null && totals.totalRevenue !== undefined ? DollarSign : ShoppingBag}
        iconBg="bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
        iconColor="text-sky-600 dark:text-sky-400"
      />

      {/* 6. Đơn hàng chờ xử lý */}
      <KpiCard
        title="Đơn hàng chờ xử lý"
        value={totals.pendingOrders}
        loading={loading}
        error={error}
        onRetry={onRetry}
        href="/admin/orders"
        subtitle="Xác nhận thanh toán & chuyển khoản"
        badge={
          totals.pendingOrders && totals.pendingOrders > 0
            ? `${totals.pendingOrders} đơn`
            : undefined
        }
        badgeColor="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
        icon={AlertCircle}
        iconBg="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
        iconColor="text-rose-600 dark:text-rose-400"
      />
    </div>
  );
}
