# TMdemy Frontend — Progress Report: F6.1 Course Listing Integration

## 1. Trạng thái (Phase Status)

**COMPLETED**

---

## 2. Mục Tiêu & Tổng Quan Giai Đoạn (Overview)

Thực hiện thành công **F6.1 — Integrate Course Listing với backend API thật**:
- Loại bỏ hoàn toàn mock data trong `/courses`.
- Kết nối thành công với backend API `GET /api/courses/` và `GET /api/categories/` đang chạy trực tiếp trên `http://localhost:3002`.
- Bảo toàn 100% thiết kế giao diện từ Stitch (`tmdemy`), bố cục layout, responsive trên cả 3 mốc màn hình và component `CourseCard` hiện có.
- Triển khai đầy đủ các trạng thái giao diện UX: **Loading State** (Skeleton cards), **Empty State** (Không tìm thấy kết quả), **Error State** (Bắt lỗi mạng kèm nút Thử lại), và **Success State** (Danh sách khóa học thật).

---

## 3. Các API Endpoints Đã Tích Hợp (API Endpoints Used)

Tuân thủ nghiêm ngặt theo Hợp đồng API tại [`api/COURSE_API.md`](file:///d:/e-learning/api/COURSE_API.md) và [`api/CATEGORY_API.md`](file:///d:/e-learning/api/CATEGORY_API.md):

| Domain | Method | Endpoint | Query Parameters Hỗ Trợ | Mục Đích |
| :--- | :---: | :--- | :--- | :--- |
| **Course** | `GET` | `/api/courses/` | `page`, `limit`, `search`, `category`, `level`, `type`, `priceMin`, `priceMax`, `sortBy` | Lấy danh sách khóa học công khai đã được phê duyệt (`approved`) từ hệ thống. |
| **Category** | `GET` | `/api/categories/` | `limit: 100` | Lấy danh sách danh mục đang hoạt động để hiển thị dynamic category pills carousel. |

---

## 4. Các Tính Năng Đã Tích Hợp (Features Integrated)

1. **Course Listing Real Data**:
   - Dữ liệu 337+ khóa học thực tế từ cơ sở dữ liệu PostgreSQL của Backend TMDEMY được tải trực tiếp qua `courseService`.
   - Chuyển đổi an toàn qua hàm adapter `mapApiCourseToCourse()` để tương thích hoàn toàn với interface của `CourseCard`.
2. **Tìm kiếm theo từ khóa (Search)**:
   - Input tìm kiếm kết nối trực tiếp với query parameter `search` của API.
   - Hỗ trợ gõ từ khóa, nhấn Enter hoặc bấm nút "Tìm kiếm", tự động reset về trang 1.
3. **Lọc theo Danh mục (Category Filter)**:
   - Thanh Carousel Pills tải danh mục thực tế từ `GET /api/categories/` (`Lập trình web`, `AI`, `Khoa học dữ liệu`,...).
   - Lọc theo ID UUID của danh mục với query parameter `category`.
4. **Lọc theo Trình độ (Level Filter)**:
   - Lọc theo các mức độ chuẩn: `beginner`, `intermediate`, `advanced` qua query parameter `level`.
5. **Lọc theo Hình thức giá (Price / Type Filter)**:
   - Hỗ trợ lọc khóa học `free` (Miễn phí) hoặc `paid` (Có phí) qua query parameter `type`.
6. **Sắp xếp linh hoạt (Sorting)**:
   - Đồng bộ với tham số `sortBy` của API contract:
     - `popular` $\rightarrow$ `sortBy=sold` (Bán chạy nhất)
     - `view` $\rightarrow$ `sortBy=view` (Lượt xem nhiều nhất)
     - `newest` $\rightarrow$ `sortBy=createdAt` (Mới nhất)
     - `price-asc` $\rightarrow$ `sortBy=price` (Giá)
7. **Phân trang động (Dynamic Pagination)**:
   - Tự động tính toán tổng số trang (`totalPages`) và tổng bản ghi (`total`) từ đối tượng `pagination` của API.
   - Hỗ trợ nút Trang trước, Trang sau, các nút trang lân cận, và ô nhập "Đến trang: [X]".
8. **Chế độ hiển thị (View Mode)**:
   - Chuyển đổi mượt mà giữa Grid View (3 cột) và List View (hàng ngang) mà không làm mất trạng thái dữ liệu.
9. **Xử lý 4 Trạng thái UX (UX States Coverage)**:
   - **Loading State**: Hiển thị 6 Skeleton Cards khớp chuẩn xác khung hình (Grid/List) trong lúc chờ network request.
   - **Empty State**: Khi không có khóa học nào khớp với bộ lọc, hiển thị icon trực quan kèm nút "Đặt lại toàn bộ bộ lọc".
   - **Error State**: Bắt lỗi kết nối máy chủ / HTTP failure, hiển thị thông báo lỗi thân thiện và nút "Thử lại".
   - **Success State**: Hiển thị danh sách khóa học thực tế kèm badge, giá, giảng viên, và thanh tóm tắt kết quả ("Hiển thị X - Y trong Z khóa học phù hợp").

---

## 5. Báo Cáo [BACKEND GAP] (Unsupported UI Capabilities)

Đối chiếu với hợp đồng [`api/COURSE_API.md`](file:///d:/e-learning/api/COURSE_API.md), các tính năng lọc sau đây trên giao diện mock cũ **chưa được backend API hỗ trợ**:

### [BACKEND GAP 1] Lọc theo Đánh giá sao (Rating Filter)
- **Năng lực cần thiết**: Lọc khóa học theo điểm đánh giá trung bình tối thiểu (ví dụ: `ratingMin=4.5`).
- **Hiện trạng Contract**: Endpoint `GET /api/courses/` không có query parameter `rating` hay `ratingMin`, và dữ liệu từng khóa học trong catalog cũng không tổng hợp trường `rating`/`ratingCount`.
- **Xử lý ở Frontend**: Giữ nguyên vị trí trong sidebar, chuyển sang trạng thái disabled (`cursor-not-allowed opacity-60`) kèm nhãn `Sắp có` và tooltip thông báo minh bạch, tránh gây hiểu lầm cho người dùng.

### [BACKEND GAP 2] Lọc theo Thời lượng khóa học (Duration Filter)
- **Năng lực cần thiết**: Lọc khóa học theo tổng thời lượng (dưới 5 giờ, 5-15 giờ, trên 15 giờ).
- **Hiện trạng Contract**: Endpoint `GET /api/courses/` không tính toán và không hỗ trợ lọc theo tổng số giờ học.
- **Xử lý ở Frontend**: Giữ nguyên vị trí trong sidebar, chuyển sang trạng thái disabled kèm nhãn `Sắp có`.

### [BACKEND GAP 3] Lọc theo Khóa học có Chứng chỉ (Certification Filter)
- **Năng lực cần thiết**: Lọc khóa học có cấp chứng chỉ hoàn thành (`hasCertificate=true`).
- **Hiện trạng Contract**: Endpoint `GET /api/courses/` không có trường dữ liệu hay tham số lọc này.
- **Xử lý ở Frontend**: Tạm thời vô hiệu hóa bộ lọc và ghi nhận backend gap.

### [BACKEND GAP 4] Lọc khóa học Đang có Ưu đãi (Discount Filter)
- **Năng lực cần thiết**: Lọc danh sách các khóa học đang giảm giá (`oldPrice > price`).
- **Hiện trạng Contract**: Tham số `type` trong `GET /api/courses/` chỉ nhận 2 giá trị là `paid` hoặc `free`.
- **Xử lý ở Frontend**: Bỏ tùy chọn discount khỏi bộ lọc loại giá và chỉ cung cấp `Tất cả`, `Miễn phí`, `Có phí`.

---

## 6. Danh Sách Files Đã Tạo & Sửa Đổi (Files Changed)

### Files Tạo Mới:
- [`src/types/category.ts`](file:///d:/e-learning/src/types/category.ts): Định nghĩa kiểu dữ liệu cho Category API theo `api/CATEGORY_API.md`.
- [`src/services/course.service.ts`](file:///d:/e-learning/src/services/course.service.ts): Service layer gọi endpoint `GET /api/courses/` thông qua `apiClient`.
- [`src/services/category.service.ts`](file:///d:/e-learning/src/services/category.service.ts): Service layer gọi endpoint `GET /api/categories/` thông qua `apiClient`.
- [`docs/progress/F6_1_COURSE_LISTING_INTEGRATION_REPORT.md`](file:///d:/e-learning/docs/progress/F6_1_COURSE_LISTING_INTEGRATION_REPORT.md): Báo cáo tiến độ nghiệm thu phase.

### Files Cập Nhật:
- [`src/types/course.ts`](file:///d:/e-learning/src/types/course.ts): Bổ sung `ApiCourseItem`, `GetCoursesParams`, `GetCoursesResponse`, và adapter `mapApiCourseToCourse()`.
- [`src/app/courses/page.tsx`](file:///d:/e-learning/src/app/courses/page.tsx): Tích hợp dữ liệu thật từ API, xóa mock data, kết nối các bộ lọc, thêm Loading/Empty/Error states, tối ưu React effect và pagination.

---

## 7. Kết Quả Xác Thực Kỹ Thuật (Validation Results)

Tuân thủ nghiêm ngặt **Rule 05** và **Workflow Gate**:

1. **Kiểm tra Kiểu dữ liệu (TypeScript Type Check)**:
   ```bash
   npx.cmd tsc --noEmit
   ```
   - **Kết quả**: **PASS** (0 errors).
2. **Kiểm tra Quy chuẩn Mã nguồn (ESLint)**:
   ```bash
   npx.cmd eslint src/app/courses/page.tsx src/services/course.service.ts src/services/category.service.ts src/types/course.ts src/types/category.ts
   ```
   - **Kết quả**: **PASS** (0 errors, 0 warnings).
3. **Kiểm tra Đóng gói Ứng dụng (Build Verification)**:
   ```bash
   npm.cmd run build
   ```
   - **Kết quả**: **PASS** (Compiled successfully in 4.3s, static pages 17/17 generated, route `/courses` builds perfectly).

---

## 8. Xác Minh Ranh Giới Phạm Vi (Scope Verification)

```text
Backend source code:       NOT MODIFIED (0 files changed)
Database / Prisma:         NOT MODIFIED (0 queries / 0 drivers)
API contracts:             NOT MODIFIED (0 files changed)
NPM Dependencies:          NOT MODIFIED (0 packages installed)
Course Detail (/courses/*):NOT TOUCHED
Classroom / Dashboard:     NOT TOUCHED
Auth / Profile / Messages: NOT TOUCHED
```

---

## 9. Khuyến Nghị Bước Tiếp Theo (Next Recommended Phase)

- **Đề xuất Phase F6.2**: **Integrate Course Detail (`/courses/[slug]`) với backend API thật**:
  - Endpoint: `GET /api/courses/:slug` (tự động tăng `view`, lấy danh sách chapters, lessons, info requirements/benefits/qa, thông tin author).
  - Tích hợp dữ liệu chi tiết vào trang xem khóa học `src/app/courses/[slug]/page.tsx`.

---

## 10. Trạng Thái Kết Thúc

Phase **F6.1** đã hoàn thành xuất sắc và đúng phạm vi yêu cầu.  
Hệ thống **DỪNG TẠI ĐÂY (STOP)** và chờ chỉ thị tiếp theo từ người dùng.
