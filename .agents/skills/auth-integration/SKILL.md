---
name: auth-integration
description: Tích hợp và bảo vệ luồng xác thực (Authentication) và phân quyền (Authorization) trong TMdemy Frontend dựa trên cơ chế JWT Dual-Token hiện có.
---

# Skill: Authentication & Authorization Integration

## 1. Khi Nào Sử Dụng (When to Use)

- Khi phát triển hoặc hiệu chỉnh trang/thành phần yêu cầu đăng nhập (Protected Routes).
- Khi xử lý phân quyền hiển thị hoặc chặn truy cập theo vai trò (`user`, `teacher`, `admin`).
- Khi làm việc với luồng đăng nhập, đăng ký, kích hoạt OTP, làm mới token (Refresh Token), hoặc đăng xuất.

---

## 2. Quy Trình Thực Thi (Step-by-Step Workflow)

```text
Inspect Existing Auth Architecture
       ↓
Verify Identity Context via useAuth()
       ↓
Check Access & Refresh Token Flow
       ↓
Implement Route / Component Protection
       ↓
Validate Role Matrix (user / teacher / admin)
       ↓
Handle Unauthorized & Forbidden States
       ↓
Verify Session Cleanup on Logout
```

### Bước 1: Khảo Sát Hệ Thống Auth Sẵn Có (Inspect Auth Architecture)
- Tham chiếu tài liệu chuẩn: `docs/AUTHENTICATION.md` và `docs/ROLE_PERMISSIONS.md`.
- Sử dụng Auth Context và hook hiện có trong dự án (`useAuth()` tại `src/hooks/useAuth` hoặc `src/context/AuthContext`).
- **Nghiêm cấm**: Tuyệt đối không tạo ra hệ thống quản lý auth thứ hai (không tự viết thêm AuthProvider hay custom JWT decoder riêng rẽ).

### Bước 2: Kiểm Tra Chu Trình Token (Token Lifecycle)
- **Access Token**: Lưu trữ ngắn hạn, đính kèm vào header `Authorization: Bearer <token>` của mọi API được bảo vệ.
- **Refresh Token**: Dùng để cấp mới Access Token qua `POST /api/users/access_token` khi nhận lỗi 401.
- Không tự ý thay đổi cách lưu trữ token trái với quy ước hiện tại của codebase.

### Bước 3: Bảo Vệ Tuyến Đường (Protected Routes)
- Đối với App Router:
  - Kiểm tra xem route thuộc nhóm bảo vệ nào: `(student)`, `(teacher)`, hay `(admin)`.
  - Tận dụng Middleware hoặc Auth Guards ở Layout để kiểm tra trạng thái đăng nhập.
  - Nếu chưa đăng nhập: Điều hướng về `/login?redirect=<url_hien_tai>` một cách an toàn.

### Bước 4: Kiểm Soát Phân Quyền Theo Vai Trò (Role Verification)
- Giá trị vai trò trong database/token luôn là: `"user"`, `"teacher"`, `"admin"`.
- So khớp với ma trận quyền trong `docs/ROLE_PERMISSIONS.md`:
  - Học viên (`user`): Không được truy cập route `/teacher/*` hoặc `/admin/*`.
  - Giảng viên (`teacher`): Chỉ quản lý khóa học, bài học, quiz do chính mình tạo.
  - Quản trị viên (`admin`): Toàn quyền kiểm duyệt, quản lý users và danh mục.
- Kiểm tra quyền ở cả 2 cấp độ:
  1. Cấp độ Trang (Page level): Chặn truy cập và chuyển hướng hoặc hiển thị 403 Forbidden.
  2. Cấp độ Giao diện (UI level): Ẩn các nút hành động đặc quyền nếu người dùng không đủ role.

### Bước 5: Xử Lý Trạng Thái Chưa Xác Thực (Unauthorized States)
- Khi user chưa đăng nhập thực hiện hành động cần quyền (ví dụ: nhấn "Yêu thích", "Mua khóa học"):
  - Mở modal đăng nhập hoặc điều hướng có lưu lại vị trí trước đó.
  - Tránh để màn hình trắng hoặc crash do `user` bị `null`.

### Bước 6: Xử Lý Đăng Xuất & Hết Hạn Phiên (Logout & Session Cleanup)
- Khi người dùng đăng xuất:
  - Gọi endpoint `POST /api/users/logout` để backend hủy Refresh Token trong DB.
  - Xóa sạch state người dùng trong client context và storage.
  - Điều hướng người dùng về trang chủ hoặc trang đăng nhập.

---

## 3. Ranh Giới & Điều Cấm (Boundaries & Constraints)

- ❌ **Không tạo cơ chế Auth mới**: Không tự ý cài đặt NextAuth/Auth.js, Supabase Auth hay các thư viện ngoài. Dự án đã có hệ thống Custom JWT Dual-Token hoàn chỉnh.
- ❌ **Không bypass luồng Auth**: Không hardcode thông tin user giả (ví dụ: `const user = { role: 'admin' }`) trong code production để vượt qua kiểm tra quyền.
- ❌ **Không gửi `userId` tùy tiện**: Không truyền `userId` qua body khi backend đã tự xác định danh tính qua token.

---

## 4. Kết Hợp Kỹ Năng (Composition)

- `page-implementation` + **`auth-integration`**: Xây dựng trang bảo mật (Dashboard, My Courses, Teacher Studio).
- **`auth-integration`** + `api-integration`: Đảm bảo request gửi lên backend có đủ token và xử lý 401 tự động refresh.
