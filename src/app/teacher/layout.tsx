import type { Metadata } from 'next';
import { TeacherShell } from '@/components/teacher/teacher-shell';

export const metadata: Metadata = {
  title: 'TMdemy Teacher — Cổng Quản Lý Giảng Viên',
  description: 'Cổng quản trị dành riêng cho Giảng viên TMdemy: Quản lý khóa học, soạn giáo trình và theo dõi báo cáo phân tích hiệu suất.',
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TeacherShell>{children}</TeacherShell>;
}
