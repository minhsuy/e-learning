import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata: Metadata = {
  title: 'TMdemy Admin — Cổng Quản Trị Hệ Thống',
  description:
    'Cổng điều hành và quản trị trung tâm TMdemy dành cho Quản trị viên cấp cao: Quản lý người dùng, kiểm duyệt khóa học, danh mục, mã giảm giá, đơn hàng và bình luận.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
