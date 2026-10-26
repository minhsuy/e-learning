'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { gamificationService } from '@/services/gamification.service';
import { ApiPagination } from '@/types/api';
import { XPTransaction, XPTransactionType } from '@/types/gamification';

interface XpHistoryListProps {
  onGoToLearn?: () => void;
}

export function XpHistoryList({ onGoToLearn }: XpHistoryListProps) {
  const { user, status } = useAuth();
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });
  const [selectedType, setSelectedType] = useState<XPTransactionType | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const filterOptions: Array<{ label: string; value: XPTransactionType | undefined; icon: string }> = [
    { label: 'Tất cả biến động', value: undefined, icon: 'receipt_long' },
    { label: 'Bài học (+70 XP)', value: 'LESSON_COMPLETED', icon: 'school' },
    { label: 'Bài kiểm tra (+100 XP)', value: 'QUIZ_COMPLETED', icon: 'quiz' },
    { label: 'Chuyên cần (+20 XP)', value: 'DAILY_STREAK', icon: 'local_fire_department' },
  ];

  const fetchHistory = useCallback(async () => {
    if (status !== 'authenticated' || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await gamificationService.getXpHistory({
        page: currentPage,
        limit: 15,
        type: selectedType,
      });

      if (res.success && res.data) {
        setTransactions(res.data.transactions || []);
        setPagination(
          res.data.pagination || {
            page: currentPage,
            limit: 15,
            total: 0,
            totalPages: 0,
          }
        );
      } else {
        setTransactions([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải lịch sử điểm XP';
      setError(msg);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, status, currentPage, selectedType]);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      await Promise.resolve();
      if (isCancelled) return;
      await fetchHistory();
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [fetchHistory]);

  const handleTypeChange = (type: XPTransactionType | undefined) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const formatTransactionDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const getTransactionMeta = (type: XPTransactionType) => {
    switch (type) {
      case 'LESSON_COMPLETED':
        return {
          title: 'Hoàn thành bài học',
          desc: 'Tích lũy kinh nghiệm khi hoàn thành bài giảng lần đầu',
          icon: 'school',
          color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
          badgeText: '+70 XP',
        };
      case 'QUIZ_COMPLETED':
        return {
          title: 'Vượt qua bài kiểm tra (Quiz)',
          desc: 'Thưởng xuất sắc khi hoàn tất bài trắc nghiệm',
          icon: 'quiz',
          color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50',
          badgeText: '+100 XP',
        };
      case 'DAILY_STREAK':
        return {
          title: 'Thưởng chuỗi chuyên cần (Daily Streak)',
          desc: 'Hoạt động học tập đầu tiên trong ngày theo múi giờ Việt Nam',
          icon: 'local_fire_department',
          color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
          badgeText: '+20 XP',
        };
      default:
        return {
          title: 'Cộng điểm thưởng',
          desc: 'Giao dịch điểm kinh nghiệm học tập',
          icon: 'star',
          color: 'text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#282136]',
          badgeText: '+ XP',
        };
    }
  };

  // State: Unauthorized (Guest)
  if (status !== 'authenticated' || !user) {
    return (
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] p-8 text-center flex flex-col items-center gap-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#f7f1ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
          <span className="material-symbols-outlined text-[36px]">lock</span>
        </div>
        <div className="max-w-md flex flex-col gap-1.5">
          <h3 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Yêu cầu đăng nhập để xem lịch sử
          </h3>
          <p className="text-xs md:text-sm text-[#635a72] dark:text-[#b4a9c7]">
            Vui lòng đăng nhập vào tài khoản TMdemy của bạn để theo dõi nhật ký biến động điểm thưởng XP và các mốc học tập.
          </p>
        </div>
        <Link
          href="/login?redirect=/leaderboard"
          className="px-6 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5f339c] text-white text-xs font-bold transition-all shadow-sm"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((opt) => {
          const isActive = selectedType === opt.value;
          return (
            <button
              key={opt.label}
              onClick={() => handleTypeChange(opt.value)}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isActive
                  ? 'bg-[#7240b8] border-[#7240b8] text-white shadow-2xs'
                  : 'bg-white dark:bg-[#1d1926] border-[#f1ebff] dark:border-[#2f2742] text-[#635a72] dark:text-[#b4a9c7] hover:border-[#7240b8]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. TRANSACTIONS LIST */}
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] shadow-xs overflow-hidden">
        {/* Header summary */}
        <div className="px-6 py-4 border-b border-[#f1ebff] dark:border-[#2f2742] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[20px]">
              history
            </span>
            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Nhật Ký Tích Lũy Điểm Kinh Nghiệm
            </h3>
          </div>
          <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
            Tổng số: <strong>{pagination.total}</strong> giao dịch
          </span>
        </div>

        {/* State: Loading */}
        {isLoading && (
          <div className="p-6 flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* State: Error */}
        {!isLoading && error && (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 text-[32px]">error</span>
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
            <button
              onClick={() => fetchHistory()}
              className="px-4 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold hover:bg-[#ebe5ff] transition-all"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* State: Empty */}
        {!isLoading && !error && transactions.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#f7f1ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
              <span className="material-symbols-outlined text-[32px]">savings</span>
            </div>
            <div className="max-w-md flex flex-col gap-1">
              <h4 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Chưa có giao dịch XP nào
              </h4>
              <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                Hãy bắt đầu hoàn thành bài học, làm bài trắc nghiệm Quiz hoặc học tập đều đặn mỗi ngày để nhận điểm kinh nghiệm đầu tiên!
              </p>
            </div>
            {onGoToLearn ? (
              <button
                onClick={onGoToLearn}
                className="px-5 py-2.5 rounded-xl bg-[#7240b8] text-white text-xs font-bold hover:bg-[#5f339c] transition-all"
              >
                Vào lớp học ngay
              </button>
            ) : (
              <Link
                href="/courses"
                className="px-5 py-2.5 rounded-xl bg-[#7240b8] text-white text-xs font-bold hover:bg-[#5f339c] transition-all"
              >
                Khám phá khóa học
              </Link>
            )}
          </div>
        )}

        {/* State: Success list */}
        {!isLoading && !error && transactions.length > 0 && (
          <div className="divide-y divide-[#f7f1ff] dark:divide-[#282136]">
            {transactions.map((tx) => {
              const meta = getTransactionMeta(tx.type);
              return (
                <div
                  key={tx.id}
                  className="p-4 md:px-6 flex items-center justify-between gap-4 hover:bg-[#faf7fc] dark:hover:bg-[#221c2e] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs md:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                        {meta.title}
                      </span>
                      <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] truncate">
                        {meta.desc}
                      </span>
                      <span className="text-[10px] text-[#7c7483] dark:text-[#8e8596] mt-0.5">
                        {formatTransactionDate(tx.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs md:text-sm">
                      +{tx.amount} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination bar */}
        {!isLoading && !error && pagination.totalPages > 1 && (
          <div className="px-6 py-3 bg-[#fdf8ff] dark:bg-[#181420] border-t border-[#f1ebff] dark:border-[#2f2742] flex items-center justify-between text-xs">
            <span className="text-[#635a72] dark:text-[#b4a9c7]">
              Trang <strong>{currentPage}</strong> / {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="px-3 py-1.5 rounded-lg border border-[#f1ebff] dark:border-[#2f2742] bg-white dark:bg-[#1d1926] font-semibold text-[#1c192c] dark:text-[#f4eeff] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f7f1ff] transition-all"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage >= pagination.totalPages || isLoading}
                className="px-3 py-1.5 rounded-lg border border-[#f1ebff] dark:border-[#2f2742] bg-white dark:bg-[#1d1926] font-semibold text-[#1c192c] dark:text-[#f4eeff] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f7f1ff] transition-all"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
