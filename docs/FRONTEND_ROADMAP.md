# TMDEMY — FRONTEND IMPLEMENTATION ROADMAP

> **Lộ trình triển khai toàn diện Frontend TMDEMY chia làm 10 Giai đoạn tuần tự (F1 đến F10).**  
> *Được thiết kế phục vụ đồ án tốt nghiệp với chất lượng cao, có thể nghiệm thu và demo theo từng giai đoạn.*

---

## Tổng Quan Tiến Độ Lộ Trình

```text
F1: Foundation ──► F2: Auth ──► F3: Public ──► F4: Learning ──► F5: Commerce
      │
      └────────► F6: Teacher ──► F7: Admin ──► F8: Realtime ──► F9: Analytics ──► F10: Polish
```

---

## 1. Giai đoạn F1: Khởi Tạo Dự Án & Nền Tảng Cốt Lõi (Foundation)
- **Mục tiêu**: Thiết lập cấu trúc dự án Next.js, cài đặt công cụ tạo kiểu (Tailwind CSS, shadcn/ui), font chữ, icon, cấu trúc thư mục và khung gọi API tập trung.
- **Nội dung công việc**:
  - Khởi tạo Next.js với App Router, TypeScript strict mode.
  - Cấu hình Tailwind CSS, biến màu CSS HSL, font chữ `Inter` hoặc `Plus Jakarta Sans`.
  - Cài đặt các thành phần nền tảng shadcn/ui: `button`, `input`, `card`, `dialog`, `dropdown-menu`, `toast/sonner`, `skeleton`.
  - Xây dựng `src/lib/api/client.ts` xử lý Base URL, Bearer Token và Interceptor Auto-refresh.
  - Xây dựng Layout cha (`RootLayout`) với Header, Footer cơ bản, Theme Provider.
- **Tiêu chí Hoàn thành (DoD)**:
  - Ứng dụng chạy mượt mà ở `http://localhost:3000`.
  - Thử nghiệm gọi một API công khai (ví dụ: `GET /api/categories/`) thành công thông qua `apiClient`.

---

## 2. Giai đoạn F2: Phân Hệ Xác Thực & Hồ Sơ Cá Nhân (Authentication & Profile)
- **Mục tiêu**: Hoàn thiện toàn bộ quy trình đăng ký, kích hoạt OTP, đăng nhập, cấp token, đăng xuất và quản lý hồ sơ người dùng.
- **API Tích hợp**:
  - `POST /api/users/register`
  - `POST /api/users/verify-otp`
  - `POST /api/users/login`
  - `GET /api/users/me`
  - `POST /api/users/logout`
  - `POST /api/users/access_token`
  - `POST /api/users/forgot-password`
  - `PUT /api/users/reset-password`
  - `PUT /api/users/update-me`
  - `PUT /api/users/change-password`
- **Màn hình & Components**:
  - Trang Đăng nhập (`/login`), Đăng ký (`/register`), Nhập OTP (`/verify-otp`).
  - Trang Quên mật khẩu (`/forgot-password`) và Đặt lại mật khẩu (`/reset-password`).
  - Trang Hồ sơ cá nhân (`/student/profile`): Cập nhật thông tin, đổi avatar, đổi mật khẩu.
  - Tầng quản lý phiên đăng nhập `useAuth()` và Middleware bảo vệ route.
- **Tiêu chí Hoàn thành (DoD)**:
  - Người dùng có thể đăng ký tài khoản mới -> nhận OTP -> xác thực -> đăng nhập nhận token -> lưu phiên và tự động đăng xuất khi hết hạn.

---

## 3. Giai đoạn F3: Trải Nghiệm Khám Phá Khóa Học Công Khai (Public Experience)
- **Mục tiêu**: Xây dựng bộ mặt công khai ấn tượng của sàn học tập, giúp học viên tìm kiếm và tìm hiểu khóa học dễ dàng.
- **API Tích hợp**:
  - `GET /api/courses/` (Lấy danh sách khóa học có bộ lọc, tìm kiếm, phân trang)
  - `GET /api/courses/:slug` (Chi tiết khóa học, tăng lượt xem)
  - `GET /api/categories/`
  - `GET /api/categories/:slug`
  - `GET /api/users/teachers`
  - `GET /api/users/profile/:id`
- **Màn hình & Components**:
  - Trang chủ (`/`): Hero Section, Danh mục thịnh hành, Khóa học mới nhất, Khóa học phổ biến.
  - Trang Danh sách Khóa học (`/courses`): Thanh tìm kiếm debounce, bộ lọc danh mục, trình độ, mức giá, sắp xếp.
  - Trang Chi tiết Khóa học (`/courses/:slug`): Video Trailer, thông tin tác giả, danh sách chương bài học (xem trước), đánh giá học viên, nút "Mua ngay / Vào học".
- **Tiêu chí Hoàn thành (DoD)**:
  - Khách vãng lai có thể duyệt danh mục, tìm kiếm bài giảng theo từ khóa và xem chi tiết giáo trình một cách mượt mà.

---

## 4. Giai đoạn F4: Không Gian Phòng Học Của Học Viên (Student Learning Experience)
- **Mục tiêu**: Xây dựng không gian học tập trực tuyến cao cấp, theo dõi tiến độ bài học, làm bài trắc nghiệm và nhận chứng chỉ.
- **API Tích hợp**:
  - `GET /api/enrollments/my-enrollments`
  - `GET /api/progress/:courseId`
  - `PUT /api/progress/lesson/:lessonId`
  - `GET /api/lessons/chapter/:chapterId`
  - `GET /api/quiz/lesson/:lessonId`
  - `POST /api/quiz-submissions/`
  - `GET /api/certificates/my-certificates`
  - `GET /api/certificates/course/:courseId`
  - `POST /api/ratings/`
  - `GET /api/ratings/course/:courseId`
  - `POST /api/comments/`
  - `GET /api/comments/lesson/:lessonId`
- **Màn hình & Components**:
  - "Khóa học của tôi" (`/student/my-courses`): Quản lý tiến độ học tập các khóa đã mua.
  - Phòng học (`/learn/:courseId`): Video player, bài đọc tài liệu, danh sách chương bài bên cạnh, nút đánh dấu hoàn thành.
  - Trình làm bài kiểm tra (`QuizRunner`): Đếm ngược thời gian, nộp bài trắc nghiệm, hiển thị bảng điểm và đáp án đúng/sai.
  - Màn hình Chứng chỉ (`/student/certificates`): Hiển thị chứng chỉ đạt chuẩn có thể tải về.
  - Khối Đánh giá & Bình luận thảo luận theo bài học.
- **Tiêu chí Hoàn thành (DoD)**:
  - Học viên xem bài học -> hoàn thành 100% -> mở khóa làm quiz -> nhận chứng chỉ tốt nghiệp tự động.

---

## 5. Giai đoạn F5: Thương Mại & Quản Lý Đơn Hàng (Commerce & Orders)
- **Mục tiêu**: Triển khai giỏ hàng, áp dụng mã giảm giá và tạo đơn hàng kích hoạt khóa học.
- **API Tích hợp**:
  - `POST /api/coupons/use` (Kiểm tra và tính số tiền giảm)
  - `POST /api/orders/` (Khởi tạo đơn hàng)
  - `GET /api/orders/my-orders`
  - `GET /api/orders/:id`
  - `POST /api/favorites/` & `DELETE /api/favorites/:courseId`
  - `GET /api/favorites/my-favorites`
- **Màn hình & Components**:
  - Trang Thanh toán (`/checkout`): Tóm tắt đơn hàng, form nhập mã giảm giá, tính toán số tiền giảm theo % hoặc VND.
  - Trang Danh sách Yêu thích (`/student/favorites`).
  - Lịch sử đơn hàng (`/student/orders`): Chi tiết hóa đơn và trạng thái hoàn tất.
- **Tiêu chí Hoàn thành (DoD)**:
  - Khóa học miễn phí (0 VND) hoặc có mã giảm giá được kích hoạt ghi danh (`Enrollment`) ngay sau khi tạo đơn hàng.

---

## 6. Giai đoạn F6: Studio Biên Soạn Của Giảng Viên (Teacher Studio)
- **Mục tiêu**: Cung cấp công cụ mạnh mẽ để giảng viên khởi tạo khóa học, xây dựng đề cương chương bài và bộ câu hỏi trắc nghiệm.
- **API Tích hợp**:
  - `POST /api/teacher/courses/`
  - `PUT /api/teacher/courses/:id`
  - `DELETE /api/teacher/courses/:id`
  - `GET /api/teacher/courses/`
  - `POST /api/chapters/:courseId`
  - `PUT /api/chapters/:id` & `DELETE /api/chapters/:id`
  - `POST /api/lessons/` & `PUT /api/lessons/:id` & `DELETE /api/lessons/:id`
  - `POST /api/quiz/` & `PUT /api/quiz/:id` & `DELETE /api/quiz/:id`
  - `POST /api/questions/` & `PUT /api/questions/:id` & `DELETE /api/questions/:id`
  - `POST /api/coupons/` (Giảng viên tạo mã khuyến mãi riêng)
- **Màn hình & Components**:
  - Studio Khóa học (`/teacher/courses`): Danh sách khóa học, trạng thái duyệt (Pending, Approved, Rejected).
  - Trình biên soạn Giáo trình (`/teacher/courses/:id/curriculum`): Kéo thả/sắp xếp chương, tạo bài học video/văn bản, thiết lập thời lượng.
  - Trình dựng bài Quiz (`/teacher/quizzes/:id`): Tạo câu hỏi nhiều lựa chọn (Multiple Choice) hoặc điền khuyết (Fill in blank).
- **Tiêu chí Hoàn thành (DoD)**:
  - Giảng viên tạo được khóa học hoàn chỉnh gồm nhiều chương, bài học và quiz kiểm tra nộp lên hệ thống.

---

## 7. Giai đoạn F7: Bảng Điều Khiển Quản Trị Viên (Admin Operations)
- **Mục tiêu**: Công cụ điều hành toàn diện sàn học tập, phê duyệt nội dung và quản lý người dùng.
- **API Tích hợp**:
  - `GET /api/admin/users`, `PUT /api/admin/users/:id`, `POST /api/admin/users`
  - `GET /api/admin/courses`, `PATCH /api/admin/courses/teacher/:id` (Duyệt/Từ chối khóa học)
  - `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`
  - `POST /api/admin/coupons`, `DELETE /api/admin/coupons/:id`
  - `GET /api/comments/`, `PATCH /api/comments/:id/status` (Kiểm duyệt bình luận)
- **Màn hình & Components**:
  - Quản lý Người dùng (`/admin/users`): Cấp quyền, khóa tài khoản, tạo tài khoản Giảng viên.
  - Kiểm duyệt Khóa học (`/admin/courses`): Xem trước nội dung khóa học và bấm "Duyệt" (Approved) hoặc "Từ chối" (Rejected kèm lý do).
  - Quản trị Danh mục & Mã giảm giá toàn sàn.
  - Trung tâm Kiểm duyệt Bình luận (`/admin/comments`).
- **Tiêu chí Hoàn thành (DoD)**:
  - Quản trị viên duyệt khóa học của giảng viên, khóa học ngay lập tức xuất hiện trên trang chủ công khai.

---

## 8. Giai đoạn F8: Giao Tiếp Thời Gian Thực (Chat & Notifications)
- **Mục tiêu**: Tích hợp Socket.IO cho hệ thống trò chuyện giữa học viên - giảng viên và chuông thông báo đẩy.
- **API & Socket Tích hợp**:
  - `POST /api/conversations/`, `GET /api/conversations/my-conversations`
  - `POST /api/messages/`, `GET /api/messages/conversation/:conversationId`
  - `GET /api/notifications/my-notifications`, `PATCH /api/notifications/:id/read`
  - Socket events: `sendMessage`, `newMessage`, `messageRead`, `notification`.
- **Màn hình & Components**:
  - Cửa sổ Chat nổi hoặc trang tin nhắn chuyên biệt (`/messages`).
  - Chuông thông báo trên Header kèm Popover danh sách thông báo và đánh dấu đã đọc.
- **Tiêu chí Hoàn thành (DoD)**:
  - Gửi tin nhắn từ tài khoản Học viên, tài khoản Giảng viên nhận được chuông thông báo và tin nhắn tức thời mà không cần reload trang.

---

## 9. Giai đoạn F9: Phân Tích Dữ Liệu & Hiệu Quả Khóa Học (Analytics & Performance)
- **Mục tiêu**: Biến số liệu học tập thành lợi thế học thuật cho đồ án tốt nghiệp, trực quan hóa phễu học tập và điểm rơi rớt học viên.
- **API Tích hợp**:
  - `GET /api/teacher/statistics/overview`
  - `GET /api/teacher/statistics/revenue`
  - `GET /api/teacher/statistics/courses`
  - `GET /api/teacher/statistics/enrollments`
  - `GET /api/teacher/statistics/learning`
  - `GET /api/teacher/statistics/course-performance/:courseId`
- **Màn hình & Components**:
  - Dashboard Giảng viên (`/teacher/dashboard`): Biểu đồ doanh thu theo thời gian, tăng trưởng học viên, phân bố cấp độ khóa học.
  - Báo cáo Chuyên sâu Khóa học (`/teacher/analytics/:courseId`):
    - Tỷ lệ hoàn thành (Completion Rate) và Điểm số Quiz trung bình.
    - Biểu đồ Phễu Bài học (Lesson Funnel): Số học viên đi từ bài đầu tiên đến bài cuối cùng.
    - Phân tích Điểm rơi rớt (Drop-off Rate): Đánh dấu bài học có lượng học viên dừng lại nhiều nhất.
- **Tiêu chí Hoàn thành (DoD)**:
  - Dữ liệu thống kê được hiển thị trực quan qua biểu đồ Recharts chuyên nghiệp, tải dữ liệu mượt mà có skeleton loading.

---

## 10. Giai đoạn F10: Tối Ưu Hóa, Đa Thiết Bị & Nghiệm Thu Đồ Án (Polish & Defense Ready)
- **Mục tiêu**: Hoàn thiện toàn diện, kiểm thử trên điện thoại/máy tính bảng, tối ưu hiệu năng Lighthouse, chuẩn bị kịch bản bảo vệ đồ án.
- **Nội dung công việc**:
  - Kiểm tra Responsive toàn bộ các trang trên dải màn hình từ 375px đến 1920px.
  - Tối ưu SEO: Bổ sung Title, Meta description, OpenGraph tags cho các trang công khai.
  - Kiểm tra rà soát lỗi TypeScript và build production thử nghiệm (`npm run build`).
  - Xây dựng tài liệu hướng dẫn kịch bản demo cho buổi bảo vệ tốt nghiệp (Demo Script Walkthrough).
