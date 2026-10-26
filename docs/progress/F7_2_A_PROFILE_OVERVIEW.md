# F7.2-A — PROFILE OVERVIEW & USER INFORMATION REPORT

**Phase:** F7.2 — Account, Profile & Favorites  
**Task:** F7.2-A — Profile Overview & User Information  
**Status:** COMPLETE (PASS)  
**Date:** 2026-10-13  
**Repository:** `d:/e-learning` (TMdemy Frontend)  

---

## 1. Current Implementation Audit

Trước khi triển khai F7.2-A, hệ thống có hiện trạng như sau:
1. **Trang `/profile` cũ (`src/app/profile/page.tsx`)**:
   - Sử dụng hoàn toàn dữ liệu tĩnh giả định từ `@/data/mock-profile` (`mockUserProfileData`).
   - Hiển thị các trường giả lập mà backend không hỗ trợ: chức danh công việc (`jobTitle`), huy hiệu blockchain giả lập, chứng chỉ số giả lập, hoạt động thời gian thực giả lập.
   - Nhúng trực tiếp modal chỉnh sửa thông tin cục bộ và tải ảnh avatar giả lập (vi phạm yêu cầu phân tách giai đoạn của F7.2-A).
2. **Auth Context (`src/contexts/auth-context.tsx`)**:
   - Cung cấp `user: UserProfile | null`, `status: AuthStatus`, `isLoading`, `isAuthenticated`, `refreshUser()`.
   - Lưu trữ Access Token và Refresh Token qua cơ chế JWT Dual-Token an toàn tại `src/lib/api/token.ts`.
3. **API Client (`src/lib/api/client.ts`)**:
   - Tự động gắn Bearer Token (`Authorization: Bearer <token>`).
   - Tự động xử lý Refresh Token khi gặp lỗi `401 Unauthorized` / `jwt expired`.
   - Chuẩn hóa lỗi chi tiết từ Express / Nest backend.
4. **Layout & Navigation**:
   - `AppShell` (`src/components/layout/app-shell.tsx`) tích hợp `DashboardHeader` và `DashboardSidebar`.
   - `DashboardSidebar` và `DashboardHeader` đã có liên kết dẫn tới `/profile` ("Hồ sơ cá nhân").
   - `RouteGuard` (`src/components/auth/route-guard.tsx`) bảo vệ truy cập trái phép và tự động chuyển hướng unauthenticated users về `/login?redirect=...`.

---

## 2. API Documentation Đã Đọc & Đối Chiếu

Đã đọc và đối chiếu trực tiếp từ thư mục `api/`:

| Tài liệu API | Endpoint đối chiếu | Mục đích sử dụng trong F7.2-A |
| :--- | :--- | :--- |
| `api/AUTH_API.md` | `GET /api/users/me` | Lấy thông tin cá nhân của người dùng hiện tại (username, email, role, avatar, phone, bio, socialLinks, isVerified, createdAt). |
| `api/USER_API.md` | `GET /api/users/profile/:id` | Hồ sơ công khai người dùng theo ID (chuẩn hóa abstraction `userService`). |
| `api/ENROLLMENT_API.md` | `GET /api/enrollments/my` | Lấy danh sách khóa học người dùng đã ghi danh để tính toán thống kê học tập (tổng khóa học, đang học, hoàn thành, tiến độ TB). |
| `api/AUTH_FLOW.md` | Luồng JWT & Route Protection | Cơ chế kiểm tra phiên đăng nhập và bảo vệ trang `/profile`. |

---

## 3. Backend Fields Thực Sự Hỗ Trợ vs Backend Gaps

### A. Các trường thực tế Backend hỗ trợ (`GET /api/users/me`):
* `id` / `_id`: UUID mã định danh người dùng.
* `username`: Tên người dùng / hiển thị.
* `email`: Địa chỉ email đăng ký.
* `status`: Trạng thái tài khoản (`ACTIVE`, `INACTIVE`, `BANNED`).
* `role`: Vai trò người dùng (`user`, `teacher`, `admin`).
* `avatar`: Đường dẫn URL ảnh đại diện (hoặc chuỗi rỗng khi chưa có).
* `phone`: Số điện thoại liên hệ (chuỗi hoặc rỗng/undefined).
* `bio`: Lời giới thiệu bản thân (chuỗi hoặc rỗng/undefined).
* `socialLinks`: Kênh mạng xã hội hỗ trợ:
  * `facebook`: URL Facebook.
  * `instagram`: URL Instagram.
  * `github`: URL GitHub.
* `isVerified`: Trạng thái xác thực email (`true`/`false`).
* `createdAt`: Ngày tham gia hệ thống (ISO Timestamp).
* `updatedAt`: Thời gian cập nhật hồ sơ gần nhất (ISO Timestamp).

### B. Backend Gaps (Không tự tạo dữ liệu giả):
1. **`gender` (Giới tính)**: Backend Prisma Schema và API không lưu trữ trường này -> Loại bỏ hoàn toàn khỏi UI.
2. **`dateOfBirth` / `birthDate` (Ngày sinh)**: Backend không lưu trữ trường này -> Loại bỏ khỏi UI.
3. **`address` (Địa chỉ)**: Backend không lưu trữ địa chỉ của người dùng -> Loại bỏ khỏi UI.
4. **`jobTitle` (Chức danh chuyên môn)**: Backend không hỗ trợ trường này -> Loại bỏ khỏi UI.
5. **`badges` (Huy hiệu cá nhân)**: Chưa có API cung cấp huy hiệu danh mục cho học viên thông thường -> Không hiển thị huy hiệu giả.

---

## 4. Files Đã Đọc

1. `AGENTS.md`
2. `.agents/rules/00-core.md`, `01-architecture.md`, `02-api-boundary.md`, `03-ui-ux.md`, `04-code-quality.md`, `05-validation.md`
3. `api/USER_API.md`
4. `api/AUTH_API.md`
5. `api/ENROLLMENT_API.md`
6. `api/GAMIFICATION_LEADERBOARD_API.md`
7. `src/types/auth.ts`
8. `src/types/api.ts`
9. `src/types/enrollment.ts`
10. `src/services/auth.service.ts`
11. `src/services/enrollment.service.ts`
12. `src/contexts/auth-context.tsx`
13. `src/hooks/use-auth.ts`
14. `src/components/auth/route-guard.tsx`
15. `src/components/layout/app-shell.tsx`
16. `src/components/layout/dashboard-header.tsx`
17. `src/components/layout/dashboard-sidebar.tsx`
18. `src/data/mock-profile.ts`
19. `src/app/profile/page.tsx` (phiên bản cũ)

---

## 5. Files Created

* [`src/services/user.service.ts`](file:///d:/e-learning/src/services/user.service.ts): Module dịch vụ giao tiếp REST API phân hệ User (`getMe`, `getPublicProfile`).

---

## 6. Files Modified

* [`src/app/profile/page.tsx`](file:///d:/e-learning/src/app/profile/page.tsx): Tái cấu trúc toàn diện màn hình **Profile Overview** theo chuẩn thiết kế TMdemy, kết nối dữ liệu thật từ `GET /api/users/me` và `GET /api/enrollments/my`, loại bỏ toàn bộ mock data và modal edit profile.

---

## 7. Profile UI Implementation

Màn hình `/profile` được cấu trúc thành các khối thông tin logic rõ ràng:

### A. Profile Header
* **Banner Ambient Gradient**: Phối màu thương hiệu TMdemy (`#7240b8`, `#ebe5ff`, hỗ trợ Dark Mode `#2a2139`).
* **Avatar & Fallback**:
  * Hiển thị avatar thực từ backend nếu có URL hợp lệ.
  * Fallback tự động: Hiển thị vòng tròn chữ cái đầu (Initials Badge) với màu nhận diện thương hiệu khi chưa có avatar hoặc khi ảnh lỗi (`onError`).
  * Beacon trạng thái trực tuyến/hoạt động (`ACTIVE`).
* **Tên hiển thị & Vai trò**:
  * Tên người dùng `username`.
  * Huy hiệu vai trò (`Học viên` / `Giảng viên` / `Quản trị viên`) kèm biểu tượng.
* **Email & Ngày tham gia**:
  * Email cá nhân.
  * Huy hiệu xác thực email: `ShieldCheck` (Đã xác thực) hoặc `ShieldAlert` (Chưa xác thực).
  * Ngày tham gia tài khoản định dạng tiếng Việt chuẩn (`dd/mm/yyyy`).
* **Hành động**:
  * Nút `Chia sẻ hồ sơ`: Tự động copy liên kết URL trang hồ sơ vào clipboard kèm thông báo toast.
  * Nút `Chỉnh sửa hồ sơ`: Placeholder button thông báo tính năng sẽ ra mắt ở Phase F7.2-B (không mở form chỉnh sửa trái phép).

### B. Learning Overview (KPI Row)
Tính toán thời gian thực từ kết quả `GET /api/enrollments/my`:
1. **Tổng khóa học**: Số khóa học đã ghi danh (`totalCourses`).
2. **Đang học**: Số khóa học đang tiếp tục (`inProgressCourses`).
3. **Đã hoàn thành**: Số khóa học đã đạt 100% hoặc status `COMPLETED` (`completedCourses`).
4. **Tiến độ trung bình**: Phần trăm tiến độ trung bình tích lũy (`averageProgress%`).

### C. Personal Information (Chi tiết tài khoản)
* Tên tài khoản (Username).
* Vai trò hệ thống (Role).
* Địa chỉ email (kèm trạng thái xác thực).
* Số điện thoại (Hiển thị giá trị thực hoặc placeholder "Chưa cập nhật" khi để trống).
* Lời giới thiệu (Bio) (Hiển thị văn bản thực hoặc "Chưa có thông tin giới thiệu bản thân" khi để trống).
* Kênh liên kết mạng xã hội (GitHub, Facebook, Instagram) với biểu tượng nhận diện, trạng thái Đã liên kết/Chưa liên kết và nút mở liên kết ngoài an toàn (`target="_blank"`, `rel="noopener noreferrer"`).

### D. Enrolled Courses Preview
* Danh sách 4 khóa học gần nhất đã ghi danh kèm thanh tiến độ (progress bar) và nhãn trạng thái (Đang học / Đã hoàn thành).
* Nút dẫn tới chi tiết khóa học hoặc `/my-courses`.
* Empty state thân thiện khi chưa có khóa học nào với CTA "Khám phá khóa học" dẫn về `/courses`.

---

## 8. Data & API Integration

1. **User Identity**:
   - Sử dụng `userService.getMe()` (gọi `GET /api/users/me` với Bearer JWT).
   - Không truyền bất kỳ tham số `userId` thừa nào trong request; danh tính được trích xuất an toàn từ payload JWT token tại backend.
   - Tuyệt đối không để lộ mật khẩu, mã OTP hoặc Refresh Token trên giao diện.
2. **Learning Overview Data**:
   - Sử dụng `enrollmentService.getMyEnrollments()` (gọi `GET /api/enrollments/my`).
   - Phân tích danh sách `ApiEnrollmentItem[]` thành các chỉ số học tập trực quan.
3. **Route Guard**:
   - Sử dụng `<RouteGuard requireAuth>` bao bọc trang `/profile`.
   - Khách vãng lai chưa đăng nhập sẽ được tự động chuyển hướng về `/login?redirect=%2Fprofile`.

---

## 9. UX States Coverage (6 States)

1. **Loading State**: Hiển thị bộ Skeleton Loader toàn diện (bento card, KPI cards, information grid, courses list) với hiệu ứng pulse mượt mà.
2. **Populated / Success State**: Dữ liệu tải thành công, hiển thị đầy đủ avatar, thông tin và chỉ số.
3. **Empty Data State**:
   - Khi chưa có avatar: Hiển thị initials fallback avatar.
   - Khi chưa có bio / số điện thoại: Hiển thị nhãn "Chưa cập nhật" / "Chưa có thông tin giới thiệu" với phong cách chữ nghiêng mờ.
   - Khi chưa ghi danh khóa học nào: Hiển thị card thông báo thân thiện kèm nút điều hướng đến trang tìm kiếm khóa học (`/courses`).
4. **Global Error State**: Nếu `GET /api/users/me` thất bại và không có cache: Hiển thị khối thông báo lỗi màu đỏ kèm nút `Thử lại` (`RefreshCw`), không tự động logout người dùng.
5. **Partial Error State**: Nếu `GET /api/enrollments/my` thất bại nhưng profile thành công: Vẫn hiển thị đầy đủ thông tin cá nhân của người dùng, chỉ hiển thị card thông báo lỗi học tập cục bộ kèm nút `Thử lại` riêng biệt.
6. **Unauthenticated State**: RouteGuard chặn truy cập và chuyển hướng về trang đăng nhập với query parameter `redirect=/profile`.

---

## 10. Responsive Behavior

- **Desktop (>= 1280px)**: Bố cục lưới 12 cột (7 cột Thông tin cá nhân, 5 cột Khóa học gần đây), hàng KPI 4 thẻ dàn đều, avatar góc trái nổi trên nền bento wash.
- **Tablet (768px - 1024px)**: Lưới 2 cột cho các thẻ KPI, bố cục thông tin co giãn tối ưu, avatar chuyển sang căn ngang tự nhiên.
- **Mobile (< 768px)**: Chuyển sang bố cục xếp chồng 1 cột, avatar căn giữa, các nút hành động (Chia sẻ, Chỉnh sửa) tự động wrap và trải rộng, font size điều chỉnh thân thiện cho màn hình cảm ứng.
- **Dark Mode**: Tuân thủ bảng màu tối `dark:bg-[#1a1722]`, `dark:border-[#2b2438]`, bảo toàn độ tương phản và thẩm mỹ theo TMdemy Design System.

---

## 11. Testing Results

| Hạng mục kiểm tra | Phương thức thực hiện | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **PASS** | 0 lỗi kiểu dữ liệu. |
| **ESLint Validation** | `npm run lint` | **PASS** | 0 lỗi linter (`src/app/profile/page.tsx` và `user.service.ts` sạch lỗi). |
| **Route Guard & Redirection** | Browser Subagent E2E Test | **PASS** | Truy cập `/profile` khi chưa đăng nhập bị chặn và chuyển hướng thành công tới `/login?redirect=%2Fprofile`. |
| **Avatar Fallback** | Code verification | **PASS** | Tự động tính toán initials khi `avatar` rỗng hoặc khi kích hoạt `onError`. |
| **Learning Stats Integration** | Code verification | **PASS** | Tích hợp an toàn qua `enrollmentService.getMyEnrollments()`. |
| **Error & Retry Handling** | Code verification | **PASS** | Phân tách lỗi toàn cục và lỗi cục bộ, có nút Thử lại độc lập. |
| **Mock Data Elimination** | `grep_search` kiểm tra tham chiếu | **PASS** | Đã loại bỏ hoàn toàn việc import `mockUserProfileData` trong `/profile`. |

---

## 12. Backend Gaps

1. **Thông tin nhân khẩu học (Demographics)**: Backend hiện tại chưa hỗ trợ lưu trữ `gender` (giới tính), `dateOfBirth` (ngày sinh), `address` (địa chỉ liên hệ). UI đã loại bỏ các trường này thay vì hiển thị dữ liệu giả.
2. **Huy hiệu học tập (Badges)**: Backend mới chỉ hỗ trợ XP và Bảng xếp hạng (`/api/leaderboard`, `/api/users/me/xp-summary`), chưa có API lưu trữ và trả về danh sách huy hiệu cá nhân (`Badges`) của học viên.

---

## 13. Known Limitations

1. Nút `Chỉnh sửa hồ sơ` hiện tại đóng vai trò điều hướng placeholder với toast thông báo và sẽ được triển khai hoàn chỉnh trong task tiếp theo (**F7.2-B — Profile Edit & Avatar Upload**).
2. Chưa triển khai đổi mật khẩu (thuộc task F7.2-C) và Favorites (thuộc task F7.2-D).

---

## 14. Next Recommended Task

* **Phase F7.2-B — Profile Edit & Avatar Management**:
  * Tích hợp `PUT /api/users/update-me` (cập nhật username, phone, bio, socialLinks).
  * Tích hợp upload ảnh đại diện (Avatar upload).
  * Form validation và đồng bộ cập nhật state trong Auth Context.
