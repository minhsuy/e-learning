import { UserRole } from './api';

export interface AdminCourseSummary {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  image?: string;
  thumbnail?: string;
  price?: number;
  oldPrice?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'pending' | 'approved' | 'rejected' | string;
  createdAt?: string;
  updatedAt?: string;
  author?: {
    id?: string;
    username?: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  category?: {
    id?: string;
    name?: string;
    slug?: string;
  };
}

export interface AdminUserSummary {
  id: string;
  _id?: string;
  username: string;
  email: string;
  role: UserRole | string;
  status: 'active' | 'inactive' | string;
  avatar?: string;
  phone?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminOrderSummary {
  id: string;
  _id?: string;
  code?: string;
  amount: number;
  discount: number;
  total: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  course?: {
    id?: string;
    title?: string;
    slug?: string;
    image?: string;
    price?: number;
  };
  user?: {
    id?: string;
    username?: string;
    email?: string;
  };
}

export interface AdminKpiState {
  totalUsers: number | null;
  totalTeachers: number | null;
  totalStudents?: number | null;
  totalCourses: number | null;
  pendingCourses: number | null;
  approvedCourses?: number | null;
  totalOrders: number | null;
  pendingOrders: number | null;
  completedOrders?: number | null;
  totalComments?: number | null;
  totalCoupons?: number | null;
  totalRevenue?: number | null;
  conversionRate?: number | null;
  loading: boolean;
  error?: string | null;
}

export interface AdminDashboardCounts {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalCourses: number;
  pendingCourses: number;
  approvedCourses: number;
  rejectedCourses: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalComments: number;
}

export interface AdminDashboardFinancials {
  totalRevenue: number;
  conversionRate: number;
}

export interface AdminDashboardPendingTask {
  type: string;
  count: number;
  actionUrl: string;
}

export interface AdminDashboardSummaryData {
  counts: AdminDashboardCounts;
  financials: AdminDashboardFinancials;
  pendingTasks: AdminDashboardPendingTask[];
  recentUsers: AdminUserSummary[];
}

export interface AdminDashboardSummaryResponse {
  success: boolean;
  message?: string;
  data: AdminDashboardSummaryData;
}

export interface AdminDashboardData {
  kpis: AdminKpiState;
  pendingCourses: {
    items: AdminCourseSummary[];
    loading: boolean;
    error?: string | null;
  };
  recentUsers: {
    items: AdminUserSummary[];
    loading: boolean;
    error?: string | null;
  };
  pendingOrders: {
    items: AdminOrderSummary[];
    loading: boolean;
    error?: string | null;
  };
}
