'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { RankSystemGuide } from '@/components/gamification/rank-system-guide';
import { XpHistoryList } from '@/components/gamification/xp-history-list';
import { useAuth } from '@/contexts/auth-context';
import { getRankBadgeConfig, useGamificationOverview } from '@/hooks/use-gamification';
import { gamificationService } from '@/services/gamification.service';
import { ApiPagination } from '@/types/api';
import { LeaderboardItem } from '@/types/gamification';

type ActiveTab = 'leaderboard' | 'xp-history' | 'rank-guide';

export default function LeaderboardPage() {
  const { user, status } = useAuth();
  const { xpSummary, streak, progressPercent } = useGamificationOverview();

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('leaderboard');

  // Filter UI State (Documented backend gap: Backend currently supports All-time Global)
  const [timeframe, setTimeframe] = useState<string>('Toàn thời gian');
  const [scope, setScope] = useState<string>('Toàn hệ thống');

  // Leaderboard Data State
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardItem | null>(null);
  const [pagination, setPagination] = useState<ApiPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await gamificationService.getLeaderboard({
        page: currentPage,
        limit: 20,
        includeMe: status === 'authenticated',
      });

      if (res.success && res.data) {
        setLeaderboard(res.data.leaderboard || []);
        setPagination(
          res.data.pagination || {
            page: currentPage,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        );
        if (res.data.currentUser) {
          setCurrentUserRank(res.data.currentUser);
        }
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải bảng xếp hạng học viên';
      setError(msg);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, status]);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      await Promise.resolve();
      if (isCancelled) return;
      await fetchLeaderboard();
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [fetchLeaderboard]);

  // Top 3 Podium calculations
  const firstPlace = currentPage === 1 ? leaderboard[0] || null : null;
  const secondPlace = currentPage === 1 ? leaderboard[1] || null : null;
  const thirdPlace = currentPage === 1 ? leaderboard[2] || null : null;
  const tableRankings = currentPage === 1 ? leaderboard.slice(3) : leaderboard;

  return (
    <AppShell>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
        {/* 1. HEADER & TOP TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[30px]">
                leaderboard
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                Bảng Xếp Hạng Học Tập
              </h1>
            </div>
            <p className="text-xs md:text-sm text-[#635a72] dark:text-[#b4a9c7]">
              Vinh danh các học viên xuất sắc, tích lũy điểm kinh nghiệm (XP) và duy trì chuỗi chuyên cần
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-2xs">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-[#7240b8] text-white shadow-2xs'
                  : 'text-[#635a72] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">emoji_events</span>
              <span>Bảng Xếp Hạng</span>
            </button>

            <button
              onClick={() => setActiveTab('xp-history')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'xp-history'
                  ? 'bg-[#7240b8] text-white shadow-2xs'
                  : 'text-[#635a72] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Lịch Sử Điểm XP</span>
            </button>

            <button
              onClick={() => setActiveTab('rank-guide')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'rank-guide'
                  ? 'bg-[#7240b8] text-white shadow-2xs'
                  : 'text-[#635a72] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Cấp Bậc & Quy Chế</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: LEADERBOARD CONTENT */}
        {/* ============================================================== */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-8">
            {/* 1.1 FILTER CONTROLS BAR */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#635a72] dark:text-[#b4a9c7] mr-1">
                  Khung thời gian:
                </span>
                {['Toàn thời gian', 'Tuần này', 'Tháng này'].map((tf) => {
                  const isCurrent = timeframe === tf;
                  return (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isCurrent
                          ? 'bg-[#7240b8] text-white shadow-2xs'
                          : 'bg-[#f7f1ff] dark:bg-[#282136] text-[#635a72] dark:text-[#b4a9c7] hover:text-[#1c192c]'
                      }`}
                    >
                      {tf}
                      {tf !== 'Toàn thời gian' && (
                        <span className="ml-1 text-[10px] opacity-75 font-normal"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#635a72] dark:text-[#b4a9c7]">
                  Phạm vi:
                </span>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#f7f1ff] dark:bg-[#282136] border border-[#e6dffa] dark:border-[#3d3252] text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:border-[#7240b8]"
                >
                  <option value="Toàn hệ thống">Toàn hệ thống (Chính thức)</option>
                  <option value="Khóa học của tôi">Khóa học của tôi (Sắp ra mắt)</option>
                  <option value="Nhóm học tập">Nhóm học tập (Sắp ra mắt)</option>
                </select>
              </div>
            </div>

            {/* Notice if user chooses non-global filter */}
            {(timeframe !== 'Toàn thời gian' || scope !== 'Toàn hệ thống') && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>
                  Hệ thống hiện đang xếp hạng chính thức theo <strong>Tổng điểm XP Toàn hệ thống</strong>. Bộ lọc chi tiết theo kỳ học sẽ được backend cập nhật trong giai đoạn tiếp theo.
                </span>
              </div>
            )}

            {/* 1.2 LOADING SKELETON */}
            {isLoading && (
              <div className="flex flex-col gap-6">
                <div className="h-80 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] animate-pulse" />
                <div className="h-28 rounded-2xl bg-[#7240b8]/30 animate-pulse" />
                <div className="h-96 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] animate-pulse" />
              </div>
            )}

            {/* 1.3 ERROR BANNER */}
            {!isLoading && error && (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#1d1926] border border-rose-200 dark:border-rose-900 text-center flex flex-col items-center gap-3 shadow-xs">
                <span className="material-symbols-outlined text-rose-500 text-[36px]">
                  error_outline
                </span>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
                <button
                  onClick={() => fetchLeaderboard()}
                  className="px-5 py-2 rounded-xl bg-[#7240b8] text-white text-xs font-bold hover:bg-[#5f339c] transition-all shadow-xs"
                >
                  Thử tải lại bảng xếp hạng
                </button>
              </div>
            )}

            {/* 1.4 EMPTY STATE */}
            {!isLoading && !error && leaderboard.length === 0 && (
              <div className="p-12 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] text-center flex flex-col items-center gap-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#f7f1ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8]">
                  <span className="material-symbols-outlined text-[36px]">group_off</span>
                </div>
                <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Chưa có dữ liệu xếp hạng học viên
                </h3>
                <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                  Dữ liệu bảng xếp hạng đang được đồng bộ hoặc chưa có người dùng nào tích lũy XP.
                </p>
              </div>
            )}

            {/* 1.5 TOP 3 PODIUM HERO (Only on Page 1 when data exists) */}
            {!isLoading && !error && currentPage === 1 && firstPlace && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#f7f1ff] via-white to-white dark:from-[#221c2e] dark:via-[#1d1926] dark:to-[#1d1926] p-6 md:p-8 border border-[#f1ebff] dark:border-[#2f2742] shadow-sm flex flex-col items-center">
                <div className="text-center mb-4">
                  <span className="px-3.5 py-1 rounded-full bg-[#eddcff] dark:bg-[#2b2438] text-[#5b27a1] dark:text-[#d6c4ff] text-xs font-bold uppercase tracking-wider">
                    👑 Top 3 Thủ Khoa Toàn Hệ Thống
                  </span>
                </div>

                <div className="w-full max-w-4xl grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 items-end pt-8 pb-4">
                  {/* RANK 2: SILVER (Left) */}
                  {secondPlace ? (
                    <div className="flex flex-col items-center">
                      <div className="relative mb-2">
                        <img
                          src={
                            secondPlace.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              secondPlace.username
                            )}&background=cdc2dd&color=1f182c`
                          }
                          alt={secondPlace.username}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover ring-4 ring-slate-300 shadow-md"
                        />
                        <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-extrabold text-xs flex items-center justify-center shadow-xs border-2 border-white dark:border-[#1d1926]">
                          2
                        </span>
                      </div>
                      <h3 className="text-xs md:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] text-center mt-3 truncate max-w-[110px] md:max-w-[140px]">
                        {secondPlace.username}
                      </h3>
                      <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] truncate max-w-[110px]">
                        {secondPlace.rankName} • Lv.{secondPlace.rankLevel}
                      </span>
                      <div className="mt-1 px-2.5 py-0.5 rounded-full bg-white dark:bg-[#282136] border border-[#e6dffa] dark:border-[#3d3252] text-[#7240b8] dark:text-[#a87ffb] font-black text-xs md:text-sm shadow-2xs">
                        {secondPlace.xpTotal.toLocaleString()} XP
                      </div>

                      {/* Silver Pedestal */}
                      <div className="w-full h-24 md:h-28 mt-3 rounded-t-xl bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-2 text-center border-t border-slate-300 dark:border-slate-700 shadow-inner">
                        <span className="text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                          🥈 Á quân 1
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          🔥 {secondPlace.currentStreak} ngày streak
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* RANK 1: GOLD (Center, Tallest) */}
                  <div className="flex flex-col items-center -mt-6">
                    {/* Crown Icon */}
                    <div className="text-amber-500 animate-bounce mb-1">
                      <span
                        className="material-symbols-outlined text-[32px] md:text-[40px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        crown
                      </span>
                    </div>
                    <div className="relative mb-2">
                      <img
                        src={
                          firstPlace.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            firstPlace.username
                          )}&background=f59e0b&color=ffffff`
                        }
                        alt={firstPlace.username}
                        className="w-20 h-20 md:w-26 md:h-26 rounded-full object-cover ring-4 ring-amber-400 shadow-xl"
                      />
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs md:text-sm flex items-center justify-center shadow-xs border-2 border-white dark:border-[#1d1926]">
                        1
                      </span>
                    </div>
                    <h3 className="text-sm md:text-base font-extrabold text-[#1c192c] dark:text-[#f4eeff] text-center mt-3 truncate max-w-[130px] md:max-w-[170px]">
                      {firstPlace.username}
                    </h3>
                    <span className="text-xs text-[#7240b8] dark:text-[#a87ffb] font-semibold truncate max-w-[130px]">
                      👑 {firstPlace.rankName} (Lv.{firstPlace.rankLevel})
                    </span>
                    <div className="mt-1.5 px-3 py-1 rounded-full bg-[#7240b8] text-white font-black text-xs md:text-base shadow-xs">
                      {firstPlace.xpTotal.toLocaleString()} XP
                    </div>

                    {/* Gold Pedestal */}
                    <div className="w-full h-32 md:h-40 mt-3 rounded-t-xl bg-gradient-to-b from-amber-200 to-amber-100 dark:from-amber-900/60 dark:to-amber-950/80 flex flex-col items-center justify-center p-2 text-center border-t border-amber-300 dark:border-amber-700 shadow-inner">
                      <span className="text-amber-900 dark:text-amber-200 text-xs md:text-sm font-extrabold">
                        Quán quân
                      </span>
                      <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                        🔥 {firstPlace.currentStreak} ngày streak liên tiếp
                      </span>
                    </div>
                  </div>

                  {/* RANK 3: BRONZE (Right) */}
                  {thirdPlace ? (
                    <div className="flex flex-col items-center">
                      <div className="relative mb-2">
                        <img
                          src={
                            thirdPlace.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              thirdPlace.username
                            )}&background=d97706&color=ffffff`
                          }
                          alt={thirdPlace.username}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover ring-4 ring-amber-700/60 shadow-md"
                        />
                        <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-800 text-white font-extrabold text-xs flex items-center justify-center shadow-xs border-2 border-white dark:border-[#1d1926]">
                          3
                        </span>
                      </div>
                      <h3 className="text-xs md:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] text-center mt-3 truncate max-w-[110px] md:max-w-[140px]">
                        {thirdPlace.username}
                      </h3>
                      <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] truncate max-w-[110px]">
                        {thirdPlace.rankName} • Lv.{thirdPlace.rankLevel}
                      </span>
                      <div className="mt-1 px-2.5 py-0.5 rounded-full bg-white dark:bg-[#282136] border border-[#e6dffa] dark:border-[#3d3252] text-[#7240b8] dark:text-[#a87ffb] font-black text-xs md:text-sm shadow-2xs">
                        {thirdPlace.xpTotal.toLocaleString()} XP
                      </div>

                      {/* Bronze Pedestal */}
                      <div className="w-full h-20 md:h-24 mt-3 rounded-t-xl bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-[#181420] flex flex-col items-center justify-center p-2 text-center border-t border-amber-600/30 shadow-inner">
                        <span className="text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                          🥉 Á quân 2
                        </span>
                        <span className="text-[10px] text-amber-900 dark:text-amber-400">
                          🔥 {thirdPlace.currentStreak}d streak
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            )}

            {/* 1.6 CURRENT USER RANK HERO CARD */}
            {status === 'authenticated' && user ? (
              <div className="rounded-2xl p-5 md:p-6 bg-gradient-to-r from-[#7240b8] to-[#8b5ad3] text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={
                        currentUserRank?.avatar ||
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.username
                        )}&background=ffffff&color=7240b8`
                      }
                      alt={user.username}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ring-4 ring-white/30"
                    />
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-white text-[#7240b8] font-black text-xs shadow-xs">
                      #{currentUserRank?.rank ?? '--'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base md:text-lg font-bold text-white truncate">
                        {user.username} (Vị trí của bạn)
                      </h3>
                      {currentUserRank?.rankName && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold shrink-0">
                          {currentUserRank.rankName} (Lv.{currentUserRank.rankLevel})
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/90 mt-1">
                      <span>
                        ⭐ <strong>{(currentUserRank?.xpTotal ?? xpSummary?.xpTotal ?? 0).toLocaleString()} XP</strong>
                      </span>
                      <span>•</span>
                      <span>
                        🔥 <strong>{currentUserRank?.currentStreak ?? streak?.currentStreak ?? 0} ngày streak</strong>
                      </span>
                      {streak?.longestStreak !== undefined && streak.longestStreak > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            Kỷ lục: <strong>{streak.longestStreak} ngày</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {xpSummary?.nextRank && (
                    <div className="flex flex-col gap-1 w-full sm:w-48">
                      <div className="flex justify-between text-xs text-white/90">
                        <span>Lên hạng {xpSummary.nextRank.name}</span>
                        <strong>{progressPercent}%</strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#6ffbbe] transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/80">
                        Còn thiếu: <strong>{xpSummary.xpToNextRank.toLocaleString()} XP</strong>
                      </span>
                    </div>
                  )}

                  <Link
                    href="/my-courses"
                    className="px-5 py-2.5 rounded-xl bg-white text-[#7240b8] text-xs font-bold hover:bg-[#f7f1ff] transition-all shrink-0 shadow-xs flex items-center gap-1.5"
                  >
                    <span>Vào học tích lũy XP</span>
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* State: Guest unauthenticated banner */
              <div className="rounded-2xl p-5 md:p-6 bg-[#f7f1ff] dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#eddcff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] shrink-0">
                    <span className="material-symbols-outlined text-[26px]">login</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      Bạn đang xem bảng xếp hạng với tư cách Khách
                    </h3>
                    <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                      Đăng nhập tài khoản TMdemy để kiểm tra thứ hạng thực tế và tích lũy điểm kinh nghiệm mỗi ngày.
                    </p>
                  </div>
                </div>
                <Link
                  href="/login?redirect=/leaderboard"
                  className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5f339c] text-white text-xs font-bold transition-all shadow-xs shrink-0 text-center"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            )}

            {/* 1.7 RANKINGS TABLE */}
            {!isLoading && !error && tableRankings.length > 0 && (
              <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] shadow-xs overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-[#f1ebff] dark:border-[#2f2742] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    {currentPage === 1
                      ? 'Danh Sách Xếp Hạng Chi Tiết (Từ hạng 4 trở đi)'
                      : `Danh Sách Xếp Hạng (Trang ${currentPage})`}
                  </h3>
                  <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                    Cập nhật chuẩn PostgreSQL RANK() 1224
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fdf8ff] dark:bg-[#181420] text-[#635a72] dark:text-[#b4a9c7] font-bold border-b border-[#f1ebff] dark:border-[#2f2742]">
                      <tr>
                        <th className="py-3 px-4 text-center w-16">Hạng</th>
                        <th className="py-3 px-4">Học viên</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Danh hiệu</th>
                        <th className="py-3 px-4 text-right">Điểm XP</th>
                        <th className="py-3 px-4 text-center hidden sm:table-cell">Streak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f7f1ff] dark:divide-[#282136]">
                      {tableRankings.map((learner) => {
                        const isYou = user?.username === learner.username || currentUserRank?.userId === learner.userId;
                        const rankConf = getRankBadgeConfig(learner.rankName);

                        return (
                          <tr
                            key={learner.userId || learner.username}
                            className={`transition-colors ${
                              isYou
                                ? 'bg-[#f7f1ff] dark:bg-[#282136] font-bold text-[#7240b8] dark:text-[#a87ffb]'
                                : 'hover:bg-[#faf7fc] dark:hover:bg-[#221c2e] text-[#1c192c] dark:text-[#f4eeff]'
                            }`}
                          >
                            {/* Rank Number */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                                  isYou
                                    ? 'bg-[#7240b8] text-white shadow-2xs'
                                    : learner.rank === 1
                                    ? 'bg-amber-400 text-amber-950 font-black'
                                    : learner.rank === 2
                                    ? 'bg-slate-300 text-slate-800 font-black'
                                    : learner.rank === 3
                                    ? 'bg-amber-800 text-white font-black'
                                    : 'bg-[#ebe5ff] dark:bg-[#282136] text-[#4b4452] dark:text-[#b4a9c7]'
                                }`}
                              >
                                {learner.rank}
                              </span>
                            </td>

                            {/* User Avatar + Username */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    learner.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      learner.username
                                    )}&background=ebe5ff&color=7240b8`
                                  }
                                  alt={learner.username}
                                  className={`w-9 h-9 rounded-full object-cover ring-1 ${
                                    isYou
                                      ? 'ring-[#7240b8]'
                                      : 'ring-[#e6dffa] dark:ring-[#3d3252]'
                                  }`}
                                />
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold truncate">{learner.username}</span>
                                    {isYou && (
                                      <span className="px-1.5 py-0.2 rounded bg-[#7240b8] text-white text-[10px] font-bold shrink-0">
                                        Bạn
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] sm:hidden truncate">
                                    {learner.rankName} (Lv.{learner.rankLevel})
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Rank Badge */}
                            <td className="py-3.5 px-4 hidden sm:table-cell">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${rankConf.badgeBg} ${rankConf.badgeText} ${rankConf.borderColor}`}
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  {rankConf.icon}
                                </span>
                                <span>{learner.rankName}</span>
                              </span>
                            </td>

                            {/* XP Total */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-extrabold text-[#7240b8] dark:text-[#a87ffb]">
                                {learner.xpTotal.toLocaleString()} XP
                              </span>
                            </td>

                            {/* Streak */}
                            <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                                🔥 {learner.currentStreak}d
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="px-6 py-4 bg-[#fdf8ff] dark:bg-[#181420] border-t border-[#f1ebff] dark:border-[#2f2742] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-[#635a72] dark:text-[#b4a9c7]">
                      Trang <strong>{currentPage}</strong> / {pagination.totalPages} (Tổng cộng{' '}
                      <strong>{pagination.total}</strong> học viên)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1 || isLoading}
                        className="px-3.5 py-1.5 rounded-lg border border-[#f1ebff] dark:border-[#2f2742] bg-white dark:bg-[#1d1926] font-semibold text-[#1c192c] dark:text-[#f4eeff] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f7f1ff] transition-all"
                      >
                        Trang trước
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage >= pagination.totalPages || isLoading}
                        className="px-3.5 py-1.5 rounded-lg border border-[#f1ebff] dark:border-[#2f2742] bg-white dark:bg-[#1d1926] font-semibold text-[#1c192c] dark:text-[#f4eeff] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f7f1ff] transition-all"
                      >
                        Trang sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: XP TRANSACTION HISTORY */}
        {/* ============================================================== */}
        {activeTab === 'xp-history' && (
          <XpHistoryList onGoToLearn={() => setActiveTab('leaderboard')} />
        )}

        {/* ============================================================== */}
        {/* TAB 3: RANK SYSTEM GUIDE & REWARDS */}
        {/* ============================================================== */}
        {activeTab === 'rank-guide' && <RankSystemGuide />}
      </div>
    </AppShell>
  );
}
