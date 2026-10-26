# TMDEMY — ROLE & PERMISSIONS MATRIX

> **Tài liệu quy định ma trận phân quyền và phạm vi hiển thị giao diện theo từng vai trò người dùng trong TMDEMY Frontend.**

---

## 1. Bảng Đối Chiếu Danh Xưng và Enum Hệ Thống

Để đảm bảo tính nhất quán giữa Giao diện người dùng (UI) và Giao thức mạng (API Contract):

| Database / API Enum (`req.user.role`) | Danh xưng Nghiệp vụ | Tên hiển thị Giao diện (UI) | Đối tượng sử dụng |
| :---: | :---: | :---: | :--- |
| *(Không có token)* | **Public Guest** | Khách vãng lai | Người dùng chưa đăng nhập, tham quan sàn khóa học |
| `"user"` | **Student** | **Học viên** | Người đăng ký tài khoản thông thường, mua và học khóa học |
| `"teacher"` | **Teacher / Expert** | **Giảng viên** | Chuyên gia tạo giáo trình, bài giảng, bài trắc nghiệm và xem phân tích |
| `"admin"` | **Administrator** | **Quản trị viên** | Ban quản trị hệ thống, kiểm duyệt nội dung và quản lý sàn |

---

## 2. Ma Trận Phân Quyền Tính Năng Chi Tiết (Permissions Matrix)

| Danh mục Tính năng | Khách (Public) | Học viên (`user`) | Giảng viên (`teacher`) | Quản trị viên (`admin`) |
| :--- | :---: | :---: | :---: | :---: |
| **Duyệt & Tìm kiếm khóa học** | ✅ | ✅ | ✅ | ✅ |
| **Xem chi tiết khóa học, đề cương** | ✅ | ✅ | ✅ | ✅ |
| **Đăng ký tài khoản & Kích hoạt OTP** | ✅ | ❌ *(Đã có)* | ❌ *(Đã có)* | ❌ *(Đã có)* |
| **Thêm khóa học vào danh sách Yêu thích** | ❌ *(Yêu cầu Login)* | ✅ | ✅ | ✅ |
| **Mua khóa học & Nhập Coupon** | ❌ *(Yêu cầu Login)* | ✅ | ✅ | ✅ |
| **Vào phòng học (Video / Text Lesson)** | ❌ | ✅ *(Đã ghi danh)* | ✅ *(Khóa học sở hữu)* | ✅ *(Toàn quyền)* |
| **Làm bài trắc nghiệm & Nộp bài (Quiz)** | ❌ | ✅ *(Đã ghi danh)* | ✅ *(Xem trước)* | ✅ *(Xem trước)* |
| **Nhận Chứng chỉ Tốt nghiệp (Certificate)** | ❌ | ✅ *(Đạt 100%)* | ❌ | ❌ |
| **Đánh giá khóa học (Rating & Review)** | ❌ | ✅ *(Đã ghi danh)* | ❌ *(Không tự rate)* | ❌ |
| **Bình luận & Phản hồi bài học** | ❌ | ✅ | ✅ | ✅ |
| **Chat thời gian thực (Realtime Chat)** | ❌ | ✅ *(Chat với GV)* | ✅ *(Chat với HV)* | ✅ |
| **Xem Dashboard Doanh thu Giảng viên** | ❌ | ❌ | ✅ | ❌ *(Xem Dashboard Admin)*|
| **Tạo & Biên soạn Khóa học mới** | ❌ | ❌ | ✅ *(Chờ duyệt)* | ✅ *(Duyệt ngay)* |
| **Biên soạn Chương, Bài học, Quiz** | ❌ | ❌ | ✅ *(Khóa học của mình)*| ✅ *(Mọi khóa học)* |
| **Xem Phân tích Chuyên sâu (Performance & Funnel)** | ❌ | ❌ | ✅ *(Khóa học của mình)*| ✅ |
| **Tạo mã giảm giá (Coupon)** | ❌ | ❌ | ✅ *(Coupon riêng)* | ✅ *(Coupon toàn sàn)* |
| **Phê duyệt / Từ chối Khóa học** | ❌ | ❌ | ❌ | ✅ |
| **Quản lý Tài khoản (Khóa/Mở/Cấp quyền)** | ❌ | ❌ | ❌ | ✅ |
| **Tạo tài khoản Giảng viên mới** | ❌ | ❌ | ❌ | ✅ |
| **Quản lý Danh mục (Categories)** | ❌ | ❌ | ❌ | ✅ |
| **Kiểm duyệt Bình luận toàn sàn** | ❌ | ❌ | ❌ | ✅ |

---

## 3. Bản Đồ Tuyến Đường Frontend (Route Access Map)

```text
/ (Public Group)
├── / .................................... Public (Tất cả mọi người)
├── /courses ............................. Public (Tất cả mọi người)
├── /courses/:slug ....................... Public (Tất cả mọi người)
├── /categories/:slug .................... Public (Tất cả mọi người)
│
/ (Auth Group)
├── /login, /register, /verify-otp ....... Chỉ dành cho khách (Đã login sẽ redirect về Dashboard)
├── /forgot-password, /reset-password .... Chỉ dành cho khách
│
/student (Student Group) - Yêu cầu role: "user" | "teacher" | "admin"
├── /student/dashboard ................... Bảng điều khiển học tập cá nhân
├── /student/my-courses .................. Khóa học đã mua và đang theo học
├── /student/orders ...................... Lịch sử mua khóa học & hóa đơn
├── /student/certificates ................ Danh sách chứng chỉ tốt nghiệp
├── /student/profile ..................... Hồ sơ cá nhân và đổi mật khẩu
├── /learn/:courseId ..................... Phòng học tập trực tuyến
│
/teacher (Teacher Group) - Yêu cầu role: "teacher" (hoặc "admin")
├── /teacher/dashboard ................... Thống kê doanh thu, học viên tổng quan
├── /teacher/courses ..................... Danh sách khóa học do mình sở hữu
├── /teacher/courses/new ................. Tạo khóa học mới (trạng thái pending)
├── /teacher/courses/:id/curriculum ...... Studio biên soạn chương, bài học, quiz
├── /teacher/coupons ..................... Quản lý mã giảm giá riêng
├── /teacher/students .................... Danh sách học viên đang theo học
├── /teacher/analytics/:courseId ......... Phân tích chuyên sâu hiệu quả khóa học
│
/admin (Admin Group) - Yêu cầu role: "admin"
├── /admin/dashboard ..................... Tổng quan tài chính & số liệu toàn hệ thống
├── /admin/users ......................... Quản lý danh sách người dùng & cấp tài khoản Teacher
├── /admin/courses ....................... Kiểm duyệt khóa học (Approve / Reject)
├── /admin/categories .................... Thêm, sửa, xóa danh mục khóa học
├── /admin/coupons ....................... Quản lý mã giảm giá toàn sàn
└── /admin/comments ...................... Kiểm duyệt bình luận vi phạm
```

---

## 4. Nguyên Tắc Bảo Vệ Giao Diện (UI Protection Principles)

1. **Kiểm tra Điều kiện Trước khi Hiển thị**: Sử dụng hook `useAuth()` để trích xuất `user.role`:
   - Nếu `role !== 'teacher'`, không hiển thị liên kết "Kênh Giảng Viên" trên thanh Navigation.
   - Nếu `role !== 'admin'`, ẩn hoàn toàn menu "Trang Quản Trị".
2. **Khóa Thành phần Học tập đối với Khóa học Chưa Mua**:
   - Nếu học viên chưa ghi danh (`isEnrolled === false`), trang chi tiết khóa học chỉ cho phép xem trước các bài học được cấu hình miễn phí (`isPreview === true`).
   - Các bài học có phí sẽ hiển thị biểu tượng ổ khóa 🔒 cùng nút "Đăng ký khóa học để mở khóa".
3. **Cơ Chế Điều Hướng Khi Không Đủ Quyền**:
   - Truy cập vào route không thuộc thẩm quyền: Chuyển hướng người dùng về trang thông báo `/403` (Forbidden) hoặc trang Dashboard mặc định của role hiện tại.
