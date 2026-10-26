# BÁO CÁO F7.0.1: FINAL STUDENT API & FRONTEND RECONCILIATION AUDIT

> **Mã báo cáo:** `F7_0_1_FINAL_STUDENT_API_AUDIT`  
> **Dự án:** TMdemy E-learning Frontend (`d:/e-learning`)  
> **Backend:** `d:/e-learning_server`  
> **Phạm vi:** Kiểm toán toàn diện API, Trạng thái Frontend App Router, Socket.IO, và Tính đồng bộ nghiệp vụ Student  
> **Chế độ:** AUDIT ONLY (Không thay đổi source code)  
> **Ngày thực hiện:** 12/10/2026

---

## 1. TỔNG QUAN VÀ BỐI CẢNH KIẾM TOÁN

TMdemy là nền tảng E-learning với kiến trúc phân tách độc lập hoàn toàn giữa Frontend (Next.js App Router, Tailwind CSS, shadcn/ui) và Backend (Node.js, Express, TypeScript, PostgreSQL, Prisma, Socket.IO).

Kiểm toán này được thực hiện trước khi bắt đầu triển khai hoàn thiện nhóm chức năng Học viên (Student). Mục tiêu là xác thực chính xác các API đã tích hợp, các tính năng còn thiếu, các điểm nghẽn nghiệp vụ và lỗi trọng yếu trong luồng trải nghiệm học viên hiện tại dựa trên bằng chứng mã nguồn (`src/` và `d:/e-learning_server/src/`).

---

## 2. KIỂM TOÁN TÀI NGUYÊN FRONTEND HIỆN TẠI

### 2.1. Thống kê Routes và Pages (Next.js App Router)
Frontend hiện có **18 routes** và **14 trang chức năng thực tế**:

| Route Path | File Path | Mục đích & Vai trò | Trạng thái Data | Ghi chú & Tồn đọng |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Trang chủ (Hero, Featured Courses, Testimonials) | **API thật** | Gọi `courseService.getCourses()` và `categoryService.getCategories()` |
| `/_not-found` | `src/app/not-found.tsx` | Trang 404 chuẩn của Next.js | Tĩnh | Hoàn thiện giao diện |
| `/login` | `src/app/login/page.tsx` | Đăng nhập tài khoản | **API thật** | Gọi `authService.login()`, lưu JWT vào `localStorage` & sync AuthContext |
| `/register` | `src/app/register/page.tsx` | Đăng ký học viên | **API thật** | Gọi `authService.register()`, điều hướng sang OTP |
| `/verify-otp` | `src/app/verify-otp/page.tsx` | Xác thực mã OTP sau đăng ký | **API thật** | Gọi `authService.verifyOtp()`, tự động sync auth state |
| `/forgot-password`| `src/app/forgot-password/page.tsx` | Yêu cầu khôi phục mật khẩu | **API thật** | Gọi `authService.forgotPassword()` gửi email |
| `/reset-password` | `src/app/reset-password/page.tsx` | Đặt lại mật khẩu với token | **API thật** | Gọi `authService.resetPassword()` |
| `/courses` | `src/app/courses/page.tsx` | Khám phá khóa học (Lọc, Search, Phân trang) | **API thật** | Gọi `courseService.getCourses()` với đầy đủ query parameters |
| `/courses/[slug]` | `src/app/courses/[slug]/page.tsx` | Chi tiết khóa học, đề cương, reviews | **API thật** | Gọi `courseService.getCourseBySlug()`, `ratingService.getCourseRatings()` |
| `/learn/[slug]` | `src/app/learn/[slug]/page.tsx` | Classroom học tập, bài giảng video, bình luận | **API thật** | Gọi `lessonService.getLessonsByChapter()`, `progressService`, `commentService` |
| `/my-courses` | `src/app/my-courses/page.tsx` | Khóa học của tôi, tiến độ học viên | **API thật** | Gọi `enrollmentService.getMyEnrollments()`, `progressService.getCourseProgress()` |
| `/dashboard` | `src/app/dashboard/page.tsx` | Dashboard chuyển hướng | Điều hướng | Tự động redirect về `/` |
| `/profile` | `src/app/profile/page.tsx` | Hồ sơ học viên | **MOCK DATA** | Đọc dữ liệu từ state tĩnh, chưa gọi `update-me` |
| `/settings` | `src/app/settings/page.tsx` | Cài đặt tài khoản, đổi mật khẩu, thông báo | **MOCK DATA** | Nút Lưu/Đổi mật khẩu chỉ hiển thị Toast giả lập |
| `/certificates` | `src/app/certificates/page.tsx` | Chứng chỉ hoàn thành khóa học | **MOCK DATA** | 100% dữ liệu tĩnh trong file |
| `/leaderboard` | `src/app/leaderboard/page.tsx` | Bảng xếp hạng học tập | **MOCK DATA** | Dữ liệu tĩnh, chưa kết nối API Gamification |
| `/roadmap` | `src/app/roadmap/page.tsx` | Lộ trình học tập cá nhân | **MOCK DATA** | Giao diện tĩnh, Backend chưa có API Roadmap |
| `/messages` | `src/app/messages/page.tsx` | Nhắn tin trao đổi học tập | **MOCK DATA** | Giao diện chat dùng mock dữ liệu, chưa nối Socket.IO |

---

### 2.2. Kiểm toán Frontend Services & Hooks
Hiện tại thư mục `src/services/` gồm **8 services** và `src/hooks/` gồm **1 hook**:

1. **`src/services/auth.service.ts`**: Đầy đủ 8 phương thức Auth REST (`login`, `register`, `verifyOtp`, `getMe`, `logout`, `refreshToken`, `forgotPassword`, `resetPassword`).
2. **`src/services/course.service.ts`**: Tích hợp `getCourses` (lọc, sort, phân trang) và `getCourseBySlug`.
3. **`src/services/category.service.ts`**: Tích hợp `getCategories`.
4. **`src/services/lesson.service.ts`**: Tích hợp `getLessonsByChapter`.
5. **`src/services/enrollment.service.ts`**: Tích hợp `getMyEnrollments`.
6. **`src/services/progress.service.ts`**: Tích hợp `completeLesson`, `uncompleteLesson`, `getCourseProgress`.
7. **`src/services/comment.service.ts`**: Tích hợp `getLessonComments`, `createComment`.
8. **`src/services/rating.service.ts`**: Tích hợp `getCourseRatings`.
9. **`src/hooks/use-auth.ts`**: Hook duy nhất cung cấp AuthContext truy cập trạng thái đăng nhập, user profile và token.

---

## 3. PHÂN LOẠI TOÀN BỘ 102 REST API ENDPOINTS

Dựa trên API Master Index (`api/API_INDEX.md`) và đối chiếu trực tiếp với mã nguồn Express router tại `d:/e-learning_server/src/routes/`:

### 3.1. Nhóm FULL (19 API - Đã tích hợp thực tế vào UI)
Tất cả 19 endpoint này đều đã có service phương thức tương ứng, kết nối API backend thật và hiển thị dữ liệu trực tiếp trên giao diện:

1. `POST /api/users/register` — Đăng ký tài khoản (`src/app/register/page.tsx`)
2. `POST /api/users/verify-otp` — Xác thực mã OTP (`src/app/verify-otp/page.tsx`)
3. `POST /api/users/login` — Đăng nhập hệ thống (`src/app/login/page.tsx`)
4. `GET /api/users/me` — Lấy thông tin user hiện tại (`src/context/AuthContext.tsx`)
5. `POST /api/users/logout` — Đăng xuất tài khoản (`src/components/layout/Header.tsx`)
6. `POST /api/users/forgot-password` — Gửi mail quên mật khẩu (`src/app/forgot-password/page.tsx`)
7. `PUT /api/users/reset-password` — Đặt lại mật khẩu (`src/app/reset-password/page.tsx`)
8. `POST /api/users/access_token` — Cấp mới access token qua refresh token (`src/services/api.client.ts`)
9. `GET /api/courses/` — Danh sách khóa học có bộ lọc (`src/app/courses/page.tsx`, `src/app/page.tsx`)
10. `GET /api/courses/:slug` — Chi tiết khóa học theo slug (`src/app/courses/[slug]/page.tsx`)
11. `GET /api/categories/` — Danh mục khóa học (`src/app/courses/page.tsx`, `src/components/layout/Header.tsx`)
12. `GET /api/lessons/chapter/:chapterId` — Danh sách bài học theo chương (`src/app/learn/[slug]/page.tsx`)
13. `GET /api/enrollments/my` — Danh sách khóa học đã ghi danh (`src/app/my-courses/page.tsx`)
14. `POST /api/progress/complete` — Đánh dấu hoàn thành bài học (`src/app/learn/[slug]/page.tsx`)
15. `POST /api/progress/uncomplete` — Hủy hoàn thành bài học (`src/app/learn/[slug]/page.tsx`)
16. `GET /api/progress/:courseId` — Lấy tiến độ học viên theo khóa (`src/app/my-courses/page.tsx`, `src/app/learn/[slug]/page.tsx`)
17. `GET /api/comments/lesson/:lessonId` — Lấy danh sách bình luận bài học (`src/app/learn/[slug]/page.tsx`)
18. `POST /api/comments/` — Gửi bình luận mới vào bài học (`src/app/learn/[slug]/page.tsx`)
19. `GET /api/ratings/course/:id` — Danh sách đánh giá khóa học (`src/app/courses/[slug]/page.tsx`)

---

### 3.2. Nhóm NOT_INTEGRATED - STUDENT SCOPE (40 API - Cần triển khai cho Học viên)
Các endpoint này đã có sẵn trong Backend Express nhưng Frontend chưa kết nối:

#### A. Tài khoản & Hồ sơ cá nhân (3 API)
- `PUT /api/users/update-me` — Cập nhật họ tên, tiểu sử, avatar học viên.
- `PUT /api/users/change-password` — Đổi mật khẩu học viên.
- `GET /api/users/:id` — Xem thông tin chi tiết người dùng/giảng viên.

#### B. Đơn hàng & Ghi danh khóa học (6 API)
- `POST /api/orders/` — Tạo đơn hàng đăng ký khóa học (cả trả phí và miễn phí).
- `GET /api/orders/my-orders` — Danh sách lịch sử đơn hàng của học viên.
- `GET /api/orders/:id` — Chi tiết đơn hàng và trạng thái duyệt.
- `POST /api/coupons/apply` — Áp dụng mã giảm giá khi thanh toán.
- `GET /api/enrollments/check/:courseId` — Kiểm tra trạng thái ghi danh của học viên.
- `GET /api/enrollments/:id` — Chi tiết bản ghi enrollment.

#### C. Khóa học yêu thích & Đánh giá (5 API)
- `POST /api/favorites/` — Thêm khóa học vào danh sách yêu thích.
- `DELETE /api/favorites/:courseId` — Xóa khỏi danh sách yêu thích.
- `GET /api/favorites/my-favorites` — Danh sách khóa học yêu thích của học viên.
- `POST /api/ratings/` — Học viên gửi đánh giá sao & review sau khi hoàn thành.
- `PUT /api/ratings/:id` — Sửa đánh giá đã gửi.

#### D. Tương tác thảo luận bài học (3 API)
- `PUT /api/comments/:id` — Chỉnh sửa nội dung bình luận của mình.
- `DELETE /api/comments/:id` — Xóa bình luận của mình.
- `POST /api/comments/:id/reaction` — Thả cảm xúc Like/Dislike vào bình luận.

#### E. Bài trắc nghiệm (Quiz) & Nộp bài kiểm tra (7 API)
- `GET /api/quizzes/lesson/:lessonId` — Lấy thông tin bài quiz gắn với bài học.
- `GET /api/quizzes/:id` — Chi tiết bài quiz.
- `GET /api/questions/quiz/:quizId` — Danh sách câu hỏi và các lựa chọn đáp án.
- `POST /api/quiz-submissions/` — Học viên nộp bài làm trắc nghiệm.
- `GET /api/quiz-submissions/my-submissions` — Lịch sử các lần nộp bài của học viên.
- `GET /api/quiz-submissions/:id` — Chi tiết điểm số, câu trả lời đúng/sai của lần nộp.
- `GET /api/quiz-submissions/quiz/:quizId/my-latest` — Lấy kết quả nộp bài mới nhất.

#### F. Chứng chỉ tốt nghiệp (3 API)
- `POST /api/certificates/` — Yêu cầu cấp chứng chỉ khi tiến độ đạt 100%.
- `GET /api/certificates/my-certificates` — Danh sách các chứng chỉ học viên đã nhận.
- `GET /api/certificates/:id` — Chi tiết chứng chỉ và mã định danh xác thực.

#### G. Thông báo học tập (5 API)
- `GET /api/notifications/` — Danh sách thông báo (đơn hàng, bài tập, phản hồi).
- `GET /api/notifications/unread-count` — Số lượng thông báo chưa đọc.
- `PUT /api/notifications/:id/read` — Đánh dấu 1 thông báo đã đọc.
- `PUT /api/notifications/read-all` — Đánh dấu tất cả thông báo đã đọc.
- `DELETE /api/notifications/:id` — Xóa thông báo khỏi danh sách.

#### H. Tin nhắn & Hội thoại (4 API REST)
- `POST /api/conversations/` — Tạo cuộc trò chuyện mới với Giảng viên/Học viên khác.
- `GET /api/conversations/` — Danh sách cuộc trò chuyện của tôi.
- `GET /api/conversations/:id` — Chi tiết cuộc trò chuyện.
- `GET /api/messages/conversation/:conversationId` — Lịch sử tin nhắn theo đoạn chat.

#### I. Gamification & Điểm thưởng (4 API)
- `GET /api/gamification/leaderboard` — Bảng xếp hạng học viên theo tuần/tháng/toàn thời gian.
- `GET /api/gamification/summary` — Tổng hợp điểm XP, Level, Hạng của học viên.
- `GET /api/gamification/streak` — Chuỗi ngày học liên tục (Streak).
- `GET /api/gamification/badges` — Danh sách huy hiệu đã đạt và chưa đạt.

---

### 3.3. Nhóm BACKEND_GAP (2 Khoảng hổng nghiệp vụ)
1. **Lộ trình học tập (Roadmap API)**:
   - *Giao diện hiện tại*: Trang `src/app/roadmap/page.tsx` hiển thị sơ đồ nhánh học tập AI Engineer, Fullstack...
   - *Thực trạng Backend*: Backend **hoàn toàn không có** controller, service, route hay Prisma table cho `Roadmap`.
   - *Kết luận*: Trang `/roadmap` hiện tại phải tạm giữ giao diện trực quan hoặc quy hoạch là tính năng nội dung tĩnh định hướng.
2. **Cổng thanh toán tự động (Automated Payment Gateway)**:
   - *Thực trạng*: Backend không tích hợp VNPay, MoMo, ZaloPay hay PayOS. Mọi đơn hàng trả phí tạo qua `POST /api/orders/` đều ở trạng thái `PENDING`.
   - *Hạn chế*: Học viên thanh toán chuyển khoản thủ công (VietQR). Đơn hàng chỉ hoàn tất sau khi Giảng viên/Admin gọi `PUT /api/orders/:id` với status `COMPLETED`.

---

### 3.4. Nhóm NOT_STUDENT_SCOPE (43 API - Dành riêng Teacher & Admin)
Các API này phục vụ cổng quản trị và xuất bản nội dung của Giảng viên và Quản trị viên, được bảo lưu sang các phase sau:
- **Admin Quản lý người dùng & Hệ thống (10 API)**: `GET /api/users/`, `POST /api/users/`, `DELETE /api/users/:id`, `PUT /api/users/:id/role`, `PUT /api/users/:id/status`, quản lý danh mục `POST/PUT/DELETE /api/categories/`, thống kê hệ thống.
- **Teacher Soạn thảo khóa học & Nội dung (18 API)**: Tạo/Sửa/Xóa khóa học `POST/PUT/DELETE /api/courses/`, Quản lý chương `POST/PUT/DELETE /api/chapters/`, Quản lý bài học `POST/PUT/DELETE /api/lessons/`, Quản lý Quiz & Question `POST/PUT/DELETE /api/quizzes/`, `POST/PUT/DELETE /api/questions/`.
- **Teacher Quản lý Mã giảm giá & Đơn hàng (7 API)**: Tạo/Sửa mã giảm giá `POST/PUT/DELETE /api/coupons/`, Xem danh sách đơn bán `GET /api/orders/teacher`, Phê duyệt/Từ chối đơn hàng `PUT /api/orders/:id`.
- **Teacher Báo cáo doanh thu & Thống kê (8 API)**: Thống kê học viên, doanh thu, đánh giá khóa học theo giáo viên.

---

## 4. MA TRẬN TÍNH NĂNG HỌC VIÊN (STUDENT FEATURE MATRIX)

| Nhóm chức năng | Tính năng chi tiết | Trạng thái UI | Trạng thái API | Đánh giá tổng thể |
|---|---|---|---|---|
| **A. Xác thực & Tài khoản** | Đăng ký & OTP | Hoàn thiện | `FULL` | Hoạt động chính xác, mã OTP gửi và xác thực qua backend |
| | Đăng nhập & Duy trì phiên | Hoàn thiện | `FULL` | Lưu token, tự refresh token khi hết hạn, Header cập nhật đúng |
| | Quên & Đặt lại mật khẩu | Hoàn thiện | `FULL` | Luồng gửi email và đổi pass qua token backend hoạt động tốt |
| | Cập nhật thông tin cá nhân | Có UI | `NOT_INTEGRATED` | Form lưu vào React State cục bộ, **chưa gọi** `PUT /api/users/update-me` |
| | Đổi mật khẩu học viên | Có UI | `NOT_INTEGRATED` | Nút đổi pass chỉ bắn toast thông báo, **chưa gọi** API |
| **B. Khám phá khóa học** | Trang chủ & Khóa học nổi bật | Hoàn thiện | `FULL` | Load khóa học thật, danh mục thật từ backend |
| | Danh sách khóa học & Tìm kiếm | Hoàn thiện | `FULL` | Bộ lọc danh mục, giá (Free/Paid), search từ khóa đều gọi API thật |
| | Chi tiết khóa học & Đề cương | Hoàn thiện | `FULL` | Hiển thị chương mục, danh sách bài học, preview demo lesson |
| **C. Ghi danh & Mua khóa học** | Đăng ký khóa học miễn phí | Có UI | `CRITICAL_BUG` | Nút bấm nhảy thẳng vào `/learn/[slug]`, **bỏ qua việc tạo Enrollment** |
| | Mua khóa học trả phí | Có UI | `CRITICAL_BUG` | Nút "Mua ngay" điều hướng sang `/checkout` -> **Trang 404** |
| | Khóa học của tôi (`/my-courses`) | Hoàn thiện | `FULL` | Load danh sách đã ghi danh và tính toán % tiến độ chính xác |
| **D. Học tập & Tiến độ** | Xem bài giảng video & Đề cương | Hoàn thiện | `FULL` | Video player, danh sách bài học theo chương hoạt động chuẩn |
| | Đánh dấu Hoàn thành / Hủy | Hoàn thiện | `FULL` | Gọi `POST /api/progress/complete` và `uncomplete`, sync tiến độ |
| | Làm bài kiểm tra (Quiz) | Chưa có | `NOT_INTEGRATED` | Giao diện Classroom chưa có tab/modal làm bài trắc nghiệm |
| | Xem chứng chỉ tốt nghiệp | Có UI | `NOT_INTEGRATED` | Trang `/certificates` đang render danh sách giả lập, chưa gọi API |
| **E. Tương tác học viên** | Bình luận bài học | Hoàn thiện | `FULL` | Xem bình luận và gửi bình luận mới hoạt động với backend |
| | Đánh giá khóa học (Rating) | Xem: `FULL` | Gửi: `NOT_INTEGRATED` | Xem review thật, nhưng form viết đánh giá chưa submit lên backend |
| | Thêm vào yêu thích (Favorite) | Icon trên UI | `NOT_INTEGRATED` | Nút trái tim chưa gọi `POST /api/favorites/` |
| | Hộp thư & Tin nhắn (`/messages`) | Có UI | `NOT_INTEGRATED` | Giao diện tĩnh, chưa kết nối Socket.IO hay API tin nhắn |
| | Thông báo hệ thống | Chuông trên UI | `NOT_INTEGRATED` | Chuông thông báo chưa kết nối API Notification |
| **F. Gamification & Lộ trình** | Bảng xếp hạng (`/leaderboard`) | Có UI | `NOT_INTEGRATED` | Dữ liệu tĩnh, chưa gọi API Gamification backend |
| | Chuỗi ngày học (Streak) & XP | Chưa có | `NOT_INTEGRATED` | Backend có API summary/streak nhưng frontend chưa hiển thị |
| | Lộ trình học (`/roadmap`) | Có UI | `BACKEND_GAP` | Backend chưa có dữ liệu roadmap |

---

## 5. KIỂM TOÁN SOCKET.IO BACKEND CONTRACT VÀ FRONTEND

### 5.1. Đặc tả Socket.IO Backend
Tại `d:/e-learning_server/src/socket/initSocket.ts`:
- **Port & Path**: Chạy chung port backend `http://localhost:3002`, path mặc định `/socket.io/`.
- **Cơ chế xác thực (Handshake Auth)**: Bắt buộc gửi JWT Access Token qua:
  ```typescript
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    // Verify JWT, gán socket.data.user = decoded
  });
  ```
- **Các sự kiện Socket.IO hỗ trợ (10 sự kiện)**:
  1. `join`: Học viên tham gia phòng chat hội thoại (`conversationId`).
  2. `sendMessage`: Gửi tin nhắn mới `{ conversationId, content, mediaUrl }`.
  3. `receiveMessage`: Nhận tin nhắn mới từ người khác trong phòng.
  4. `editMessage`: Sửa nội dung tin nhắn đã gửi.
  5. `messageEdited`: Broadcast tin nhắn vừa sửa cho các thành viên.
  6. `deleteMessage`: Xóa tin nhắn.
  7. `messageDeleted`: Broadcast thông báo xóa tin nhắn.
  8. `typing`: Phát tín hiệu đang gõ phím.
  9. `stopTyping`: Dừng gõ phím.
  10. `userTyping` / `userStopTyping`: Nhận tín hiệu trạng thái gõ phím từ người khác.

### 5.2. Trạng thái Frontend
- **Thư viện Socket**: `socket.io-client` **chưa được tích hợp** trong `package.json`.
- **Trang `/messages`**: Đang dùng hoàn toàn dữ liệu tĩnh từ `src/data/mockMessagesData.ts`.
- **Kết luận**: Mức độ tích hợp Socket.IO của Frontend hiện tại là **0% (NOT INTEGRATED)**.

---

## 6. CÁC LỖI TRỌNG YẾU (CRITICAL BUGS) ĐƯỢC PHÁT HIỆN

### 🔴 Bug 1: Lỗi bỏ qua ghi danh khóa học miễn phí (Free Course Bypass)
- **Vị trí**: `src/app/courses/[slug]/page.tsx` dòng 168.
- **Hành vi lỗi**: Khi học viên bấm nút "Đăng ký học miễn phí", giao diện chuyển hướng ngay lập tức: `router.push(/learn/${course.slug})`.
- **Hậu quả**: Không có bản ghi Order hay Enrollment nào được tạo trên cơ sở dữ liệu. Khi vào classroom, học viên hoàn thành bài học thì Backend trả về lỗi **403 Forbidden** (do middleware kiểm tra enrollment thất bại). Đồng thời khóa học không bao giờ xuất hiện trong `/my-courses`.
- **Giải pháp**: Phải gọi `POST /api/orders/` với `totalAmount: 0` để Backend tự động kích hoạt tạo `Enrollment` trước khi chuyển trang.

### 🔴 Bug 2: Link chết trang thanh toán (`/checkout` 404)
- **Vị trí**: `src/app/courses/[slug]/page.tsx` dòng 162.
- **Hành vi lỗi**: Khi khóa học có phí, nút "Mua khóa học ngay" điều hướng tới `/checkout?course=${course.slug}`.
- **Hậu quả**: Route `/checkout` **chưa hề tồn tại** trong Next.js App Router, dẫn đến trang 404 Not Found. Học viên hoàn toàn không thể mua bất kỳ khóa học trả phí nào.

### 🔴 Bug 3: Lưu trữ dữ liệu giả lập trong Profile & Settings
- **Vị trí**: `src/app/profile/page.tsx` và `src/app/settings/page.tsx`.
- **Hành vi lỗi**: Form cập nhật thông tin cá nhân và form đổi mật khẩu chỉ cập nhật state tạm thời trong component và bắn `toast.success`, không gửi request tới Backend.
- **Hậu quả**: Dữ liệu mất sạch khi người dùng reload trang; mật khẩu không bao giờ được thay đổi trên server.

---

## 7. TỔNG KẾT BẢN ĐỐI CHIẾU RECONCILIATION

- **Tổng số REST API endpoints**: **102**
  - **FULL (Đã tích hợp thực tế)**: **19** (18.6%)
  - **PARTIAL**: **0** (0%)
  - **NOT_INTEGRATED (Thuộc phạm vi Học viên)**: **40** (39.2%)
  - **NOT_STUDENT_SCOPE (Dành cho Teacher / Admin)**: **43** (42.2%)
  - **BACKEND_GAP**: **2** (Roadmap API & Cổng thanh toán trực tuyến tự động)
- **Socket.IO Realtime Events**: 10/10 events chưa được tích hợp (0%).
- **Lỗi hệ thống nghiêm trọng**: 3 lỗi ảnh hưởng trực tiếp đến luồng người dùng (Free enrollment bypass, Checkout 404, Profile/Settings mock).
