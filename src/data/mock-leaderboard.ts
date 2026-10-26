// F4 UI placeholder only.
// Real leaderboard API integration will be implemented in a later phase.

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  title: string;
  xp: number;
  studyHours: number;
  streakDays: number;
  change: 'up' | 'down' | 'same';
  changeAmount?: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardData {
  timeframe: string;
  scope: string;
  currentUser: {
    rank: number;
    name: string;
    avatar: string;
    role: string;
    xp: number;
    streakDays: number;
    studyHours: number;
    gapToTop10Xp: number;
    percentToNextTier: number;
  };
  top3: {
    first: LeaderboardUser;
    second: LeaderboardUser;
    third: LeaderboardUser;
  };
  rankings: LeaderboardUser[];
}

export const mockLeaderboardData: LeaderboardData = {
  timeframe: 'Tuần này',
  scope: 'Toàn hệ thống',
  currentUser: {
    rank: 12,
    name: 'Trần Minh Triết',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1c80X608S4kMriOyLk9qsIJXJv0f5-pcYStEOGIBNadpCx7S9iMwtldAHebWm-AH3hPNT0xyAcUei1EgcYRS4ngG1OJS5rIkd-JkSqvPSZJ7BQCdqJNEDc9HA-ccxuuu4oLErHeX0MsJnOI0F5zOoDVPJRfaaDUsWGgyOsrVVE-9LWGHxMvIUhTWJD32xJz8TgtzpqlX07_aTEgyV1DhJgkE0WFRVy4DI4IqKiYwKhhmXHUkmJ4AL',
    role: 'Học viên Chăm chỉ',
    xp: 2450,
    streakDays: 14,
    studyHours: 19,
    gapToTop10Xp: 120,
    percentToNextTier: 78,
  },
  top3: {
    first: {
      rank: 1,
      name: 'Đặng Quốc Hưng',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      title: 'Master Coder',
      xp: 4560,
      studyHours: 34,
      streakDays: 45,
      change: 'same',
    },
    second: {
      rank: 2,
      name: 'Nguyễn Hải Yến',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      title: 'Fullstack Wizard',
      xp: 3820,
      studyHours: 28,
      streakDays: 32,
      change: 'up',
      changeAmount: 1,
    },
    third: {
      rank: 3,
      name: 'Lê Tuấn Anh',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      title: 'Next.js Enthusiast',
      xp: 3410,
      studyHours: 25,
      streakDays: 28,
      change: 'down',
      changeAmount: 1,
    },
  },
  rankings: [
    {
      rank: 4,
      name: 'Phạm Thuỳ Dung',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      title: 'Frontend Specialist',
      xp: 3180,
      studyHours: 24,
      streakDays: 22,
      change: 'up',
      changeAmount: 2,
    },
    {
      rank: 5,
      name: 'Vũ Đức Thịnh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'TypeScript Devotee',
      xp: 2950,
      studyHours: 22,
      streakDays: 19,
      change: 'same',
    },
    {
      rank: 6,
      name: 'Hoàng Kim Ngân',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      title: 'UI/UX & Code Craftsman',
      xp: 2840,
      studyHours: 21,
      streakDays: 26,
      change: 'down',
      changeAmount: 1,
    },
    {
      rank: 7,
      name: 'Đỗ Mạnh Cường',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Backend Explorer',
      xp: 2790,
      studyHours: 20,
      streakDays: 17,
      change: 'up',
      changeAmount: 3,
    },
    {
      rank: 8,
      name: 'Trịnh Mai Phương',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'React Architect',
      xp: 2710,
      studyHours: 20,
      streakDays: 21,
      change: 'same',
    },
    {
      rank: 9,
      name: 'Bùi Gia Huy',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      title: 'Fullstack Pioneer',
      xp: 2620,
      studyHours: 19,
      streakDays: 15,
      change: 'down',
      changeAmount: 2,
    },
    {
      rank: 10,
      name: 'Ngô Thanh Tùng',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      title: 'DevOps & Cloud Learner',
      xp: 2570,
      studyHours: 18,
      streakDays: 16,
      change: 'up',
      changeAmount: 1,
    },
    {
      rank: 11,
      name: 'Lý Ánh Tuyết',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      title: 'Clean Code Advocate',
      xp: 2510,
      studyHours: 18,
      streakDays: 14,
      change: 'same',
    },
    {
      rank: 12,
      name: 'Trần Minh Triết',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1c80X608S4kMriOyLk9qsIJXJv0f5-pcYStEOGIBNadpCx7S9iMwtldAHebWm-AH3hPNT0xyAcUei1EgcYRS4ngG1OJS5rIkd-JkSqvPSZJ7BQCdqJNEDc9HA-ccxuuu4oLErHeX0MsJnOI0F5zOoDVPJRfaaDUsWGgyOsrVVE-9LWGHxMvIUhTWJD32xJz8TgtzpqlX07_aTEgyV1DhJgkE0WFRVy4DI4IqKiYwKhhmXHUkmJ4AL',
      title: 'Học viên Chăm chỉ',
      xp: 2450,
      studyHours: 19,
      streakDays: 14,
      change: 'up',
      changeAmount: 2,
      isCurrentUser: true,
    },
    {
      rank: 13,
      name: 'Võ Minh Khôi',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      title: 'Algorithm Solver',
      xp: 2380,
      studyHours: 16,
      streakDays: 12,
      change: 'down',
      changeAmount: 1,
    },
    {
      rank: 14,
      name: 'Chu Ngọc Linh',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Frontend Explorer',
      xp: 2290,
      studyHours: 15,
      streakDays: 10,
      change: 'same',
    },
    {
      rank: 15,
      name: 'Dương Thành Đạt',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      title: 'Web Security Starter',
      xp: 2150,
      studyHours: 14,
      streakDays: 9,
      change: 'down',
      changeAmount: 3,
    },
  ],
};
