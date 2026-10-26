'use client';

import React from 'react';
import { Tag, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { CouponItem } from '@/types/coupon';

interface CouponKpiCardsProps {
  coupons: CouponItem[];
  totalFromPagination?: number;
  isLoading?: boolean;
}

export function CouponKpiCards({
  coupons,
  totalFromPagination,
  isLoading = false,
}: CouponKpiCardsProps) {
  const totalCoupons = totalFromPagination ?? coupons.length;
  const activeCoupons = coupons.filter((c) => c.active).length;
  const totalUsed = coupons.reduce((sum, c) => sum + (c.used || 0), 0);
  const totalLimit = coupons.reduce((sum, c) => sum + (c.limit || 0), 0);
  const usageRate = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 animate-pulse flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-9 w-9 rounded-xl bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Tổng mã giảm giá',
      value: totalCoupons,
      description: 'Số lượng mã trong tài khoản',
      icon: Tag,
      iconBg: 'bg-[#7240b8]/10 text-[#7240b8] dark:bg-[#a87ffb]/20 dark:text-[#a87ffb]',
    },
    {
      label: 'Đang hoạt động',
      value: activeCoupons,
      description: 'Mã đang có hiệu lực áp dụng',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
    {
      label: 'Lượt đã áp dụng',
      value: totalUsed,
      description: 'Học viên đã sử dụng để mua',
      icon: Users,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      label: 'Tỷ lệ khai thác',
      value: `${usageRate}%`,
      description: totalLimit > 0 ? `${totalUsed} / ${totalLimit} lượt tổng hạn mức` : 'Chưa thiết lập giới hạn',
      icon: TrendingUp,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-xs hover:border-[#7240b8]/30 dark:hover:border-[#a87ffb]/30 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4]">
                {kpi.label}
              </span>
              <div className={`p-2.5 rounded-xl ${kpi.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              {kpi.value}
            </div>
            <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e] mt-1 truncate">
              {kpi.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
