// F5 UI static mock data only.
// Real settings API integration will be implemented in a later phase.

export interface ConnectedDevice {
  id: string;
  name: string;
  deviceType: 'laptop' | 'mobile';
  platform: string;
  location: string;
  ipAddress?: string;
  isCurrent: boolean;
  statusText: string;
}

export interface UserSettingsData {
  account: {
    id: string;
    name: string;
    avatarUrl: string;
    studentTitle: string;
    rankMonth: string;
    completedCerts: string;
    roleBadge: string;
    email: string;
    isEmailVerified: boolean;
    phone: string;
    language: string;
    timezone: string;
  };
  security: {
    securityLevel: string;
    academicSecurityPercent: number;
    lastSyncedTime: string;
    connectedDevices: ConnectedDevice[];
  };
  preferences: {
    studyReminder: boolean;
    instructorMessages: boolean;
    leaderboardAlerts: boolean;
    publicProfile: boolean;
    showOnLeaderboard: boolean;
  };
}

export const mockUserSettingsData: UserSettingsData = {
  account: {
    id: 'TM-98214',
    name: 'Trần Minh Triết',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA5RVR6cd8QYcyRfBE38H9829zcpipzfR2lhLTlikcOpPvXEbmousYUadlU3AL_4Ph9xTAeBdYBE8MdRqq4mOzmMa2KcCO_djdKhTRiUYJBZfBRWH29W58rSQafJqYvV0ADLTirEQGk6eyJ3mAE7g6Cfs7tEN6sPtVceKKjLs0QdjTWODyo5r_AIGQO44_YUF2p1qeHVdFt3NK21AcOsZHpo-jGb27JVL-iYKCQzmP09fjDug63BBwH',
    studentTitle: 'Sinh viên Chuyên ngành Kỹ thuật Phần mềm',
    rankMonth: 'Hạng 14 BXH Tháng',
    completedCerts: '12 Chứng chỉ hoàn thành',
    roleBadge: 'Học viên chính thức',
    email: 'triet.tran@tmdemy.edu.vn',
    isEmailVerified: true,
    phone: '+84 987 654 321',
    language: 'Tiếng Việt (Mặc định)',
    timezone: 'GMT+7 (Giờ Hà Nội, Bangkok, Jakarta)',
  },
  security: {
    securityLevel: 'An toàn cấp 2',
    academicSecurityPercent: 98,
    lastSyncedTime: '10:42 AM hôm nay',
    connectedDevices: [
      {
        id: 'dev-1',
        name: 'Chrome trên MacOS Sonoma',
        deviceType: 'laptop',
        platform: 'Phiên hiện tại',
        location: 'TP. Hồ Chí Minh, Việt Nam',
        ipAddress: '118.69.182.10',
        isCurrent: true,
        statusText: 'Đang hoạt động',
      },
      {
        id: 'dev-2',
        name: 'TMdemy App trên iPhone 15 Pro',
        deviceType: 'mobile',
        platform: 'iOS 17.5',
        location: 'TP. Hồ Chí Minh, Việt Nam',
        isCurrent: false,
        statusText: 'Hoạt động 2 giờ trước',
      },
    ],
  },
  preferences: {
    studyReminder: true,
    instructorMessages: true,
    leaderboardAlerts: true,
    publicProfile: true,
    showOnLeaderboard: true,
  },
};
