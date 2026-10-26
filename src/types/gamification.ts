import { ApiPagination, ApiResponse } from './api';

export type RankName =
  | 'Beginner'
  | 'Explorer'
  | 'Learner'
  | 'Skilled'
  | 'Advanced'
  | 'Expert'
  | 'Master';

export interface RankDetail {
  name: RankName;
  minXP: number;
  maxXP?: number;
}

export interface NextRankDetail {
  name: RankName;
  minXP: number;
}

export interface UserXpSummary {
  userId: string;
  username: string;
  avatar: string;
  xpTotal: number;
  rank: RankDetail;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  nextRank: NextRankDetail | null;
  xpToNextRank: number;
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  timezone: string;
}

export interface LeaderboardItem {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  xpTotal: number;
  currentStreak: number;
  rankName: RankName;
  rankLevel: number;
}

export interface LeaderboardResponseData {
  leaderboard: LeaderboardItem[];
  pagination: ApiPagination;
  currentUser?: LeaderboardItem;
}

export interface UserLeaderboardPosition {
  userId: string;
  username: string;
  avatar: string;
  xpTotal: number;
  rank: number;
  rankName: RankName;
  rankLevel: number;
  currentStreak: number;
}

export type XPTransactionType = 'LESSON_COMPLETED' | 'QUIZ_COMPLETED' | 'DAILY_STREAK';

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  type: XPTransactionType;
  eventKey: string;
  createdAt: string;
}

export interface XpHistoryResponseData {
  transactions: XPTransaction[];
  pagination: ApiPagination;
}

export interface GetLeaderboardParams {
  page?: number;
  limit?: number;
  includeMe?: boolean;
}

export interface GetXpHistoryParams {
  page?: number;
  limit?: number;
  type?: XPTransactionType;
}

export type LeaderboardApiResponse = ApiResponse<LeaderboardResponseData>;
export type UserLeaderboardPositionResponse = ApiResponse<UserLeaderboardPosition>;
export type UserXpSummaryResponse = ApiResponse<UserXpSummary>;
export type UserStreakResponse = ApiResponse<UserStreak>;
export type XpHistoryApiResponse = ApiResponse<XpHistoryResponseData>;
