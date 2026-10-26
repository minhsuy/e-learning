import type { Metadata } from 'next';
import { AdminCoursesView } from '@/components/admin/courses/admin-courses-view';

export const metadata: Metadata = {
  title: 'Quản Lý & Phê Duyệt Khóa Học | TMdemy Admin',
  description: 'Thẩm định giáo trình, video demo và phê duyệt các khóa học do giảng viên đăng tải trên TMdemy.',
};

export default function AdminCoursesPage() {
  return <AdminCoursesView />;
}
