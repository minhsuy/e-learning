'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, BarChart3, ListOrdered, BookOpenCheck, ExternalLink } from 'lucide-react';
import { extractCommissionApiError, NormalizedCommissionError } from '@/lib/commission-earnings';
import { teacherEarningsService } from '@/services/teacher-earnings.service';
import { teacherStatisticsService } from '@/services/teacher-statistics.service';
import { TeacherEarningsOverviewData } from '@/types/commission-earnings';
import { TeacherWalletOverview } from './teacher-wallet-overview';
import { TeacherEarningsStatistics } from './teacher-earnings-statistics';
import { TeacherEarningsTable } from './teacher-earnings-table';
import { TeacherTransactionsPanel } from './teacher-transactions-panel';

type ActiveTab = 'statistics' | 'earnings' | 'transactions';

interface CourseOption {
  id: string;
  title: string;
}

export function TeacherEarningsView() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('statistics');
  const [overview, setOverview] = useState<TeacherEarningsOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<NormalizedCommissionError | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  const loadOverview = useCallback(async (signal?: AbortSignal) => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await teacherEarningsService.getOverview({ signal });
      setOverview(res.data);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setOverviewError(extractCommissionApiError(err, 'Không thể tải tổng quan ví hoa hồng.'));
    } finally {
      if (!signal?.aborted) setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void loadOverview(controller.signal);
    });

    // Fetch teacher's own courses for optional courseId filter dropdown
    teacherStatisticsService
      .getCoursesStats({ page: 1, limit: 100 }, { signal: controller.signal })
      .then((res) => {
        const list = (res.data?.courses || [])
          .map((c) => ({
            id: c.id || c._id || '',
            title: c.title,
          }))
          .filter((c) => c.id.length > 0);
        setCourses(list);
      })
      .catch(() => {
        // Non-blocking optional filter list
      });

    return () => controller.abort();
  }, [loadOverview]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Ví & Thu nhập hoa hồng
            </h1>
            <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              Theo dõi số dư chuẩn sổ cái, tỷ lệ chia sẻ hoa hồng và lịch sử mở khóa thu nhập.
            </p>
          </div>
        </div>

        <Link
          href="/teacher/analytics"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-white dark:bg-[#17141f] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] text-xs font-semibold text-[#7240b8] dark:text-[#c4a6ff] self-start md:self-auto transition-colors"
        >
          <span>Xem Thống kê Doanh thu Bán hàng</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Authoritative Wallet Overview & Policy Banner */}
      <TeacherWalletOverview
        data={overview}
        loading={overviewLoading}
        error={overviewError}
        onRetry={() => loadOverview()}
      />

      {/* Section Tabs */}
      <div className="border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'statistics' as const, label: 'Biểu đồ & Phân bổ', icon: BarChart3 },
          { id: 'earnings' as const, label: 'Danh sách thu nhập', icon: ListOrdered },
          { id: 'transactions' as const, label: 'Lịch sử sổ cái', icon: BookOpenCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-[#7240b8] text-[#7240b8] dark:border-[#a87ffb] dark:text-[#c4a6ff]'
                  : 'border-transparent text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'statistics' && <TeacherEarningsStatistics courses={courses} />}
      {activeTab === 'earnings' && <TeacherEarningsTable courses={courses} />}
      {activeTab === 'transactions' && <TeacherTransactionsPanel />}
    </div>
  );
}
