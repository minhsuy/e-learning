'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { gamificationService } from '@/services/gamification.service';
import {
  RankName,
  UserLeaderboardPosition,
  UserStreak,
  UserXpSummary,
} from '@/types/gamification';

/**
 * Checks if the given ISO date string occurred on today's date in Asia/Ho_Chi_Minh (UTC+7).
 */
export function isTodayVietnam(isoDateString: string | null): boolean {
  if (!isoDateString) return false;
  try {
    const activityDate = new Date(isoDateString);
    if (isNaN(activityDate.getTime())) return false;

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const activityDay = formatter.format(activityDate);
    const todayDay = formatter.format(new Date());

    return activityDay === todayDay;
  } catch {
    return false;
  }
}

/**
 * Calculates current rank level progress percentage (0 - 100).
 */
export function calculateRankProgress(
  xpTotal: number,
  minXp: number,
  nextMinXp: number | undefined
): number {
  if (!nextMinXp || nextMinXp <= minXp) return 100;
  const currentLevelXp = Math.max(0, xpTotal - minXp);
  const neededForLevel = nextMinXp - minXp;
  const percentage = Math.min(100, Math.max(0, (currentLevelXp / neededForLevel) * 100));
  return Math.round(percentage);
}

/**
 * Rank Badge theme styling mapping according to TMdemy Stitch Design System.
 */
export function getRankBadgeConfig(rankName?: RankName | string): {
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  icon: string;
  level: number;
} {
  switch (rankName) {
    case 'Master':
      return {
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
        badgeText: 'text-amber-800 dark:text-amber-300',
        borderColor: 'border-amber-300 dark:border-amber-700',
        icon: 'workspace_premium',
        level: 7,
      };
    case 'Expert':
      return {
        badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
        badgeText: 'text-purple-800 dark:text-purple-300',
        borderColor: 'border-purple-300 dark:border-purple-700',
        icon: 'military_tech',
        level: 6,
      };
    case 'Advanced':
      return {
        badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
        badgeText: 'text-indigo-800 dark:text-indigo-300',
        borderColor: 'border-indigo-300 dark:border-indigo-700',
        icon: 'verified',
        level: 5,
      };
    case 'Skilled':
      return {
        badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
        badgeText: 'text-teal-800 dark:text-teal-300',
        borderColor: 'border-teal-300 dark:border-teal-700',
        icon: 'psychology',
        level: 4,
      };
    case 'Learner':
      return {
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
        badgeText: 'text-emerald-800 dark:text-emerald-300',
        borderColor: 'border-emerald-300 dark:border-emerald-700',
        icon: 'school',
        level: 3,
      };
    case 'Explorer':
      return {
        badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
        badgeText: 'text-blue-800 dark:text-blue-300',
        borderColor: 'border-blue-300 dark:border-blue-700',
        icon: 'explore',
        level: 2,
      };
    case 'Beginner':
    default:
      return {
        badgeBg: 'bg-[#ebe5ff] dark:bg-[#282136]',
        badgeText: 'text-[#5b27a1] dark:text-[#d6c4ff]',
        borderColor: 'border-[#e6dffa] dark:border-[#3d3252]',
        icon: 'eco',
        level: 1,
      };
  }
}

/**
 * Hook to fetch and maintain Gamification Overview for Authenticated User.
 */
export function useGamificationOverview() {
  const { user, status } = useAuth();
  const [xpSummary, setXpSummary] = useState<UserXpSummary | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [position, setPosition] = useState<UserLeaderboardPosition | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (status !== 'authenticated' || !user) {
      setXpSummary(null);
      setStreak(null);
      setPosition(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [xpRes, streakRes, posRes] = await Promise.allSettled([
        gamificationService.getXpSummary(),
        gamificationService.getStreak(),
        gamificationService.getUserLeaderboardPosition(),
      ]);

      if (xpRes.status === 'fulfilled' && xpRes.value.data) {
        setXpSummary(xpRes.value.data);
      }
      if (streakRes.status === 'fulfilled' && streakRes.value.data) {
        setStreak(streakRes.value.data);
      }
      if (posRes.status === 'fulfilled' && posRes.value.data) {
        setPosition(posRes.value.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu Gamification';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user, status]);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      await Promise.resolve();
      if (isCancelled) return;
      await fetchOverview();
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [fetchOverview]);

  // Derived properties
  const hasStudiedToday = isTodayVietnam(streak?.lastActivityAt ?? xpSummary?.lastActivityAt ?? null);
  const progressPercent = xpSummary
    ? calculateRankProgress(
        xpSummary.xpTotal,
        xpSummary.rank.minXP,
        xpSummary.nextRank?.minXP
      )
    : 0;

  return {
    xpSummary,
    streak,
    position,
    isLoading,
    error,
    hasStudiedToday,
    progressPercent,
    refresh: fetchOverview,
  };
}
