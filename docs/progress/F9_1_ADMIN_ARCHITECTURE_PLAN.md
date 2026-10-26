# TMDEMY FRONTEND — PHASE F9.1: ADMIN UI DISCOVERY & ARCHITECTURE PLAN

> **Giai đoạn**: F9.1 — Admin UI Discovery & Architecture Design  
> **Trạng thái**: KẾ HOẠCH KIẾN TRÚC & THIẾT KẾ (DISCOVERY & ARCHITECTURE ONLY — ZERO IMPLEMENTATION)  
> **Repository**: `D:\e-learning` (TMdemy Frontend Only)  
> **Ngày lập báo cáo**: 18/10/2026  
> **Author**: AI Frontend Architect / Engineer  

---

## EXECUTION TRACE & WORKFLOW AUDIT

### 1. Workflow Used
- **Workflow**: `.agents/workflows/feature-development.md`
- **Mục đích**: Điều phối toàn diện pha khám phá (Discovery), thẩm định hợp đồng API (`api/`), khảo sát kiến trúc frontend hiện tại, thiết kế hệ thống màn hình trên Stitch MCP, và lập lộ trình kiến trúc cho Admin Portal trước khi bước vào triển khai mã nguồn.

### 2. Skills Used & Evidence

| Skill | Trạng thái | Bằng chứng thực tế áp dụng |
| :--- | :---: | :--- |
| `page-implementation` | **USED** | Khảo sát cấu trúc `src/app/`, thiết kế Route Map cho App Router `/admin/*`, phân định rõ Server Components (SEO metadata, vỏ trang) và Client Components (bảng dữ liệu, modal, bộ lọc tương tác). |
| `api-integration` | **USED** | Rà soát toàn bộ 102 REST endpoints trong `api/API_INDEX.md`, đặc tả chi tiết 13 endpoints trong `api/ADMIN_API.md` cùng các API liên quan trong `USER_API.md`, `ORDER_API.md`, `COUPON_API.md`, `COMMENT_API.md`, `CATEGORY_API.md`; xác định năng lực và ranh giới bảo mật. |
| `stitch-ui` | **USED** | Kết nối trực tiếp Stitch MCP với project `tmdemy` (`projects/4018234784417032182`), áp dụng Design System `Modern Academic Violet` (`assets/5ee7138b7bc143c38a2790b53d505be7`), khởi tạo thành công 6 màn hình quản trị hệ thống chuẩn mực và ghi nhận chính xác Screen IDs. |
| `frontend-review` | **USED** | Rà soát rủi ro bảo mật hệ thống, thẩm định ma trận phân quyền (`user`/`teacher`/`admin`), kiểm tra quy tắc bảo vệ tuyến đường (`RouteGuard`), phân loại các điểm nghẽn kỹ thuật theo `[BACKEND GAP]` và `[API CONTRACT ISSUE]`. |

### 3. Workflow Gates Verification

| Cổng kiểm soát (Gate) | Kết quả | Chi tiết kiểm chứng |
| :--- | :---: | :--- |
| **Context Gate** | **PASS** | Đã thấu hiểu trọn vẹn yêu cầu F9.1: Chỉ thực hiện khảo sát, phân tích API, thiết kế UI trên Stitch và lập tài liệu kiến trúc; **tuyệt đối không implement mã nguồn**. |
| **Scope Gate** | **PASS** | Giới hạn tuyệt đối trong không gian `D:\e-learning`. Không mở hoặc chỉnh sửa file trong backend repository (`D:\e-learning_server`). |
| **API Boundary Gate** | **PASS** | Khảo sát nghiêm ngặt dựa trên Source of Truth trong thư mục `api/`. Nhận diện rõ ràng các chức năng backend có hỗ trợ vs các tính năng thiếu hụt (`[BACKEND GAP]`). |
| **Permission Analysis Gate**| **PASS** | Xây dựng ma trận phân quyền chuẩn xác 3 chiều (`user`, `teacher`, `admin`), xác định rõ ràng quyền kiểm soát của Admin trên toàn bộ tài nguyên hệ thống. |
| **Stitch Design Gate** | **PASS** | Tận dụng Stitch MCP tạo 6 màn hình Desktop Admin Portal mang bản sắc `Modern Academic Violet` (#7240b8), ghi nhận đầy đủ Screen IDs thực tế từ API. |
| **No-Implementation Gate** | **PASS** | **0 dòng code `.ts`/`.tsx`/`.css` nào được tạo hoặc sửa đổi**. Chỉ tạo duy nhất tài liệu kiến trúc `docs/progress/F9_1_ADMIN_ARCHITECTURE_PLAN.md`. |
| **Documentation Gate** | **PASS** | Báo cáo hoàn chỉnh, cấu trúc đủ 20 hạng mục chi tiết theo đúng tiêu chuẩn đề ra. |

---

## 1. PROJECT OVERVIEW

TMdemy là nền tảng E-learning và Sàn giao dịch khóa học trực tuyến. Sau khi hoàn thành các phân hệ Học viên (Student Portal - F1 đến F7) và Giảng viên (Teacher Portal - F8), dự án bước vào giai đoạn xây dựng **Cổng Quản Trị Hệ Thống (Admin Portal - F9)**.

Admin Portal là trung tâm điều hành toàn diện của nền tảng TMdemy, phục vụ vai trò **Quản trị viên Cấp cao (`role = admin`)** nhằm:
- Giám sát toàn bộ hệ sinh thái người dùng (Học viên, Giảng viên, Quản trị viên).
- Kiểm soát chất lượng, thẩm định và phê duyệt giáo trình khóa học trước khi phát hành công khai.
- Quản lý cây danh mục khóa học chuẩn hóa.
- Quản lý các chiến dịch mã giảm giá (Coupon & Promotions) trên toàn sàn.
- Kiểm soát các giao dịch đơn hàng, gạch nợ học phí và theo dõi dòng tiền thanh toán.
- Kiểm duyệt và bảo vệ môi trường thảo luận học tập, loại bỏ nội dung vi phạm, spam và lừa đảo.

---

## 2. CURRENT FRONTEND ARCHITECTURE

Khảo sát hệ thống frontend TMdemy hiện tại (`D:\e-learning`):

### 2.1. Tech Stack & Package Versions (`package.json`)
- **Framework**: Next.js `16.3.8` (Next.js App Router, React Server Components)
- **UI Library**: React `19.2.8` & React DOM `19.2.8`
- **TypeScript**: `^5` (Strict mode kích hoạt trong `tsconfig.json`)
- **Styling**: Tailwind CSS `v4` (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`)
- **Component Primitives**: shadcn/ui (`^4.21.1`), `@base-ui/react: ^1.8.0`, `lucide-react: ^1.52.0`, `class-variance-authority: ^0.7.1`
- **Media Upload**: `@uploadthing/react: ^7.3.3`, `uploadthing: ^7.7.4`
- **Realtime Communication**: `socket.io-client: ^4.8.1`
- **Linting & Code Quality**: ESLint `^9`, `eslint-config-next: 16.3.8`

### 2.2. Existing Architecture & Directory Map
```text
src/
├── app/                  # Next.js App Router (RSC by default)
│   ├── (auth)/           # Route group cho xác thực: login, register, forgot-password
│   ├── courses/          # Public course catalog & course detail
│   ├── dashboard/        # Student learning dashboard
│   ├── learn/            # Student classroom & interactive video player
│   ├── my-courses/       # Student enrolled courses roster
│   ├── orders/           # Student order history
│   ├── teacher/          # Teacher Portal (Dashboard, Courses, Curriculum, Orders)
│   ├── profile/          # User profile management
│   ├── settings/         # Account & notification settings
│   ├── leaderboard/      # Gamification leaderboard
│   ├── messages/         # Realtime chat rooms
│   ├── layout.tsx        # Root layout with ThemeProvider, AuthProvider, Toaster
│   └── globals.css       # Design tokens & Tailwind CSS v4 directives
├── components/           # Reusable UI Components
│   ├── auth/             # RouteGuard (bảo vệ quyền truy cập theo vai trò)
│   ├── common/           # ThemeToggle, Breadcrumbs, EmptyState, LoadingSkeleton
│   ├── course/           # CourseCard, CourseFilters, RatingStars
│   ├── teacher/          # TeacherShell, TeacherSidebar, TeacherHeader, CurriculumBuilder
│   └── ui/               # shadcn/ui primitives (Button, Card, Dialog, Badge, Input,...)
├── services/             # Centralized API service layer
│   ├── api.client.ts     # Centralized Fetch Client (Bearer token, auto refresh 401)
│   ├── auth.service.ts   # Login, register, logout, token refresh
│   ├── user.service.ts   # Profile update, change password, public teachers
│   ├── course.service.ts # Public & shared course fetching
│   ├── order.service.ts  # Checkout, order creation, order tracking
│   ├── coupon.service.ts # Coupon validation & teacher coupons
│   ├── category.service.ts # Public categories fetching
│   └── comment.service.ts # Comment creation, replies, reactions
├── types/                # Strict TypeScript interfaces & DTOs
│   ├── api.ts            # ApiResponse<T>, PaginationMeta, UserRole
│   ├── auth.ts           # User, LoginCredentials, AuthResponse
│   ├── course.ts         # Course, Chapter, Lesson, CourseDetail
│   ├── order.ts          # Order, OrderStatus, PaymentMethod
│   ├── coupon.ts         # Coupon, CouponType
│   └── comment.ts        # Comment, CommentReaction
└── hooks/                # Custom React Hooks
    ├── use-auth.ts       # Auth state, login, logout, currentUser
    ├── use-socket.ts     # Socket.IO client instance
    └── use-gamification.ts # User XP, streak, achievements
```

### 2.3. State Management, Auth & Route Protection Patterns
- **Auth State**: Quản lý tập trung qua `AuthContext` (`src/context/auth-context.tsx`) và hook `useAuth()` (`src/hooks/use-auth.ts`). Tự động đọc và đồng bộ thông tin người dùng từ `localStorage` (`access_token`, `refresh_token`, `user_profile`).
- **Token Lifecycle**: API Client (`src/lib/api/client.ts`) tự động đính kèm header `Authorization: Bearer <accessToken>`. Khi gặp lỗi `401 Unauthorized`, interceptor tự động gọi `POST /api/users/access_token` với Refresh Token để lấy Access Token mới và retry request gốc.
- **Route Protection**: Triển khai qua component `RouteGuard` (`src/components/auth/route-guard.tsx`). Hỗ trợ cấu hình `requireAuth` và danh sách vai trò cho phép `allowedRoles: UserRole[]`.
  - Nếu chưa đăng nhập: Tự động chuyển hướng về `/login?redirect=<current_path>`.
  - Nếu đã đăng nhập nhưng sai role: Hiển thị giao diện chặn truy cập 403 Forbidden thân thiện và cung cấp nút điều hướng về dashboard đúng vai trò (`getDefaultRolePath(user.role)`).

---

## 3. EXISTING ADMIN IMPLEMENTATION

Khảo sát hiện trạng phần Admin trong repository frontend:

### 3.1. Admin Routes
- **Hiện trạng**: **Chưa tồn tại route nào trong `src/app/admin/`**.
- Thư mục `src/app/` hiện chỉ có: `(auth)`, `courses`, `dashboard`, `learn`, `my-courses`, `orders`, `profile`, `settings`, `leaderboard`, `messages`, `teacher`.

### 3.2. Admin Components & Layout
- **Hiện trạng**: **Chưa có thư mục `src/components/admin/`**.
- Chưa có `AdminShell`, `AdminSidebar`, `AdminHeader`, hay `AdminBreadcrumb`.

### 3.3. Admin Services & Types
- **Hiện trạng**: Chưa có file `admin.service.ts` chuyên biệt trong `src/services/`.
- Các endpoint quản trị hiện đang nằm rải rác hoặc chưa được khai báo:
  - `category.service.ts` chỉ có `getCategories()`, `getCategoryBySlug()` (Public API). Chưa có các hàm `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`.
  - `coupon.service.ts` chỉ có `getCoupons()`, `createCoupon()`. Chưa có hàm `PUT`, `DELETE` cho Admin.
  - `order.service.ts` có `getOrders()`, `updateOrderStatus()` nhưng chưa tối ưu cho Admin.
  - `comment.service.ts` có `deleteComment()` nhưng chưa có `deleteCommentByAdmin()`.

### 3.4. RouteGuard Role Checking
- **Hiện trạng**: File `src/components/auth/route-guard.tsx` **đã hỗ trợ sẵn sàng cho vai trò `admin`**:
  ```typescript
  export function getDefaultRolePath(role?: UserRole): string {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'user':
      default:
        return '/';
    }
  }
  ```
- Định nghĩa kiểu `UserRole` trong `src/types/api.ts` đã bao gồm `'admin' | 'teacher' | 'user'`.

### 3.5. Lessons Learned from Existing Teacher Portal
Teacher Portal (`src/app/teacher/`) đã cung cấp một kiến trúc chuẩn mực để Admin Portal kế thừa và nâng tầm:
1. **Shell Pattern**: `TeacherLayout` (`src/app/teacher/layout.tsx`) bọc toàn bộ các trang con bằng `TeacherShell` (`src/components/teacher/teacher-shell.tsx`), đảm bảo RouteGuard bọc ngoài cùng và layout không bị re-render khi chuyển trang con.
2. **Responsive Sidebar**: Sidebar cố định trên Desktop (`lg:pl-72`), trượt ra (Drawer) với Backdrop mờ trên Mobile/Tablet.
3. **Fixed Top Header**: Header đính cố định trên cùng (`h-16`), chứa Breadcrumbs động, Theme Toggle, Notification Popover và Profile Dropdown.
4. **Không sao chép nguyên mẫu**: Admin Portal cần phong cách trang trọng, quyền uy hơn (huy hiệu Cổng Quản Trị Hệ Thống, màu tím `#7240b8` kết hợp badge cảnh báo kiểm duyệt, các bảng dữ liệu có checkbox chọn hàng loạt và Drawer trượt thẩm định chuyên sâu).

---

## 4. ADMIN API INVENTORY

Dựa trên Source of Truth trong thư mục `api/` (`api/ADMIN_API.md`, `api/USER_API.md`, `api/COURSE_API.md`, `api/CATEGORY_API.md`, `api/COUPON_API.md`, `api/ORDER_API.md`, `api/COMMENT_API.md`, `api/API_INDEX.md`):

### 4.1. Domain: User Management

#### API 1.1: `GET /api/admin/users`
- **Method & Path**: `GET /api/admin/users`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10, range: 1-100)
  - `role`: string (`admin` | `teacher` | `user`)
  - `status`: string (`active` | `inactive`)
  - `search`: string (tìm theo username hoặc email)
  - `sortBy`: string (`createdAt` | `username` | `email`)
- **Response Structure**:
  ```json
  {
    "success": true,
    "message": "Fetched users successfully !",
    "data": {
      "users": [
        {
          "id": "uuid-v4",
          "_id": "uuid-v4",
          "username": "hoang_teacher",
          "email": "teacher@tmdemy.vn",
          "role": "teacher",
          "status": "active",
          "avatar": "url",
          "phone": "0987654321",
          "bio": "Senior Instructor",
          "socialLinks": { "facebook": "", "instagram": "", "github": "" },
          "createdAt": "2026-02-10T08:00:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
    }
  }
  ```
- **Capabilities**: Pagination [x], Search [x], Filtering [x], Sorting [x], Mutation [ ]
- **Error Codes**: 401 Unauthorized, 403 Forbidden (Non-admin)

#### API 1.2: `GET /api/admin/users/:id`
- **Method & Path**: `GET /api/admin/users/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Path Parameters**: `id` (UUID v4)
- **Response Structure**: Object user chi tiết đầy đủ thông tin an toàn.
- **Capabilities**: Pagination [ ], Search [ ], Filtering [ ], Sorting [ ], Mutation [ ]
- **Error Codes**: 400 Bad Request (Invalid UUID), 403 Forbidden, 404 Not Found

#### API 1.3: `PUT /api/admin/users/:id`
- **Method & Path**: `PUT /api/admin/users/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Path Parameters**: `id` (UUID v4)
- **Request Body**:
  ```json
  {
    "username": "hoang_updated",
    "role": "teacher",
    "status": "active",
    "phone": "0912345678",
    "bio": "Updated bio description",
    "socialLinks": { "facebook": "https://..." }
  }
  ```
- **Validation & Business Rules**: Cấm cập nhật `email`, `password`. Bắt buộc gửi ít nhất 1 trường được phép. Kiểm tra trùng username (`USERNAME_CONFLICT`, 409).
- **Capabilities**: Pagination [ ], Search [ ], Filtering [ ], Sorting [ ], Mutation [x]

#### API 1.4: `DELETE /api/admin/users/:id`
- **Method & Path**: `DELETE /api/admin/users/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Path Parameters**: `id` (UUID v4)
- **Business Rules**:
  - Chống tự xóa tài khoản chính mình (`SELF_DELETE_BLOCKED`, 400).
  - Chống xóa Admin cuối cùng trong hệ thống (`LAST_ADMIN`, 409).
- **Capabilities**: Mutation [x] (Hard delete user khỏi database)

#### API 1.5: `POST /api/admin/users` (Create Teacher)
- **Method & Path**: `POST /api/admin/users`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Request Body**:
  ```json
  {
    "username": "teacher_nam",
    "email": "nam.teacher@tmdemy.vn",
    "password": "Password123",
    "confirm_password": "Password123",
    "phone": "0988776655",
    "bio": "Chuyên gia React & TypeScript",
    "socialLinks": { "github": "https://..." }
  }
  ```
- **Business Rules**: Tạo trực tiếp tài khoản Giảng viên đã kích hoạt sẵn (`isVerified = true`, `status = active`, `role = teacher`). Không gửi trường `role`.
- **Capabilities**: Mutation [x]

---

### 4.2. Domain: Course Management & Approval

#### API 2.1: `GET /api/admin/courses`
- **Method & Path**: `GET /api/admin/courses`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `status`: string (`approved` | `pending` | `rejected`)
  - `author`: UUID (lọc theo ID giảng viên)
  - `_destroy`: boolean (`true` xem khóa đã xóa mềm, `false` xem khóa bình thường)
  - `search`: string (tìm theo tiêu đề khóa học)
- **Response Structure**:
  ```json
  {
    "success": true,
    "message": "Fetched all courses successfully!",
    "data": {
      "courses": [
        {
          "id": "uuid-v4",
          "_id": "uuid-v4",
          "title": "Node.js Microservices Architecture",
          "slug": "nodejs-microservices-architecture",
          "price": 799000,
          "status": "approved",
          "author": { "id": "uuid", "username": "hoang_teacher" },
          "category": { "id": "uuid", "name": "Backend Development" },
          "_destroy": false
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 24, "totalPages": 3 }
    }
  }
  ```
- **Capabilities**: Pagination [x], Search [x], Filtering [x] (status, author, _destroy), Sorting [ ], Mutation [ ]

#### API 2.2: `POST /api/admin/courses`
- **Method & Path**: `POST /api/admin/courses`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Request Body**: Payload khóa học đầy đủ (`title`, `description`, `category`, `price`, `level`, `image`, `info`...).
- **Business Rules**: Khóa học do Admin tạo được gán ngay trạng thái `APPROVED` (bỏ qua bước kiểm duyệt).
- **Capabilities**: Mutation [x]

#### API 2.3: `PUT /api/admin/courses/:id`
- **Method & Path**: `PUT /api/admin/courses/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Purpose**: Admin cập nhật toàn diện thông tin bất kỳ khóa học nào.
- **Capabilities**: Mutation [x]

#### API 2.4: `DELETE /api/admin/courses/:id`
- **Method & Path**: `DELETE /api/admin/courses/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Business Rules**: Soft-delete khóa học (`isDestroyed = true`). Khóa học bị ẩn khỏi catalog nhưng lịch sử đơn hàng của học viên được bảo toàn.
- **Capabilities**: Mutation [x]

#### API 2.5: `PATCH /api/admin/courses/teacher/:id` (Course Approval)
- **Method & Path**: `PATCH /api/admin/courses/teacher/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Request Body**:
  ```json
  {
    "status": "approved" // hoặc "rejected" hoặc "pending"
  }
  ```
- **Business Rules**: Phê duyệt hoặc từ chối khóa học của giảng viên. Tự động bắn thông báo Notification đến tác giả của khóa học.
- **Capabilities**: Mutation [x]

---

### 4.3. Domain: Category Management

#### API 3.1: `POST /api/admin/categories`
- **Method & Path**: `POST /api/admin/categories`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Request Body**: `{ "name": "string", "description": "string" }`
- **Business Rules**: Tự động sinh `slug`. Kiểm tra trùng tên (`NAME_CONFLICT`) hoặc trùng slug (`SLUG_CONFLICT`, 409).
- **Capabilities**: Mutation [x]

#### API 3.2: `PUT /api/admin/categories/:id`
- **Method & Path**: `PUT /api/admin/categories/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Request Body**: `{ "name"?: string, "slug"?: string, "description"?: string, "isDestroyed"?: boolean }`
- **Capabilities**: Mutation [x]

#### API 3.3: `DELETE /api/admin/categories/:id`
- **Method & Path**: `DELETE /api/admin/categories/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Business Rules**: Soft-delete danh mục (`isDestroyed = true`).
- **Capabilities**: Mutation [x]

#### API 3.4: `GET /api/categories/` (Public / Shared)
- **Method & Path**: `GET /api/categories/`
- **Authentication**: `Public`
- **Query Parameters**: `page`, `limit`, `search`, `sortBy`
- **Purpose**: Lấy danh sách các danh mục đang hoạt động phục vụ hiển thị bảng và bộ lọc.

---

### 4.4. Domain: Coupon Management

#### API 4.1: `GET /api/coupons/`
- **Method & Path**: `GET /api/coupons/`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`, `teacher`
- **Business Rules**:
  - `admin`: Xem toàn bộ mã giảm giá trong toàn hệ thống.
  - `teacher`: Chỉ xem các mã do chính mình tạo.
- **Capabilities**: Mutation [ ]

#### API 4.2: `POST /api/coupons/`
- **Method & Path**: `POST /api/coupons/`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`, `teacher`
- **Request Body**: `{ "title": "string", "code": "string", "type": "percentage"|"number", "value": number, "limit": number, "startDate": "ISO", "endDate": "ISO", "active": boolean, "courses": string[] }`
- **Capabilities**: Mutation [x]

#### API 4.3: `GET /api/coupons/:id`, `PUT /api/coupons/:id`, `DELETE /api/coupons/:id`
- **Method & Path**: `GET|PUT|DELETE /api/coupons/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`, `teacher`
- **Capabilities**: Mutation [x]

---

### 4.5. Domain: Order Management & Reconciliation

#### API 5.1: `GET /api/orders/`
- **Method & Path**: `GET /api/orders/`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`, `teacher`
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `status`: string (`pending` | `completed` | `rejected`)
  - `search`: string (tìm theo mã đơn hàng)
  - `sortBy`: string (default: `"createdAt"`)
- **Business Rules**:
  - `admin`: Trả về toàn bộ đơn hàng trong hệ thống.
  - `teacher`: Chỉ trả về đơn hàng mua các khóa học do chính mình tạo.
- **Capabilities**: Pagination [x], Search [x], Filtering [x], Sorting [x], Mutation [ ]

#### API 5.2: `PUT /api/orders/:id`
- **Method & Path**: `PUT /api/orders/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`, `teacher`
- **Request Body**: `{ "status": "completed" | "rejected" }`
- **Business Rules**:
  - Khi chuyển sang `COMPLETED`: Tự động tạo bản ghi `Enrollment`, tăng số lượng đã bán của khóa học (`sold + 1`), thêm học viên vào kênh chat chung (`Conversation`), bắn Notification.
  - Khi chuyển sang `REJECTED`: Hủy bản ghi Enrollment tương ứng, hoàn lại lượt dùng coupon (`used - 1`).
- **Capabilities**: Mutation [x]

---

### 4.6. Domain: Comment Moderation

#### API 6.1: `GET /api/comments/`
- **Method & Path**: `GET /api/comments/`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`, `teacher`
- **Business Rules**: Admin xem toàn bộ bình luận trong toàn hệ thống; Giảng viên chỉ xem bình luận trong các khóa học của mình.
- **Capabilities**: Mutation [ ]

#### API 6.2: `DELETE /api/comments/admin/:id`
- **Method & Path**: `DELETE /api/comments/admin/:id`
- **Authentication**: `Bearer JWT required`
- **Role Requirement**: `admin`
- **Business Rules**: Quản trị viên xóa vĩnh viễn bất kỳ bình luận vi phạm nào và toàn bộ các câu trả lời con liên kết.
- **Capabilities**: Mutation [x]

---

## 5. ADMIN FEATURE AVAILABILITY MATRIX

Bảng đối chiếu giữa các tính năng kỳ vọng của Admin Portal và năng lực thực tế của Backend API:

| Nhóm chức năng | Tính năng chi tiết | Backend Endpoint hỗ trợ | Đánh giá | Trạng thái kỹ thuật |
| :--- | :--- | :--- | :---: | :---: |
| **Người dùng** | Xem danh sách người dùng (phân trang, lọc role, status, tìm kiếm) | `GET /api/admin/users` | Đầy đủ | **Sẵn sàng** |
| | Xem chi tiết hồ sơ tài khoản | `GET /api/admin/users/:id` | Đầy đủ | **Sẵn sàng** |
| | Thay đổi vai trò (role) và trạng thái (active/inactive) | `PUT /api/admin/users/:id` | Đầy đủ | **Sẵn sàng** |
| | Xóa tài khoản (chống xóa chính mình, chống xóa admin cuối cùng) | `DELETE /api/admin/users/:id` | Đầy đủ | **Sẵn sàng** |
| | Tạo trực tiếp tài khoản Giảng viên (Teacher pre-verified) | `POST /api/admin/users` | Đầy đủ | **Sẵn sàng** |
| **Khóa học** | Xem toàn bộ khóa học hệ thống (kèm lọc status, author, _destroy) | `GET /api/admin/courses` | Đầy đủ | **Sẵn sàng** |
| | Tạo khóa học xuất bản ngay (APPROVED) | `POST /api/admin/courses` | Đầy đủ | **Sẵn sàng** |
| | Chỉnh sửa bất kỳ khóa học nào | `PUT /api/admin/courses/:id` | Đầy đủ | **Sẵn sàng** |
| | Xóa mềm khóa học (_destroy = true) | `DELETE /api/admin/courses/:id` | Đầy đủ | **Sẵn sàng** |
| | Duyệt / Từ chối khóa học của Giảng viên | `PATCH /api/admin/courses/teacher/:id` | Đầy đủ | **Sẵn sàng** |
| **Danh mục** | Xem danh sách danh mục đang hoạt động | `GET /api/categories/` | Đầy đủ | **Sẵn sàng** |
| | Tạo mới danh mục khóa học | `POST /api/admin/categories` | Đầy đủ | **Sẵn sàng** |
| | Cập nhật tên, slug, mô tả danh mục | `PUT /api/admin/categories/:id` | Đầy đủ | **Sẵn sàng** |
| | Xóa mềm danh mục | `DELETE /api/admin/categories/:id` | Đầy đủ | **Sẵn sàng** |
| **Mã giảm giá** | Xem toàn bộ mã giảm giá toàn sàn | `GET /api/coupons/` | Đầy đủ | **Sẵn sàng** |
| | Tạo mã giảm giá toàn hệ thống | `POST /api/coupons/` | Đầy đủ | **Sẵn sàng** |
| | Sửa thông tin / Bật tắt mã giảm giá | `PUT /api/coupons/:id` | Đầy đủ | **Sẵn sàng** |
| | Xóa mã giảm giá | `DELETE /api/coupons/:id` | Đầy đủ | **Sẵn sàng** |
| **Đơn hàng** | Xem toàn bộ đơn hàng trong hệ thống (lọc status, search mã đơn) | `GET /api/orders/` | Đầy đủ | **Sẵn sàng** |
| | Cập nhật trạng thái đơn hàng (Xác nhận COMPLETED, Hủy REJECTED) | `PUT /api/orders/:id` | Đầy đủ | **Sẵn sàng** |
| **Bình luận** | Quản lý toàn bộ bình luận hệ thống | `GET /api/comments/` | Đầy đủ | **Sẵn sàng** |
| | Xóa bình luận vi phạm và câu trả lời con | `DELETE /api/comments/admin/:id` | Đầy đủ | **Sẵn sàng** |
| **Dashboard** | Đếm Tổng người dùng, Học viên, Giảng viên | `GET /api/admin/users?limit=1&...` | Suy diễn qua `pagination.total` | **Hỗ trợ gián tiếp** |
| | Đếm Tổng khóa học, Khóa chờ duyệt | `GET /api/admin/courses?limit=1&...` | Suy diễn qua `pagination.total` | **Hỗ trợ gián tiếp** |
| | Đếm Tổng đơn hàng, Đơn chờ xử lý | `GET /api/orders/?limit=1&...` | Suy diễn qua `pagination.total` | **Hỗ trợ gián tiếp** |
| | Biểu đồ doanh thu hệ thống theo thời gian (Revenue timeline) | *Chưa có API tổng hợp* | Không có endpoint | **`[BACKEND GAP]`** |
| | Biểu đồ tăng trưởng người dùng mới theo tháng (User growth) | *Chưa có API tổng hợp* | Không có endpoint | **`[BACKEND GAP]`** |
| | Báo cáo tỷ lệ hoàn thành học tập toàn sàn | *Chưa có API tổng hợp* | Không có endpoint | **`[BACKEND GAP]`** |

---

## 6. ROLE & PERMISSION MATRIX

Ma trận phân quyền 3 vai trò (`user`, `teacher`, `admin`) dựa trên kết quả khảo sát API contract thực tế:

| Tài nguyên / Chức năng | Học viên (`user`) | Giảng viên (`teacher`) | Quản trị viên (`admin`) | Ghi chú kỹ thuật |
| :--- | :---: | :---: | :---: | :--- |
| **Admin Portal Shell (`/admin/*`)** | ❌ Chặn (403) | ❌ Chặn (403) | ✅ Cho phép | `RouteGuard allowedRoles={['admin']}` |
| **Teacher Portal Shell (`/teacher/*`)**| ❌ Chặn (403) | ✅ Cho phép | ✅ Cho phép | Admin có quyền truy cập kiểm tra portal |
| **Quản lý Người dùng (`/admin/users`)**| ❌ Từ chối | ❌ Từ chối | ✅ Toàn quyền | Endpoint `GET/PUT/DELETE /api/admin/users` |
| **Tạo tài khoản Giảng viên** | ❌ Từ chối | ❌ Từ chối | ✅ Toàn quyền | Endpoint `POST /api/admin/users` |
| **Duyệt / Từ chối Khóa học** | ❌ Từ chối | ❌ Từ chối | ✅ Toàn quyền | Endpoint `PATCH /api/admin/courses/teacher/:id` |
| **Quản lý Khóa học toàn sàn** | ❌ Từ chối | ⚠️ Chỉ khóa của mình | ✅ Toàn quyền | Giảng viên dùng `/api/teacher/courses/` |
| **Xóa khóa học đã duyệt** | ❌ Từ chối | ❌ Bị chặn (chỉ xóa khi PENDING)| ✅ Cho phép | Admin soft-delete qua `DELETE /api/admin/courses/:id` |
| **Quản lý Danh mục (`/admin/categories`)**| 👁️ Chỉ xem Public | 👁️ Chỉ xem Public | ✅ Tạo, Sửa, Xóa mềm | Endpoints `/api/admin/categories/*` |
| **Quản lý Mã giảm giá (`/admin/coupons`)**| ⚠️ Chỉ áp dụng mã | ⚠️ Chỉ mã mình tạo | ✅ Toàn bộ mã sàn | Admin quản lý toàn bộ coupon trong hệ thống |
| **Quản lý Đơn hàng (`/admin/orders`)** | 👁️ Chỉ đơn của mình | ⚠️ Chỉ đơn khóa mình | ✅ Toàn bộ đơn sàn | Admin xem và gạch nợ đơn hàng toàn hệ thống |
| **Kiểm duyệt Bình luận (`/admin/comments`)**| ⚠️ Chỉ xóa cmt mình | ⚠️ Chỉ cmt khóa mình | ✅ Xóa bất kỳ cmt | Endpoint `DELETE /api/comments/admin/:id` |
| **Kiểm duyệt Đánh giá (Rating)** | ⚠️ Đánh giá khóa học | ⚠️ Quản lý cmt khóa mình | ✅ Quản lý toàn sàn | Quản lý qua `/api/ratings/manage/` |

---

## 7. ADMIN ROUTE MAP

Đề xuất kiến trúc tuyến đường (Frontend Route Map) cho Admin Portal trong Next.js App Router:

```text
/admin
├── /admin/dashboard                # Trang Bảng điều khiển Quản trị viên trung tâm
├── /admin/users                    # Quản lý danh sách người dùng, phân quyền, trạng thái
├── /admin/courses                  # Quản lý toàn bộ khóa học, phê duyệt khóa học giảng viên
├── /admin/categories               # Quản lý danh mục khóa học (CRUD)
├── /admin/coupons                  # Quản lý mã giảm giá toàn sàn
├── /admin/orders                   # Quản lý đơn hàng, đối soát và gạch nợ học phí
└── /admin/comments                 # Kiểm duyệt bình luận, xử lý báo cáo vi phạm
```

### Rationale cho việc không tạo route con dư thừa:
- **Chi tiết người dùng (`/admin/users/[id]`)**: Thay vì tách trang riêng gây gián đoạn luồng làm việc, thông tin chi tiết và form phân quyền người dùng được tích hợp dưới dạng **Slide-over Drawer** trực tiếp trong trang danh sách `/admin/users`, giúp admin duyệt nhanh danh sách mà không mất context.
- **Thẩm định khóa học (`/admin/courses/[id]`)**: Đề cương thẩm định và video demo được tích hợp vào **Right Inspection Drawer** trực tiếp trong trang `/admin/courses`, cho phép admin bấm Duyệt hoặc Từ chối tức thì.
- **Chi tiết đơn hàng (`/admin/orders/[id]`)**: Tích hợp dưới dạng **Reconciliation Drawer** trên trang `/admin/orders` phục vụ gạch nợ nhanh.

---

## 8. ADMIN INFORMATION ARCHITECTURE

Cấu trúc cây điều hướng trên Admin Sidebar (`src/components/admin/admin-sidebar.tsx`):

```text
TMdemy Admin Shell
├── [Brand Header]
│   ├── Logo TMdemy Admin (Modern Academic Violet)
│   └── Badge: "Cổng Quản Trị Hệ Thống"
│
├── [Cụm Điều Hướng Chính]
│   ├── 1. Tổng quan
│   │   └── Route: /admin/dashboard (Icon: dashboard)
│   │
│   ├── 2. Người dùng
│   │   └── Route: /admin/users (Icon: group)
│   │
│   ├── 3. Nội dung giảng dạy
│   │   ├── Khóa học (Route: /admin/courses, Icon: school, Badge: số khóa chờ duyệt)
│   │   └── Danh mục (Route: /admin/categories, Icon: category)
│   │
│   ├── 4. Thương mại & Doanh thu
│   │   ├── Đơn hàng (Route: /admin/orders, Icon: shopping_cart, Badge: số đơn pending)
│   │   └── Mã giảm giá (Route: /admin/coupons, Icon: local_offer)
│   │
│   └── 5. Kiểm duyệt & An toàn
│       └── Bình luận (Route: /admin/comments, Icon: forum, Badge: số cmt bị báo cáo)
│
└── [Cụm Chân Trang Sidebar]
    ├── Chế độ Học viên (Link nhanh sang `/`)
    └── Đăng xuất (Thu hồi phiên làm việc)
```

---

## 9. ADMIN DASHBOARD DATA MAPPING

Khảo sát dữ liệu phục vụ trang Bảng điều khiển Quản trị viên (`/admin/dashboard`):

### 9.1. Các chỉ số KPI có thể trích xuất từ API hiện tại:

| Nhóm KPI | API nguồn | Query trích xuất | Trường dữ liệu | Khả thi |
| :--- | :--- | :--- | :--- | :---: |
| **Tổng người dùng** | `GET /api/admin/users` | `?limit=1` | `pagination.total` | ✅ **100%** |
| **Tổng Giảng viên** | `GET /api/admin/users` | `?limit=1&role=teacher` | `pagination.total` | ✅ **100%** |
| **Tổng Học viên** | `GET /api/admin/users` | `?limit=1&role=user` | `pagination.total` | ✅ **100%** |
| **Tài khoản đang hoạt động**| `GET /api/admin/users` | `?limit=1&status=active` | `pagination.total` | ✅ **100%** |
| **Tổng số khóa học** | `GET /api/admin/courses`| `?limit=1` | `pagination.total` | ✅ **100%** |
| **Khóa học chờ duyệt**| `GET /api/admin/courses`| `?limit=1&status=pending` | `pagination.total` | ✅ **100%** |
| **Khóa học đã xuất bản**| `GET /api/admin/courses`| `?limit=1&status=approved` | `pagination.total` | ✅ **100%** |
| **Tổng số đơn hàng** | `GET /api/orders/` | `?limit=1` | `pagination.total` | ✅ **100%** |
| **Đơn chờ gạch nợ** | `GET /api/orders/` | `?limit=1&status=pending` | `pagination.total` | ✅ **100%** |
| **Đơn hoàn thành** | `GET /api/orders/` | `?limit=1&status=completed` | `pagination.total` | ✅ **100%** |
| **Danh sách chờ duyệt nhanh**| `GET /api/admin/courses`| `?limit=5&status=pending` | `data.courses` | ✅ **100%** |
| **Người dùng mới đăng ký**| `GET /api/admin/users` | `?limit=5&sortBy=createdAt` | `data.users` | ✅ **100%** |

### 9.2. Khoảng trống dữ liệu Dashboard (`[BACKEND GAP]`):
- **Tổng doanh thu hệ thống toàn sàn**: Không có endpoint `/api/admin/statistics/overview`. Frontend hiện tại chỉ có thể tính tổng doanh thu bằng cách fetch danh sách đơn hàng hoàn tất hoặc chờ backend cung cấp API thống kê.
- **Biểu đồ doanh thu theo thời gian (Revenue Timeline Chart)**: API `GET /api/teacher/statistics/revenue` chỉ trả số liệu của khóa học thuộc giảng viên hiện tại, **không trả số liệu toàn sàn**. Cần backend cung cấp `GET /api/admin/statistics/revenue`.
- **Biểu đồ tăng trưởng người dùng (User Growth Chart)**: Không có endpoint nhóm người dùng đăng ký theo tuần/tháng. Cần backend cung cấp `GET /api/admin/statistics/users`.
- **Phương án hiển thị tạm thời**: Ở phase F9.3, Dashboard sẽ hiển thị trọn vẹn 6 Thẻ KPI tổng hợp thực tế từ pagination totals, khu vực "Khóa học cần thẩm định gấp" và bảng "Người dùng mới đăng ký". Khu vực biểu đồ sẽ hiển thị thông báo tiến độ hoặc thẻ mô phỏng cấu trúc rõ ràng kèm nhãn `[BACKEND GAP]`.

---

## 10. ADMIN COMPONENT ARCHITECTURE

Cấu trúc component dự kiến cho Admin Portal (được thiết kế để triển khai từ F9.2 trở đi):

```text
src/components/admin/
├── admin-shell.tsx                 # Khung bao bọc layout, RouteGuard allowedRoles={['admin']}
├── admin-sidebar.tsx               # Thanh điều hướng trái, responsive mobile drawer
├── admin-header.tsx                # Thanh header trên cùng, breadcrumbs, search, admin profile
├── admin-breadcrumb.tsx            # Breadcrumbs tự động parse route URL
│
├── dashboard/                      # Components cho Admin Dashboard
│   ├── admin-kpi-card.tsx          # Thẻ hiển thị chỉ số đo lường với icon và % tăng trưởng
│   ├── pending-courses-queue.tsx   # Danh sách khóa học chờ duyệt nhanh
│   ├── recent-users-table.tsx      # Bảng người dùng đăng ký gần nhất
│   └── quick-reconciliation-card.tsx # Thẻ đối soát đơn hàng cần gạch nợ
│
├── users/                          # Components cho User Management
│   ├── user-data-table.tsx         # Bảng người dùng có checkbox, avatar, status badges
│   ├── user-filter-toolbar.tsx     # Bộ lọc Role, Status, ô tìm kiếm và sắp xếp
│   ├── user-detail-drawer.tsx      # Slide-over Drawer xem profile và đổi role/status
│   └── create-teacher-modal.tsx    # Modal form tạo tài khoản Giảng viên (POST /api/admin/users)
│
├── courses/                        # Components cho Course Management & Approval
│   ├── course-data-table.tsx       # Bảng khóa học với thumbnail, giảng viên, giá, status
│   ├── course-status-tabs.tsx      # Tabs: Tất cả, Chờ duyệt, Đã xuất bản, Từ chối, Thùng rác
│   ├── course-inspection-drawer.tsx# Drawer xem trước giáo trình, video demo và nút Duyệt/Từ chối
│   └── reject-reason-dialog.tsx    # Dialog nhập lý do từ chối khóa học gửi giảng viên
│
├── categories/                     # Components cho Category Management
│   ├── category-data-table.tsx     # Bảng danh mục khóa học
│   └── category-form-modal.tsx     # Modal thêm/sửa danh mục (tên, slug, mô tả)
│
├── coupons/                        # Components cho Coupon Management
│   ├── coupon-data-table.tsx       # Bảng mã giảm giá kèm thanh tiến độ lượt dùng
│   └── coupon-form-drawer.tsx      # Drawer tạo/sửa mã giảm giá toàn sàn
│
├── orders/                         # Components cho Order Management
│   ├── order-data-table.tsx        # Bảng đơn hàng có mã đơn, học viên, tổng tiền, phương thức
│   └── order-detail-drawer.tsx     # Drawer chi tiết đơn hàng, lịch sử và nút gạch nợ
│
└── comments/                       # Components cho Comment Moderation
    ├── comment-moderation-list.tsx # Danh sách bình luận bị báo cáo kèm ngữ cảnh bài học
    └── delete-comment-dialog.tsx   # Dialog xác nhận xóa bình luận và các phản hồi con
```

---

## 11. ADMIN API CLIENT STRATEGY

### 11.1. Nguyên tắc tổ chức Service Layer
Tạo file dịch vụ chuyên biệt `src/services/admin.service.ts` nhằm đóng gói toàn bộ các lời gọi mạng dành riêng cho Admin, kế thừa trực tiếp từ Centralized API Client (`src/lib/api/client.ts`):
- Tự động đính kèm header `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`.
- Tự động xử lý cơ chế làm mới token khi gặp mã lỗi 401.
- Chuẩn hóa kiểu trả về theo mẫu `ApiResponse<T>`.

### 11.2. Danh sách hàm dự kiến trong `src/services/admin.service.ts`
```typescript
// Users
getUsers(params: AdminUserQueryParams): Promise<ApiResponse<AdminUserListResponse>>
getUserDetail(id: string): Promise<ApiResponse<AdminUserDetail>>
updateUser(id: string, data: UpdateUserDTO): Promise<ApiResponse<AdminUserDetail>>
deleteUser(id: string): Promise<ApiResponse<void>>
createTeacher(data: CreateTeacherDTO): Promise<ApiResponse<AdminUserDetail>>

// Courses
getCourses(params: AdminCourseQueryParams): Promise<ApiResponse<AdminCourseListResponse>>
createCourse(data: CreateCourseDTO): Promise<ApiResponse<Course>>
updateCourse(id: string, data: UpdateCourseDTO): Promise<ApiResponse<Course>>
deleteCourse(id: string): Promise<ApiResponse<void>> // Soft delete
reviewTeacherCourse(id: string, status: 'approved' | 'rejected' | 'pending'): Promise<ApiResponse<Course>>

// Categories
createCategory(data: { name: string; description?: string }): Promise<ApiResponse<Category>>
updateCategory(id: string, data: Partial<Category>): Promise<ApiResponse<Category>>
deleteCategory(id: string): Promise<ApiResponse<void>>

// Orders
getAllOrders(params: AdminOrderQueryParams): Promise<ApiResponse<AdminOrderListResponse>>
updateOrderStatus(id: string, status: 'completed' | 'rejected'): Promise<ApiResponse<Order>>

// Coupons
getCoupons(): Promise<ApiResponse<Coupon[]>>
getCouponDetail(id: string): Promise<ApiResponse<Coupon>>
createCoupon(data: CreateCouponDTO): Promise<ApiResponse<Coupon>>
updateCoupon(id: string, data: Partial<CreateCouponDTO>): Promise<ApiResponse<Coupon>>
deleteCoupon(id: string): Promise<ApiResponse<void>>

// Comments
getAllComments(): Promise<ApiResponse<Comment[]>>
deleteCommentByAdmin(id: string): Promise<ApiResponse<void>>
```

---

## 12. AUTHENTICATION & ROUTE PROTECTION

### 12.1. Cơ chế bảo vệ Route `/admin/*`
- Toàn bộ tuyến đường `/admin/*` được bao bọc bởi `AdminShell` trong `src/app/admin/layout.tsx`.
- `AdminShell` sử dụng `RouteGuard` với các tham số:
  ```tsx
  <RouteGuard requireAuth allowedRoles={['admin']}>
    {children}
  </RouteGuard>
  ```
- **Xử lý tình huống**:
  - Khách chưa đăng nhập: `RouteGuard` lập tức đẩy sang `/login?redirect=/admin/...`.
  - Học viên (`user`) hoặc Giảng viên (`teacher`) cố ý truy cập: `RouteGuard` chặn hiển thị, render màn hình cảnh báo lỗi **403 Forbidden** kèm giải thích rõ tài khoản của họ không có quyền quản trị, đồng thời cung cấp nút chuyển hướng về trang chủ hoặc Teacher Dashboard.

### 12.2. Kiểm soát hiển thị trên Header / Navigation chung
- Khi tài khoản đăng nhập có `user.role === 'admin'`:
  - Profile Dropdown trên Navbar chung hiển thị thêm mục liên kết nhanh **"Cổng Quản Trị Hệ Thống"** dẫn tới `/admin/dashboard`.
  - Giảng viên và Học viên không nhìn thấy liên kết này.

---

## 13. STITCH DESIGN SYSTEM

Kiểm tra trực tiếp từ Stitch project `tmdemy` (`projects/4018234784417032182`):
- **Design System Name**: `Modern Academic Violet` (`assets/5ee7138b7bc143c38a2790b53d505be7`)
- **Tông màu chủ đạo (Primary)**: `#7240b8` / `#9564dd`
- **Tông màu nền (Canvas Base)**: `#fdf8ff` (Ultra-soft cool-lavender atmospheric backdrop)
- **Tông màu bề mặt thẻ (Card Surface)**: `#ffffff` (Pure white card surface)
- **Đường viền ngăn cách (Structural Border)**: `#f1ebff` / `#eceaf3` (Fine hairline separation)
- **Văn bản chính (Text Ink Primary)**: `#1c192c` / `#1e1b2e` (Deep violet-tinted charcoal)
- **Văn bản phụ (Text Ink Secondary)**: `#635a72` / `#6c687d`
- **Màu ngữ nghĩa (Semantic Accents)**:
  - Thành công / Hoàn thành: `#10b981` (Success Emerald)
  - Cảnh báo / Chờ duyệt: `#f59e0b` (Amber Warning)
  - Vi phạm / Lỗi / Xóa: `#ba1a1a` (Error Crimson)
- **Typography**:
  - Headings: `Plus Jakarta Sans`
  - Body & Metadata: `Be Vietnam Pro`
- **Bo góc (Rounded)**: `rounded-xl` (12px), `rounded-2xl` (16px), Status Badges `rounded-full` (9999px).

---

## 14. STITCH SCREEN INVENTORY

Toàn bộ 6 màn hình quản trị Admin Portal đã được tạo thành công trên Stitch MCP và lưu trữ chính xác trong project `tmdemy` (`projects/4018234784417032182`). Bảng danh mục màn hình chính thức:

| STT | Screen Title | Screen ID | Canonical Resource Name | Intended Route | Mục đích & Thành phần chính |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **TMdemy Admin - Bảng điều khiển Quản trị viên** | `bd2c030993c64763a0270ea658583a65` | `projects/4018234784417032182/screens/bd2c030993c64763a0270ea658583a65` | `/admin/dashboard` | Dashboard tổng quan: 6 KPI metrics, danh sách khóa học chờ duyệt nhanh, đối soát đơn hàng, người dùng mới đăng ký. |
| **2** | **TMdemy Admin - Quản lý Người dùng** | `37e6b35e079a4de392e92afe223be032` | `projects/4018234784417032182/screens/37e6b35e079a4de392e92afe223be032` | `/admin/users` | Bảng quản lý người dùng, lọc role/status, nút Thêm Giảng viên mới, Slide-over Drawer đổi role và trạng thái. |
| **3** | **TMdemy Admin - Quản lý & Phê duyệt Khóa học** | `5077abd2d3754e659e5f3fc55dcdc62e` | `projects/4018234784417032182/screens/5077abd2d3754e659e5f3fc55dcdc62e` | `/admin/courses` | Quản lý khóa học toàn sàn, tabs trạng thái (Pending/Approved/Rejected), Drawer thẩm định video demo và nút Duyệt/Từ chối. |
| **4** | **TMdemy Admin - Quản lý Danh mục Khóa học** | `f38a997ff69b4463a3a0dfb0f1a8554a` | `projects/4018234784417032182/screens/f38a997ff69b4463a3a0dfb0f1a8554a` | `/admin/categories` | Quản lý cây danh mục, bảng danh mục kèm số khóa học, Slide-over Drawer thêm và sửa danh mục. |
| **5** | **TMdemy Admin - Quản lý Đơn hàng** | `d9332aae0c8d47ffa37c08e806dfd5e3` | `projects/4018234784417032182/screens/d9332aae0c8d47ffa37c08e806dfd5e3` | `/admin/orders` | Đối soát đơn hàng toàn sàn, tabs Pending/Completed/Rejected, nút gạch nợ nhanh, Drawer chi tiết thanh toán. |
| **6** | **TMdemy Admin - Quản lý Mã giảm giá (Coupons)** | `f39a2afecef5445c902772086178d790` | `projects/4018234784417032182/screens/f39a2afecef5445c902772086178d790` | `/admin/coupons` | Quản lý mã ưu đãi toàn sàn, progress bar theo dõi lượt dùng, Drawer tạo và cấu hình mã coupon. |
| **7** | **TMdemy Admin - Kiểm duyệt Bình luận** | `4d6e4bb5e6fd4a7bae654b28ac590b48` | `projects/4018234784417032182/screens/4d6e4bb5e6fd4a7bae654b28ac590b48` | `/admin/comments` | Kiểm duyệt bình luận, tabs xử lý bình luận bị gắn cờ vi phạm/spam, Dialog xác nhận xóa vĩnh viễn thảo luận con. |

*Ghi chú*: Tất cả Screen IDs trên đều được trích xuất trực tiếp từ phản hồi thực tế của Stitch MCP Server, không sử dụng ID giả định.

---

## 15. SECURITY & UX RISKS

Đánh giá rủi ro an ninh và trải nghiệm người dùng trong Admin Portal:

1. **Rủi ro người dùng vãng lai hoặc giảng viên truy cập trái phép `/admin`**:
   - *Nguy cơ*: Học viên hoặc Giảng viên nhập thủ công URL `/admin/dashboard` để xem thông tin nội bộ.
   - *Giải pháp*: `AdminShell` bọc `RouteGuard` với `allowedRoles={['admin']}`. Nếu không khớp role, lập tức chặn render nội dung nhạy cảm và hiển thị màn hình 403 Forbidden.
2. **Rủi ro phiên làm việc của Admin bị hết hạn đột ngột**:
   - *Nguy cơ*: Admin đang thao tác kiểm duyệt thì Access Token hết hạn, API trả về 401.
   - *Giải pháp*: API Client tự động kích hoạt luồng silent refresh token. Nếu Refresh Token cũng hết hạn, tự động lưu lại đường dẫn hiện tại và chuyển hướng về `/login?redirect=...`.
3. **Rủi ro tự xóa tài khoản hoặc xóa Admin cuối cùng**:
   - *Nguy cơ*: Admin vô tình bấm xóa chính tài khoản mình hoặc xóa hết admin trong hệ thống.
   - *Giải pháp*: Backend đã có sẵn business rule chặn `SELF_DELETE_BLOCKED` (400) và `LAST_ADMIN` (409). Ở giao diện, nút xóa trên chính dòng tài khoản của Admin đang đăng nhập sẽ bị ẩn hoặc vô hiệu hóa (`disabled`) kèm tooltip giải thích.
4. **Rủi ro thao tác phá hủy (Destructive Mutations)**:
   - *Nguy cơ*: Thao tác xóa người dùng, xóa khóa học hoặc xóa bình luận diễn ra chỉ với 1 cú click nhầm.
   - *Giải pháp*: Bắt buộc hiển thị Confirmation Dialog 2 bước: Yêu cầu xác nhận rõ tên đối tượng bị xóa trước khi phát lệnh DELETE lên server.
5. **Rủi ro gửi yêu cầu trùng lặp (Double Submission)**:
   - *Nguy cơ*: Admin click liên tục vào nút "Phê duyệt" hoặc "Gạch nợ" làm phát sinh nhiều sự kiện song song.
   - *Giải pháp*: Sử dụng cờ `isSubmitting = true`, làm mờ nút (`opacity-60 pointer-events-none`) và hiển thị Spinner trong suốt thời gian mutation pending.
6. **Rủi ro Race Condition trong Tìm kiếm & Phân trang**:
   - *Nguy cơ*: Admin gõ từ khóa tìm kiếm nhanh, response của request trước về sau request sau gây sai lệch kết quả bảng.
   - *Giải pháp*: Áp dụng Debounce 300ms - 400ms trên ô tìm kiếm và sử dụng AbortController để hủy bỏ request cũ khi có từ khóa mới.
7. **Rủi ro rò rỉ dữ liệu nhạy cảm**:
   - *Nguy cơ*: Token, mật khẩu hoặc thông tin thẻ xuất hiện trong UI hoặc `console.log`.
   - *Giải pháp*: API backend đã ẩn hoàn toàn trường `password` và `refreshToken`. Frontend loại bỏ triệt để mọi lệnh `console.log` chứa dữ liệu nhạy cảm.

---

## 16. BACKEND GAPS

Các chức năng phía Frontend cần nhưng Backend API chưa cung cấp hoặc chưa có endpoint tối ưu:

### `[BACKEND GAP 1]`: Thiếu API Thống kê Tổng hợp dành riêng cho Quản trị viên (`/api/admin/statistics`)
- **Năng lực cần thiết**: Thống kê tổng quan toàn sàn (Doanh thu thực tế tích lũy, doanh thu tháng này, tốc độ tăng trưởng, tỷ lệ đơn hàng).
- **Endpoint mong đợi**: `GET /api/admin/statistics/overview`
- **Lý do Frontend cần**: Hiện tại chỉ có `/api/teacher/statistics/overview` (chỉ trả số liệu của khóa học do chính giảng viên đó tạo). Admin Portal không có endpoint để lấy tổng doanh thu toàn sàn.
- **Giải pháp tạm thời**: Tính toán số lượng bản ghi thông qua trường `pagination.total` của các endpoint danh sách (`/api/admin/users`, `/api/admin/courses`, `/api/orders/`).

### `[BACKEND GAP 2]`: Thiếu API Biểu đồ Doanh thu và Tăng trưởng Người dùng toàn sàn
- **Năng lực cần thiết**: Dữ liệu chuỗi thời gian (Timeseries) để vẽ biểu đồ doanh thu theo 7 ngày, 30 ngày, 12 tháng và số lượng người dùng mới đăng ký.
- **Endpoint mong đợi**: `GET /api/admin/statistics/revenue` và `GET /api/admin/statistics/users`
- **Lý do Frontend cần**: Trực quan hóa tốc độ phát triển của nền tảng TMdemy trên Dashboard.
- **Giải pháp tạm thời**: Ở F9.3, hiển thị thẻ thông báo đang cập nhật dữ liệu thống kê chuỗi thời gian hoặc hiển thị danh sách hoạt động gần đây thay thế.

### `[BACKEND GAP 3]`: Thiếu Endpoint xem chi tiết một Đơn hàng (`GET /api/orders/:id`)
- **Năng lực cần thiết**: Xem chi tiết 1 đơn hàng theo UUID.
- **Hiện trạng**: Trong `ORDER_API.md`, chỉ có `GET /api/orders/` (danh sách) và `PUT /api/orders/:id` (cập nhật). Chưa có route GET đơn lẻ cho 1 order.
- **Giải pháp tạm thời**: Lấy thông tin đơn hàng trực tiếp từ object của dòng đã fetch trong `data.orders` để mở Drawer xem chi tiết.

---

## 17. API CONTRACT ISSUES

Các điểm lưu ý trong tài liệu đặc tả API:

### `[API CONTRACT ISSUE 1]`: Đường dẫn của Comment Moderation
- **Chi tiết**: API xóa bình luận của Admin nằm tại `DELETE /api/comments/admin/:id`, KHÔNG nằm dưới prefix `/api/admin/comments/:id`. Frontend Service cần gọi chính xác path này.

### `[API CONTRACT ISSUE 2]`: Endpoint duyệt khóa học của Giảng viên
- **Chi tiết**: Endpoint phê duyệt khóa học nằm tại `PATCH /api/admin/courses/teacher/:id` với body `{ "status": "approved" | "rejected" | "pending" }`.

### `[API CONTRACT ISSUE 3]`: Tạo khóa học trực tiếp bởi Admin
- **Chi tiết**: Endpoint `POST /api/admin/courses` trả về khóa học có trạng thái `approved` ngay lập tức, không đi qua trạng thái `pending`.

---

## 18. F9.2–F9.10 IMPLEMENTATION ROADMAP

Lộ trình triển khai chi tiết từng phase từ F9.2 đến F9.10:

```text
F9.2: Shell & RouteGuard ──> F9.3: Dashboard ──> F9.4: Users ──> F9.5: Courses & Approval
                                                                          │
F9.10: Integration & Test <── F9.9: Comments <── F9.8: Orders <── F9.7: Coupons <── F9.6: Categories
```

### Phase F9.2 — Admin Layout Shell & Route Protection
- **Nội dung**: Xây dựng khung nền tảng cho Admin Portal.
- **Pages**: `src/app/admin/layout.tsx`
- **Components**: `AdminShell`, `AdminSidebar`, `AdminHeader`, `AdminBreadcrumb`
- **Route Protection**: Bọc `RouteGuard requireAuth allowedRoles={['admin']}`
- **Acceptance Criteria**: Đăng nhập bằng tài khoản admin truy cập được `/admin`; tài khoản user/teacher bị chặn 403; sidebar responsive mượt mà trên Desktop/Tablet/Mobile; dark mode đồng bộ.

### Phase F9.3 — Admin Dashboard (Overview & Quick Actions)
- **Nội dung**: Bảng điều khiển trung tâm với các chỉ số KPI vận hành.
- **Pages**: `src/app/admin/dashboard/page.tsx`
- **Components**: `AdminKpiCard`, `PendingCoursesQueue`, `RecentUsersTable`, `QuickReconciliationCard`
- **APIs**: `GET /api/admin/users?limit=1`, `GET /api/admin/courses?limit=5&status=pending`, `GET /api/orders/?limit=1`
- **Acceptance Criteria**: Hiển thị chính xác các số liệu người dùng, khóa học, đơn hàng; danh sách duyệt nhanh hoạt động mượt mà; đầy đủ 6 trạng thái UX.

### Phase F9.4 — User Management & Teacher Creation
- **Nội dung**: Quản lý toàn diện tài khoản người dùng và phân quyền.
- **Pages**: `src/app/admin/users/page.tsx`
- **Components**: `UserDataTable`, `UserFilterToolbar`, `UserDetailDrawer`, `CreateTeacherModal`, `DeleteUserDialog`
- **APIs**: `GET /api/admin/users`, `GET /api/admin/users/:id`, `PUT /api/admin/users/:id`, `DELETE /api/admin/users/:id`, `POST /api/admin/users`
- **Acceptance Criteria**: Tìm kiếm username/email với debounce; lọc role và status chuẩn xác; đổi vai trò và trạng thái lưu thành công; tạo giảng viên mới thành công; chặn tự xóa tài khoản an toàn.

### Phase F9.5 — Course Management & Approval
- **Nội dung**: Quản lý khóa học toàn hệ thống và thẩm định giáo trình của giảng viên.
- **Pages**: `src/app/admin/courses/page.tsx`
- **Components**: `CourseDataTable`, `CourseStatusTabs`, `CourseInspectionDrawer`, `RejectReasonDialog`
- **APIs**: `GET /api/admin/courses`, `PATCH /api/admin/courses/teacher/:id`, `PUT /api/admin/courses/:id`, `DELETE /api/admin/courses/:id`
- **Acceptance Criteria**: Tabs lọc All, Pending, Approved, Rejected, Destroyed; xem trước video demo và đề cương trong Drawer; phê duyệt hoặc từ chối khóa học thành công kèm notification.

### Phase F9.6 — Category Management
- **Nội dung**: Quản lý phân cấp danh mục khóa học.
- **Pages**: `src/app/admin/categories/page.tsx`
- **Components**: `CategoryDataTable`, `CategoryFormModal`, `DeleteCategoryDialog`
- **APIs**: `GET /api/categories/`, `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`
- **Acceptance Criteria**: Hiển thị danh sách danh mục kèm slug và số khóa học; tạo mới tự động tạo slug; sửa và xóa mềm danh mục an toàn.

### Phase F9.7 — Coupon Management
- **Nội dung**: Quản lý các chiến dịch mã giảm giá toàn sàn.
- **Pages**: `src/app/admin/coupons/page.tsx`
- **Components**: `CouponDataTable`, `CouponFormDrawer`, `DeleteCouponDialog`
- **APIs**: `GET /api/coupons/`, `POST /api/coupons/`, `PUT /api/coupons/:id`, `DELETE /api/coupons/:id`
- **Acceptance Criteria**: Quản lý mã giảm giá % hoặc số tiền cố định; progress bar lượt dùng trực quan; bật/tắt kích hoạt mã; xóa mã coupon an toàn.

### Phase F9.8 — Order & Revenue Management
- **Nội dung**: Quản lý toàn bộ giao dịch mua khóa học và đối soát gạch nợ.
- **Pages**: `src/app/admin/orders/page.tsx`
- **Components**: `OrderDataTable`, `OrderFilterToolbar`, `OrderDetailDrawer`, `ConfirmPaymentDialog`
- **APIs**: `GET /api/orders/`, `PUT /api/orders/:id`
- **Acceptance Criteria**: Danh sách đơn hàng toàn hệ thống; lọc pending, completed, rejected; thao tác gạch nợ chuyển trạng thái completed tự động ghi danh cho học viên và thêm vào nhóm chat.

### Phase F9.9 — Comment Moderation
- **Nội dung**: Kiểm duyệt bình luận bài học và xử lý vi phạm.
- **Pages**: `src/app/admin/comments/page.tsx`
- **Components**: `CommentModerationList`, `CommentFilterToolbar`, `DeleteCommentDialog`
- **APIs**: `GET /api/comments/`, `DELETE /api/comments/admin/:id`
- **Acceptance Criteria**: Lọc bình luận theo khóa học; xem ngữ cảnh bài học; xóa vĩnh viễn bình luận vi phạm và toàn bộ thảo luận con liên quan.

### Phase F9.10 — Admin Integration & Testing
- **Nội dung**: Kiểm thử tích hợp toàn diện, rà soát typecheck, accessibility, responsive và liên kết cross-portal.
- **Acceptance Criteria**: Chạy kiểm tra `npx tsc --noEmit` đạt 0 lỗi; `npm run lint` đạt 0 cảnh báo; kiểm thử luồng e2e trên trình duyệt thông suốt.

---

## 19. RECOMMENDED IMPLEMENTATION ORDER

Thứ tự triển khai đề xuất tuân thủ hoàn hảo lộ trình tiêu chuẩn:
1. **F9.2 trước tiên**: Phải có Shell, Sidebar, Header và RouteGuard vững chắc trước khi xây dựng bất kỳ trang nào.
2. **F9.3 thứ hai**: Admin Dashboard cung cấp cái nhìn tổng quan và lối tắt điều hướng đến các phân hệ khác.
3. **F9.4 & F9.5 tiếp theo**: Hai phân hệ nghiệp vụ cốt lõi nhất của Admin (Quản lý người dùng & Thẩm định khóa học).
4. **F9.6, F9.7, F9.8, F9.9 tuần tự**: Quản lý nội dung danh mục, thương mại (Coupon, Đơn hàng) và kiểm duyệt bình luận.
5. **F9.10 cuối cùng**: Nghiệm thu, tối ưu hiệu năng và kiểm thử liên thông.

---

## 20. NEXT PHASE & STOP CONDITION

- **Phase tiếp theo khuyến nghị**: **F9.2 — Admin Layout Shell & Route Protection**
- **Trạng thái kết thúc F9.1**:
  - Toàn bộ kết quả khảo sát, API Inventory, Permission Matrix, Route Map và Stitch Screen IDs đã được lập hồ sơ chi tiết.
  - **Không có bất kỳ file mã nguồn nào bị chỉnh sửa** (Strict No-Implementation Rule).
  - DỪNG LẠI (STOP) tại đây và chờ phê duyệt từ người dùng trước khi tiến hành Phase F9.2.
