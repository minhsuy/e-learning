# TMDEMY — AUTHENTICATION & AUTHORIZATION SPECIFICATION

> **Tài liệu đặc tả chi tiết toàn bộ chu trình Xác thực (Authentication) và Phân quyền (Authorization) của TMDEMY Frontend.**  
> *Tuân thủ 100% cơ chế Dual-Token JWT của Backend tại [`api/AUTH_FLOW.md`](file:///d:/e-learning/api/AUTH_FLOW.md).*

---

## 1. Chu trình Xác thực Hai Lớp (Dual-Token Lifecycle)

Hệ thống sử dụng cơ chế kết hợp giữa **Access Token** ngắn hạn và **Refresh Token** dài hạn để cân bằng giữa bảo mật và trải nghiệm người dùng.

```text
┌──────────────┐                               ┌────────────────┐
│ Trình duyệt  │                               │ Backend Server │
│  (Frontend)  │                               │ (Express Port) │
└──────┬───────┘                               └────────┬───────┘
       │                                                │
       │ 1. POST /api/users/login (email, password)     │
       ├───────────────────────────────────────────────►│
       │                                                │
       │ 2. Trả về: access_token, refresh_token         │
       │◄───────────────────────────────────────────────┤
       │                                                │
       │ 3. Lưu trữ tokens (Cookie / Secure Storage)    │
       │                                                │
       │ 4. GET /api/users/me (Bearer access_token)     │
       ├───────────────────────────────────────────────►│
       │                                                │
       │ 5. Trả về thông tin cá nhân & role ("user"...) │
       │◄───────────────────────────────────────────────┤
       │                                                │
       │ ... (Thời gian sau: access_token hết hạn) ...  │
       │                                                │
       │ 6. Gửi API bất kỳ (Bearer access_token cũ)    │
       ├───────────────────────────────────────────────►│
       │                                                │
       │ 7. Lỗi 401 Unauthorized ("jwt expired")        │
       │◄───────────────────────────────────────────────┤
       │                                                │
       │ 8. POST /api/users/access_token                │
       │    Body: { "refresh_token": "..." }            │
       ├───────────────────────────────────────────────►│
       │                                                │
       │ 9. Trả về: access_token mới                    │
       │◄───────────────────────────────────────────────┤
       │                                                │
       │ 10. Tự động gửi lại request ban đầu (Retry)    │
       ├───────────────────────────────────────────────►│
       │                                                │
       ▼                                                ▼
```

---

## 2. Đặc tả Chi tiết các Luồng Xác thực

### 2.1. Đăng ký & Kích hoạt Tài khoản (Registration & OTP)
1. Người dùng điền form tại `/register`: `username`, `email`, `password`, `confirm_password`, `phone`, `bio`.
2. Frontend gọi `POST /api/users/register`.
3. Backend tạo user với trạng thái `isVerified: false`, tạo mã OTP 6 số và gửi qua email.
4. Frontend chuyển hướng người dùng sang trang `/verify-otp?email=...`.
5. Người dùng nhập mã OTP 6 chữ số, frontend gọi `POST /api/users/verify-otp`.
6. Sau khi xác thực thành công, điều hướng sang `/login` kèm thông báo chào mừng.

### 2.2. Đăng nhập (Login)
1. Người dùng nhập `email` và `password` tại `/login`.
2. Frontend gọi `POST /api/users/login`.
3. Backend kiểm tra mật khẩu và điều kiện `isVerified === true`.
4. Nhận về payload:
   ```json
   {
     "success": true,
     "access_token": "eyJhbGciOi...",
     "refresh_token": "eyJhbGciOi...",
     "message": "Login successfully !"
   }
   ```
5. Frontend lưu trữ tokens và ngay lập tức gọi `GET /api/users/me` với header `Authorization: Bearer <access_token>` để lấy thông tin chi tiết người dùng (`id`, `username`, `email`, `role`, `avatar`).
6. Dựa vào `role` nhận được, frontend điều hướng người dùng tới phân hệ phù hợp:
   - Role `admin`: Điều hướng về `/admin/dashboard`
   - Role `teacher`: Điều hướng về `/teacher/dashboard`
   - Role `user`: Điều hướng về `/courses` hoặc `/student/dashboard`

### 2.3. Cấp mới Access Token (Token Refresh)
- Khi bất kỳ request nào trả về `401 Unauthorized` do hết hạn token (`jwt expired`):
- Frontend gọi:
  ```http
  POST /api/users/access_token
  Content-Type: application/json

  {
    "refresh_token": "<CURRENT_REFRESH_TOKEN>"
  }
  ```
- Backend kiểm tra tính hợp lệ và băm token so khớp trong PostgreSQL, sau đó cấp phát `access_token` mới.
- Nếu refresh token cũng đã hết hạn hoặc không hợp lệ: Xóa toàn bộ token và điều hướng về `/login`.

### 2.4. Đăng xuất (Logout)
1. Người dùng bấm nút "Đăng xuất" trên giao diện.
2. Frontend gọi `POST /api/users/logout` với header `Authorization: Bearer <access_token>`.
3. Backend xóa trường `refresh_token` trong DB để hủy phiên vĩnh viễn trên server.
4. Frontend xóa sạch token khỏi storage, ngắt kết nối Socket.IO, reset Auth state và đưa người dùng về `/login`.

### 2.5. Quên & Đặt lại Mật khẩu (Forgot & Reset Password)
- **Quên mật khẩu**: Form `/forgot-password` gọi `POST /api/users/forgot-password` với `email`. Backend gửi đường link kèm reset token vào hòm thư.
- **Đặt lại mật khẩu**: Trang `/reset-password?token=...` nhận token từ URL và form nhập `password`, `confirm_password`. Frontend gọi `PUT /api/users/reset-password` để cập nhật mật khẩu mới.

---

## 3. Quản lý Phiên & Bảo vệ Tuyến đường (Route Protection)

### 3.1. Next.js Middleware (`src/middleware.ts`)
Middleware ở tầng cạnh (Edge) kiểm tra sự tồn tại của token trước khi render route:
- Các tuyến đường công khai: `/`, `/courses/*`, `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password`.
- Các tuyến đường bắt buộc đăng nhập:
  - Phân hệ Quản trị (`/admin/*`): Yêu cầu người dùng đăng nhập và có `role === 'admin'`.
  - Phân hệ Giảng viên (`/teacher/*`): Yêu cầu người dùng đăng nhập và có `role === 'teacher'`.
  - Phân hệ Học viên (`/student/*`, `/learn/*`): Yêu cầu người dùng đăng nhập với role `user` (hoặc `teacher`, `admin` khi trải nghiệm học tập).

### 3.2. Cảnh báo Quan trọng về Phân quyền UI
> [!WARNING]
> **Giao diện không phải là ranh giới bảo mật tuyệt đối**: Việc ẩn nút bấm hay chặn trang ở phía Frontend chỉ nhằm nâng cao trải nghiệm người dùng (UX). Toàn bộ tính bảo mật và quyền truy cập dữ liệu thực tế do các Middleware của Backend (`verifyAccessToken`, `isTeacher`, `isAdmin`) kiểm soát và thực thi.
