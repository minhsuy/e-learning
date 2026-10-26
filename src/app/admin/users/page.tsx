import type { Metadata } from 'next';
import { AdminUsersView } from '@/components/admin/users/admin-users-view';

export const metadata: Metadata = {
  title: 'Quản Lý Người Dùng | TMdemy Admin',
  description: 'Quản lý tài khoản và quyền truy cập của người dùng trên hệ thống TMdemy.',
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}
