// F4 UI placeholder only.
// Real learning API integration will be implemented in a later phase.

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'exercise';
  isCompleted: boolean;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  lessons: Lesson[];
  isExpanded?: boolean;
}

export interface ClassroomCourse {
  id: string;
  slug: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  instructor: {
    name: string;
    role: string;
    avatar: string;
    rating: number;
    reviewsCount: number;
  };
  currentLesson: {
    id: string;
    chapterId: string;
    title: string;
    orderNumber: number;
    videoDuration: string;
    currentTime: string;
    progressSeconds: number;
    totalSeconds: number;
    description: string;
    takeaways: string[];
    resources: {
      title: string;
      size: string;
      type: string;
      icon: string;
    }[];
  };
  chapters: Chapter[];
}

export const mockClassroomData: ClassroomCourse = {
  id: 'c1',
  slug: 'react-nextjs-14',
  title: 'Chuyên sâu React & Next.js 14 Toàn diện (Fullstack Web Developer)',
  totalLessons: 40,
  completedLessons: 18,
  progressPercent: 45,
  instructor: {
    name: 'ThS. Hoàng Quốc Bảo',
    role: 'Senior Software Engineer @ TechCorp',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 1850,
  },
  currentLesson: {
    id: 'l18',
    chapterId: 'ch3',
    title: 'Bài 18: Tối ưu Render với useMemo & useCallback trong Thực tế',
    orderNumber: 18,
    videoDuration: '28:45',
    currentTime: '14:20',
    progressSeconds: 860,
    totalSeconds: 1725,
    description: 'Trong bài giảng này, chúng ta sẽ tìm hiểu sâu về cơ chế Re-rendering của React Virtual DOM, thời điểm chính xác nên áp dụng `useMemo` và `useCallback`, cũng như các lỗi anti-pattern phổ biến gây suy giảm hiệu năng ứng dụng khi lạm dụng tối ưu hóa sớm.',
    takeaways: [
      'Hiểu rõ Referential Equality trong JavaScript và nguyên nhân component con re-render không cần thiết.',
      'Sử dụng React Developer Tools Profiler để đo lường flamechart render timing chính xác.',
      'Phân biệt khi nào chi phí bộ nhớ của memoization cao hơn chi phí tái tạo hàm thông thường.',
      'Áp dụng useMemo cho các phép tính danh sách dữ liệu nặng (filtering, sorting trên 10.000 records).',
    ],
    resources: [
      {
        title: 'Mã nguồn mẫu bài 18 (GitHub Repository)',
        size: '12.4 MB',
        type: 'ZIP',
        icon: 'folder_zip',
      },
      {
        title: 'Bản tóm tắt Cheat-sheet: React Performance Hooks',
        size: '1.8 MB',
        type: 'PDF',
        icon: 'picture_as_pdf',
      },
      {
        title: 'Bộ bài tập thực hành tối ưu hóa Virtual List',
        size: '4.2 MB',
        type: 'LAB',
        icon: 'terminal',
      },
    ],
  },
  chapters: [
    {
      id: 'ch1',
      title: 'Chương 1: Nền tảng React & Tư duy Component Hiện đại',
      totalLessons: 4,
      completedLessons: 4,
      isExpanded: false,
      lessons: [
        { id: 'l1', title: 'Bài 1: Giới thiệu kiến trúc React 18+ và JSX', duration: '12:30', type: 'video', isCompleted: true },
        { id: 'l2', title: 'Bài 2: Props, Immutability & Component Composition', duration: '18:15', type: 'video', isCompleted: true },
        { id: 'l3', title: 'Bài 3: Quản lý State cơ bản với useState', duration: '22:40', type: 'video', isCompleted: true },
        { id: 'l4', title: 'Bài 4: Trắc nghiệm kiểm tra kiến thức Chương 1', duration: '15 câu', type: 'quiz', isCompleted: true },
      ],
    },
    {
      id: 'ch2',
      title: 'Chương 2: State Management Nâng cao & Side Effects',
      totalLessons: 8,
      completedLessons: 8,
      isExpanded: false,
      lessons: [
        { id: 'l5', title: 'Bài 5: Vòng đời Component và useEffect chuyên sâu', duration: '25:10', type: 'video', isCompleted: true },
        { id: 'l6', title: 'Bài 6: Xử lý Clean-up và Race Conditions trong useEffect', duration: '20:45', type: 'video', isCompleted: true },
        { id: 'l7', title: 'Bài 7: Truy cập DOM và Mutable Ref với useRef', duration: '16:30', type: 'video', isCompleted: true },
        { id: 'l8', title: 'Bài 8: Quản lý Complex State bằng useReducer', duration: '28:15', type: 'video', isCompleted: true },
        { id: 'l9', title: 'Bài 9: Tránh Prop Drilling với React Context API', duration: '24:00', type: 'video', isCompleted: true },
        { id: 'l10', title: 'Bài 10: Xây dựng Custom Hooks tái sử dụng nghiệp vụ', duration: '31:20', type: 'video', isCompleted: true },
        { id: 'l11', title: 'Bài 11: Quản lý Server State với TanStack React Query', duration: '34:50', type: 'video', isCompleted: true },
        { id: 'l12', title: 'Bài 12: Dự án Mini: Ứng dụng Quản lý Khóa học Cá nhân', duration: '45:00', type: 'exercise', isCompleted: true },
      ],
    },
    {
      id: 'ch3',
      title: 'Chương 3: Tối ưu Hiệu năng React & Web Vitals',
      totalLessons: 10,
      completedLessons: 6,
      isExpanded: true,
      lessons: [
        { id: 'l13', title: 'Bài 13: Đo lường Web Vitals & React Profiler', duration: '19:40', type: 'video', isCompleted: true },
        { id: 'l14', title: 'Bài 14: Kỹ thuật Code Splitting & Dynamic Import', duration: '21:15', type: 'video', isCompleted: true },
        { id: 'l15', title: 'Bài 15: React.memo & Khi nào nên Memoize Component', duration: '26:50', type: 'video', isCompleted: true },
        { id: 'l16', title: 'Bài 16: Tối ưu Re-render với State Colocation', duration: '17:35', type: 'video', isCompleted: true },
        { id: 'l17', title: 'Bài 17: Phân tích chi phí bộ nhớ của Closures', duration: '23:10', type: 'video', isCompleted: true },
        { id: 'l18', title: 'Bài 18: Tối ưu Render với useMemo & useCallback', duration: '28:45', type: 'video', isCompleted: false, isActive: true },
        { id: 'l19', title: 'Bài 19: Virtualized Lists xử lý 100.000 dòng dữ liệu', duration: '32:00', type: 'video', isCompleted: false },
        { id: 'l20', title: 'Bài 20: Tối ưu hình ảnh và Web Worker trong React', duration: '24:15', type: 'video', isCompleted: false },
        { id: 'l21', title: 'Bài 21: Bài tập thực hành: Refactor Legacy Codebase', duration: '40:00', type: 'exercise', isCompleted: false },
        { id: 'l22', title: 'Bài 22: Trắc nghiệm đánh giá kiến thức Hiệu năng', duration: '20 câu', type: 'quiz', isCompleted: false },
      ],
    },
    {
      id: 'ch4',
      title: 'Chương 4: Next.js 14 App Router & React Server Components',
      totalLessons: 10,
      completedLessons: 0,
      isExpanded: false,
      lessons: [
        { id: 'l23', title: 'Bài 23: Kiến trúc Next.js 14 App Router toàn diện', duration: '27:30', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l24', title: 'Bài 24: Server Components vs Client Components', duration: '30:15', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l25', title: 'Bài 25: Routing, Layouts, Templates & Route Groups', duration: '25:40', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l26', title: 'Bài 26: Data Fetching, Caching & Revalidation', duration: '35:20', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l27', title: 'Bài 27: Server Actions và Mutation xử lý form', duration: '29:50', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l28', title: 'Bài 28: Streaming UI với Suspense & loading.tsx', duration: '22:15', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l29', title: 'Bài 29: Xử lý Error Boundaries và NotFound UI', duration: '18:40', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l30', title: 'Bài 30: Tối ưu SEO, Metadata API & OpenGraph Image', duration: '24:00', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l31', title: 'Bài 31: Xây dựng Middleware xác thực bảo mật', duration: '26:30', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l32', title: 'Bài 32: Đồ án thực hành: E-commerce Product Catalog', duration: '60:00', type: 'exercise', isCompleted: false, isLocked: true },
      ],
    },
    {
      id: 'ch5',
      title: 'Chương 5: Xác thực, WebSocket & Production Deployment',
      totalLessons: 8,
      completedLessons: 0,
      isExpanded: false,
      lessons: [
        { id: 'l33', title: 'Bài 33: Tích hợp RESTful API với Interceptor & Refresh Token', duration: '33:20', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l34', title: 'Bài 34: Kết nối Realtime Socket.IO Chat & Notifications', duration: '38:40', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l35', title: 'Bài 35: Viết Unit Test và Integration Test với Vitest', duration: '28:10', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l36', title: 'Bài 36: Thiết lập CI/CD Pipeline với GitHub Actions', duration: '22:30', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l37', title: 'Bài 37: Đóng gói Docker Container cho ứng dụng Next.js', duration: '25:15', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l38', title: 'Bài 38: Triển khai Vercel, VPS và tối ưu hóa CDN Edge', duration: '30:00', type: 'video', isCompleted: false, isLocked: true },
        { id: 'l39', title: 'Bài 39: Đồ án Tốt nghiệp Toàn diện (Capstone Project)', duration: '120:00', type: 'exercise', isCompleted: false, isLocked: true },
        { id: 'l40', title: 'Bài 40: Bài kiểm tra chứng chỉ cuối khóa TMdemy', duration: '50 câu', type: 'quiz', isCompleted: false, isLocked: true },
      ],
    },
  ],
};
