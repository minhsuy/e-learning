# TMdemy Frontend — Progress Report: F6.2 Course Detail API Integration

**Feature Phase**: F6.2 — Course Detail API Integration  
**Date**: 2026-10-09  
**Status**: COMPLETED & VALIDATED (Ready for Review)  
**Execution Context**: Frontend TMdemy (`d:/e-learning`)  

---

## 1. Summary

* **Mục tiêu**: Tích hợp trang chi tiết khóa học [`src/app/courses/[slug]/page.tsx`](file:///d:/e-learning/src/app/courses/%5Bslug%5D/page.tsx) với backend REST API thật (`http://localhost:3002`), loại bỏ hoàn toàn mock data tĩnh `mockCourseDetailData`.
* **Trạng thái hoàn thành**: **COMPLETED (100% mục tiêu của Phase F6.2)**.
* **Các chức năng đã tích hợp**:
  1. **Tải dữ liệu khóa học thật theo slug**: Kết nối `GET /api/courses/:slug` lấy dữ liệu khóa học trực tiếp từ cơ sở dữ liệu backend.
  2. **Hiển thị giáo trình thực tế (Curriculum)**: Tải và hiển thị danh sách chương (`chapters`) và bài học (`lessons`) thực tế, tính toán tổng số bài học và tổng thời lượng chính xác từ dữ liệu API.
  3. **Hiển thị giá & quy tắc miễn phí**: Khóa học có `price === 0` hiển thị `Miễn phí` với `text-green-500`; khóa học có phí hiển thị giá bán và giá gốc gạch ngang kèm phần trăm giảm giá.
  4. **Tích hợp video giới thiệu (Video Preview)**: Tự động trích xuất và phát video demo YouTube trực tiếp qua iframe player từ trường `intro_url` / `introUrl`.
  5. **Tích hợp đánh giá thực tế (Ratings & Reviews)**: Kết nối `GET /api/ratings/course/:id` hiển thị điểm đánh giá trung bình, số lượng đánh giá và danh sách nhận xét công khai từ học viên.
  6. **Kiểm tra trạng thái đăng ký (Enrollment & Access)**: Kết nối `GET /api/enrollments/my` khi học viên đăng nhập để phân biệt trạng thái "Vào học ngay" (đã ghi danh hoặc là tác giả khóa học) và "Mua khóa học ngay" / "Đăng ký học miễn phí" (chưa ghi danh).
  7. **Bao quát đầy đủ 5 trạng thái UX**: Loading Skeleton, Error State, 404 Not Found State, Success State và Null/Optional data fallback.
* **Phần chưa hoàn thành**: Không có.

---

## 2. API Contract

Căn cứ theo Hợp đồng API chuẩn tại [`api/COURSE_API.md`](file:///d:/e-learning/api/COURSE_API.md), [`api/RATING_API.md`](file:///d:/e-learning/api/RATING_API.md), và [`api/ENROLLMENT_API.md`](file:///d:/e-learning/api/ENROLLMENT_API.md):

### A. Endpoints Thực Tế

| Endpoint | Method | Auth | Role | Mục Đích |
| :--- | :---: | :---: | :---: | :--- |
| `/api/courses/:slug` | `GET` | Public | All | Lấy toàn bộ thông tin chi tiết khóa học, chương học, bài học và quyền lợi học tập theo slug URL. |
| `/api/ratings/course/:id` | `GET` | Public | All | Lấy danh sách đánh giá công khai (`ACTIVE`), điểm trung bình và số lượt đánh giá của khóa học. |
| `/api/enrollments/my` | `GET` | Bearer JWT | All | Lấy danh sách các khóa học học viên hiện tại đã ghi danh để kiểm tra quyền truy cập bài học. |

### B. Request Parameters

* `/api/courses/:slug`: Path parameter `slug` (ví dụ: `nhan-dang-vat-the-thoi-gian-thuc-yolov8-yolov10`, `trien-khai-mo-hinh-ai-nvidia-triton-inference-server`).
* `/api/ratings/course/:id`: Path parameter `id` (UUID của khóa học).
* `/api/enrollments/my`: Header `Authorization: Bearer <ACCESS_TOKEN>`.

### C. Response Fields Đã Sử Dụng

* **Course**: `id`, `_id`, `title`, `slug`, `image`, `intro_url` / `introUrl`, `description`, `price`, `oldPrice` / `old_price`, `view`, `sold`, `createdAt`, `updatedAt`, `level`.
* **Category**: `category.name`, `category.slug`.
* **Author / Instructor**: `author.username`, `author.avatar`, `author.role`.
* **Info**: `info.requirements` (danh sách yêu cầu), `info.benefits` (bạn sẽ học được gì), `info.techniques` (kỹ thuật & công nghệ áp dụng), `info.documents`.
* **Chapters & Lessons**: `chapters[].title`, `chapters[].order`, `chapters[].lessons[].title`, `chapters[].lessons[].duration` (tính bằng giây), `chapters[].lessons[].isDemo`.
* **Ratings**: `ratings.averageRating`, `ratings.totalRatings`, `ratings.ratings[].rate`, `ratings.ratings[].content`, `ratings.ratings[].user.username`, `ratings.ratings[].user.avatar`, `ratings.ratings[].createdAt`.
* **Enrollments**: `enrollments[].courseId`, `enrollments[].course.slug`.

### D. Error Handling

* **404 Not Found**: Bắt khi `error.statusCode === 404` từ `GET /api/courses/:slug` $\rightarrow$ Render giao diện chuyên biệt **Not Found State** (icon `search_off`, thông báo rõ ràng, nút quay lại `/courses` và `/`).
* **Lỗi mạng / 500**: Bắt lỗi kết nối máy chủ $\rightarrow$ Render **Error State** với nút "Thử lại" kích hoạt lại request.
* **Race Condition & Abort**: Tích hợp `AbortController` tự động hủy request cũ khi người dùng điều hướng liên tiếp giữa các slug khác nhau.

### E. Báo cáo [BACKEND GAP]

1. **[BACKEND GAP 1] Hồ sơ chi tiết của Giảng viên (Instructor Bio & Experience)**:
   - **Hiện trạng Contract**: Endpoint `GET /api/courses/:slug` chỉ trả về `author: { id, username, email, avatar, role }`. Backend chưa tổng hợp trường `bio`, `rating`, `experience` hay `studentsCount` của riêng giảng viên trong response khóa học.
   - **Xử lý ở Frontend**: Hiển thị thông tin thực tế sẵn có (`username`, `avatar`, nhãn chức danh theo `role`), loại bỏ toàn bộ dữ liệu mock ảo (như 15.000 học viên, 10+ năm kinh nghiệm).
2. **[BACKEND GAP 2] Tiêu đề phụ của khóa học (`subtitle`)**:
   - **Hiện trạng Contract**: Bảng cơ sở dữ liệu khóa học chỉ có `title` và `description`. Không có trường `subtitle`.
   - **Xử lý ở Frontend**: Tái sử dụng `description` làm đoạn tóm tắt mở đầu, không làm trống giao diện.
3. **[BACKEND GAP 3] Chứng chỉ hoàn thành (`hasCertificate`)**:
   - **Hiện trạng Contract**: Schema khóa học công khai chưa có cờ boolean `hasCertificate`.
   - **Xử lý ở Frontend**: Ghi nhận backend gap, hiển thị cam kết đào tạo chung của TMdemy.

---

## 3. Files Changed

### Files Tạo Mới:
1. [`src/types/rating.ts`](file:///d:/e-learning/src/types/rating.ts):
   - Định nghĩa `ApiRatingUser`, `ApiRatingItem`, và `GetCourseRatingsResponse` theo hợp đồng `api/RATING_API.md`.
2. [`src/types/enrollment.ts`](file:///d:/e-learning/src/types/enrollment.ts):
   - Định nghĩa `ApiEnrollmentItem` và `GetMyEnrollmentsResponse` theo hợp đồng `api/ENROLLMENT_API.md`.
3. [`src/services/rating.service.ts`](file:///d:/e-learning/src/services/rating.service.ts):
   - Service layer gọi `GET /api/ratings/course/:id` qua `apiClient`.
4. [`src/services/enrollment.service.ts`](file:///d:/e-learning/src/services/enrollment.service.ts):
   - Service layer gọi `GET /api/enrollments/my` qua `apiClient`.
5. [`docs/progress/F6_2_COURSE_DETAIL_API_INTEGRATION_REPORT.md`](file:///d:/e-learning/docs/progress/F6_2_COURSE_DETAIL_API_INTEGRATION_REPORT.md):
   - Báo cáo tiến độ nghiệm thu Phase F6.2.

### Files Sửa Đổi:
1. [`src/types/course.ts`](file:///d:/e-learning/src/types/course.ts):
   - Bổ sung `ApiCourseChapterLesson`, `ApiCourseChapter`, `ApiCourseQA`, `ApiCourseInfo`, `ApiCourseDetail`, và `GetCourseDetailResponse`.
2. [`src/services/course.service.ts`](file:///d:/e-learning/src/services/course.service.ts):
   - Bổ sung method `getCourseBySlug(slug: string, options?: { signal?: AbortSignal })`.
3. [`src/contexts/auth-context.tsx`](file:///d:/e-learning/src/contexts/auth-context.tsx):
   - Export alias `useAuth = useAuthContext` để tương thích quy chuẩn sử dụng hook.
4. [`src/app/courses/[slug]/page.tsx`](file:///d:/e-learning/src/app/courses/%5Bslug%5D/page.tsx):
   - Tích hợp 100% dữ liệu API thật từ `courseService`, `ratingService`, `enrollmentService`.
   - Xóa bỏ hoàn toàn phụ thuộc vào `mockCourseDetailData`.
   - Xây dựng 5 trạng thái giao diện: Skeleton Loading, 404 Not Found, Error Retry, Real Data Success, và Null Data Safety.
   - Hỗ trợ phát video demo YouTube trực quan qua iframe player.

---

## 4. UI States

1. **Loading State**:
   - Khung hình Skeleton hai cột (8 cột nội dung chính + 4 cột card nổi) tương thích chuẩn xác layout thật.
   - Thể hiện skeleton cho breadcrumb, tiêu đề, mô tả, video player, learning outcomes, accordion và card thanh toán.
2. **404 Not Found State**:
   - Hiển thị khi backend trả về mã `404 Course not found`.
   - Biểu tượng `search_off` lớn, thông báo định danh slug không tồn tại, kèm 2 nút điều hướng an toàn: "Khám phá danh sách khóa học" (`/courses`) và "Về trang chủ" (`/`).
3. **Error State**:
   - Bắt các lỗi mạng (network drop) hoặc lỗi HTTP 500 từ server.
   - Biểu tượng `cloud_off`, hiển thị nguyên nhân lỗi kèm nút "Thử lại" gọi lại request mà không cần reload toàn bộ trang.
4. **Success State**:
   - Hiển thị đầy đủ thông tin khóa học thực tế: Tiêu đề, danh mục, cấp độ, thông tin tác giả, video preview, danh sách "Bạn sẽ học được gì", kỹ thuật công nghệ, giáo trình chương học accordion, đánh giá học viên và card học phí.
5. **Optional / Null Data Handling**:
   - Nếu `course.chapters` trống $\rightarrow$ Hiển thị thông báo "Giáo trình khóa học đang được giảng viên cập nhật".
   - Nếu `info.benefits` hoặc `info.techniques` rỗng $\rightarrow$ Tự động ẩn section mượt mà, không để lại khoảng trắng vỡ layout.
   - Nếu `ratings.ratings` rỗng $\rightarrow$ Hiển thị thông báo "Khóa học chưa có đánh giá nào từ học viên. Hãy là người đầu tiên tham gia!".

---

## 5. Enrollment and Access

* **Trạng thái đã xác minh từ API**:
  - Khi chưa đăng nhập: Sticky card hiển thị "Mua khóa học ngay" (với khóa học có phí) hoặc "Đăng ký học miễn phí" (với khóa học 0đ). Các bài học không có cờ `isDemo` hiển thị biểu tượng `lock`.
  - Khi đã đăng nhập và đã ghi danh (`isEnrolled === true` từ `GET /api/enrollments/my`):
    - Xuất hiện badge xanh "Đã ghi danh học".
    - Nút CTA chuyển sang "Vào học ngay" (dẫn đến `/learn/:slug`).
    - Các bài học trong giáo trình chuyển sang trạng thái mở khóa với biểu tượng `play_circle` / `smart_display`.
  - Khi người dùng là tác giả của khóa học (`isAuthor === true`):
    - Xuất hiện badge "Khóa học do bạn giảng dạy".
    - Nút CTA cho phép "Vào học ngay".
* **Trạng thái chưa tích hợp trong phase này**:
  - Không triển khai luồng thanh toán Checkout / Payment Gateway hay Order Creation trong phase F6.2 (tuân thủ nguyên tắc giới hạn scope của phase).

---

## 6. Validation

| Kiểm tra | Lệnh | Kết quả | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Type Check** | `npx.cmd tsc --noEmit` | **PASS (Exit code 0)** | 0 lỗi TypeScript strict |
| **Lint** | `npm.cmd run lint` | **PASS (Exit code 0)** | 0 lỗi ESLint; 29 warnings `<img>` tồn tại từ trước |
| **Production Build** | `npm.cmd run build` | **PASS (Exit code 0)** | Route `/courses/[slug]` build động thành công |
| **Browser Testing** | Browser Subagent | **PASS** | Xác minh trực tiếp trên `http://localhost:3000` |

### Kết Quả Browser Testing Thực Tế (Browser Subagent):
1. **Khóa học tồn tại hợp lệ** (`/courses/nhan-dang-vat-the-thoi-gian-thuc-yolov8-yolov10`):
   - Tiêu đề: `"Nhận Dạng Vật Thể Thời Gian Thực Với YOLOv8 và YOLOv10 Chuyên Sâu"` tải chính xác từ API.
   - Giá: `499.000 đ` (giá gốc `699.000 đ`, giảm `29%`).
   - Giảng viên: `new_username123`, `392 học viên`, `7,844 lượt xem`.
   - Quyền lợi học tập: 4 gạch đầu dòng từ trường `benefits` của API.
   - Screenshot minh chứng: `course_detail_top_1791547277673.png`.
2. **Khóa học không tồn tại** (`/courses/slug-khong-ton-tai-404`):
   - Hiển thị hộp thông báo 404 chuẩn: `"Không tìm thấy khóa học"`, `"Khóa học với định danh slug-khong-ton-tai-404 không tồn tại hoặc đã được gỡ bỏ khỏi hệ thống TMDEMY."`.
   - Screenshot minh chứng: `course_404_state_1791547369361.png`.
3. **Khóa học có giáo trình đầy đủ** (`/courses/trien-khai-mo-hinh-ai-nvidia-triton-inference-server`):
   - Tóm tắt giáo trình: `2 chương • 9 bài học • Tổng thời lượng 3 giờ`.
   - Hiển thị đầy đủ 2 chương: Chương 1 (4 bài học) và Chương 2 (5 bài học), thời lượng từng bài, nhãn "Xem thử" và icon khóa.
   - Screenshot minh chứng: `triton_course_chapters_1791547419885.png`.
4. **Video ghi hình toàn bộ phiên kiểm thử trình duyệt**:  
   `file:///C:/Users/MINH/.gemini/antigravity-ide/brain/48483f18-e5d3-43c9-88a9-5691dd074a25/course_detail_test_1791547209447.webp`

---

## 7. Execution Trace

* **Workflow Used**: `.agents/workflows/feature-development.md`
* **Skills Used**:
  - `api-integration` ([`.agents/skills/api-integration/SKILL.md`](file:///d:/e-learning/.agents/skills/api-integration/SKILL.md)): Khảo sát contract trong `api/COURSE_API.md`, `api/RATING_API.md`, `api/ENROLLMENT_API.md`, định nghĩa types trong `src/types/`, xây dựng service layer và tích hợp API client tập trung.
  - `page-implementation` ([`.agents/skills/page-implementation/SKILL.md`](file:///d:/e-learning/.agents/skills/page-implementation/SKILL.md)): Xây dựng cấu trúc Client Component cho dynamic route `/courses/[slug]`, xử lý unwrapping params, layout 2 cột responsive và bảo toàn giao diện Stitch.
  - `frontend-review` ([`.agents/skills/frontend-review/SKILL.md`](file:///d:/e-learning/.agents/skills/frontend-review/SKILL.md)): Rà soát toàn bộ các quy chuẩn React 19 compiler, xóa bỏ các manual memoization không cần thiết, kiểm tra độ tương phản Dark/Light mode và validation gate.
* **Workflow Gates**:
  - **Context Gate**: PASS. Đã đọc kỹ `AGENTS.md`, các rules, `F6_1_COURSE_LISTING_INTEGRATION_REPORT.md` và `F6_1_PATCH_COURSE_SEARCH_UI_REPORT.md` trước khi sửa mã nguồn.
  - **Scope Gate**: PASS. Giới hạn nghiêm ngặt trong phạm vi Course Detail API Integration. Không can thiệp sang checkout, payment, classroom hay các trang khác.
  - **API / Backend Boundary Gate**: PASS. Không sửa bất kỳ file nào trong `d:/e-learning_server`. Không tạo mock API.
  - **Dependency Gate**: PASS. Không cài đặt thêm bất kỳ package nào mới vào `package.json`.
  - **Validation Gate**: PASS. `tsc`, `lint`, và `build` đều hoàn thành với mã thoát 0. Kiểm tra thực tế bằng browser subagent thành công 100%.

---

## DỪNG CHỜ REVIEW

Theo đúng chỉ dẫn của tài liệu dự án và yêu cầu đề bài: Toàn bộ công việc của **PHASE F6.2 — COURSE DETAIL API INTEGRATION** đã hoàn thành và được xác minh kỹ lưỡng. Hệ thống **DỪNG LẠI TẠI ĐÂY**, không tự ý chuyển sang phase tiếp theo và chờ phản hồi từ người dùng.
