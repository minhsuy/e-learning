# Feature Implementation Report: Google OAuth2 / OpenID Connect Integration

> **Báo cáo tích hợp Frontend**: Triển khai đăng nhập và đăng ký tự động bằng Google SSO / Google Identity Services (GIS) cho TMDEMY Frontend kết nối với TMDEMY Backend REST API.

---

### Feature Implementation Report

- **Task**: Tích hợp chức năng Đăng nhập & Đăng ký tài khoản bằng Google (Google OAuth2 / GIS)
- **Trạng thái**: COMPLETED
- **Phạm vi (Scope)**:
  - Authentication flow (`src/contexts/auth-context.tsx`, `src/services/auth.service.ts`, `src/types/auth.ts`, `src/types/google.d.ts`, `src/lib/google-auth.ts`)
  - Target routes & components (`src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/components/auth/google-login-button.tsx`, `src/app/layout.tsx`)
  - API Contracts & Environment (`api/AUTH_API.md`, `api/API_INDEX.md`, `.env.local`, `.env.example`)
- **Skills Đã Sử Dụng**:
  - `auth-integration`: Quản lý JWT dual-token lifecycle, tích hợp `useAuth()`, kiểm soát tài khoản bị khóa (403 INACTIVE) và điều hướng theo Role Matrix.
  - `api-integration`: Kết nối centralized client (`apiClient.post`), định nghĩa DTOs chuẩn từ `api/`, xử lý loading/error states.
  - `page-implementation`: Hoàn thiện component `GoogleLoginButton` gắn kết trên trang Login & Register, bảo toàn Visual Hierarchy của TMdemy.
  - `frontend-review`: Kiểm tra TypeScript strict mode, bảo đảm 0 dependency ngoài (tuân thủ Rule 15), rà soát 6 trạng thái UX.

---

### Files Tạo Mới & Sửa Đổi

1. **`src/types/google.d.ts`** *(Mới)*:
   - Khai báo kiểu dữ liệu cho Google Identity Services (`window.google.accounts.id` và `window.google.accounts.oauth2`).
2. **`src/types/auth.ts`** *(Sửa đổi)*:
   - Bổ sung interface `GoogleLoginRequest` (hỗ trợ `idToken`, `credential`, `code`, `redirectUri`, `accessToken`).
   - Bổ sung interface `GoogleLoginResponse` (nhận `access_token`, `refresh_token`, `user`, `data`).
3. **`src/services/auth.service.ts`** *(Sửa đổi)*:
   - Bổ sung method `authService.googleLogin(payload: GoogleLoginRequest)`.
4. **`src/contexts/auth-context.tsx`** *(Sửa đổi)*:
   - Mở rộng `AuthContextType` với `loginWithGoogle`.
   - Lưu trữ token thông qua `setTokens()`, đồng bộ profile `getMe()`, kích hoạt modal `AccountLockedModal` nếu tài khoản ở trạng thái `INACTIVE`.
5. **`src/lib/google-auth.ts`** *(Mới)*:
   - Module nạp dynamic script Google Identity Services an toàn trên trình duyệt, đọc biến môi trường `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
6. **`src/components/auth/google-login-button.tsx`** *(Mới)*:
   - Component nút bấm Google SSO theo chuẩn TMdemy design system.
   - Hỗ trợ cả 2 luồng: **OAuth2 Popup Code Flow** (khi nhấn nút) và **Google One Tap** (tự động gợi ý 1 chạm nếu user đã đăng nhập Google).
   - Tích hợp trạng thái Loading (`Loader2`), Disabled, Error Toast, và Callback điều hướng.
7. **`src/app/layout.tsx`** *(Sửa đổi)*:
   - Bổ sung `<Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />` để pre-warm SDK.
8. **`src/app/(auth)/login/page.tsx`** *(Sửa đổi)*:
   - Thay thế nút bấm tĩnh bằng `<GoogleLoginButton mode="signin" redirectUrl={redirectUrl} />`.
9. **`src/app/(auth)/register/page.tsx`** *(Sửa đổi)*:
   - Thay thế nút bấm tĩnh bằng `<GoogleLoginButton mode="signup" />`.
10. **`api/AUTH_API.md` & `api/API_INDEX.md`** *(Sửa đổi)*:
   - Bổ sung đặc tả kỹ thuật cho `POST /api/users/google-login` và alias `POST /api/users/google`.
11. **`.env.local` & `.env.example`** *(Sửa đổi)*:
   - Cấu hình `NEXT_PUBLIC_GOOGLE_CLIENT_ID=390549866441-5lj602nm7k92b010eft62vi5me9u6bk6.apps.googleusercontent.com`.

---

### 6 Trạng Thái UX (UX States Coverage)

- **Loading** [x]: Hiển thị spinner xoay (`Loader2`), vô hiệu hóa nút bấm và cập nhật text "Đang kết nối Google...".
- **Empty** [x]: Không phát sinh trạng thái rỗng đặc thù.
- **Error** [x]: Bắt lỗi từ popup Google, lỗi mạng và phản hồi lỗi từ backend (400, 403, 500); hiển thị Toast thông báo và alert trong form.
- **Disabled** [x]: Nút bị khóa trong suốt quá trình xác thực hoặc khi prop `disabled = true`.
- **Unauthorized / Locked** [x]: Xử lý chuẩn HTTP 403 nếu tài khoản bị Admin vô hiệu hóa (`INACTIVE`), chặn session và hiển thị hướng dẫn liên hệ support.
- **Success Feedback** [x]: Toast thông báo "Đăng nhập Google thành công!" và tự động chuyển hướng người dùng đến trang đích (`redirect` query param) hoặc trang mặc định theo vai trò (`/dashboard`, `/teacher`, `/admin`).

---

### Kết Quả Validation

- `npx tsc --noEmit`: **PASS** (0 lỗi kiểu dữ liệu).
- `npm run lint`: **PASS** (0 lỗi cú pháp / linter).
- `npm run build`: **PASS** (Biên dịch toàn bộ 40 routes thành công, Turbopack bundle optimized).

---

### Tuân Thủ Ranh Giới & Dependency (Rule Compliance)

- **Rule 15 (Dependency Policy)**: **PASS**. Sử dụng trực tiếp Google Identity Services SDK qua cơ chế native script và TypeScript declaration. Không cần cài đặt thư viện `@react-oauth/google` từ bên ngoài, giải quyết triệt để vấn đề xung đột peer-dependency với React 19 / Next.js 16.
- **Rule 02 (API Boundary)**: **PASS**. Không can thiệp mã nguồn backend `d:/e-learning_server`. Kết nối backend thông qua REST API endpoint `/api/users/google-login`.

---

### Bước Khuyến Nghị Tiếp Theo

1. Khởi động backend server tại `http://localhost:3002`.
2. Chạy `npm run dev` trên frontend, truy cập `/login` hoặc `/register` để trải nghiệm đăng nhập Google trực tiếp.
3. Cấu hình Authorized JavaScript Origins (`http://localhost:3000`) trên Google Cloud Console nếu chuyển sang domain khác.
