'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export function TeacherBreadcrumb() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'Trang chủ', href: '/' },
      { label: 'Kênh Giảng viên', href: '/teacher/dashboard' },
    ];

    if (!pathname || pathname === '/teacher' || pathname === '/teacher/dashboard') {
      items.push({ label: 'Tổng quan', isCurrent: true });
      return items;
    }

    if (pathname === '/teacher/courses') {
      items.push({ label: 'Khóa học của tôi', isCurrent: true });
    } else if (pathname === '/teacher/courses/new') {
      items.push({ label: 'Khóa học của tôi', href: '/teacher/courses' });
      items.push({ label: 'Tạo khóa học mới', isCurrent: true });
    } else if (pathname.includes('/curriculum')) {
      items.push({ label: 'Khóa học của tôi', href: '/teacher/courses' });
      items.push({ label: 'Soạn giáo trình', isCurrent: true });
    } else if (pathname.startsWith('/teacher/courses/')) {
      items.push({ label: 'Khóa học của tôi', href: '/teacher/courses' });
      items.push({ label: 'Chi tiết khóa học', isCurrent: true });
    } else if (pathname === '/teacher/analytics') {
      items.push({ label: 'Báo cáo & Phân tích', isCurrent: true });
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
                {isFirst && <Home className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
