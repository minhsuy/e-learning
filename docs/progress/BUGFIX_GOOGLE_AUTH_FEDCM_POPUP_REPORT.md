# Bug Fix Report: Khắc Phục Lỗi Google Identity Services (FedCM & Popup Closure)

> **Báo cáo xử lý sự cố**: Khắc phục triệt để các lỗi `FedCM NotAllowedError`, `AbortError: signal is aborted without reason` và `Popup window closed` khi thao tác với Google Login trên TMDEMY Frontend.

---

### Bug Fix Report

- **Task**: Khắc phục lỗi FedCM get() và Popup window closed khi đăng nhập Google
- **Trạng thái**: RESOLVED
- **Nguyên Nhân Gốc Rễ (Root Cause)**:
  1. **Khởi tạo lặp và hủy bất đồng bộ (Multiple Initialize & Abort)**: `GoogleLoginButton` có dependency array phụ thuộc vào các props hàm inline (`onError`, `onSuccess`). Mỗi khi form re-render (người dùng nhập liệu), `useEffect` chạy lại khiến `window.google.accounts.id.cancel()` và `window.google.accounts.id.initialize()` được gọi liên tục. Trong React Strict Mode ở môi trường dev, điều này kích hoạt 2 yêu cầu `navigator.credentials.get()` song song dẫn đến:
     - `AbortError: signal is aborted without reason` (do lệnh cancel hủy request trước).
     - `NotAllowedError: Only one navigator.credentials.get request may be outstanding at one time.` (do request thứ hai đè lên khi request thứ nhất chưa hoàn tất).
  2. **Xung đột luồng giữa FedCM / One Tap và Popup OAuth2**: Khi `id.prompt()` đang chạy trong nền và bị FedCM khóa tài nguyên, người dùng nhấn nút mở popup `initCodeClient.requestCode()`, GSI phát hiện xung đột credential request và lập tức đóng popup (`Popup window closed`).
  3. **Xử lý lỗi người dùng đóng popup**: Khi người dùng nhấn đóng popup Google (`X`), GIS trả về `popup_closed_by_user`. Logic trước đó không loại trừ mã lỗi này khiến nút rơi vào trạng thái lỗi và hiện toast báo lỗi sai ngữ cảnh.

- **Tầng Kiến Trúc Bị Ảnh Hưởng**: Presentation & State (`src/components/auth/google-login-button.tsx`, `src/types/google.d.ts`).
- **Skills Đã Sử Dụng**:
  - `bug-investigation`: Cô lập nguyên nhân gốc rễ qua browser logs và cơ chế FedCM của Chrome 120+.
  - `auth-integration`: Chuẩn hóa luồng ID Token thông qua `google.accounts.id.renderButton` (Cách 1 khuyên dùng) kết hợp fallback Code Flow.
  - `frontend-review`: Kiểm tra type safety, đảm bảo không vi phạm quy tắc `react-hooks/refs` trong React 19.

---

### Files Sửa Đổi

1. **`src/types/google.d.ts`**:
   - Bổ sung trường `use_fedcm_for_prompt?: boolean;` vào `GoogleIdConfiguration`.
2. **`src/components/auth/google-login-button.tsx`**:
   - Sử dụng `hasInitializedRef.current` để đảm bảo khởi tạo GSI **duy nhất 1 lần**.
   - Cập nhật `callbacksRef` trong `useEffect` để tuân thủ quy chuẩn `react-hooks/refs` của React 19.
   - Thêm `use_fedcm_for_prompt: false` vào `initialize()` để vô hiệu hóa cơ chế FedCM xung đột trên môi trường dev/localhost.
   - Hiển thị nút bấm chính thức của Google qua `window.google.accounts.id.renderButton` (ID Token Flow - chuẩn GIS), tránh hoàn toàn vấn đề popup blocker.
   - Trước khi mở popup thủ công (fallback), tự động gọi `id.cancel()` để giải phóng lock credential.
   - Bỏ qua mã lỗi `popup_closed_by_user` / `user_cancelled` một cách êm ái mà không bắn toast lỗi.

---

### Kiểm Tra Chống Hồi Quy (Regression Check)

- **Kịch bản lỗi gốc**:
  - `[GSI_LOGGER]: FedCM get() rejects with NotAllowedError`: **RESOLVED** (0 lỗi).
  - `[GSI_LOGGER]: FedCM get() rejects with AbortError`: **RESOLVED** (0 lỗi).
  - `Popup window closed`: **RESOLVED** (xử lý êm, không kẹt trạng thái loading).
- **Chức năng lân cận**:
  - Form đăng nhập thường (email/password): Hoạt động ổn định.
  - Nút bấm Google: Hiển thị giao diện chính thức `"Tiếp tục sử dụng dịch vụ bằng Google"`, vừa vặn với kích thước thẻ đăng nhập.
  - Luồng nhận token và chuyển hướng: Khớp với DTO và API Contract của backend.

---

### Kết Quả Validation

- `npx tsc --noEmit`: **PASS** (0 lỗi TypeScript).
- `npm run lint`: **PASS** (0 lỗi linter ESLint).
- `browser_subagent verification`: **PASS** (kiểm tra thực tế trên trình duyệt Chromium thành công).

---

### Khuyến Nghị

- Người dùng có thể tiếp tục thử nghiệm đăng nhập Google trên `http://localhost:3000/login` và `http://localhost:3000/register`.
- Đảm bảo Google Cloud Console đã thêm `http://localhost:3000` vào danh sách **Authorized JavaScript Origins**.
