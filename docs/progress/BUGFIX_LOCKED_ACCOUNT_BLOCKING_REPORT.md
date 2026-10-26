# Báo Cáo Triển Khai: Chặn Tuyệt Đối Tài Khoản Bị Khóa (Status: INACTIVE)

**Mã công việc:** BUGFIX / FEATURE ENHANCEMENT — ACCOUNT LOCKOUT ENFORCEMENT  
**Dự án:** TMdemy E-learning Frontend (`d:/e-learning`)  
**Ngày thực hiện:** 19/10/2026  
**Trạng thái:** HOÀN THÀNH TOÀN DIỆN (ĐÃ VALIDATE BUILD & E2E BROWSER)

---

## 1. Bối cảnh & Vấn đề Phát hiện (Root Cause)

### Vấn đề người dùng phản ánh:
> *"Khi admin đã khóa tài khoản (status = INACTIVE) rồi nhưng vẫn vô được hệ thống bình thường, chỉ với 1 pop up cơ bản thì chưa chặn được hoàn toàn, mong bạn phát triển tính năng này nhé."*

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
1. **Ranh giới Backend**: Backend `POST /api/users/login` chỉ kiểm tra email, password và `isVerified: true`. Khi tài khoản đã bị đặt `status = 'INACTIVE'`, Backend vẫn cấp JWT `access_token` và `refresh_token`. Đồng thời endpoint `GET /api/users/me` trả về `200 OK` với trường `"status": "INACTIVE"`.
2. **Kẽ hở Frontend trước đây**:
   - `AuthProvider` sau khi gọi `login()` chỉ lưu token và chuyển trạng thái sang `authenticated` mà không kiểm tra trường `user.status`.
   - `RouteGuard` chỉ kiểm tra `isAuthenticated` và `allowedRoles`, không kiểm tra `status === 'INACTIVE'`.
   - Kết quả: Người dùng bị khóa vẫn đăng nhập được, được chuyển vào `/` hoặc `/dashboard` và chỉ gặp các thông báo nhẹ (toast/pop up) nhưng vẫn tiếp tục click xem khóa học, xem video bình thường.

---

## 2. Giải Pháp Triển Khai (Multi-layered Protection)

Để triệt để ngăn chặn, giải pháp phòng thủ 4 lớp (Defense-in-depth) được xây dựng hoàn toàn ở Frontend theo đúng ranh giới kiến trúc:

### Lớp 1: Cổng Đăng Nhập (`src/contexts/auth-context.tsx` & `src/app/(auth)/login/page.tsx`)
- Trong hàm `login()`: Ngay sau khi lấy thông tin qua `authService.getMe()`, kiểm tra ngay lập tức `isUserAccountLocked(profile)`:
  - Nếu `status.toUpperCase() === 'INACTIVE'`:
    - **Lập tức thu hồi token**: Gọi `clearTokens()` để không lưu bất kỳ access_token/refresh_token nào vào localStorage hoặc Cookie.
    - Đặt trạng thái về `unauthenticated`.
    - Quăng lỗi `AppApiError` (403): *"Tài khoản của bạn đã bị khóa bởi Quản trị viên. Bạn không có quyền truy cập vào hệ thống."*
- Tại trang `login/page.tsx`:
  - Bắt lỗi 403 từ `login()` và render **Khung cảnh báo đỏ nổi bật (Dedicated Locked Alert Box)** ngay trên giao diện form đăng nhập với icon cảnh báo đỏ, thông điệp rõ ràng và liên kết gửi mail trực tiếp tới `support@tmdemy.vn`.
  - Không cho phép người dùng chuyển trang vào bất kỳ phân hệ nào.

### Lớp 2: Bảo Vệ Phiên Làm Việc Hiện Hữu (`checkSession` & Tab Focus Listener)
- Khi người dùng đã có token trong trình duyệt hoặc truy cập trực tiếp URL hệ thống:
  - `checkSession()` gọi `authService.getMe()`: Nếu phát hiện `status: 'INACTIVE'`, chuyển `status` sang `'locked'` và lưu thông tin tài khoản bị khóa.
  - Tích hợp `visibilitychange` listener: Khi người dùng chuyển tab và quay lại tab TMdemy, nếu Admin vừa thực hiện khóa tài khoản ở màn hình quản trị, hệ thống lập tức tự động sync lại trạng thái và khóa ngay.

### Lớp 3: Modal Khóa Toàn Màn Hình Không Thể Tắt (`AccountLockedModal`)
- Tạo component `AccountLockedModal` (`src/components/auth/account-locked-modal.tsx`) được mount toàn cục trong `Providers`:
  - **Z-Index tối đa**: `z-[999999]`.
  - **Lớp phủ nền (Backdrop)**: Màu tối `#0c0914]/95` kết hợp hiệu ứng `backdrop-blur-xl`, vô hiệu hóa hoàn toàn con trỏ và thao tác click vào các thành phần bên dưới.
  - **Khóa thanh cuộn (Scroll Lock)**: Vô hiệu hóa `document.body.style.overflow = 'hidden'`.
  - **Không có nút đóng hay backdrop dismiss**: Người dùng không thể tắt modal bằng phím ESC hay click ra ngoài.
  - Hiển thị đầy đủ thông tin: Tên tài khoản, email, huy hiệu `BỊ KHÓA TOÀN PHẦN (INACTIVE)`.
  - Cung cấp 2 hành động duy nhất:
    - **"Đăng xuất khỏi hệ thống"**: Gọi `logout()`, xóa sạch toàn bộ token/state và điều hướng về `/login`.
    - **"Liên hệ hỗ trợ"**: Mở ứng dụng mail với tiêu đề khiếu nại gửi tới `support@tmdemy.vn`.

### Lớp 4: Khóa Tuyệt Đối Tại `RouteGuard` (`src/components/auth/route-guard.tsx`)
- Thêm điều kiện `isAccountBlocked = isLocked || Boolean(user && user.status?.toUpperCase() === 'INACTIVE');`.
- Khi `isAccountBlocked === true`: `RouteGuard` lập tức trả về `null`, ngăn chặn hoàn toàn việc render giao diện con của các trang được bảo vệ (`/dashboard`, `/profile`, `/learn`, `/teacher/*`, `/admin/*`, v.v.).

### Cải thiện Độ Tương Thích & Tính Nhất Quán (Case-Insensitive Status):
- Đồng bộ kiểm tra trạng thái người dùng không phân biệt chữ hoa chữ thường (`status?.toLowerCase() === 'inactive'` / `status?.toUpperCase() === 'INACTIVE'`) xuyên suốt toàn bộ hệ thống:
  - `src/components/admin/users/lock-user-modal.tsx`: Khóa và Mở khóa tài khoản hoạt động mượt mà hai chiều.
  - `src/components/admin/users/user-table.tsx`: Hiển thị chính xác badge Bị khóa / Hoạt động cả ở giao diện Desktop và Mobile.
  - `src/components/admin/users/user-detail-modal.tsx`
  - `src/components/admin/dashboard/recent-users-card.tsx`

---

## 3. Danh Sách Tệp Đã Tạo & Chỉnh Sửa

| Tệp tin | Thao tác | Mục đích |
| :--- | :--- | :--- |
| `src/types/auth.ts` | Chỉnh sửa | Bổ sung trạng thái `'locked'` vào `AuthStatus`, thêm `isLocked: boolean` vào `AuthContextType`. |
| `src/contexts/auth-context.tsx` | Chỉnh sửa | Hàm `isUserAccountLocked`, chặn cấp session trong `login()`, bắt trạng thái locked trong `checkSession` & `refreshUser`, thêm `visibilitychange` listener. |
| `src/components/auth/account-locked-modal.tsx` | Tạo mới | Modal chặn toàn diện với `z-[999999]`, backdrop blur, scroll-lock, hiển thị thông tin tài khoản và nút đăng xuất/hỗ trợ. |
| `src/components/auth/route-guard.tsx` | Chỉnh sửa | Bổ sung `isAccountBlocked`, từ chối render children khi người dùng bị khóa. |
| `src/components/providers.tsx` | Chỉnh sửa | Mount `<AccountLockedModal />` toàn cục trong `AuthProvider`. |
| `src/app/(auth)/login/page.tsx` | Chỉnh sửa | Khung cảnh báo đỏ chuyên dụng hiển thị lỗi tài khoản bị khóa và liên kết hỗ trợ. |
| `src/lib/api/client.ts` | Chỉnh sửa | Bổ sung dịch lỗi tiếng Việt cho các mã lỗi locked/inactive. |
| `src/components/admin/users/lock-user-modal.tsx` | Chỉnh sửa | Chuẩn hóa case-insensitive `status`, bổ sung test IDs cho nút xác nhận khóa/mở khóa. |
| `src/components/admin/users/user-table.tsx` | Chỉnh sửa | Chuẩn hóa `isInactive` case-insensitive cho bảng và thẻ mobile. |
| `src/components/admin/users/user-detail-modal.tsx` | Chỉnh sửa | Chuẩn hóa `isInactive` case-insensitive trong modal chi tiết. |
| `src/components/admin/dashboard/recent-users-card.tsx` | Chỉnh sửa | Chuẩn hóa `active` status check trong dashboard card. |

---

## 4. Kết Quả Kiểm Tra & Xác Nhận (Validation)

### 4.1. TypeScript Compiler & ESLint
- `cmd /c npx tsc --noEmit`: **PASS (0 errors)**.
- `cmd /c npm run lint`: **PASS (0 errors, 45 warnings từ các file cũ liên quan thẻ img)**.

### 4.2. Next.js Production Build
- `cmd /c npm run build`: **PASS (0 errors)**. Toàn bộ 39 routes tĩnh & động build thành công hoàn hảo.

### 4.3. Browser E2E Testing (Subagent Verification)
Đã chạy kịch bản tự động trên trình duyệt thật:
1. **Kiểm tra đăng nhập tài khoản bị khóa (`student@example.com`)**:
   - Nhập email và mật khẩu tài khoản có `status = INACTIVE`.
   - Kết quả: **Bị chặn 100% không thể vào hệ thống**.
   - Giao diện hiển thị Alert Box màu đỏ: *"Tài khoản của bạn đã bị khóa: Tài khoản của bạn đã bị khóa bởi Quản trị viên. Bạn không có quyền truy cập vào hệ thống."* kèm thông tin hỗ trợ `support@tmdemy.vn`.
   - Trình duyệt giữ nguyên URL tại `/login`. Không có bất kỳ token nào được lưu trữ.
2. **Kiểm tra mở khóa từ Admin Portal**:
   - Đăng nhập tài khoản Admin (`thaiminh0612@gmail.com`).
   - Vào `/admin/users`, tìm kiếm `student@example.com`.
   - Huy hiệu hiển thị đúng "Bị khóa".
   - Click nút "Mở khóa", modal "Mở khóa tài khoản" bật lên, bấm "Xác nhận mở khóa".
   - Toast thông báo thành công: *"Đã mở khóa tài khoản "Student Example" thành công!"*. Huy hiệu chuyển sang "Hoạt động".
3. **Kiểm tra đăng nhập lại sau khi được mở khóa**:
   - Đăng nhập `student@example.com` / `Password123`.
   - Kết quả: **Đăng nhập thành công** và điều hướng vào trang học tập sinh viên (`/`).
4. **Kiểm tra hai chiều Khóa & Mở khóa**:
   - Đã xác thực API `PUT /api/admin/users/:id` với `{ status: 'inactive' }` và `{ status: 'active' }` đều cập nhật chính xác và phản ánh tức thì vào trạng thái đăng nhập.

---

## 5. Kết luận
Tính năng chặn tài khoản bị khóa (status = INACTIVE) đã được xây dựng hoàn thiện, đa tầng và triệt để, khắc phục hoàn toàn tình trạng người dùng bị khóa vẫn có thể truy cập hệ thống bằng popup cơ bản trước đây.
