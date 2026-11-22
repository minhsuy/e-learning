'use client';

import React from 'react';
import { Layers, CheckCircle2, Clock, XCircle, CreditCard, Gift } from 'lucide-react';
import { AdminFinancialStatsData } from '@/types/admin-order';

interface OrderStatusBreakdownProps {
  data: AdminFinancialStatsData | null;
  loading: boolean;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n);
}

export function OrderStatusBreakdown({ data, loading }: OrderStatusBreakdownProps) {
  const totalOrders = data?.totalOrders ?? 0;
  const completedOrders = data?.completedOrders ?? 0;
  const pendingOrders = data?.pendingOrders ?? 0;
  const rejectedOrders = data?.rejectedOrders ?? 0;
  const paidOrders = data?.paidOrders ?? 0;
  const freeOrders = data?.freeOrders ?? 0;

  const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

  const statusRows = [
    {
      id: 'completed',
      label: 'Đơn đã hoàn tất (COMPLETED)',
      count: completedOrders,
      percent: pct(completedOrders, totalOrders),
      barClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
      icon: CheckCircle2,
    },
    {
      id: 'pending',
      label: 'Đơn đang chờ (PENDING)',
      count: pendingOrders,
      percent: pct(pendingOrders, totalOrders),
      barClass: 'bg-amber-500',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
      icon: Clock,
    },
    {
      id: 'rejected',
      label: 'Đơn đã từ chối (REJECTED)',
      count: rejectedOrders,
      percent: pct(rejectedOrders, totalOrders),
      barClass: 'bg-rose-500',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300',
      icon: XCircle,
    },
  ];

  const paidPct = pct(paidOrders, completedOrders);
  const freePct = pct(freeOrders, completedOrders);

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Phân tích trạng thái đơn hàng
          </h2>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
            Tách biệt rõ trạng thái vòng đời đơn và phân loại Trả phí / Miễn phí
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse py-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="space-y-2">
              <div className="h-3.5 w-40 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
              <div className="h-2.5 w-full bg-[#f7f1ff] dark:bg-[#221d2d] rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Part 1: Mutually Exclusive Lifecycle Statuses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                1. Theo trạng thái xử lý (Tổng: {fmt(totalOrders)} đơn)
              </span>
            </div>

            {/* Combined Stacked Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] flex">
              {statusRows.map((row) =>
                row.percent > 0 ? (
                  <div
                    key={row.id}
                    className={row.barClass}
                    style={{ width: `${row.percent}%` }}
                    title={`${row.label}: ${fmt(row.count)} (${row.percent.toFixed(1)}%)`}
                  />
                ) : null
              )}
            </div>

            <div className="space-y-2">
              {statusRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs"
                  >
                    <span className="inline-flex items-center gap-2 font-medium text-[#1c192c] dark:text-[#f4eeff]">
                      <Icon className="w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2]" />
                      <span>{row.label}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">{fmt(row.count)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${row.badgeClass}`}>
                        {row.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Part 2: Sub-classification strictly inside Completed Orders */}
          <div className="pt-4 border-t border-[#f1ebff] dark:border-[#2b2438] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                2. Cơ cấu đơn đã hoàn tất ({fmt(completedOrders)} đơn COMPLETED)
              </span>
            </div>

            <div className="h-2.5 w-full rounded-full overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] flex">
              {paidPct > 0 && (
                <div
                  className="bg-[#7240b8]"
                  style={{ width: `${paidPct}%` }}
                  title={`Đơn trả phí: ${fmt(paidOrders)} (${paidPct.toFixed(1)}%)`}
                />
              )}
              {freePct > 0 && (
                <div
                  className="bg-teal-500"
                  style={{ width: `${freePct}%` }}
                  title={`Đơn miễn phí: ${fmt(freeOrders)} (${freePct.toFixed(1)}%)`}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#f7f1ff]/70 dark:bg-[#221d2d] border border-[#e6dffa] dark:border-[#2b2438] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                  <div>
                    <p className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">Đơn trả phí</p>
                    <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">{paidPct.toFixed(1)}% đơn hoàn tất</p>
                  </div>
                </div>
                <span className="text-base font-bold text-[#7240b8] dark:text-[#a87ffb]">{fmt(paidOrders)}</span>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">Đơn miễn phí</p>
                    <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">{freePct.toFixed(1)}% đơn hoàn tất</p>
                  </div>
                </div>
                <span className="text-base font-bold text-teal-700 dark:text-teal-300">{fmt(freeOrders)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
