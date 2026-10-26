'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  FolderTree,
  Ticket,
  ShoppingBag,
  MessageSquare,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: 'Quản lý người dùng',
    description: 'Phân quyền, kích hoạt và quản lý thông tin học viên & giảng viên',
    href: '/admin/users',
    icon: Users,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
  },
  {
    title: 'Quản lý khóa học',
    description: 'Kiểm duyệt chất lượng nội dung và quản lý danh mục toàn hệ thống',
    href: '/admin/courses',
    icon: BookOpen,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    title: 'Quản lý danh mục',
    description: 'Cấu trúc ngành học, cây danh mục và chuyên đề đào tạo',
    href: '/admin/categories',
    icon: FolderTree,
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-950/40',
  },
  {
    title: 'Quản lý mã giảm giá',
    description: 'Thiết lập chương trình ưu đãi, khuyến mãi toàn sàn',
    href: '/admin/coupons',
    icon: Ticket,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  {
    title: 'Quản lý đơn hàng',
    description: 'Theo dõi giao dịch mua khóa học, xác nhận thanh toán',
    href: '/admin/orders',
    icon: ShoppingBag,
    iconColor: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-50 dark:bg-sky-950/40',
  },
  {
    title: 'Kiểm duyệt bình luận',
    description: 'Giám sát thảo luận học tập, loại bỏ nội dung vi phạm tiêu chuẩn',
    href: '/admin/comments',
    icon: MessageSquare,
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-950/40',
  },
];

export function QuickActionsCard() {
  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 md:p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-[#f1ebff] dark:border-[#2b2438] mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Thao tác nhanh
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Truy cập nhanh vào các phân hệ quản trị chính
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-start gap-3.5 p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] hover:border-[#7240b8]/40 dark:hover:border-[#a87ffb]/40 hover:shadow-xs transition-all duration-200"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                  action.iconBg,
                  action.iconColor
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] group-hover:text-[#7240b8] dark:group-hover:text-[#a87ffb] transition-colors">
                    {action.title}
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2] group-hover:text-[#7240b8] dark:group-hover:text-[#a87ffb] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-1 line-clamp-2 leading-relaxed">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
