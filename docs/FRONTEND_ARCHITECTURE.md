# TMDEMY — FRONTEND ARCHITECTURE SPECIFICATION

> **Tài liệu hướng dẫn cấu trúc và kiến trúc mã nguồn Frontend TMDEMY.**  
> *Được thiết kế cho Next.js App Router, React 19/18, TypeScript, Tailwind CSS và shadcn/ui.*

---

## 1. Triết lý Thiết kế Kiến trúc (Architecture Philosophy)

1. **Rõ ràng và Thực tế (Clarity over Cleverness)**: Kiến trúc hướng tới tính tường minh, dễ bảo trì, dễ demo bảo vệ đồ án tốt nghiệp, không lạm dụng abstraction phức tạp.
2. **Server-First by Default**: Mặc định tận dụng sức mạnh của React Server Components (RSC) cho các tác vụ lấy dữ liệu tĩnh, metadata SEO, và dựng khung giao diện. Chỉ chuyển sang Client Component (`"use client"`) khi có tương tác người dùng, quản lý state, dùng browser API hoặc kết nối Socket.IO.
3. **Phân tách Rõ Ràng các Tầng Trách Nhiệm (Separation of Concerns)**:
   - **Tầng Giao diện (Presentation)**: Các React Components thuần túy, nhận props và render UI.
   - **Tầng Dịch vụ API (Service Layer)**: Quản lý gọi API, URL, headers, xử lý dữ liệu trả về và bắt lỗi HTTP.
   - **Tầng Kiểu dữ liệu (Type Definitions)**: Khai báo types chặt chẽ phản ánh đúng API Contract.
   - **Tầng Trạng thái (State Management)**: Phân định ranh giới giữa Auth state, Server cache, Form state và Local UI state.

---

## 2. Cấu trúc Thư mục Chuẩn (Target Directory Structure)

Codebase của TMDEMY Frontend được tổ chức theo mô hình mô-đun hóa kết hợp Route Groups của App Router:

```text
d:/e-learning/
├── docs/                        # Toàn bộ tài liệu kiến trúc & đặc tả API
├── api/                         # 29 file API Contract gốc của Backend (Source of Truth)
├── .agents/                     # AI Agent configuration & rules
├── AGENTS.md                    # Project-level AI coding guidelines
│
├── public/                      # Static assets (images, logos, icons, fonts)
├── src/                         # Source code chính của ứng dụng
│   ├── app/                     # Next.js App Router (Routes, Layouts, Pages)
│   │   ├── (auth)/              # Route Group: Phân hệ xác thực
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── verify-otp/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── layout.tsx
│   │   ├── (public)/            # Route Group: Khách vãng lai & Trang chủ
│   │   │   ├── page.tsx         # Landing Page
│   │   │   ├── courses/         # Tìm kiếm & danh mục khóa học
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx # Chi tiết khóa học công khai
│   │   │   └── layout.tsx
│   │   ├── (student)/           # Route Group: Không gian học tập của học viên
│   │   │   ├── dashboard/
│   │   │   ├── my-courses/      # Khóa học đã ghi danh (Enrollments)
│   │   │   ├── learn/[courseId]/# Phòng học (Lesson Player & Quiz)
│   │   │   ├── orders/          # Lịch sử đơn hàng
│   │   │   ├── certificates/    # Chứng chỉ tốt nghiệp
│   │   │   ├── profile/
│   │   │   └── layout.tsx
│   │   ├── (teacher)/           # Route Group: Studio & Thống kê Giảng viên
│   │   │   ├── teacher/dashboard/
│   │   │   ├── teacher/courses/ # CRUD Khóa học, Chương, Bài học, Quiz
│   │   │   ├── teacher/coupons/
│   │   │   ├── teacher/students/
│   │   │   ├── teacher/revenue/
│   │   │   ├── teacher/analytics/ # Course Performance & Funnels
│   │   │   └── teacher/layout.tsx
│   │   ├── (admin)/             # Route Group: Bảng điều khiển Quản trị viên
│   │   │   ├── admin/dashboard/
│   │   │   ├── admin/users/
│   │   │   ├── admin/courses/   # Phê duyệt khóa học
│   │   │   ├── admin/categories/
│   │   │   ├── admin/coupons/
│   │   │   ├── admin/comments/  # Kiểm duyệt bình luận
│   │   │   └── admin/layout.tsx
│   │   ├── api/                 # Next.js Route Handlers (nếu cần proxy/BFF trung gian)
│   │   ├── error.tsx            # Global Error Boundary
│   │   ├── not-found.tsx        # Global 404 Page
│   │   ├── loading.tsx          # Global Page Loading Skeleton
│   │   └── layout.tsx           # Root Layout (Fonts, Providers, Toaster)
│   │
│   ├── components/              # Reusable UI Components
│   │   ├── ui/                  # shadcn/ui primitives (button, dialog, card, table,...)
│   │   ├── common/              # Shared components (Header, Footer, Navbar, Logo, ThemeToggle)
│   │   ├── feedback/            # EmptyState, ErrorState, LoadingSkeleton, ConfirmDialog
│   │   └── media/               # VideoPlayer, ImageWithFallback
│   │
│   ├── features/                # Domain-specific components & logic
│   │   ├── auth/                # LoginForm, RegisterForm, OtpInput
│   │   ├── course/              # CourseCard, CourseGrid, CourseFilter, CurriculumViewer
│   │   ├── learning/            # VideoLesson, TextLesson, ProgressTracker, CertificateView
│   │   ├── quiz/                # QuizRunner, QuestionItem, QuizResultModal
│   │   ├── order/               # CheckoutSummary, CouponForm, OrderTable
│   │   ├── teacher-studio/      # CourseEditor, ChapterManager, LessonEditor, QuizBuilder
│   │   ├── analytics/           # FunnelChart, DropoffAnalysis, RevenueLineChart
│   │   ├── chat/                # ConversationList, ChatWindow, MessageBubble
│   │   └── notification/        # NotificationDropdown, NotificationItem
│   │
│   ├── lib/                     # Core libraries configuration & instances
│   │   ├── api/                 # Centralized API Client & Axios/Fetch wrapper
│   │   │   ├── client.ts        # Axios/Fetch instance với token interceptors & auto-refresh
│   │   │   └── endpoints.ts     # URL constants ánh xạ 1-1 với Backend
│   │   ├── socket/              # Socket.IO client instance & event listeners
│   │   │   └── socket-client.ts
│   │   └── utils.ts             # shadcn `cn()` helper và formatters (tiền tệ VND, ngày tháng)
│   │
│   ├── services/                # API Service Layer (Chia nhỏ theo Domain)
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── course.service.ts
│   │   ├── chapter.service.ts
│   │   ├── lesson.service.ts
│   │   ├── quiz.service.ts
│   │   ├── order.service.ts
│   │   ├── coupon.service.ts
│   │   ├── enrollment.service.ts
│   │   ├── progress.service.ts
│   │   ├── certificate.service.ts
│   │   ├── comment.service.ts
│   │   ├── rating.service.ts
│   │   ├── chat.service.ts
│   │   ├── notification.service.ts
│   │   ├── teacher-stats.service.ts
│   │   └── admin.service.ts
│   │
│   ├── hooks/                   # Custom React Hooks
│   │   ├── use-auth.ts          # Auth state & helper functions
│   │   ├── use-socket.ts        # Socket.IO connection & listener hook
│   │   ├── use-debounce.ts      # Debounce hook for search input
│   │   └── use-media-query.ts   # Responsive layout helper
│   │
│   ├── types/                   # TypeScript Type Definitions (Pure Interfaces/Types)
│   │   ├── api.ts               # Common API Response, Pagination, Error types
│   │   ├── auth.ts              # LoginRequest, RegisterRequest, UserProfile
│   │   ├── course.ts            # Course, Chapter, Lesson, CourseDetail
│   │   ├── quiz.ts              # Quiz, Question, QuizSubmission
│   │   ├── order.ts             # Order, Coupon, PaymentInfo
│   │   ├── learning.ts          # Enrollment, Progress, Certificate
│   │   ├── analytics.ts         # TeacherOverview, CoursePerformance, FunnelStep
│   │   ├── chat.ts              # Conversation, Message
│   │   └── notification.ts      # Notification
│   │
│   ├── store/                   # Global Client State (Zustand hoặc React Context)
│   │   └── auth-store.ts        # Lưu trữ trạng thái đăng nhập, User info
│   │
│   └── constants/               # Hằng số toàn cục
│       ├── roles.ts             # USER_ROLES ('user', 'teacher', 'admin')
│       └── enums.ts             # Statuses, Types, Levels
```

---

## 3. Chiến lược Phân chia Server vs. Client Components

Để tối ưu hóa hiệu năng tải trang và trải nghiệm người dùng:

| Thành phần | Loại Component | Lý do |
| :--- | :---: | :--- |
| **Landing Page Layout, Hero Banner, Danh mục tĩnh** | Server Component | Không có state tương tác, render sẵn HTML để tối ưu SEO và tốc độ FCP. |
| **Course Detail Header, Đề cương bài học (Read-only)** | Server Component | Lấy dữ liệu tĩnh của khóa học, hỗ trợ SEO metadata OpenGraph. |
| **Thanh tìm kiếm, Bộ lọc khóa học (Filters)** | Client Component | Cần lắng nghe sự kiện `onChange`, cập nhật URL query params với debounce. |
| **Form Đăng nhập, Đăng ký, OTP, Đổi mật khẩu** | Client Component | Cần xử lý form state, validation lỗi, sự kiện submit và nhận token. |
| **Phòng học: Trình phát video (Lesson Player)** | Client Component | Cần can thiệp vào player events (play, pause, ended) để gửi API cập nhật tiến độ học (`Progress`). |
| **Bộ làm bài trắc nghiệm (Quiz Runner)** | Client Component | Cần đếm ngược thời gian (timer), chọn đáp án, tính điểm tạm thời và nộp bài. |
| **Bảng điều khiển Giảng viên / Quản trị viên (Dashboards)** | Kết hợp (Hybrid) | Khung Layout & thông tin cố định là Server Component; Bộ lọc ngày tháng, biểu đồ động (Charts) và bảng dữ liệu tương tác là Client Component. |
| **Khung Chat & Chuông Thông báo** | Client Component | Duy trì kết nối WebSocket thời gian thực (Socket.IO). |

---

## 4. Kiến trúc Tầng Gọi API (API Service Layer)

Tất cả các cuộc gọi HTTP ra bên ngoài đều đi qua một cổng tập trung duy nhất (`src/lib/api/client.ts`). Không gọi `fetch` hay `axios` phân tán trong các UI components.

### 4.1. Nhiệm vụ của `apiClient`:
1. **Gắn tiền tố Base URL**: Đọc từ biến môi trường `NEXT_PUBLIC_API_URL` (mặc định: `http://localhost:3002`).
2. **Gắn Access Token tự động**: Đính kèm `Authorization: Bearer <access_token>` nếu người dùng đã đăng nhập.
3. **Cơ chế Tự động Làm mới Token (Auto-Refresh on 401)**:
   - Khi nhận mã lỗi `401 Unauthorized` và thông báo liên quan đến token hết hạn (`jwt expired`):
   - Đưa request vào hàng đợi (queue) và kích hoạt gọi `POST /api/users/access_token` bằng `refresh_token` đang lưu trong trình duyệt.
   - Nhận Access Token mới, cập nhật vào store/storage, và tự động thử lại (retry) các request đang chờ.
   - Nếu việc làm mới token thất bại: Xóa sạch phiên đăng nhập và chuyển hướng người dùng về trang `/login`.
4. **Chuẩn hóa Định dạng Lỗi (Error Normalization)**:
   - Chuyển đổi mọi định dạng lỗi từ backend (`error`, `message`, hoặc object validation `errors`) thành một cấu trúc đồng nhất để UI dễ hiển thị.

---

## 5. Chiến lược Quản lý Trạng thái (State Management)

Dự án phân chia ranh giới trạng thái rõ ràng, tránh dồn mọi thứ vào Global State:

1. **Authentication State (Global)**:
   - Lưu trữ `user` profile hiện tại, cờ `isAuthenticated`, `isInitialized`.
   - Sử dụng lightweight store (Zustand hoặc AuthContext) kết hợp lưu token an toàn trong cookie/localStorage.
2. **Server Cache State (API Data)**:
   - Dữ liệu khóa học, bài học, thống kê nên được quản lý qua fetch/caching hoặc thư viện data fetching gọn nhẹ (React Query/SWR) để hỗ trợ cache, revalidation, và optimistic updates.
3. **Form State**:
   - Sử dụng React Hook Form kết hợp Zod schema để quản lý validation, field errors, trạng thái submitting và disable submit lặp lại.
4. **Local UI State**:
   - Dùng `useState` và `useReducer` cho các trạng thái giao diện cục bộ: đóng/mở modal, toggle sidebar, tab hiện tại, video time.

---

## 6. Xử lý Trạng thái Tải & Lỗi (Loading & Error UX)

Mọi màn hình nạp dữ liệu từ API đều phải tuân thủ chuẩn 5 trạng thái:
1. **Loading**: Sử dụng Skeleton Shimmer của shadcn/ui mô phỏng đúng cấu trúc nội dung sẽ xuất hiện, không để màn hình trống hoặc xoay tròn đơn điệu.
2. **Success**: Hiển thị dữ liệu hoàn chỉnh.
3. **Empty State**: Khi danh sách rỗng (chưa có khóa học, chưa có đơn hàng,...), hiển thị hình minh họa, thông điệp rõ ràng và nút bấm dẫn dắt hành động (Call To Action).
4. **Error State**: Thông báo lỗi lịch sự kèm nút bấm "Thử lại" (Retry).
5. **Forbidden / Unauthorized**: Tự động chuyển trang hoặc thông báo lý do không có quyền truy cập.
