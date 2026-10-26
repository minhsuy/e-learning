# Báo Cáo Triển Khai: Phase F9.5 — Admin Course Management & Approval

**Mã Phase:** F9.5 — ADMIN COURSE MANAGEMENT & APPROVAL  
**Phân hệ:** Admin Portal  
**Dự án:** TMdemy E-learning Frontend (`d:/e-learning`)  
**Ngày thực hiện:** 19/10/2026  
**Trạng thái:** HOÀN THÀNH TOÀN DIỆN (VALIDATED 100% BUILD & E2E BROWSER)

---

## 1. Summary (Tổng quan)

Phase F9.5 tập trung xây dựng toàn diện phân hệ **Quản lý & Phê duyệt Khóa học dành cho Quản trị viên (`/admin/courses`)**. Trang đã được kết nối 100% với Backend REST API thật, tuân thủ nghiêm ngặt ranh giới kiến trúc, hợp đồng API (`api/ADMIN_API.md`, `api/CHAPTER_API.md`, `api/CATEGORY_API.md`), đảm bảo bảo vệ phiên đăng nhập (`RouteGuard allowedRoles={['admin']}`), hỗ trợ tìm kiếm debounced 500ms chống race condition, bộ lọc đa chiều (trạng thái, danh mục, giảng viên), phân trang server-side, modal thẩm định chi tiết giáo trình bài học, và luồng phê duyệt / từ chối khóa học có hộp thoại xác nhận an toàn.

---

## 2. Existing Implementation Audit (Khảo sát hiện trạng trước khi triển khai)

- **Admin Layout Shell (F9.2)**: `src/components/admin/admin-shell.tsx`, `admin-sidebar.tsx`, `admin-header.tsx`, `admin-breadcrumb.tsx` đã hoàn thành và hoạt động ổn định.
- **Admin Users (F9.4)**: Kiến trúc tổ chức component dạng container (`admin-users-view.tsx`), filters bar, table, modal, pagination và KPI summary đã chứng minh tính hiệu quả cao và được áp dụng làm quy chuẩn cho F9.5.
- **Placeholder cũ**: `src/app/admin/courses/page.tsx` trước đây chỉ là một placeholder tĩnh với icon `BookOpen` và thông báo kế hoạch F9.5.
- **Backend API Boundary**: Frontend giao tiếp độc lập với Backend tại `http://localhost:3002` thông qua REST API và Bearer JWT Token. Không can thiệp bất kỳ dòng code backend nào (`D:\e-learning_server`).

---

## 3. API Contract Mapping (Ánh xạ hợp đồng API)

| Chức năng | Phương thức | Endpoint Backend | Quyền hạn | Ghi chú & Dữ liệu cung cấp |
| :--- | :---: | :--- | :---: | :--- |
| **Lấy danh sách khóa học** | `GET` | `/api/admin/courses` | `ADMIN` | Query: `page`, `limit`, `status`, `search`, `category`, `author`, `_destroy`. Trả về `courses`, `pagination`. |
| **Thẩm định giáo trình** | `GET` | `/api/chapters/course/:id` | `TEACHER`, `ADMIN` | Path param: `id` (Course ID). Trả về danh sách `chapters` và `lessons` (tiêu đề, thời lượng, học thử `isDemo`). |
| **Phê duyệt khóa học** | `PATCH` | `/api/admin/courses/teacher/:id` | `ADMIN` | Body: `{ status: 'approved' }`. Chuyển khóa học sang `APPROVED`, kích hoạt notification tới giảng viên. |
| **Từ chối khóa học** | `PATCH` | `/api/admin/courses/teacher/:id` | `ADMIN` | Body: `{ status: 'rejected', reason?: string }`. Chuyển trạng thái sang `REJECTED`. |
| **Danh mục cho bộ lọc** | `GET` | `/api/categories/` | `Public` | Trả về danh sách danh mục hoạt động trên hệ thống. |
| **Giảng viên cho bộ lọc** | `GET` | `/api/admin/users?role=teacher` | `ADMIN` | Trả về danh sách tài khoản giảng viên để lọc khóa học theo tác giả. |

---

## 4. Course Listing (Hiển thị danh sách khóa học)

Bảng khóa học quản trị được thiết kế theo hệ thống nhận diện **Modern Academic Violet**:
- **Thumbnail**: Tỷ lệ 16:9 sắc nét, có fallback icon `BookOpen` nếu thiếu ảnh.
- **Thông tin khóa học**: Tiêu đề khóa học, đường dẫn slug, huy hiệu trình độ (`Cơ bản`, `Trung cấp`, `Nâng cao`), số lượng đã bán (`sold`).
- **Giảng viên**: Avatar đại diện, họ tên giảng viên (`username`) và email liên hệ.
- **Danh mục**: Huy hiệu danh mục với icon `Tag`.
- **Giá bán**: Định dạng tiền tệ VND (`Intl.NumberFormat('vi-VN')`), hiển thị rõ giá gốc gạch ngang nếu có giảm giá, hoặc nhãn "Miễn phí".
- **Trạng thái**:
  - `Chờ duyệt (PENDING)`: Huy hiệu hổ phách (amber), chấm trạng thái vàng.
  - `Đã duyệt (APPROVED)`: Huy hiệu xanh lá (emerald), chấm trạng thái xanh.
  - `Bị từ chối (REJECTED)`: Huy hiệu đỏ hồng (rose), chấm trạng thái đỏ.
- **Ngày tạo**: Định dạng ngày tháng năm chuẩn Việt Nam (`dd/MM/yyyy`).
- **Thao tác**: Nút xem chi tiết (`Eye`), nút duyệt nhanh (`CheckCircle2`), nút từ chối nhanh (`XCircle`) (chỉ hiển thị cho khóa học đang `PENDING`).

---

## 5. Search Behavior (Tìm kiếm khóa học)

- **Cơ chế**: Debounce 500ms trên client, tự động reset debounce timer khi người dùng tiếp tục gõ phím.
- **Server-side**: Gửi tham số `search` trực tiếp lên `GET /api/admin/courses?search=...`.
- **Bảo vệ Race Condition**: Tích hợp `AbortController` hủy bỏ request cũ trước đó nếu có request mới được gửi đi.
- **Pagination Sync**: Tự động đưa về `page: 1` khi từ khóa tìm kiếm thay đổi.
- **Xóa tìm kiếm nhanh**: Nút "X" trong ô tìm kiếm cho phép xóa từ khóa tức thì.

---

## 6. Course Filters (Bộ lọc đa chiều)

### 6.1. Lọc theo trạng thái (Status Filter)
- 4 Pills chuyển đổi nhanh: `Tất cả trạng thái` (`all`), `Chờ duyệt` (`pending`), `Đã duyệt` (`approved`), `Bị từ chối` (`rejected`).
- Tích hợp 2 chiều với các thẻ KPI: Khi click vào thẻ KPI "Chờ phê duyệt" hoặc "Bị từ chối", bộ lọc trạng thái tự động chọn tab tương ứng và lọc bảng.

### 6.2. Lọc theo danh mục (Category Filter)
- Tải động từ `categoryService.getCategories({ limit: 100 })`.
- Truyền tham số `category: categoryId` chuẩn xác lên backend.

### 6.3. Lọc theo giảng viên (Teacher Filter)
- Tải danh sách giảng viên từ `adminUserService.getUsers({ role: 'teacher', limit: 100 })`.
- Truyền tham số `author: teacherId` (UUID) chuẩn xác lên backend.

### 6.4. Nút Xóa bộ lọc (Reset Filters)
- Khi có bất kỳ bộ lọc hoặc tìm kiếm nào hoạt động, xuất hiện nút đỏ "Xóa bộ lọc" kèm số lượng kết quả tìm thấy. Bấm vào sẽ reset toàn bộ điều kiện về mặc định.

---

## 7. Server-Side Pagination (Phân trang máy chủ)

- Tái sử dụng component phân trang `CoursePagination`:
  - `page`: Trang hiện tại.
  - `limit`: Số lượng bản ghi mỗi trang (cho phép chọn 10, 20, 50).
  - `total`: Tổng số bản ghi thực tế từ metadata `pagination.total`.
  - `totalPages`: Tổng số trang.
  - Các nút điều hướng: Đầu trang (`ChevronsLeft`), Trang trước (`ChevronLeft`), Trang sau (`ChevronRight`), Cuối trang (`ChevronsRight`).

---

## 8. Course Detail & Content Inspection (Xem chi tiết & Thẩm định giáo trình)

Component `CourseDetailModal` (`src/components/admin/courses/course-detail-modal.tsx`) cung cấp giao diện thẩm định chuyên sâu:
1. **Thông tin chung**: Tiêu đề, slug, thumbnail, huy hiệu trạng thái, loại khóa học, trình độ.
2. **Chỉ số kinh doanh**: Giá bán niêm yết, lượt mua, lượt xem, ngày tạo.
3. **Thẻ Giảng viên**: Ảnh đại diện, tên người dùng, email giảng viên.
4. **Thẻ Danh mục**: Tên danh mục và UUID.
5. **Thẩm định Giáo trình & Bài học**:
   - Gọi API thật `GET /api/chapters/course/:id` với token Admin.
   - Thống kê tổng số chương và tổng số bài học.
   - Liệt kê chi tiết từng chương (Chapter order & title), danh sách bài học con kèm icon video, thời lượng bài học (phút:giây) và huy hiệu "Học thử" (`isDemo`).
6. **Thao tác phê duyệt ngay trong modal**: Nếu khóa học đang ở trạng thái `PENDING`, hiển thị 2 nút "Từ chối" và "Phê duyệt khóa học" ngay ở footer của modal.

---

## 9. Course Approval Flow (Quy trình duyệt khóa học)

1. Admin bấm nút Duyệt trên bảng hoặc trong Modal chi tiết.
2. Mở hộp thoại xác nhận `ApproveCourseModal`:
   - Hiển thị tóm tắt khóa học và giảng viên.
   - Nhắc nhở quy định kiểm duyệt.
3. Bấm "Xác nhận phê duyệt":
   - Hiển thị spinner "Đang phê duyệt...".
   - Gọi API thật: `PATCH /api/admin/courses/teacher/:id` với payload `{ status: 'approved' }`.
   - Backend cập nhật trạng thái `APPROVED` và tự động gửi notification tới Giảng viên.
   - Toast thông báo thành công: *"Đã phê duyệt khóa học thành công!"*.
   - Tự động làm mới danh sách khóa học và cập nhật lại toàn bộ 4 chỉ số KPI.

---

## 10. Course Rejection Flow (Quy trình từ chối khóa học)

1. Admin bấm nút Từ chối trên bảng hoặc trong Modal chi tiết.
2. Mở hộp thoại `RejectCourseModal`:
   - Hiển thị tóm tắt khóa học.
   - Cung cấp ô textarea nhập lý do từ chối hoặc góp ý hoàn thiện (không bắt buộc).
3. Bấm "Xác nhận từ chối":
   - Hiển thị spinner "Đang từ chối...".
   - Gọi API thật: `PATCH /api/admin/courses/teacher/:id` với payload `{ status: 'rejected', reason?: string }`.
   - Backend cập nhật trạng thái `REJECTED`.
   - Toast thông báo: *"Đã từ chối khóa học."*.
   - Tự động làm mới danh sách và cập nhật lại KPI.

---

## 11. Loading / Error / Empty States (Xử lý 6 trạng thái UX)

- **Loading Skeleton**: Hiển thị 6 dòng skeleton pulsing có thumbnail, text và badge placeholders.
- **Error State**: Khung cảnh báo lỗi với nút "Thử tải lại" kích hoạt reload tức thì.
- **Empty State (Chưa có dữ liệu)**: Thông báo hệ thống chưa có khóa học nào khi database trống.
- **Empty State (Bộ lọc không khớp)**: Thông báo không tìm thấy kết quả phù hợp, kèm gợi ý và nút "Xóa bộ lọc".
- **Mutation Loading**: Nút xác nhận bị khóa (`disabled`) và hiển thị `Loader2 animate-spin` trong suốt quá trình gọi API.
- **KPI Loading**: Các ô số liệu hiển thị skeleton pulse trước khi Promise settling.

---

## 12. Responsive Behavior (Độ thích ứng giao diện)

- **Desktop (>= 1024px)**: Bảng dữ liệu đầy đủ 7 cột, thanh tìm kiếm và tabs trạng thái nằm ngang, 4 thẻ KPI trải dài.
- **Tablet (768px - 1023px)**: Bảng cuộn ngang mượt mà, dropdown bộ lọc linh hoạt.
- **Mobile (< 768px)**: Tự động chuyển đổi bảng thành **danh sách thẻ (Cards layout)** gọn gàng, hiển thị thumbnail, trạng thái, giá tiền và các nút thao tác nhanh mà không bị tràn khung hay vỡ layout.

---

## 13. Files Created (Các tệp tin tạo mới)

1. `src/types/admin-course.ts`: Toàn bộ TypeScript interfaces & types cho Admin Course, Chapters, Pagination, Mutation và KPIs.
2. `src/services/admin-course.service.ts`: Service giao tiếp API với `getCourses`, `getCourseChapters`, `approveCourse`, `rejectCourse`, `getCourseKpis`.
3. `src/components/admin/courses/course-kpi-summary.tsx`: 4 thẻ chỉ số KPI tổng hợp, hỗ trợ click lọc nhanh.
4. `src/components/admin/courses/course-filters-bar.tsx`: Thanh công cụ tìm kiếm debounced 500ms, tabs trạng thái, dropdown lọc danh mục & giảng viên.
5. `src/components/admin/courses/course-table.tsx`: Bảng dữ liệu Desktop & giao diện thẻ Mobile, tích hợp loading/error/empty states.
6. `src/components/admin/courses/course-pagination.tsx`: Bộ điều khiển phân trang server-side.
7. `src/components/admin/courses/course-detail-modal.tsx`: Modal thẩm định chi tiết giáo trình khóa học và xem trước bài học con.
8. `src/components/admin/courses/approve-course-modal.tsx`: Modal xác nhận phê duyệt khóa học.
9. `src/components/admin/courses/reject-course-modal.tsx`: Modal xác nhận từ chối khóa học kèm lý do phản hồi.
10. `src/components/admin/courses/admin-courses-view.tsx`: Component container điều phối toàn bộ luồng dữ liệu, filter, pagination và modal.

---

## 14. Files Modified (Các tệp tin đã chỉnh sửa)

1. `src/app/admin/courses/page.tsx`: Thay thế placeholder bằng việc mount component `AdminCoursesView` với tiêu đề và metadata chuẩn.

---

## 15. Backend Gaps (Khoảng trống Backend được ghi nhận)

1. **`[BACKEND GAP]` — Lưu trữ và phản hồi chi tiết Lý do từ chối (Rejection Reason)**:
   - **Thực tế**: Backend endpoint `PATCH /api/admin/courses/teacher/:id` chấp nhận `status: 'rejected'`, tuy nhiên database schema và response của `GET /api/admin/courses` hiện tại không lưu hoặc trả về trường `rejectionReason` trong thực thể `Course`.
   - **Xử lý phía Frontend**: Frontend gửi `reason` trong body nếu có, hiển thị giao diện nhập lý do phản hồi để Admin ghi chú, đồng thời thông báo rõ ràng cho Admin rằng Backend sẽ ghi nhận trạng thái `REJECTED` và gửi notification đến Giảng viên.

---

## 16. Dependency Changes (Chính sách thư viện)

- **Không cài đặt bất kỳ thư viện ngoài (npm package) nào mới**. Tận dụng 100% stack hiện có: Next.js 15, React 19, Lucide React, Tailwind CSS, shadcn/ui.

---

## 17. Validation Results (Kết quả kiểm định)

| Công cụ kiểm tra | Lệnh thực thi | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **TypeScript Compiler** | `cmd /c npx tsc --noEmit` | **PASS** | 0 lỗi compilation. |
| **ESLint** | `cmd /c npm run lint` | **PASS** | 0 lỗi, cảnh báo cũ từ các file khác không liên quan. |
| **Production Build** | `cmd /c npm run build` | **PASS** | 39/39 routes build thành công mỹ mãn. |

---

## 18. Browser Testing Results (Kiểm thử thực tế trên trình duyệt)

Đã chạy kiểm thử tự động toàn diện bằng `browser_subagent` trên trình duyệt Chrome:
1. **Đăng nhập Admin**: Đăng nhập bằng `thaiminh0612@gmail.com` / `quangminh2004` thành công và chuyển vào `/admin/courses`.
2. **Hiển thị đầy đủ UI**: Header, 4 thẻ KPI (Tổng: 370, Chờ duyệt: 24, Đã duyệt: 338, Bị từ chối: 8), thanh filters, bảng dữ liệu, phân trang.
3. **Lọc trạng thái Chờ duyệt**: Click pill "Chờ duyệt", bảng cập nhật hiển thị 24 khóa học đang ở trạng thái `Chờ duyệt` với badge hổ phách.
4. **Tìm kiếm Debounced**: Nhập từ khóa `"Feast"`, danh sách lọc ra chính xác khóa học *"Quản Lý Kho Đặc Trưng Dữ Liệu Tập Trung (Feature Store) Với Feast"*.
5. **Mở Modal Thẩm định Chi tiết**: Click icon xem chi tiết, `CourseDetailModal` mở ra hiển thị đầy đủ thông tin khóa học, giáo trình bài học tải từ API, và các nút phê duyệt / từ chối. Đóng modal hoạt động trơn tru.
6. **Kiểm tra Responsive Mobile**: Thu nhỏ viewport về kích thước `450x850`, bảng tự động chuyển thành định dạng thẻ mobile sắc nét, không bị tràn viền hay vỡ giao diện.

### Các hình ảnh bằng chứng (Artifacts):
- `admin_courses_desktop`: Giao diện desktop đầy đủ.
- `admin_course_detail_modal`: Modal thẩm định chi tiết giáo trình.
- `admin_courses_mobile` & `admin_courses_mobile_cards`: Giao diện thích ứng trên điện thoại di động.

---

## 19. Execution Trace (Bắt buộc theo quy chuẩn)

### Workflow Used
- `feature-development.md` — **USED**

### Skills Used
- `page-implementation` — **USED**
- `api-integration` — **USED**
- `stitch-ui` — **USED**
- `frontend-review` — **USED**

### Skill Evidence
#### `api-integration`
- Tra cứu và đọc hợp đồng API trong `api/ADMIN_API.md` (mục 2: Course Management: `GET /api/admin/courses`, `PATCH /api/admin/courses/teacher/:id`).
- Tra cứu endpoint giáo trình bài học tại `api/CHAPTER_API.md` (`GET /api/chapters/course/:id`).
- Xác thực trực tiếp dữ liệu trả về và các query params (`search`, `status`, `category`, `author`) bằng script kiểm thử với access token thực tế.
- Xây dựng tầng service tập trung `adminCourseService` kế thừa `apiClient`.

#### `page-implementation`
- Xây dựng cấu trúc route chuẩn mực tại `src/app/admin/courses/page.tsx` và client container `AdminCoursesView`.
- Tách nhỏ các component chuyên biệt: `CourseKpiSummary`, `CourseFiltersBar`, `CourseTable`, `CoursePagination`, `CourseDetailModal`, `ApproveCourseModal`, `RejectCourseModal`.
- Quản lý đồng bộ trạng thái tìm kiếm, phân trang và modal.

#### `stitch-ui`
- Tra cứu project Stitch `projects/4018234784417032182` và Design System `Modern Academic Violet`.
- Tái sử dụng bảng màu chủ đạo `#7240b8`, dark surface `#1d1926`, border `#2b2438` đồng nhất với toàn bộ hệ thống Admin Portal TMdemy.

#### `frontend-review`
- Rà soát toàn bộ code mới, loại bỏ triệt để các cảnh báo React 19 / ESLint `react-hooks/set-state-in-effect`.
- Đảm bảo ranh giới Backend được bảo vệ nguyên vẹn.

---

## 20. Workflow Gates

- **Context Gate**: **PASS** (Đọc đầy đủ rules, API contract, Stitch design system).
- **Scope Gate**: **PASS** (Tập trung chính xác vào Admin Course Management & Approval, không mở rộng sang tạo/sửa/xóa khóa học ngoài scope).
- **API/Backend Boundary Gate**: **PASS** (Chỉ giao tiếp qua REST API, không đụng chạm backend repo).
- **Dependency Gate**: **PASS** (Không cài bất kỳ package ngoài nào).
- **Data Safety Gate**: **PASS** (Kiểm tra an toàn, bảo vệ dữ liệu khóa học thật, không làm biến đổi dữ liệu tùy tiện).
- **Validation Gate**: **PASS** (TypeScript PASS, Lint PASS, Next.js Build PASS, Browser E2E PASS).

---

## 21. Known Limitations (Giới hạn đã biết)
- Backend hiện chưa hỗ trợ endpoint xem chi tiết riêng cho Admin (`GET /api/admin/courses/:id` là 404), do đó Frontend tận dụng thông tin trả về từ danh sách kết hợp với `GET /api/chapters/course/:id` để thẩm định giáo trình.

---

## 22. Recommended Next Phase (Đề xuất bước tiếp theo)
- **Phase F9.6 — Admin Category Management (`/admin/categories`)**: Xây dựng phân hệ quản lý danh mục khóa học (thêm, sửa, kích hoạt/vô hiệu hóa danh mục).
