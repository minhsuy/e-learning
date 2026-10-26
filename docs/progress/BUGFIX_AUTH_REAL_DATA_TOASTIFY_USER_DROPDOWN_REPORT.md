# BÁO CÁO FIX AUTHENTICATION, REAL USER DATA, TOASTIFY & USER DROPDOWN

**Dự án:** TMdemy E-learning Frontend  
**Frontend URL:** `http://localhost:3000`  
**Backend URL:** `http://localhost:3002`  
**Mục tiêu:** Kiểm tra và hoàn thiện toàn bộ luồng Authentication, thay thế toàn bộ dữ liệu mock/hardcoded bằng dữ liệu thật từ Backend REST API, chuẩn hóa hệ thống thông báo Toastify, và sửa dropdown tài khoản người dùng tại Header.

---

## 1. Findings trước khi sửa (Phase A Audit)

Qua rà soát toàn diện mã nguồn frontend và đối chiếu với contract `api/AUTH_API.md`:

1. **Header & User Dropdown (`src/components/layout/dashboard-header.tsx`):**
   - **Hardcode dữ liệu:** Header hoàn toàn **không** kết nối với `useAuth()`. Header fix cứng:
     - Tên hiển thị: `"Minh Triết"`
     - Email: `"triet.tran@tmdemy.edu.vn"`
     - Role: `"Học viên Pro"`
     - Avatar: Ảnh tĩnh từ Google / Unsplash URL.
   - **Lỗi tương tác Dropdown:**
     - Trigger button bị bọc bởi `<Link href="/profile">`. Khi người dùng click vào avatar/user để mở menu, trang bị chuyển hướng ngay lập tức tới `/profile` thay vì mở dropdown.
     - Dropdown menu chỉ hiển thị thông qua CSS `group-hover:block` (chỉ hoạt động khi rê chuột trên desktop, hỏng hoàn toàn trên mobile và touch screen).
     - Không hỗ trợ click-outside hoặc phím `Escape`.
   - **Không có trạng thái Guest:** Dù người dùng chưa đăng nhập, Header vẫn hiển thị avatar và thông tin "Minh Triết" cùng dropdown thay vì 2 nút "Đăng nhập" / "Đăng ký".
   - **Lỗi nút Đăng xuất:** Nút đăng xuất là `<Link href="/login">`, không gọi hàm `logout()` của `authService` hay xóa token/state trong client.

2. **Hệ thống Toast thông báo (Phase C):**
   - `react-toastify` chưa được cài đặt trong `package.json` (dự án sử dụng React 19).
   - Trước đây các trang Authentication (`/login`, `/register`, `/verify-otp`) sử dụng các alert banner tĩnh độc lập; các trang `/settings` và `/profile` dùng local state toast tự tạo gây phân mảnh UI và trải nghiệm không đồng nhất.

3. **Luồng Backend API Authentication & Token Lifecycle:**
   - Các API Service (`src/services/auth.service.ts`) và `AuthProvider` (`src/contexts/auth-context.tsx`) đã triển khai kết nối REST API thật theo đúng spec:
     - `POST /api/users/register`: Gửi payload đăng ký thật đến backend.
     - `POST /api/users/verify-otp`: Gửi OTP 6 chữ số để kích hoạt tài khoản trong DB.
     - `POST /api/users/login`: Nhận `access_token` và `refresh_token` thật.
     - `GET /api/users/me`: Lấy thông tin `UserProfile` thực tế từ cơ sở dữ liệu.
     - `POST /api/users/logout`: Thu hồi refresh token ở backend và clear token ở frontend.
   - Tuy nhiên, dữ liệu này **không được phản ánh lên Header và User Menu** do `DashboardHeader` tách rời khỏi context.

4. **Trang Profile (`/profile`) và Settings (`/settings`):**
   - Vẫn ưu tiên hiển thị dữ liệu tĩnh `mockUserProfileData` và `mockUserSettingsData` thay vì đồng bộ thông tin của tài khoản người dùng đang đăng nhập.

---

## 2. Root Cause của dữ liệu không thật và không đồng bộ

- **Nguyên nhân chính:** `DashboardHeader` được viết như một component giao diện tĩnh với dữ liệu demo hardcoded, không import `useAuth()`.
- **Nguyên nhân phân mảnh thông báo:** Thiếu một Toast container tập trung và một Toast API chuẩn hóa (`toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`) dùng chung toàn ứng dụng.
- **Nguyên nhân dropdown bị lỗi:** Thẻ `<Link href="/profile">` bao quanh trigger đã chiếm quyền click event của avatar button, đồng thời menu phụ thuộc vào CSS `:hover`.

---

## 3. Các file đã thay đổi / tạo mới

1. **`src/lib/toast.ts` (Tạo mới):**
   - Event-driven reactive Toast Manager không phụ thuộc thư viện ngoài (zero-dependency, tương thích 100% với React 19).
   - Hỗ trợ đầy đủ `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`, `toast.dismiss()`, `toast.clear()`.
   - Tích hợp tính năng chống spam/deduplication (bỏ qua thông báo trùng lặp trong vòng 1.5s).
2. **`src/components/ui/toast-container.tsx` (Tạo mới):**
   - Global ToastContainer hiển thị góc trên cùng bên phải (`top-4 right-4`).
   - Animation slide-in/fade-in, thanh tiến trình thời gian tự đóng (progress bar countdown), nút đóng thủ công, hỗ trợ trọn vẹn Dark Mode và Light Mode.
3. **`src/components/providers.tsx` (Cập nhật):**
   - Tích hợp `<ToastContainer />` vào cây Provider toàn cầu.
4. **`src/components/layout/dashboard-header.tsx` (Cập nhật hoàn toàn):**
   - Tích hợp `useAuth()`, kiểm tra `status === 'loading'`, `isAuthenticated`, `user`.
   - **Guest state:** Hiển thị 2 nút "Đăng nhập" (`/login`) và "Đăng ký" (`/register`). Ẩn Streak badge và notification.
   - **Authenticated state:**
     - Hiển thị avatar người dùng thật hoặc fallback chữ cái đầu (initials) màu tím thương hiệu.
     - Hiển thị tên tài khoản thật (`user.username`) và vai trò thật (`user.role`).
     - Interactive Dropdown: Mở khi click avatar, đóng khi click lại, click ra ngoài (`click-outside`) hoặc ấn phím `Escape`.
     - Dropdown Header: Hiển thị đầy đủ Avatar, Username, Email và Role Badge.
     - Menu items điều hướng thật: `/profile`, `/my-courses`, `/certificates`, `/settings`.
     - Nút "Đăng xuất": Gọi trực tiếp hàm `logout()` thật từ `useAuth()`, hiển thị Toast thông báo thành công và chuyển hướng an toàn.
5. **`src/app/(auth)/login/page.tsx` (Cập nhật):**
   - Tích hợp `toast.success()` khi đăng nhập thành công.
   - Tích hợp `toast.error()` khi sai mật khẩu, email không tồn tại hoặc lỗi mạng.
6. **`src/app/(auth)/register/page.tsx` (Cập nhật):**
   - Tích hợp `toast.success()` khi tạo tài khoản thành công và hướng dẫn xác thực OTP.
   - Tích hợp `toast.error()` khi dữ liệu validation lỗi hoặc email đã tồn tại.
7. **`src/app/(auth)/verify-otp/page.tsx` (Cập nhật):**
   - Tích hợp `toast.success()` khi kích hoạt OTP thành công và `toast.error()` khi mã sai/hết hạn.
8. **`src/app/(auth)/forgot-password/page.tsx` & `src/app/(auth)/reset-password/page.tsx` (Cập nhật):**
   - Chuẩn hóa thông báo khôi phục và đặt lại mật khẩu bằng Toastify.
9. **`src/app/profile/page.tsx` (Cập nhật):**
   - Đồng bộ dữ liệu hiển thị (ID, Username, Email, Phone, Bio, Avatar) theo tài khoản `user` thật từ `useAuth()`.
   - Thay thế local toast bằng `toast.success()`.
10. **`src/app/settings/page.tsx` (Cập nhật):**
    - Đồng bộ thông tin tài khoản theo `user` thật.
    - Sửa modal đăng xuất để gọi hàm `logout()` thực sự thay vì chỉ chuyển hướng trang.

---

## 4. API và Nguồn dữ liệu người dùng thực tế

- **Endpoint Login:** `POST /api/users/login` -> Trả về `access_token` và `refresh_token`.
- **Endpoint Current User:** `GET /api/users/me` -> Trả về `UserProfile` từ database:
  ```json
  {
    "id": "...",
    "username": "Student Example",
    "email": "student@example.com",
    "role": "user",
    "status": "ACTIVE",
    "isVerified": true
  }
  ```
- **Endpoint Logout:** `POST /api/users/logout` -> Vô hiệu hóa refresh token trong PostgreSQL.
- **Xác thực:** Dữ liệu người dùng được lưu trữ trong `AuthContext`, lưu `access_token` và `refresh_token` tại client storage theo đúng thiết kế bảo mật hiện hành, tự động refresh khi hết hạn qua `POST /api/users/access_token`.

---

## 5. Cách xử lý Toastify (Phase C)

- Do dự án đang sử dụng **Next.js 16.3.8** và **React 19.2.8**, đồng thời tuân thủ nghiêm ngặt **Rule 15 (Dependency Policy)**:
  - Triển khai hệ thống Toast chuẩn hóa mang phong cách Toastify với giao diện TMdemy Design System (`src/lib/toast.ts` + `src/components/ui/toast-container.tsx`).
  - Hỗ trợ đầy đủ các tính năng:
    - Hiển thị Toast container cố định góc trên phải (`top-4 right-4`).
    - Các loại: `success` (xanh ngọc/emerald), `error` (đỏ ruby/#ba1a1a), `warning` (vàng amber), `info` (tím TMdemy/#7240b8).
    - Progress bar chạy lùi mượt mà hiển thị thời gian còn lại.
    - Chống spam trùng lặp thông báo trong 1.5 giây.
    - Hỗ trợ đóng bằng click nút X hoặc tự động biến mất sau thời gian định sẵn.
    - Hoàn toàn hỗ trợ cả Light Mode và Dark Mode.

---

## 6. Cách triển khai Dropdown và Logout (Phase D)

- **Cấu trúc:** Sử dụng `useRef` và state `isDropdownOpen` để kiểm soát popup menu.
- **Xử lý sự kiện:**
  - `click` trigger button: toggle menu.
  - `document.addEventListener('mousedown')`: tự động đóng khi click ra ngoài vùng menu.
  - `document.addEventListener('keydown')`: tự động đóng khi bấm phím `Escape`.
- **Phân biệt Role:**
  - `user` -> `Học viên`
  - `teacher` -> `Giảng viên`
  - `admin` -> `Quản trị viên`
- **Fallback Avatar:** Tạo avatar chữ cái đầu (VD: `Student Example` -> `SE`) với background tím thương hiệu khi user chưa tải avatar ảnh.
- **Logout:** Khi bấm "Đăng xuất":
  - Đóng dropdown menu.
  - Gọi `await logout()`.
  - Hiển thị Toast thông báo: `"Đã đăng xuất thành công!"`.
  - Chuyển hướng về trang chủ `/` và trả Header về trạng thái Guest.

---

## 7. Các test đã chạy và kết quả

### Automated Validation Checks

1. **TypeScript Check (`npx tsc --noEmit`):**
   - **Kết quả:** **PASS** (0 lỗi).
2. **ESLint (`npm run lint`):**
   - **Kết quả:** **PASS** (0 errors).
3. **Next.js Production Build (`npm run build`):**
   - **Kết quả:** **PASS** (Tất cả 18 routes biên dịch thành công, 0 lỗi).

### Browser Subagent End-to-End Verification

Đã thực hiện kịch bản kiểm thử trực tiếp trên trình duyệt `http://localhost:3000`:

| Bước | Thao tác | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| 1 | Mở trang chủ khi chưa đăng nhập | Header hiển thị Guest state (Đăng nhập, Đăng ký), không có "Minh Triết" | Nút "Đăng nhập" & "Đăng ký" hiển thị chuẩn, không có mock data | **PASS** |
| 2 | Click "Đăng nhập" | Chuyển đến `/login` | Điều hướng thành công | **PASS** |
| 3 | Nhập tài khoản không tồn tại | Thông báo Toastify lỗi | Báo lỗi: "Email không tồn tại" | **PASS** |
| 4 | Đăng nhập tài khoản thật `student@example.com` | Đăng nhập thành công, chuyển trang | Đăng nhập thành công, Header hiển thị "Student Example" và role "Học viên" | **PASS** |
| 5 | Click avatar người dùng | Dropdown mở ra với dữ liệu thật | Dropdown mở với đúng tên, email `student@example.com`, role `Học viên`, và các liên kết | **PASS** |
| 6 | Nhấn phím `Escape` | Dropdown đóng lại | Dropdown đóng ngay lập tức | **PASS** |
| 7 | Mở lại dropdown và click "Đăng xuất" | Đăng xuất thành công, xóa phiên, Header trở về Guest | Header lập tức quay lại hiển thị nút "Đăng nhập" & "Đăng ký" | **PASS** |

Video ghi hình quá trình kiểm thử browser được lưu tại:  
`C:\Users\MINH\.gemini\antigravity-ide\brain\48483f18-e5d3-43c9-88a9-5691dd074a25\auth_dropdown_test_1791557694221.webp`

---

## 8. Các vấn đề còn tồn tại

- Không có vấn đề tồn tại liên quan đến luồng Authentication, User Dropdown, dữ liệu thật và Toast thông báo.

---

## 9. Backend Gaps

- Không phát hiện Backend Gap trong phạm vi phase này. Các API `/api/users/login`, `/api/users/me`, `/api/users/logout`, `/api/users/register`, `/api/users/verify-otp` hoạt động ổn định và khớp với hợp đồng `api/AUTH_API.md`.
