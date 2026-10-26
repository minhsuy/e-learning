import { apiClient } from '@/lib/api/client';
import {
  GetLeaderboardParams,
  GetXpHistoryParams,
  LeaderboardApiResponse,
  UserLeaderboardPositionResponse,
  UserStreakResponse,
  UserXpSummaryResponse,
  XpHistoryApiResponse,
} from '@/types/gamification';

/**
 * Gamification Service
 * Handles XP, Rank, Streak, Leaderboard, and XP Transactions.
 * Strictly adheres to api/GAMIFICATION_LEADERBOARD_API.md source of truth.
 */
export const gamificationService = {
  /**
   * Fetch global leaderboard with pagination and optional currentUser position.
   * Public / Authenticated.
   */
  getLeaderboard(params?: GetLeaderboardParams): Promise<LeaderboardApiResponse> {
    return apiClient.get<LeaderboardApiResponse>('/api/leaderboard', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        includeMe: params?.includeMe ? true : undefined,
      },
    });
  },

  /**
   * Fetch current user's position on the global leaderboard.
   * Requires Bearer JWT.
   */
  getUserLeaderboardPosition(): Promise<UserLeaderboardPositionResponse> {
    return apiClient.get<UserLeaderboardPositionResponse>('/api/leaderboard/me');
  },

  /**
   * Fetch current user's XP summary, current rank, next rank, and xpToNextRank.
   * Requires Bearer JWT.
   */
  getXpSummary(): Promise<UserXpSummaryResponse> {
    return apiClient.get<UserXpSummaryResponse>('/api/users/me/xp-summary');
  },

  /**
   * Fetch current user's streak details (currentStreak, longestStreak, lastActivityAt, timezone).
   * Requires Bearer JWT.
   */
  getStreak(): Promise<UserStreakResponse> {
    return apiClient.get<UserStreakResponse>('/api/users/me/streak');
  },

  /**
   * Fetch paginated XP transactions history with optional event type filter.
   * Requires Bearer JWT.
   */
  getXpHistory(params?: GetXpHistoryParams): Promise<XpHistoryApiResponse> {
    return apiClient.get<XpHistoryApiResponse>('/api/users/me/xp-history', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        type: params?.type,
      },
    });
  },
};
