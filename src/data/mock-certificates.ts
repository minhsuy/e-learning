// F4 UI placeholder only.
// Real certificate API integration will be implemented in a later phase.

export interface CertificateItem {
  id: string;
  code: string;
  courseTitle: string;
  courseSlug: string;
  category: string;
  issueDate: string;
  score: number;
  grade: string;
  instructorName: string;
  studentName: string;
  blockchainHash: string;
  verificationUrl: string;
  status: 'issued' | 'pending';
  progressPercent?: number;
}

export interface CertificatesData {
  summary: {
    earnedCount: number;
    completedCoursesCount: number;
    totalXp: number;
    achievementRank: string;
  };
  certificates: CertificateItem[];
}

export const mockCertificatesData: CertificatesData = {
  summary: {
    earnedCount: 3,
    completedCoursesCount: 8,
    totalXp: 2450,
    achievementRank: 'Top 5% Xuất sắc',
  },
  certificates: [
    {
      id: 'cert-1',
      code: 'TMDEMY-CERT-2024-8921',
      courseTitle: 'Chuyên sâu React & Next.js 14 Toàn diện (Fullstack Web Developer)',
      courseSlug: 'react-nextjs-14',
      category: 'Lập trình Frontend & Fullstack',
      issueDate: '15/09/2024',
      score: 96,
      grade: 'Xuất sắc (High Distinction)',
      instructorName: 'ThS. Hoàng Quốc Bảo',
      studentName: 'Trần Minh Triết',
      blockchainHash: '0x7f9a812bc3e5904d712f9b1836e4f3a2908c3b4c',
      verificationUrl: 'https://verify.tmdemy.edu.vn/cert/8921',
      status: 'issued',
    },
    {
      id: 'cert-2',
      code: 'TMDEMY-CERT-2024-5102',
      courseTitle: 'JavaScript Core ES6+ & Cơ chế Bất đồng bộ Chuyên sâu',
      courseSlug: 'javascript-deep-dive',
      category: 'Khoa học Máy tính',
      issueDate: '02/08/2024',
      score: 92,
      grade: 'Giỏi (Distinction)',
      instructorName: 'Đặng Tuấn Nghĩa',
      studentName: 'Trần Minh Triết',
      blockchainHash: '0x3d2eb108ca783f6029d91a0c4f820561e89291a0',
      verificationUrl: 'https://verify.tmdemy.edu.vn/cert/5102',
      status: 'issued',
    },
    {
      id: 'cert-3',
      code: 'TMDEMY-CERT-2024-2248',
      courseTitle: 'HTML5 Semantic, CSS3 Hiện đại & Responsive Design System',
      courseSlug: 'html-css-responsive',
      category: 'UI/UX & Frontend Styling',
      issueDate: '12/06/2024',
      score: 98,
      grade: 'Xuất sắc (High Distinction)',
      instructorName: 'Nguyễn Thị Thảo',
      studentName: 'Trần Minh Triết',
      blockchainHash: '0x1a8f94cb02e7d3810f64d2719ba187f5d90164d2',
      verificationUrl: 'https://verify.tmdemy.edu.vn/cert/2248',
      status: 'issued',
    },
    {
      id: 'cert-4',
      code: 'TMDEMY-CERT-PENDING',
      courseTitle: 'TypeScript Chuyên nghiệp: Generic, Type Narrowing & Clean Architecture',
      courseSlug: 'typescript-clean-code',
      category: 'Kiến trúc Phần mềm',
      issueDate: 'Đang theo học',
      score: 0,
      grade: 'Chưa hoàn thành',
      instructorName: 'Nguyễn Văn Minh',
      studentName: 'Trần Minh Triết',
      blockchainHash: 'Chưa cấp mã Hash',
      verificationUrl: '',
      status: 'pending',
      progressPercent: 85,
    },
  ],
};
