# TMdemy Frontend — Progress Report: F6.1 PATCH — Course Search & UI Refinement

## 1. Trạng thái (Phase Status)

**COMPLETED**

---

## 2. Phạm Vi Thực Hiện (Scope)

Giai đoạn **F6.1 PATCH** tập trung giải quyết các cải tiến và tinh chỉnh trải nghiệm tìm kiếm, hiển thị giá và chi tiết khóa học:
- **Search as User Types**: Tìm kiếm trực tiếp với debounce ~700ms, phòng chống race condition, reset pagination về trang 1, không gọi API trên từng keystroke.
- **Filters Verification & Representation**: Xác thực backend contract cho `Đánh giá` và `Thời lượng học`, hiển thị nhãn `Sắp có` minh bạch khi backend chưa hỗ trợ, không fake data ở frontend.
- **Hiển thị khóa học miễn phí**: Chuẩn hóa presentation layer hiển thị `Miễn phí` khi `price === 0` thay vì `0đ` trên toàn bộ thẻ và trang khóa học.
- **Course Detail Badge Cleanup**: Xóa bỏ hoàn toàn badge `Bán chạy nhất` trên `/courses/[slug]`.
- **Course Detail Star Size Refinement**: Thu nhỏ kích thước icon ngôi sao trên `/courses/[slug]` để cân đối thị giác với text điểm rating.

---

## 3. Các Thay Đổi Chi Tiết (Changes Implemented)

### 3.1. Tìm Kiếm Khóa Học Tự Động (Search as User Types)
- **Cơ chế Debounce ~700ms**:
  - Khi người dùng gõ vào ô tìm kiếm, state `searchInput` cập nhật ngay lập tức để giữ độ phản hồi bàn phím mượt mà (0 lag).
  - Timer `setTimeout(..., 700)` được thiết lập. Mỗi khi người dùng gõ thêm ký tự trong khoảng 700ms, cleanup `clearTimeout` tự động hủy timer trước đó và đếm lại từ đầu.
  - Khi người dùng ngừng gõ đủ ~700ms, giá trị đã được trim sẽ được gán vào `searchTerm`, `currentPage` tự động reset về `1` và kích hoạt network request.
  - Hỗ trợ nút `close` (xóa nhanh từ khóa) và spinner `progress_activity` nhỏ báo hiệu khi đang chờ debounce kết thúc.
  - Vẫn hỗ trợ phím Enter hoặc nút "Tìm kiếm" để gửi yêu cầu ngay lập tức nếu người dùng không muốn đợi 700ms.
- **Phòng chống Race Condition (Air-tight Race Prevention)**:
  - Tích hợp `AbortController`: mỗi khi `searchTerm` hoặc các filter thay đổi và kích hoạt effect mới, request đang dở dang trước đó sẽ lập tức bị hủy qua `abortController.abort()`.
  - Cờ `isCurrent`: ngăn chặn tuyệt đối tình huống response cũ trả về chậm hơn đè lên kết quả của request mới nhất.

### 3.2. Rà Soát Bộ Lọc Đánh Giá & Thời Lượng (Rating & Duration Filters)
- **Bộ lọc Đánh giá**:
  - Đối chiếu hợp đồng API [`api/COURSE_API.md`](file:///d:/e-learning/api/COURSE_API.md): Endpoint `GET /api/courses/` hiện **chưa có** tham số lọc theo rating và catalog không trả về rating tổng hợp.
  - Giữ nguyên cấu trúc giao diện sidebar, hiển thị nhãn `Sắp có`, trạng thái `disabled` kèm tooltip thông báo minh bạch `[BACKEND GAP]`. Không dùng dữ liệu giả lập phía client.
- **Bộ lọc Thời lượng học**:
  - Đối chiếu hợp đồng API: Endpoint `GET /api/courses/` **chưa có** tham số lọc theo số giờ học.
  - Hiển thị nhãn `Sắp có`, trạng thái `disabled` kèm tooltip thông báo minh bạch `[BACKEND GAP]`.

### 3.3. Hiển Thị Giá Khóa Học 0đ (Free-Course Display)
- Cập nhật hàm `formatPrice`:
  ```typescript
  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };
  ```
- Khóa học có `price === 0` hiển thị `Miễn phí` trên:
  - [`CourseCard`](file:///d:/e-learning/src/components/course/course-card.tsx) (cả Grid View và List View).
  - [`/courses/[slug]`](file:///d:/e-learning/src/app/courses/[slug]/page.tsx) (Khối giá nổi bật).

### 3.4. Tinh Chỉnh Trang Chi Tiết Khóa Học (Course Detail UI Changes)
- **Xóa Badge "Bán chạy nhất"**: Gỡ bỏ badge `Bán chạy nhất` kèm icon ngọn lửa tại Header Overview của [`/courses/[slug]`](file:///d:/e-learning/src/app/courses/[slug]/page.tsx).
- **Thu nhỏ kích thước ngôi sao**:
  - Header rating strip: giảm từ `text-[18px]` xuống `text-[14px]` (cân đối tuyệt đối với text `4.8`).
  - Student Reviews breakdown grid: giảm từ `text-[20px]` xuống `text-[16px]`.
  - Individual Reviews list: giảm từ `text-[16px]` xuống `text-[13px]`.

---

## 4. Danh Sách Files Tạo Mới & Sửa Đổi

### Files Tạo Mới:
- [`docs/progress/F6_1_PATCH_COURSE_SEARCH_UI_REPORT.md`](file:///d:/e-learning/docs/progress/F6_1_PATCH_COURSE_SEARCH_UI_REPORT.md): Báo cáo nghiệm thu patch phase.

### Files Sửa Đổi:
- [`src/app/courses/page.tsx`](file:///d:/e-learning/src/app/courses/page.tsx): Cài đặt debounce 700ms, AbortController, xử lý race condition, clear button và filter UX.
- [`src/app/courses/[slug]/page.tsx`](file:///d:/e-learning/src/app/courses/[slug]/page.tsx): Xóa badge "Bán chạy nhất", thu nhỏ kích thước icon sao, format giá 0đ thành "Miễn phí".
- [`src/components/course/course-card.tsx`](file:///d:/e-learning/src/components/course/course-card.tsx): Cập nhật `formatPrice` trả về "Miễn phí" khi `amount === 0`.
- [`src/services/course.service.ts`](file:///d:/e-learning/src/services/course.service.ts): Hỗ trợ truyền tùy chọn `signal: AbortSignal` xuống `apiClient` để hủy network request.

---

## 5. Tích Hợp API (API Integration)

* **Endpoint**: `GET /api/courses/`
* **Query Params sử dụng trong search**:
  * `search`: chuỗi tìm kiếm sau debounce 700ms
  * `page`: tự động reset về `1` mỗi khi nội dung search thay đổi
  * `limit`: 9 khóa học / trang
* **Hủy request cũ (Request Abort)**: Tận dụng native Fetch API `signal` được cấu hình trong `apiClient.get`.

---

## 6. Báo Cáo [BACKEND GAP]

1. **[BACKEND GAP 1] Lọc theo Đánh giá (Rating)**: Backend chưa hỗ trợ query parameter `rating`/`ratingMin` trong `GET /api/courses/` $\rightarrow$ Giữ nhãn `Sắp có` ở sidebar.
2. **[BACKEND GAP 2] Lọc theo Thời lượng (Duration)**: Backend chưa hỗ trợ lọc theo giờ học $\rightarrow$ Giữ nhãn `Sắp có` ở sidebar.

---

## 7. Thay Đổi Gói Phụ Thuộc (Dependency Changes)

```text
Dependencies installed: 0 (KHÔNG THÊM BẤT KỲ PACKAGE MỚI NÀO)
```
Cơ chế debounce và hủy request được triển khai thuần túy bằng chuẩn `setTimeout`, `clearTimeout` và `AbortController` của nền tảng web hiện đại.

---

## 8. Kết Quả Xác Thực Kỹ Thuật (Validation Results)

1. **Kiểm tra Kiểu dữ liệu (TypeScript)**:
   ```bash
   npx.cmd tsc --noEmit
   ```
   - **Kết quả**: **PASS** (0 errors).
2. **Kiểm tra Quy chuẩn Mã nguồn (ESLint)**:
   ```bash
   npx.cmd eslint src/app/courses/page.tsx src/app/courses/[slug]/page.tsx src/components/course/course-card.tsx src/services/course.service.ts
   ```
   - **Kết quả**: **PASS** (0 errors).
3. **Kiểm tra Đóng gói Ứng dụng (Build Verification)**:
   ```bash
   npm.cmd run build
   ```
   - **Kết quả**: **PASS** (Compiled successfully in 1404ms, 17/17 pages generated cleanly).

---

## 9. Bằng Chứng Thực Thi Quy Trình (Execution Trace)

### Workflow Used
- `feature-development.md` — **USED**

### Skills Used
- `page-implementation` — **USED**
- `api-integration` — **USED**
- `stitch-ui` — **USED**
- `frontend-review` — **USED**

### Skill Evidence

#### `page-implementation`
- Refactor luồng state management và controlled input trong [`src/app/courses/page.tsx`](file:///d:/e-learning/src/app/courses/page.tsx).
- Tổ chức lại component layout, thêm nút xóa tìm kiếm nhanh và typing feedback spinner.
- Cập nhật trang [`/courses/[slug]`](file:///d:/e-learning/src/app/courses/[slug]/page.tsx) bảo toàn cấu trúc breadcrumbs và two-column workspace.

#### `api-integration`
- Mở rộng [`courseService.getCourses()`](file:///d:/e-learning/src/services/course.service.ts) để tiếp nhận `AbortSignal`.
- Kết nối request tìm kiếm debounced với query param `search` của API thật.
- Khắc phục triệt để race condition khi người dùng gõ liên tục bằng `AbortController` và cờ hủy `isCurrent`.

#### `stitch-ui`
- Đối chiếu ngôn ngữ thị giác Stitch của TMdemy: giữ nguyên padding, bo góc `rounded-xl`, màu sắc thương hiệu tím `#7240b8`.
- Thu nhỏ kích thước ngôi sao từ `text-[18px]`/`text-[20px]` xuống `text-[14px]`/`text-[16px]` để cân xứng hoàn hảo với font chữ theo chuẩn thiết kế.
- Gỡ bỏ badge `Bán chạy nhất` để giao diện Course Detail thoáng đãng và thanh lịch hơn.

#### `frontend-review`
- Đánh giá toàn diện các files sửa đổi theo 10 tiêu chuẩn chất lượng.
- Kiểm tra tính bảo toàn ranh giới backend: 0 file backend/Prisma bị can thiệp.
- Đảm bảo strict TypeScript mode và 0 lỗi compile/linting.

### Workflow Gates

- **Context Gate**: **PASS** (Đã nắm vững yêu cầu debounce 700ms, phòng chống race condition, định dạng giá 0đ và tinh chỉnh Course Detail).
- **Scope Gate**: **PASS** (Chỉ sửa các thành phần trực tiếp liên quan đến Course Search, Filter, CourseCard và Course Detail UI).
- **API/Backend Boundary Gate**: **PASS** (Không sửa backend, không tạo endpoint mới, không mock data).
- **Dependency Gate**: **PASS** (Không cài package ngoài).
- **Validation Gate**: **PASS** (Đã chạy thực tế `tsc`, `eslint`, `build` thành công 100%).

---

## 10. Giới Hạn Còn Lại (Known Limitations)

- Chức năng lọc `Đánh giá` và `Thời lượng học` hiển thị ở dạng `Sắp có` vì Backend API catalog (`GET /api/courses/`) chưa hỗ trợ các trường này.
- Trang Course Detail (`/courses/[slug]`) vẫn đang sử dụng dữ liệu chi tiết tĩnh (`mockCourseDetailData`) và đang chờ được kết nối API thật trong Phase F6.2.

---

## 11. Khuyến Nghị Bước Kế Tiếp (Next Phase)

- **Phase F6.2**: **Integrate Course Detail (`/courses/[slug]`) với backend API thật**:
  - Endpoint: `GET /api/courses/:slug`.
  - Tích hợp chapters, lessons, info requirements/benefits/qa, tác giả, và tăng view tự động.

---

## 12. Trạng Thái Kết Thúc

Phase **F6.1 PATCH** đã hoàn thành trọn vẹn và đạt toàn bộ tiêu chí kỹ thuật.  
Hệ thống tuân thủ nghiêm ngặt nguyên tắc: **DỪNG LẠI (STOP)** và chờ chỉ thị tiếp theo từ bạn.
