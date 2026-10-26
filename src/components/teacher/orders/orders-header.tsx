'use client';

import React from 'react';
import { ShoppingBag, RefreshCw } from 'lucide-react';

interface OrdersHeaderProps {
  totalOrders: number;
  isLoading?: boolean;
  onRefresh: () => void;
}

export function OrdersHeader({
  totalOrders,
  isLoading = false,
  onRefresh,
}: OrdersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] shrink-0 border border-[#eceaf3] dark:border-[#352e43]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Quản lý đơn hàng
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] border border-[#eceaf3] dark:border-[#352e43]">
                {totalOrders} đơn hàng
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              Theo dõi danh sách học viên mua khóa học, kiểm tra trạng thái thanh toán và quản lý các giao dịch phát sinh.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          title="Làm mới danh sách đơn hàng"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#7240b8]' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>
    </div>
  );
}
