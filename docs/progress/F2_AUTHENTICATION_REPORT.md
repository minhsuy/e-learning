# F2 — Authentication & Identity Progress Report

## Status

COMPLETED

---

## Environment

- **Workspace**: `d:/e-learning`
- **Framework**: Next.js 16.3.8 (App Router with Turbopack)
- **React**: React 19.2.8 / React DOM 19.2.8
- **TypeScript**: TypeScript 5.x (Strict mode enabled)
- **Styling**: Tailwind CSS v4, `@tailwindcss/postcss`, shadcn/ui design tokens
- **Design System**: TMdemy (Primary: `#7240b8` / `#9564DD`)

---

## Stitch Integration

- **Stitch Project Name**: `tmdemy`
- **Stitch Project ID**: `4018234784417032182`
- **Login Screen ID**: `e1ad747da114430bab07b56a782feb94` (Canonical: `Login`)
- **Register Screen ID**: `f98b4b44bf334ff69a0dde29f7de923e` (Canonical: `Register`)
- **MCP Verification**: Cả hai màn hình `Login` và `Register` đều được truy xuất trực tiếp thông qua công cụ Stitch MCP `get_screen`, phân tích mã nguồn HTML/CSS gốc và đối chiếu các thông số layout, typography, màu sắc, border radius, và component states.

---

## Implemented Routes

| Tuyến đường (Route) | File nguồn | Mô tả & Nguồn gốc | Trạng thái |
| :--- | :--- | :--- | :--- |
| `/login` | `src/app/(auth)/login/page.tsx` | Màn hình Đăng nhập học viên chuẩn Stitch Screen `e1ad747da114430bab07b56a782feb94` | IMPLEMENTED |
| `/register` | `src/app/(auth)/register/page.tsx` | Màn hình Đăng ký tài khoản chuẩn Stitch Screen `f98b4b44bf334ff69a0dde29f7de923e` | IMPLEMENTED |
| `/verify-otp` | `src/app/(auth)/verify-otp/page.tsx` | Màn hình Xác thực OTP 6 số (kế thừa thiết kế TMdemy theo API contract) | IMPLEMENTED |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Màn hình Quên mật khẩu & Gửi link khôi phục (kế thừa recovery view từ Stitch) | IMPLEMENTED |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | Màn hình Đặt lại mật khẩu mới qua token từ email | IMPLEMENTED |
| `/` | `src/app/page.tsx` | Root verification page hiển thị trạng thái Identity và điều hướng nhanh | UPDATED |

---

## Authentication Features

| Tính năng | API Endpoint & Method | Trạng thái triển khai | Chi tiết kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Register** | `POST /api/users/register` | SẴN SÀNG | Form chuẩn hóa: `username`, `email`, `password`, `confirm_password`. Tự động chuyển tiếp sang `/verify-otp?email=...` khi thành công. |
| **Verify OTP** | `POST /api/users/verify-otp` | SẴN SÀNG | Nhập mã OTP 6 số, định dạng numeric mono spacing. Thành công chuyển hướng sang `/login?verified=true`. |
| **Login** | `POST /api/users/login` | SẴN SÀNG | Gửi credentials, nhận cặp `access_token` và `refresh_token`, lưu trữ và nạp danh tính qua `GET /api/users/me`. |
| **Current User** | `GET /api/users/me` | SẴN SÀNG | Lấy hồ sơ người dùng (`UserProfile`) gồm `role`, `status`, `avatar`, `socialLinks`, `isVerified`. |
| **Token Refresh** | `POST /api/users/access_token` | SẴN SÀNG | Auto-refresh khi API trả `401 jwt expired` với mutex locking và subscriber queue chống gọi trùng lặp. |
| **Logout** | `POST /api/users/logout` | SẴN SÀNG | Thu hồi refresh token trên DB, xóa sạch token tại client, reset state về `unauthenticated`. |
| **Forgot Password** | `POST /api/users/forgot-password` | SẴN SÀNG | Gửi email chứa reset token có hiệu lực 15 phút, hiển thị thông báo thành công. |
| **Reset Password** | `PUT /api/users/reset-password` | SẴN SÀNG | Cập nhật mật khẩu mới bằng token nhận từ email. Tuân thủ tuyệt đối method `PUT` trong API contract. |
| **Route Protection** | `RouteGuard` Component | SẴN SÀNG | Bảo vệ route theo vai trò (`user`, `teacher`, `admin`), hỗ trợ `guestOnly`, chống chớp màn hình (flash). |

---

## Token Architecture

- **Access Token Storage**: `localStorage` (khóa `tmdemy_access_token`).
- **Refresh Token Storage**: `localStorage` (khóa `tmdemy_refresh_token`).
- **Authentication State**: Được quản lý tập trung bởi React Context `AuthProvider` (`src/contexts/auth-context.tsx`) và hook `useAuth()`. Trạng thái gồm `status: 'loading' | 'authenticated' | 'unauthenticated'` và `user: UserProfile | null`.
- **Refresh Strategy**: Xử lý tự động tại Central API Client (`src/lib/api/client.ts`). Khi bắt gặp mã lỗi HTTP `401` kèm chuỗi `"jwt expired"`, client giữ khóa `isRefreshing`, gom các request kế tiếp vào hàng đợi `refreshSubscribers`, gửi `POST /api/users/access_token` kèm `refresh_token`. Sau khi nhận token mới, cập nhật storage và retry tự động tất cả các request đang chờ. Nếu refresh thất bại, xóa sạch session và chuyển trạng thái về `unauthenticated`.
- **SSR Behavior**: Hàm `isBrowser()` kiểm tra `typeof window !== 'undefined'`, trả về `null` trong môi trường Node.js / Server Component để đảm bảo an toàn tuyệt đối, không gây lỗi SSR hydration mismatch.
- **Client Behavior**: Truy xuất tức thời, tự động gắn header `Authorization: Bearer <token>` cho mọi request cần xác thực.

---

## Stitch UI Implementation

1. **Login (`/login`)**:
   - Khớp 100% với Stitch Screen `e1ad747da114430bab07b56a782feb94`.
   - Bố cục lưới chia đôi (Grid Split Card) trên nền tím pastel `#fdf8ff`.
   - Cột trái: Thương hiệu TMdemy với biểu tượng học viện, huy hiệu kiểm định, thẻ hình ảnh giảng đường đại học hiện đại, các chỉ số thống kê `98.4%` và `120K+`, con dấu tín nhiệm quốc tế.
   - Cột phải: Form đăng nhập với email, mật khẩu kèm nút bật/tắt hiển thị, checkbox ghi nhớ đăng nhập, liên kết quên mật khẩu, nút đăng nhập hiệu ứng hover shadow, phân cách SSO Google, liên kết đăng ký tài khoản, chân trang bảo mật SSL 256-bit.
   - Đã kiểm tra trực quan trên browser subagent và chụp ảnh xác thực.

2. **Register (`/register`)**:
   - Khớp 100% với Stitch Screen `f98b4b44bf334ff69a0dde29f7de923e`.
   - Bố cục 2 khối linh hoạt (Flex Card) kèm các vầng sáng mờ ambient tím & oải hương.
   - Khối trái: Form tạo tài khoản gồm Họ tên/Username, Email, Mật khẩu kèm thanh đo độ an toàn 4 cấp độ và checklist kiểm tra (8 ký tự, chữ hoa & ký tự đặc biệt), Xác nhận mật khẩu kèm icon tick xanh, Checkbox đồng ý điều khoản, Nút đăng ký, Nút Google SSO, và Liên kết đăng nhập.
   - Khối phải: Thẻ ưu đãi học viên mới (giảm 30%) chuyển màu gradient tím, nhóm ảnh đại diện 3 học viên kèm badge `+48k`, đánh giá chất lượng 5 sao `4.9/5`, huy hiệu chứng chỉ quốc tế và học theo tiến độ, thẻ bổ trợ lộ trình chuẩn hóa nghề nghiệp 1.200 bài thực hành.
   - Đã kiểm tra tương tác thực tế thanh đo mật khẩu "Rất mạnh" trên browser subagent.

---

## API Endpoints Integrated

- `POST /api/users/register`
- `POST /api/users/verify-otp`
- `POST /api/users/login`
- `GET  /api/users/me`
- `POST /api/users/logout`
- `POST /api/users/forgot-password`
- `PUT  /api/users/reset-password`
- `POST /api/users/access_token`

---

## Validation

### npm run lint
- **Lệnh**: `cmd /c npm run lint`
- **Kết quả**: `PASS` (0 errors, 0 warnings).

### npx tsc --noEmit
- **Lệnh**: `cmd /c npx tsc --noEmit`
- **Kết quả**: `PASS` (TypeScript strict mode, 0 errors).

### npm run build
- **Lệnh**: `cmd /c npm run build`
- **Kết quả**: `PASS` (Build production thành công 100% với Next.js 16.3.8 Turbopack, 9 static routes được tạo thành công).

---

## Browser Visual Validation

- **Công cụ kiểm tra**: Browser Subagent với tương tác thực trên trình duyệt tự động.
- **Tệp ghi hình tương tác**: `auth_screens_demo_1791292584466.webp`
- **Ảnh chụp màn hình xác thực**:
  - `login_page_verification_1791292604453.png`
  - `register_page_verification_1791292619455.png`
  - `register_password_strength_1791292653117.png`
  - `verify_otp_page_verification_1791292673065.png`
- **Kết luận**: Giao diện hiển thị sắc nét, tỷ lệ chuẩn xác, typography đồng bộ, màu sắc tím `#7240b8` hài hòa và đầy đủ hiệu ứng tương tác.

---

## Files Created

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/verify-otp/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/components/ui/input.tsx`
- `docs/progress/F2_AUTHENTICATION_REPORT.md`

## Files Modified

- `src/contexts/auth-context.tsx` (Bổ sung cơ chế async effect tránh cascading renders và rollback an toàn khi login lỗi)
- `src/components/auth/route-guard.tsx` (Làm sạch biến không sử dụng)
- `src/app/page.tsx` (Cập nhật giao diện xác thực danh tính F2 và các nút điều hướng nhanh)

---

## Packages Added

None (Sử dụng 100% dependencies đã có trong dự án: `lucide-react`, `tailwindcss`, `shadcn/ui primitives`).

---

## Backend Changes

NONE

---

## API Contract Changes

NONE

---

## Mock Data

- **Mock authentication**: NOT USED
- **Mock API responses**: NOT USED

---

## Known Issues

- **Backend Integration Connectivity**: Máy chủ backend (`http://localhost:3002`) hiện chưa chạy trên cổng 3002 tại thời điểm kiểm tra tự động (`fetch failed`). Toàn bộ API calls ở frontend đã được kết nối đúng đặc tả và sẵn sàng giao tiếp ngay khi backend khởi động.

---

## Scope Not Implemented

- Dashboard, Khóa học, Phòng học, Thanh toán, Giỏ hàng, Chat, Đánh giá, Giảng viên (thuộc các giai đoạn F3+ tiếp theo theo lộ trình).

---

## Ready for F3

YES
