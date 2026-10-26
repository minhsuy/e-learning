import type { Metadata } from 'next';
import { AdminDashboardView } from '@/components/admin/dashboard/admin-dashboard-view';

export const metadata: Metadata = {
  title: 'Tổng Quan Bảng Điều Khiển | TMdemy Admin',
  description: 'Trung tâm giám sát và điều hành toàn bộ nền tảng TMdemy.',
};

export default function AdminDashboardPage() {
  return <AdminDashboardView />;
}
