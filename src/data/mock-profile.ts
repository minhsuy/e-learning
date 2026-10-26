// F5 UI static mock data only.
// Real profile API integration will be implemented in a later phase.

export interface UserProfileSocials {
  github: string;
  githubHandle: string;
  linkedin: string;
  linkedinHandle: string;
  portfolio: string;
  portfolioDomain: string;
}

export interface ProfileStat {
  label: string;
  value: string;
  unit: string;
  icon: string;
  note: string;
  noteColor?: 'primary' | 'tertiary' | 'muted';
}

export interface ProfileBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'unlocked' | 'in_progress';
  progress?: number;
  colorScheme: 'primary' | 'secondary' | 'tertiary' | 'surface';
}

export interface ProfileCertificateSummary {
  id: string;
  title: string;
  issueDate: string;
  certCode: string;
  badgeLabel: string;
  icon: string;
}

export interface ProfileActivityItem {
  id: string;
  title: string;
  timeNote: string;
  icon: string;
  iconScheme: 'primary' | 'secondary' | 'tertiary' | 'surface';
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  bio: string;
  roleBadge: string;
  joinDate: string;
  xp: number;
  streakDays: number;
  isOnline: boolean;
  avatarUrl: string;
  socials: UserProfileSocials;
  stats: ProfileStat[];
  badges: {
    level: number;
    unlockedCount: number;
    inProgressCount: number;
    items: ProfileBadge[];
  };
  recentCertificates: ProfileCertificateSummary[];
  recentActivities: ProfileActivityItem[];
}

export const mockUserProfileData: UserProfileData = {
  id: '#TMD-8842',
  name: 'Trần Minh Triết',
  email: 'triet.tran@tmdemy.edu.vn',
  phone: '+84 987 654 321',
  jobTitle: 'Frontend Developer',
  bio: 'Kỹ sư phát triển giao diện yêu thích kiến trúc Modern JavaScript, React và hệ sinh thái Next.js App Router. Mục tiêu hoàn thiện lộ trình Fullstack và đạt chứng chỉ kiến trúc phần mềm cao cấp tại TMdemy trong năm 2025.',
  roleBadge: 'Học viên TMdemy Pro',
  joinDate: 'Tháng 03/2024',
  xp: 2450,
  streakDays: 14,
  isOnline: true,
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCEoVuzB18OQ_5N_6rRdZXCpurZOZJx4FIBqpWf3RkO_oYxYeC1SWbtRnb67jQOgpAYu35QO17cndeLjn6oXIp8ZIzq475j0vUdrYlW1dMnodu8o8CawCt3dNl5Tu94fqbbarwabHyOrB1vsewo0ET2EbMNqkKEl8MtyBN0LkMeseRTO_gj0zbgaruvuUWHWPZn55hVRcYzFuldHan3rnGRdEpXztgPxTLLAC0sYhoWueJvgc6DKxOn',
  socials: {
    github: 'https://github.com/minhtriet',
    githubHandle: 'minhtriet',
    linkedin: 'https://linkedin.com/in/minhtriet',
    linkedinHandle: 'in/minhtriet',
    portfolio: 'https://minhtriet.dev',
    portfolioDomain: 'minhtriet.dev',
  },
  stats: [
    {
      label: 'Đang học',
      value: '03',
      unit: 'khóa',
      icon: 'auto_stories',
      note: '2 bài thi sắp tới',
      noteColor: 'primary',
    },
    {
      label: 'Đã hoàn thành',
      value: '08',
      unit: 'khóa',
      icon: 'task_alt',
      note: '+100% tỷ lệ đỗ',
      noteColor: 'tertiary',
    },
    {
      label: 'Chứng chỉ số',
      value: '03',
      unit: 'chứng chỉ',
      icon: 'verified',
      note: 'Xác thực Polygon',
      noteColor: 'muted',
    },
    {
      label: 'Tổng giờ học',
      value: '148',
      unit: 'giờ',
      icon: 'schedule',
      note: 'Trung bình 4.2h / tuần',
      noteColor: 'muted',
    },
    {
      label: 'Điểm thưởng XP',
      value: '2.450',
      unit: 'XP',
      icon: 'bolt',
      note: 'Hạng #4 tuần này',
      noteColor: 'primary',
    },
    {
      label: 'Chuỗi Streak',
      value: '14',
      unit: 'ngày',
      icon: 'local_fire_department',
      note: 'Kỷ lục cá nhân mới!',
      noteColor: 'tertiary',
    },
  ],
  badges: {
    level: 5,
    unlockedCount: 4,
    inProgressCount: 1,
    items: [
      {
        id: 'badge-1',
        title: 'Khóa học đầu tiên',
        description: 'Hoàn thành bài nhập môn',
        icon: 'school',
        status: 'unlocked',
        colorScheme: 'primary',
      },
      {
        id: 'badge-2',
        title: '7 ngày liên tiếp',
        description: 'Duy trì thói quen học',
        icon: 'local_fire_department',
        status: 'unlocked',
        colorScheme: 'secondary',
      },
      {
        id: 'badge-3',
        title: 'Chiến binh 100h',
        description: 'Tích lũy >100 giờ bài giảng',
        icon: 'timelapse',
        status: 'unlocked',
        colorScheme: 'tertiary',
      },
      {
        id: 'badge-4',
        title: 'Top 10 tuần',
        description: 'Xếp hạng xuất sắc',
        icon: 'emoji_events',
        status: 'unlocked',
        colorScheme: 'primary',
      },
      {
        id: 'badge-5',
        title: 'Bậc thầy Next.js',
        description: 'Còn 2 bài tập dự án lớn để hoàn tất huy hiệu này',
        icon: 'code',
        status: 'in_progress',
        progress: 80,
        colorScheme: 'surface',
      },
    ],
  },
  recentCertificates: [
    {
      id: 'cert-tmd-nx',
      title: 'React & Next.js Hiện Đại',
      issueDate: '18/02/2025',
      certCode: 'TMD-NX-99321',
      badgeLabel: 'Polygon Verified',
      icon: 'developer_mode',
    },
    {
      id: 'cert-tmd-js',
      title: 'JavaScript Nâng Cao & ES6+',
      issueDate: '10/01/2025',
      certCode: 'TMD-JS-44102',
      badgeLabel: 'Polygon Verified',
      icon: 'javascript',
    },
  ],
  recentActivities: [
    {
      id: 'act-1',
      title: 'Hoàn thành bài 18: Tối ưu hiệu năng với useMemo',
      timeNote: '2 giờ trước • Khóa React Nâng Cao',
      icon: 'play_circle',
      iconScheme: 'primary',
    },
    {
      id: 'act-2',
      title: 'Nộp bài tập thực hành Redux Toolkit',
      timeNote: 'Hôm qua • Đã được chấm 100/100',
      icon: 'upload_file',
      iconScheme: 'secondary',
    },
    {
      id: 'act-3',
      title: 'Nhận chứng chỉ Lập trình viên Frontend Hiện đại',
      timeNote: '3 ngày trước • Hoàn thành xuất sắc',
      icon: 'card_membership',
      iconScheme: 'tertiary',
    },
    {
      id: 'act-4',
      title: 'Đạt chuỗi học tập 14 ngày liên tục',
      timeNote: '5 ngày trước • Nhận +150 XP thưởng',
      icon: 'local_fire_department',
      iconScheme: 'surface',
    },
  ],
};
