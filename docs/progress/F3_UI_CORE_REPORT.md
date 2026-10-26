# F3 — Stitch UI Core Screens Progress Report

## Status

COMPLETED

---

## Environment

- **Workspace**: `d:/e-learning`
- **Next.js Version**: 16.3.8 (App Router with Turbopack)
- **React Version**: 19.2.8 / React DOM 19.2.8
- **TypeScript Version**: TypeScript 5.x (Strict Mode 100%)
- **Tailwind Version**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Design System**: TMdemy (Primary: `#7240b8`, Primary Container: `#8b5ad3`, Accent: `#9564DD`)

---

## Stitch Integration

- **Stitch Project Name**: `tmdemy`
- **Stitch Project ID**: `4018234784417032182`
- **MCP Verification**: Cả 3 màn hình cốt lõi đều được truy xuất trực tiếp qua Stitch MCP `get_screen`, trích xuất HTML, CSS tokens, assets hình ảnh Google Usercontent và phân tích cấu trúc DOM gốc.

### Implemented Canonical Screens

| Canonical Name | Screen ID | Route | Display Title | Implementation Status |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | `4a6b385f44c243ba937bfc396c9b0912` | `/dashboard` | TMdemy - Tổng quan học tập | COMPLETED |
| **CourseListing** | `79651dd67a79478bacd965e246803bd0` | `/courses` | TMdemy - Khám phá khóa học | COMPLETED |
| **CourseDetail** | `6c8b2108257c49a1b863fbd490201d75` | `/courses/[slug]` | TMdemy - Chi tiết khóa học React & Next.js | COMPLETED |

---

## Component Architecture

### 1. Shared & Layout Components (`src/components/layout/`)
- `DashboardSidebar` (`src/components/layout/dashboard-sidebar.tsx`):
  - Khớp 100% thanh điều hướng bên trái Stitch (`w-72`, nền trắng, viền `#f1ebff`).
  - Brand header với icon học viện và logo `TMdemy`.
  - Danh mục chính: *Tổng quan* (`/dashboard`), *Khóa học* (`/courses`), *Khóa học của tôi*, *Lộ trình*, *Chứng chỉ*, *Bảng xếp hạng*, *Tin nhắn* (badge `4`).
  - Danh mục phụ: *Cài đặt*, *Hỗ trợ*.
  - Tự động nhận diện `pathname` để highlight menu đang hoạt động (`bg-[#f7f1ff] text-[#7240b8] border-l-4`).
  - Tích hợp ngăn kéo (drawer) đáp ứng trên Mobile/Tablet với nút đóng mở mượt mà.
- `DashboardHeader` (`src/components/layout/dashboard-header.tsx`):
  - Thanh header cố định trên cùng (`fixed h-16 backdrop-blur-xl`).
  - Nút hamburger mở menu trên thiết bị di động.
  - Ô tìm kiếm mở rộng với phím tắt gợi ý `Ctrl + K`.
  - Huy hiệu chuỗi học tập: `7 ngày Streak` (`local_fire_department`).
  - Nút chuông thông báo có chấm đỏ báo tin mới.
  - Hồ sơ học viên vắn tắt: ảnh đại diện, `Minh Triết` - `Học viên`.
- `AppShell` (`src/components/layout/app-shell.tsx`):
  - Bọc cấu trúc layout thống nhất cho toàn bộ các trang nội bộ của học viên.

### 2. Domain & Course Components (`src/components/course/`)
- `CourseCard` (`src/components/course/course-card.tsx`):
  - Hỗ trợ 2 chế độ hiển thị: Grid mode (Lưới 3 cột) và List mode (Danh sách ngang).
  - Tỷ lệ khung hình chuẩn `16:9`, hiệu ứng hover phóng to nhẹ hình ảnh.
  - Các huy hiệu linh hoạt: `Bán chạy nhất`, `Nổi bật`, `Đánh giá cao`, `Xu hướng`, `Mới`.
  - Tương tác nút yêu thích (Wishlist heart toggle).
  - Thông số khóa học: thời lượng bài học (`38 giờ`), cấp độ (`Mọi cấp độ`), điểm đánh giá sao (`4.9 ⭐`), số lượt nhận xét, giá ưu đãi và giá gốc gạch ngang.
  - Nút hành động CTA `Xem khóa học` chuyển tiếp sang `/courses/[slug]`.

### 3. Reused Components
- `Button` (`src/components/ui/button.tsx`)
- `Input` (`src/components/ui/input.tsx`)
- Icons từ Google Fonts `Material Symbols Outlined` và `lucide-react`

---

## Implemented Routes & Visual States

### 1. Dashboard (`/dashboard`)
- **Tuyến đường**: `/dashboard`
- **Khớp chuẩn Stitch**: Screen ID `4a6b385f44c243ba937bfc396c9b0912`.
- **Bố cục**: Chia lưới 12 cột (8 cột nội dung chính + 4 cột thanh chỉ số học tập bên phải).
- **Khu vực nội dung chính**:
  1. *Banner Chào mừng*: Gradient tím chuyển sắc, huy hiệu hoàn thành 85% mục tiêu tuần, lời chào cá nhân hóa Minh Triết, nút CTA `"Vào lớp ngay"`.
  2. *Tiếp tục học (3 thẻ tiến độ)*: React & Next.js (45%), Node.js & Express (38%), UI/UX Figma (50%) với thanh tiến độ trực quan và nút tiếp tục học.
  3. *Khóa học đề xuất cho bạn*: Bộ nút lọc chuyên ngành (Tất cả, Thịnh hành, Lập trình Web, AI, Dữ liệu) cùng 4 thẻ khóa học 2x2.
- **Thanh chỉ số học tập bên phải**:
  1. *Thẻ tóm tắt học viên*: Ảnh đại diện, con dấu xác nhận, danh hiệu học viên xuất sắc, 2.450 điểm thưởng.
  2. *Bộ 3 chỉ số nhanh*: 14 ngày streak, xếp hạng #12 toàn trường, 45/60 phút học hôm nay.
  3. *Chuỗi chuyên cần*: Lịch tuần 42 đánh dấu hoàn thành từ T2 đến T7.
  4. *Biểu đồ thời gian học trong tuần*: Biểu đồ cột SVG hiển thị 18.1 giờ học với cột Thứ 7 đạt đỉnh 4.0h.
  5. *Bộ đếm & Nhắc nhở*: 3 khóa đang học, 8 khóa hoàn thành, thẻ nhắc nhở bài kiểm tra cuối kỳ React & Next.js trong 3 ngày tới.

### 2. Course Listing (`/courses`)
- **Tuyến đường**: `/courses`
- **Khớp chuẩn Stitch**: Screen ID `79651dd67a79478bacd965e246803bd0`.
- **Bố cục**: Khung tìm kiếm gắn cố định + Lưới 12 cột (3 cột bộ lọc bên trái + 9 cột danh mục khóa học).
- **Banner Khám phá**: Tiêu đề hệ sinh thái TMdemy, huy hiệu 100% chứng chỉ chuẩn và 48.5K+ học viên hoạt động.
- **Thanh điều khiển tìm kiếm**:
  - Ô nhập tìm kiếm từ khóa real-time.
  - Dropdown sắp xếp đa tiêu chí (Phổ biến nhất, Đánh giá cao nhất, Mới nhất, Giá tăng/giảm).
  - Nút chuyển đổi giao diện Lưới (Grid) / Danh sách (List).
  - Băng chuyền cuộn ngang các thẻ danh mục (Web, Frontend, Backend, AI, UI/UX, Cloud, Mobile).
- **Bộ lọc bên trái**:
  - Trình độ (Tất cả, Mới bắt đầu, Trung cấp, Nâng cao kèm số lượng).
  - Đánh giá (Từ 4.5 sao trở lên, Từ 4.0 sao trở lên).
  - Mức giá (Miễn phí, Có phí, Đang có ưu đãi).
  - Thời lượng (Dưới 5h, 5-15h, Trên 15h).
  - Đặc quyền cấp chứng chỉ.
  - Thẻ giới thiệu gói hội viên Pro tiết kiệm 70%.
- **Danh mục 6 khóa học chuẩn Stitch**:
  1. *React & Next.js 14 từ cơ bản đến nâng cao* (ThS. Hoàng Minh Đức)
  2. *Lập trình Backend chuyên nghiệp với NestJS & Microservices* (Kỹ sư Phạm Văn Tuấn)
  3. *Thiết kế hệ thống Design System & UI/UX toàn diện* (Lead Designer Mai Anh)
  4. *Trí tuệ nhân tạo (AI) ứng dụng & Kỹ thuật Prompt Engineering* (TS. Đặng Quốc Thịnh)
  5. *Cấu trúc dữ liệu & Giải thuật nâng cao cho phỏng vấn FAANG* (ThS. Lê Quang Huy)
  6. *DevOps thực chiến: Docker, Kubernetes, CI/CD trên AWS* (Kỹ sư Nguyễn Thành Long)
- **Thanh phân trang chân trang**: Hiển thị trang 1/12, các nút chuyển trang và ô nhập số trang linh hoạt.

### 3. Course Detail (`/courses/[slug]`)
- **Tuyến đường**: `/courses/[slug]` (Demo: `/courses/react-nextjs-14`).
- **Khớp chuẩn Stitch**: Screen ID `6c8b2108257c49a1b863fbd490201d75`.
- **Bố cục**: 2 cột (8 cột chi tiết học thuật + 4 cột thẻ mua khóa học nổi cố định).
- **Khu vực học thuật bên trái**:
  - *Thanh điều hướng breadcrumbs*: `Trang chủ > Khóa học > Lập trình Frontend > React & Next.js...`
  - *Hero chi tiết*: Tiêu đề khóa học, tóm tắt, huy hiệu kiểm định, đánh giá 4.9 sao (2.410 nhận xét), 8.520 học viên, phụ đề song ngữ.
  - *Thẻ giảng viên thu nhỏ*: ThS. Hoàng Minh Đức (Senior Frontend Architect tại VNG).
  - *Khung xem trước video bài học*: Video player có overlay nút play tương tác, nhãn học thử miễn phí.
  - *Mục "Bạn sẽ học được gì?"*: 6 kết quả học tập đầu ra trình bày dưới dạng thẻ 2 cột có dấu tick xanh.
  - *Mục "Nội dung khóa học"*: Accordion tương tác 6 chương, 48 bài học (38 giờ 15 phút), hỗ trợ Mở rộng/Thu gọn toàn bộ, biểu tượng khóa và xem thử bài 1 & 2.
  - *Mục "Về giảng viên"*: Hồ sơ chi tiết, 15.000+ học viên, 10+ năm kinh nghiệm, tiểu sử nghề nghiệp, nút theo dõi giảng viên.
  - *Mục "Đánh giá từ học viên"*: Điểm số 4.9 lớn, biểu đồ thanh phần trăm từng mức sao (88% 5 sao), 2 nhận xét chi tiết của sinh viên ĐH Bách Khoa và lập trình viên SmartDev.
- **Thẻ ghi danh bên phải (Sticky Enrollment Card)**:
  - Giá ưu đãi `799.000 đ` (giảm 46% từ giá gốc `1.490.000 đ`).
  - Cam kết hoàn tiền trong 7 ngày nếu không hài lòng.
  - Nút chính: `Mua khóa học ngay` (shopping_bag).
  - Nút phụ: `Thêm vào giỏ hàng` (add_shopping_cart) và nút trái tim yêu thích (Wishlist).
  - Danh sách 5 quyền lợi đi kèm khóa học.
  - Chức năng sao chép liên kết chia sẻ.
  - Con dấu kiểm định chất lượng bởi Hội đồng Công nghệ TMdemy.

---

## Data Management

- **Business API Integration**: `NOT IMPLEMENTED` (Tuyệt đối không gọi API backend trong Phase F3 theo quy tắc UI First).
- **Database Integration**: `NOT IMPLEMENTED` (Không sử dụng database hay mock API).
- **Static Placeholder Data**: Được lưu trữ độc lập tại:
  - `src/data/mock-dashboard.ts` (Dữ liệu tiến độ, biểu đồ và chỉ số dashboard)
  - `src/data/mock-courses.ts` (Danh mục 6 khóa học đầy đủ thuộc tính)
  - `src/data/mock-course-detail.ts` (Dữ liệu chương trình học 6 chương, giảng viên, và nhận xét học viên)
- Ghi chú phân định rõ: `// F3 UI placeholder only. Real API integration will be implemented in a later phase.`

---

## Verification & Quality Checks

### 1. TypeScript Compiler (`tsc --noEmit`)
```bash
cmd.exe /c "npx tsc --noEmit"
```
- **Kết quả**: `PASS` (Exit code: 0). Strict 100%, không sử dụng `any`, không có type error.

### 2. Next.js Production Build (`npm run build`)
```bash
cmd.exe /c "npm run build"
```
- **Kết quả**: `PASS` (Exit code: 0).
- **Output routes**:
  - `○ /` (Static)
  - `○ /dashboard` (Static)
  - `○ /courses` (Static)
  - `ƒ /courses/[slug]` (Dynamic server-rendered)
  - Tất cả route F2 (`/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password`) build hoàn hảo.

### 3. Linter (`eslint`)
```bash
cmd.exe /c "npx eslint src"
```
- **Kết quả**: `PASS` (Exit code: 0, 0 errors).

### 4. Browser Subagent Visual Validation
- Chạy qua Browser subagent tự động:
  - **Dashboard**: Chụp ảnh `dashboard_page_1791295505140.png` — Khớp toàn bộ layout, card metrics, streak calendar, bar chart.
  - **CourseListing**: Chụp ảnh `courses_page_1791295551817.png` — Khớp search control panel, category pills, filter sidebar, 6 course cards, pagination bar.
  - **CourseDetail**: Chụp ảnh `course_detail_page_1791295596211.png` — Khớp hero, video preview, outcomes, accordion curriculum, instructor, reviews, sticky pricing card.
  - **Luồng điều hướng (Navigation Flow)**: Di chuyển giữa `/dashboard` ⇄ `/courses` ⇄ `/courses/react-nextjs-14` thông qua thanh sidebar và breadcrumb hoạt động mượt mà, phản hồi tức thời.
  - **Video ghi hình thao tác browser**: `f3_stitch_validation_1791295434736.webp`.

---

## Backend & API Boundaries

- **Backend Changes**: `NONE` (Tuyệt đối không sửa đổi backend, không cài package backend, không tạo client Prisma/MongoDB).
- **API Contract Changes**: `NONE` (Thư mục `/api` được bảo toàn nguyên vẹn).
- **Database Changes**: `NONE`.

---

## F2 Authentication State

- **F2 Authentication Architecture**: `PRESERVED` (Không sửa `AuthProvider`, `useAuth`, `RouteGuard`, token storage, refresh interceptor).
- Các trang xác thực `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password` hoạt động bình thường, không bị ảnh hưởng.

---

## Known Issues

- Hiện tại các bộ lọc và tìm kiếm ở `/courses` hoạt động trên local static mock data nhằm phục vụ mục đích minh họa trực quan UI. Logic lọc qua backend query params sẽ được kết nối chính thức ở phase tích hợp API.
- Các nút CTA mua hàng, thêm vào giỏ hàng và nộp bài ở `/courses/[slug]` hiện chỉ hiển thị hiệu ứng tương tác giao diện và điều hướng, chưa gọi luồng thanh toán (Payment/Checkout) theo đúng phạm vi F3.

---

## Ready for F4

**YES**

Hệ thống đã có bộ khung giao diện UI Core hoàn chỉnh, responsive, chuẩn thiết kế Stitch của TMdemy, sẵn sàng cho các phase tiếp theo theo lộ trình.
