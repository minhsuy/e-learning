// F4 UI placeholder only.
// Real learning roadmap API integration will be implemented in a later phase.

export interface RoadmapCourseNode {
  id: string;
  title: string;
  slug: string;
  status: 'completed' | 'in-progress' | 'available' | 'locked';
  progressPercent?: number;
  duration: string;
  lessonCount: number;
  level: string;
}

export interface RoadmapStage {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'locked';
  progressPercent: number;
  totalCourses: number;
  completedCourses: number;
  courses: RoadmapCourseNode[];
}

export interface LearningRoadmapData {
  title: string;
  trackName: string;
  currentStep: number;
  totalSteps: number;
  estimatedDuration: string;
  overviewStats: {
    totalProgressPercent: number;
    completedCourses: number;
    inProgressCourses: number;
    learningHours: number;
    streakDays: number;
  };
  stages: RoadmapStage[];
  recommendedCourses: {
    id: string;
    slug: string;
    title: string;
    category: string;
    instructor: string;
    thumbnail: string;
    rating: number;
    studentCount: number;
  }[];
}

export const mockRoadmapData: LearningRoadmapData = {
  title: 'Kế hoạch Phát triển Năng lực Cá nhân',
  trackName: 'Fullstack Web Developer Chuyên Nghiệp',
  currentStep: 3,
  totalSteps: 6,
  estimatedDuration: '6 tháng',
  overviewStats: {
    totalProgressPercent: 42,
    completedCourses: 8,
    inProgressCourses: 3,
    learningHours: 148,
    streakDays: 14,
  },
  stages: [
    {
      id: 'stage-1',
      stepNumber: 1,
      title: 'Nền tảng Khoa học Máy tính & Tư duy Lập trình',
      subtitle: 'Xây dựng tư duy giải thuật vững chắc, nắm vững cấu trúc dữ liệu và quy trình phối hợp dự án chuyên nghiệp.',
      status: 'completed',
      progressPercent: 100,
      totalCourses: 3,
      completedCourses: 3,
      courses: [
        {
          id: 's1-c1',
          title: 'Nhập môn Giải thuật & Cấu trúc Dữ liệu Ứng dụng',
          slug: 'algorithms-data-structures',
          status: 'completed',
          progressPercent: 100,
          duration: '24 giờ',
          lessonCount: 32,
          level: 'Cơ bản',
        },
        {
          id: 's1-c2',
          title: 'Git & Quy trình Quản lý Mã nguồn GitHub theo Chuẩn Công nghiệp',
          slug: 'git-github-mastery',
          status: 'completed',
          progressPercent: 100,
          duration: '12 giờ',
          lessonCount: 18,
          level: 'Cơ bản',
        },
        {
          id: 's1-c3',
          title: 'JavaScript Core ES6+ & Cơ chế Bất đồng bộ (Async/Await, Event Loop)',
          slug: 'javascript-deep-dive',
          status: 'completed',
          progressPercent: 100,
          duration: '36 giờ',
          lessonCount: 45,
          level: 'Trung bình',
        },
      ],
    },
    {
      id: 'stage-2',
      stepNumber: 2,
      title: 'Frontend Hiện đại & React Ecosystem',
      subtitle: 'Thành thạo giao diện Responsive hiện đại, Component Architecture, Hook Lifecycle và tư duy UI/UX.',
      status: 'completed',
      progressPercent: 100,
      totalCourses: 3,
      completedCourses: 3,
      courses: [
        {
          id: 's2-c1',
          title: 'HTML5 Semantic, CSS3 Hiện đại & Responsive Flexbox / Grid',
          slug: 'html-css-responsive',
          status: 'completed',
          progressPercent: 100,
          duration: '20 giờ',
          lessonCount: 28,
          level: 'Cơ bản',
        },
        {
          id: 's2-c2',
          title: 'Tailwind CSS Toàn diện & Xây dựng Design System Tái sử dụng',
          slug: 'tailwind-css-design-system',
          status: 'completed',
          progressPercent: 100,
          duration: '18 giờ',
          lessonCount: 24,
          level: 'Trung bình',
        },
        {
          id: 's2-c3',
          title: 'React 18 Nâng cao: State Management, Context API & Custom Hooks',
          slug: 'react-18-advanced',
          status: 'completed',
          progressPercent: 100,
          duration: '38 giờ',
          lessonCount: 42,
          level: 'Trung bình',
        },
      ],
    },
    {
      id: 'stage-3',
      stepNumber: 3,
      title: 'Next.js 14 Fullstack & Tối ưu hóa Web Vitals',
      subtitle: 'Chuyển dịch lên App Router, Server Components, Streaming UI và chuẩn hóa mã nguồn với TypeScript Strict.',
      status: 'active',
      progressPercent: 45,
      totalCourses: 3,
      completedCourses: 1,
      courses: [
        {
          id: 's3-c1',
          title: 'Chuyên sâu React & Next.js 14 Toàn diện (Fullstack Web Developer)',
          slug: 'react-nextjs-14',
          status: 'in-progress',
          progressPercent: 45,
          duration: '48 giờ',
          lessonCount: 40,
          level: 'Nâng cao',
        },
        {
          id: 's3-c2',
          title: 'TypeScript Chuyên nghiệp: Generic, Type Narrowing & Clean Architecture',
          slug: 'typescript-clean-code',
          status: 'available',
          progressPercent: 0,
          duration: '22 giờ',
          lessonCount: 26,
          level: 'Nâng cao',
        },
        {
          id: 's3-c3',
          title: 'Kiểm thử Tự động Frontend với Vitest, Testing Library & Playwright E2E',
          slug: 'testing-vitest-playwright',
          status: 'available',
          progressPercent: 0,
          duration: '20 giờ',
          lessonCount: 22,
          level: 'Nâng cao',
        },
      ],
    },
    {
      id: 'stage-4',
      stepNumber: 4,
      title: 'Backend Node.js, REST API & Cơ sở dữ liệu Phân tán',
      subtitle: 'Xây dựng Backend chịu tải cao, thiết kế API chuẩn REST, bảo mật JWT/OAuth2 và tối ưu hóa truy vấn Database.',
      status: 'locked',
      progressPercent: 0,
      totalCourses: 3,
      completedCourses: 0,
      courses: [
        {
          id: 's4-c1',
          title: 'Node.js & Express.js: Kiến trúc Layered, Clean Architecture & Microservices',
          slug: 'nodejs-express-architecture',
          status: 'locked',
          duration: '35 giờ',
          lessonCount: 38,
          level: 'Nâng cao',
        },
        {
          id: 's4-c2',
          title: 'Cơ sở Dữ liệu Quan hệ & Phi quan hệ: PostgreSQL, MongoDB, Prisma & Redis Caching',
          slug: 'databases-postgresql-mongodb',
          status: 'locked',
          duration: '32 giờ',
          lessonCount: 34,
          level: 'Nâng cao',
        },
        {
          id: 's4-c3',
          title: 'Bảo mật Hệ thống Web: JWT Dual-token, OAuth 2.0, Rate Limiting & OWASP Top 10',
          slug: 'web-security-owasp',
          status: 'locked',
          duration: '24 giờ',
          lessonCount: 25,
          level: 'Nâng cao',
        },
      ],
    },
    {
      id: 'stage-5',
      stepNumber: 5,
      title: 'DevOps, Docker, CI/CD Pipeline & Cloud Deployment',
      subtitle: 'Đóng gói ứng dụng với Docker Containers, tự động hóa quy trình CI/CD GitHub Actions và triển khai Cloud.',
      status: 'locked',
      progressPercent: 0,
      totalCourses: 2,
      completedCourses: 0,
      courses: [
        {
          id: 's5-c1',
          title: 'Docker & Docker Compose: Containerization cho ứng dụng Đa nền tảng',
          slug: 'docker-containers-devops',
          status: 'locked',
          duration: '20 giờ',
          lessonCount: 22,
          level: 'Nâng cao',
        },
        {
          id: 's5-c2',
          title: 'CI/CD Pipeline với GitHub Actions & Triển khai AWS Elastic Cloud',
          slug: 'cicd-github-actions-aws',
          status: 'locked',
          duration: '28 giờ',
          lessonCount: 30,
          level: 'Chuyên gia',
        },
      ],
    },
    {
      id: 'stage-6',
      stepNumber: 6,
      title: 'Đồ án Tốt nghiệp Thực chiến & Luyện Phỏng vấn Kỹ sư Phần mềm',
      subtitle: 'Hoàn thành Capstone Project sản phẩm thực tế, rèn luyện System Design và Mock Interview cùng Senior Tech Lead.',
      status: 'locked',
      progressPercent: 0,
      totalCourses: 2,
      completedCourses: 0,
      courses: [
        {
          id: 's6-c1',
          title: 'Đồ án Capstone: Phát triển Sàn Thương mại E-Learning Quy mô Lớn',
          slug: 'capstone-project-elearning',
          status: 'locked',
          duration: '80 giờ',
          lessonCount: 15,
          level: 'Chuyên gia',
        },
        {
          id: 's6-c2',
          title: 'Bộ kỹ năng Phỏng vấn Kỹ sư Web: System Design & Live Coding Interview',
          slug: 'software-engineer-interview-prep',
          status: 'locked',
          duration: '25 giờ',
          lessonCount: 20,
          level: 'Chuyên gia',
        },
      ],
    },
  ],
  recommendedCourses: [
    {
      id: 'rec-1',
      slug: 'typescript-clean-code',
      title: 'TypeScript Chuyên nghiệp: Generic, Type Narrowing & Clean Architecture',
      category: 'Lập trình Web',
      instructor: 'Nguyễn Văn Minh',
      thumbnail: 'https://images.unsplash.com/photo-1516116211227-bbc13c744ef5?w=500&auto=format&fit=crop&q=80',
      rating: 4.85,
      studentCount: 1240,
    },
    {
      id: 'rec-2',
      slug: 'testing-vitest-playwright',
      title: 'Kiểm thử Tự động Frontend với Vitest, Testing Library & Playwright E2E',
      category: 'Kiểm thử & QA',
      instructor: 'Trần Thị Mai',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=80',
      rating: 4.9,
      studentCount: 980,
    },
  ],
};
