# Báo Cáo Thiết Kế Stitch UI — Phân Hệ Giảng Viên (Teacher)
**Phase:** `F8.1-A — Teacher UI Discovery & Stitch Design`  
**Dự án:** TMdemy Frontend (`D:\e-learning`)  
**Stitch Project Name:** `tmdemy`  
**Stitch Project ID:** `4018234784417032182`  
**Design System Kế Thừa:** `Modern Academic Violet` (`assets/5ee7138b7bc143c38a2790b53d505be7`)  
**Ngày thực hiện:** 15/10/2026  

---

## 1. Bảng Mapping Màn Hình & Tuyến Tuyến (Route Mapping)

Toàn bộ 5 màn hình dành riêng cho phân hệ Giảng viên đã được tạo thành công trực tiếp trong dự án Stitch `tmdemy` và đã được liên kết với Design System chính thức:

| Screen | Tiêu đề màn hình (Stitch Screen Title) | Screen ID | Canonical Resource Name | Route Đề Xuất |
|---|---|---|---|---|
| **Teacher Dashboard** | TMdemy - Bảng điều khiển Giảng viên | `8c3e365d2ac94acd81a3e3bfba30f4fa` | `projects/4018234784417032182/screens/8c3e365d2ac94acd81a3e3bfba30f4fa` | `/teacher/dashboard` |
| **Course Management** | TMdemy - Quản lý khóa học (Giảng viên) | `f69a87521aff49e09067aaaab91a0f18` | `projects/4018234784417032182/screens/f69a87521aff49e09067aaaab91a0f18` | `/teacher/courses` |
| **Create Course** | TMdemy - Tạo khóa học mới | `df6fbe2635354bfd90fed4328f25c282` | `projects/4018234784417032182/screens/df6fbe2635354bfd90fed4328f25c282` | `/teacher/courses/new` |
| **Curriculum Builder** | TMdemy - Soạn giáo trình khóa học | `0b1d69fcb4e8494caa17075abbdcbc69` | `projects/4018234784417032182/screens/0b1d69fcb4e8494caa17075abbdcbc69` | `/teacher/courses/[id]/curriculum` |
| **Teacher Analytics** | TMdemy - Báo cáo & Phân tích Giảng viên | `356b9c98f4c64760945f778b0f92240d` | `projects/4018234784417032182/screens/356b9c98f4c64760945f778b0f92240d` | `/teacher/analytics` |

---

## 2. Design System & Ngôn Ngữ Thiết Kế Kế Thừa

Teacher UI kế thừa 100% ngôn ngữ thiết kế **Modern Academic Violet** của TMdemy, đảm bảo tính nhất quán liền mạch khi chuyển đổi giữa vai trò Student và Teacher:

* **Bảng màu chủ đạo (Color Palette):**
  * `Primary`: Tím thẫm thanh lịch `#7240b8` (dùng cho nút CTA, active navigation, key badges, progress highlight).
  * `Secondary`: Tím xám học thuật `#635a72`.
  * `Surface / Background`: `#fdf8ff` (Light mode) và bảng nền tối tương phản cao `#141218` / `#1c1a22` (Dark mode).
  * `Card Surface`: Trắng tinh khiết `#ffffff` viền mờ `border-slate-100` với đổ bóng mềm `shadow-sm` / `shadow-md`.
  * `Status Colors`:
    * Draft: Xám trung tính (`bg-slate-100 text-slate-700`).
    * Pending (Chờ duyệt): Vàng hổ phách (`bg-amber-50 text-amber-700 border-amber-200`).
    * Approved / Published: Xanh lục bảo ngọc (`bg-emerald-50 text-emerald-700 border-emerald-200`).
    * Rejected (Từ chối): Đỏ anh đào (`bg-rose-50 text-rose-700 border-rose-200`).
* **Typography:** Phối hợp `Plus Jakarta Sans` cho tiêu đề, số liệu KPI cỡ lớn và `Be Vietnam Pro` cho nội dung văn bản tiếng Việt.
* **Border Radius & Spacing:** Bo góc đồng bộ `rounded-xl` (12px) cho card và modal, `rounded-lg` (8px) cho input fields và buttons.

---

## 3. Khung Giao Diện Dùng Chung (Shared Teacher Layout)

Cả 5 màn hình đều tuân thủ cấu trúc bố cục thống nhất chuẩn SaaS Management:

### 3.1. Teacher Sidebar
* **Brand Header:** Logo TMdemy với huy hiệu tím `Teacher Portal`.
* **Primary Quick Action CTA:** Nút tím nổi bật `+ Tạo khóa học mới` dẫn trực tiếp tới `/teacher/courses/new`.
* **Main Navigation:**
  * 📊 **Tổng quan** (`/teacher/dashboard`)
  * 📚 **Khóa học của tôi** (`/teacher/courses`)
  * 📈 **Báo cáo & Phân tích** (`/teacher/analytics`)
* **Bottom Utility:**
  * 🎓 **Chuyển sang Chế độ Học viên** (`Switch to Student Mode` — dẫn về `/dashboard`).
  * ⚙️ **Cài đặt hồ sơ giảng viên**.
  * 🚪 **Đăng xuất**.

### 3.2. Teacher Header
* **Breadcrumb:** Điều hướng phân cấp rõ ràng (ví dụ: `Giảng viên` > `Khóa học` > `Soạn giáo trình`).
* **Actions:**
  * Nút chuyển đổi Light/Dark mode.
  * Chuông thông báo có badge số tin/sự kiện chưa xem.
  * Teacher Profile Avatar với nhãn `Giảng viên chính`.

---

## 4. Chi Tiết Các Màn Hình Đã Thiết Kế

### 4.1. Screen 1 — Teacher Dashboard (`/teacher/dashboard`)
* **Overview KPI Cards:**
  * Tổng khóa học: `12` khóa học (+2 tháng này).
  * Tổng học viên: `3,420` học viên (+15%).
  * Doanh thu tích lũy: `158,400,000 ₫` (+12.4%).
  * Đánh giá trung bình: `4.9 / 5.0` (từ 1,280 lượt nhận xét).
* **Revenue Overview:** Biểu đồ xu hướng doanh thu trực quan theo tháng.
* **Khóa học gần đây & Học viên mới đăng ký:** Bảng tóm tắt hoạt động thực tế theo thời gian thực.
* **Quick Actions:** Phím tắt Tạo khóa học, Xem phân tích, Quản lý học viên.

### 4.2. Screen 2 — Teacher Course Management (`/teacher/courses`)
* **Header & Controls:** Tìm kiếm khóa học theo tên/mã, bộ lọc trạng thái (Tất cả, Đã duyệt, Đang chờ duyệt, Bản nháp, Bị từ chối).
* **Course List / Table:**
  * Thumbnail khóa học 16:9 sắc nét.
  * Tên khóa học, danh mục, thời lượng, số bài giảng.
  * Số học viên đã ghi danh, điểm đánh giá.
  * Giá bán & giá khuyến mãi.
  * Badge trạng thái chuẩn màu hệ thống.
  * Menu thao tác nhanh: Sửa thông tin, Soạn giáo trình (`Curriculum`), Báo cáo doanh số, Xóa bản nháp.
* **Phân trang (Pagination):** Chuẩn 10-20 khóa học/trang.

### 4.3. Screen 3 — Create/Edit Course (`/teacher/courses/new`)
* **Bố cục 2 cột (Two-column Form Layout):**
  * **Cột trái (Main Form):**
    * Tiêu đề khóa học, Phụ đề tóm tắt.
    * Mô tả chi tiết với trình soạn thảo Rich Text.
    * Phân loại danh mục (Lập trình, Thiết kế, v.v.) và Cấp độ (Mới bắt đầu, Trung cấp, Nâng cao).
    * Thiết lập giá bán, giá gốc khuyến mãi.
    * Yêu cầu tiên quyết & Mục tiêu đạt được sau khóa học.
  * **Cột phải (Media & Preview Card):**
    * Upload Thumbnail (kèm preview trực tiếp).
    * Video giới thiệu (Intro Video URL / Trailer preview).
    * Thẻ tóm tắt hiển thị trực quan giống như khi học viên nhìn thấy trên sàn khóa học.
* **Actions Bar:** Nút Lưu bản nháp (Draft) và Nút Gửi duyệt khóa học (Submit for Review).

### 4.4. Screen 4 — Curriculum Builder (`/teacher/courses/[id]/curriculum`)
* **Course Header:** Tên khóa học đang biên soạn, tổng số chương, tổng số bài học, nút quay lại danh sách.
* **Chapter Accordion Architecture:**
  * Danh sách các chương (Chapters) có thể thu gọn/mở rộng, kèm biểu tượng thao tác kéo thả thứ tự (`grip-vertical`).
  * Nút `+ Thêm bài học mới` trong từng chương.
  * Chức năng đổi tên chương, xóa chương.
* **Lesson Item Details:**
  * Tiêu đề bài học, thời lượng dự kiến.
  * Badge đánh dấu `Bài học xem thử miễn phí` (Free Preview / Demo lesson indicator) dạng toggle hoặc checkbox nổi bật.
  * Nút chỉnh sửa nội dung bài học, gán Video URL, thêm tài liệu đính kèm.
* **Action Footer:** Nút `+ Thêm chương mới` kích thước lớn, nút Lưu giáo trình.

### 4.5. Screen 5 — Teacher Analytics (`/teacher/analytics`)
* **Filters Bar:** Bộ lọc khoảng thời gian (7 ngày qua, 30 ngày qua, Quý này, Năm nay) và Bộ lọc theo từng khóa học cụ thể.
* **Doanh thu & Lượt ghi danh:**
  * Biểu đồ doanh thu so sánh theo chu kỳ.
  * Biểu đồ lượt học viên đăng ký mới hàng ngày/tuần.
* **Hiệu suất hoàn thành khóa học (Completion & Drop-off):** Tỷ lệ học viên hoàn thành từng chương, điểm trung bình các bài tập/quiz.
* **Bảng xếp hạng hiệu suất khóa học (Course Performance Table):**
  * Sắp xếp theo khóa học mang lại doanh thu cao nhất, tỷ lệ hoàn thành cao nhất, điểm hài lòng cao nhất.

---

## 5. Kế Hoạch & Điểm Cần Lưu Ý Cho Implementation (F8.1-B)

1. **Next.js App Router Structure:**
   * Tổ chức route group: `src/app/(teacher)/teacher/...` hoặc `src/app/teacher/...` dùng chung layout `TeacherLayout` (`src/components/teacher/layout/...`).
2. **Role Authorization & Route Guard:**
   * Route `/teacher/*` bắt buộc phải được bảo vệ bởi auth middleware / guard, yêu cầu role `INSTRUCTOR` hoặc `ADMIN`. Học viên (`STUDENT`) khi truy cập cần được điều hướng về trang đăng ký trở thành giảng viên hoặc dashboard học viên.
3. **API Contract Alignment (`api/` Source of Truth):**
   * Đối chiếu với `api/courses.md`, `api/teacher.md` để đảm bảo:
     * Dữ liệu form tạo khóa học mapping đúng schema `title`, `description`, `thumbnail`, `price`, `level`, `categoryId`.
     * API quản lý chương bài: `POST /api/courses/:id/chapters`, `POST /api/chapters/:id/lessons`.
     * Chú ý ranh giới `[BACKEND GAP]` nếu API thực tế chưa hỗ trợ endpoint thống kê nâng cao (analytics) hoặc reorder drag-and-drop.
4. **Tái Sử Dụng Thành Phần Sẵn Có (Component Reuse):**
   * Tận dụng tối đa bộ UI shadcn có sẵn trong dự án: `Button`, `Input`, `Textarea`, `Select`, `Dialog`, `Badge`, `DropdownMenu`, `Card`, `Table`.

---

## 6. Kết Luận & Trạng Thái

Giai đoạn **F8.1-A — Teacher UI Discovery & Stitch Design** đã hoàn thành 100% mục tiêu thiết kế mà **không can thiệp vào mã nguồn, không cài đặt package, không sửa đổi backend**.

Hệ thống đã sẵn sàng cho bước kiểm duyệt thiết kế trước khi tiến hành chuyển giao sang giai đoạn lập trình giao diện (Phase F8.1-B).
