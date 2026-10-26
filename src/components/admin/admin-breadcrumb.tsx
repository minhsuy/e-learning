'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ShieldCheck } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export function AdminBreadcrumb() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'Admin', href: '/admin/dashboard' },
    ];

    if (!pathname || pathname === '/admin' || pathname === '/admin/dashboard') {
      items.push({ label: 'Tổng quan', isCurrent: true });
      return items;
    }

    if (pathname === '/admin/users' || pathname.startsWith('/admin/users/')) {
      items.push({ label: 'Người dùng', isCurrent: true });
    } else if (pathname === '/admin/courses' || pathname.startsWith('/admin/courses/')) {
      items.push({ label: 'Khóa học', isCurrent: true });
    } else if (pathname === '/admin/categories' || pathname.startsWith('/admin/categories/')) {
      items.push({ label: 'Danh mục', isCurrent: true });
    } else if (pathname === '/admin/coupons' || pathname.startsWith('/admin/coupons/')) {
      items.push({ label: 'Mã giảm giá', isCurrent: true });
    } else if (pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')) {
      items.push({ label: 'Đơn hàng', isCurrent: true });
    } else if (pathname === '/admin/comments' || pathname.startsWith('/admin/comments/')) {
      items.push({ label: 'Kiểm duyệt bình luận', isCurrent: true });
    } else {
      const segment = pathname.split('/').filter(Boolean).pop() || '';
      items.push({ label: segment, isCurrent: true });
    }

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">
      {breadcrumbs.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-[#cdc3d4] dark:text-[#4b4359] shrink-0" aria-hidden="true" />
            )}

            {isLast || !item.href ? (
              <span
                className="font-semibold text-[#7240b8] dark:text-[#a87ffb] truncate max-w-[180px] sm:max-w-none"
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-1 hover:text-[#1c192c] dark:hover:text-[#f4eeff] transition-colors truncate max-w-[120px] sm:max-w-none"
              >
                {isFirst && <ShieldCheck className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />}
                <span>{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
