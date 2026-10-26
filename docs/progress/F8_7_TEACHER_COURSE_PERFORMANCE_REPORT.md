# F8.7 — Teacher Course Performance & Analytics Report

## 1. Status

- **Phase**: F8.7 — Teacher Course Performance & Analytics
- **Status**: **COMPLETED**
- **Date**: 18/10/2026
- **Repository Boundary**: TMdemy Frontend (`d:\e-learning`) — Frontend only. Không sửa đổi hoặc can thiệp backend.

---

## 2. Scope Completed

Theo đúng đặc tả trong F8.7, toàn bộ các chức năng thuộc phạm vi đã được hoàn thiện 100%:

1. **Course Performance Route**: Triển khai route `/teacher/courses/[id]/performance` hoạt động chuẩn trên Next.js App Router và tích hợp trong `TeacherShell`.
2. **API Discovery & Integration**: Xác minh và tích hợp thành công endpoint `GET /api/teacher/statistics/course-performance/:courseId` (dữ liệu thật từ backend, không mock, không tự suy diễn số liệu thiếu).
3. **Course Performance Overview Header**:
   - Hiển thị thông tin tổng quan: Thumbnail, Tên khóa học, Badge trạng thái (Approved/Pending/Rejected), Danh mục, Cấp độ, Số lượt xem, Giá bán và Tổng doanh thu.
   - Quick navigation: Nút chuyển nhanh tới **Học viên & Ghi danh** (`/students`) và **Giáo trình** (`/curriculum`).
   - Nút **Làm mới** (Refresh) tải lại dữ liệu tức thì.
   - **Course Switcher Dropdown**: Chuyển đổi báo cáo giữa các khóa học của giảng viên ngay trên header mà không cần quay lại danh sách.
4. **KPI Overview Cards (6 Metrics)**:
   - Tổng học viên (Total Enrollments / Students) cùng số học viên đang học.
   - Tiến độ học tập trung bình (Average Learning Progress %) với sub-metric tỷ lệ hoàn thành.
   - Tỷ lệ hoàn thành khóa học (Completion Rate %) với số lượng học viên hoàn thành thực tế.
   - Tổng doanh thu khóa học (Total Course Revenue) và số đơn hàng thành công.
   - Đánh giá trung bình (Average Rating / 5.0) và tổng số lượt đánh giá.
   - Chứng chỉ đã cấp (Certificates Issued) và điểm trung bình chứng chỉ.
5. **Learning Progress & Rating Analytics**:
   - Thanh tiến độ học tập trung bình trực quan.
   - Thanh phân bố trạng thái học viên (Đang học / Đã hoàn thành / Đã hủy) kèm chú giải tỷ lệ phần trăm.
   - Tổng quan giáo trình (Số chương, tổng số bài học, tổng thời lượng bài giảng quy đổi giờ/phút).
   - Biểu đồ phân bố đánh giá 1–5 sao với màu sắc vàng/cam tiêu chuẩn, hiển thị số lượt và tỷ lệ % từng mức sao.
6. **Lesson Completion Analytics & Funnel**:
   - Bảng phân tích chi tiết từng bài học theo trình tự: Thứ tự, tên bài & chương, loại nội dung (Video/Văn bản), huy hiệu Demo và Quiz.
   - Số học viên hoàn thành và thanh tỷ lệ hoàn thành trực quan với màu sắc phản ánh mức độ (Xanh lá >= 70%, Tím 40–69%, Cam < 40%).
   - Tỷ lệ giảm trừ / rơi rớt (`dropOffFromPrevious`) từ bài học liền trước, kèm thông báo điểm dừng lớn nhất (Highest drop-off alert banner).
   - Bộ lọc tiện ích: "Chỉ xem bài < 50%" giúp giảng viên nhanh chóng định vị các bài giảng có tỷ lệ bỏ dở cao.
   - Ghi chú minh bạch dữ liệu (Transparency Note): Khẳng định chỉ số tính toán dựa trên `Progress.completed = true` trong CSDL, không phải dữ liệu continuous video playback telemetry.
7. **Quiz Performance Analytics**:
   - 4 thẻ thống kê tổng quan: Tổng bài kiểm tra, Tổng lượt nộp bài, Điểm trung bình và Tỷ lệ đạt (Pass Rate).
   - Bảng chi tiết từng bài Quiz: Tên bài kiểm tra, bài học đính kèm, số câu hỏi, điểm chuẩn đạt (Passing Grade), lượt làm bài, điểm trung bình và thanh tỷ lệ đạt kèm tỷ lệ người học vượt qua.
   - Trạng thái trống (Empty state) thân thiện khi khóa học chưa có bài kiểm tra trắc nghiệm.
8. **Cross-Navigation Integration**:
   - Thêm nút hành động **Hiệu suất & Phân tích** (`BarChart3`) trong bảng Quản lý khóa học (`/teacher/courses`).
   - Thêm nút chuyển **Hiệu suất** trong Header trang Học viên (`/teacher/courses/[id]/students`).
   - Thêm nút chuyển **Hiệu suất** trong Header trang Soạn giáo trình (`/teacher/courses/[id]/curriculum`).

---

## 3. API Discovery Results

- **Endpoint**: `GET /api/teacher/statistics/course-performance/:courseId`
- **Authentication**: Bắt buộc Bearer JWT Access Token.
- **Role**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.
- **Backend Ownership Validation**: Backend tự động kiểm tra `course.authorId === req.user.userId`. Nếu không phải chủ sở hữu, trả về HTTP `403 Forbidden`.
- **Response Structure Verified**:
  - `course`: `{ id, title, slug, image, price, status, level, view, category: { name } }`
  - `overview.revenue`: `{ totalRevenue, completedOrders, totalDiscount, averageOrderValue, currency }`
  - `overview.students`: `{ totalStudents, activeStudents, completedStudents, canceledStudents, completionRate, averageProgress }`
  - `overview.engagement`: `{ averageRating, totalReviews, ratingDistribution, certificatesIssued, certificateRate, averageCertificateGrade }`
  - `curriculum`: `{ totalChapters, totalLessons, totalDuration }`
  - `quizzes`: `{ summary: { totalQuizzes, totalSubmissions, averageScore, passRate }, items: [...] }`
  - `lessonsFunnel`: `[{ lessonId, lessonTitle, order, duration, type, isDemo, chapter, hasQuiz, completedStudents, completionRate, dropOffFromPrevious }]`

---

## 4. UI/UX & Design Alignment

Tuân thủ chặt chẽ design system **Modern Academic Violet** của Stitch TMdemy:
- **Tông màu chủ đạo**: `#7240b8`, `#a87ffb`, nền sáng `#fbf9fe` / `#ffffff`, nền tối `#1d1926` / `#252030`, viền `#eceaf3` / `#352e43`.
- **Đánh giá sao**: Sử dụng tông vàng/cam ấm (`fill-amber-400 text-amber-400`) nhất quán với toàn bộ hệ thống.
- **Tiến độ**: Các dải gradient mượt mà và thanh phân khúc rõ ràng.
- **Đầy đủ 6 trạng thái UX**: Loading skeleton mượt mà, Success, Empty state với minh họa rõ ràng, Error với nút Retry, 403 Forbidden và 404 Not Found.

---

## 5. Files Created

1. `src/types/teacher-statistics.ts` (Mở rộng thêm các interfaces Course Performance DTO):
   - `TeacherCoursePerformanceCourse`
   - `TeacherCoursePerformanceRevenue`
   - `TeacherCoursePerformanceStudents`
   - `TeacherCoursePerformanceEngagement`
   - `TeacherCoursePerformanceOverview`
   - `TeacherCoursePerformanceCurriculum`
   - `TeacherCoursePerformanceQuizItem`
   - `TeacherCoursePerformanceQuizzesSummary`
   - `TeacherCoursePerformanceQuizzes`
   - `TeacherCoursePerformanceLessonFunnelItem`
   - `TeacherCoursePerformanceData`
   - `TeacherCoursePerformanceResponse`
2. `src/components/teacher/performance/performance-header.tsx`: Header tổng quan khóa học, nút quay lại, quick links, badge doanh thu và Course Switcher Dropdown.
3. `src/components/teacher/performance/performance-kpi-cards.tsx`: 6 thẻ KPI tổng quan (Học viên, Tiến độ, Tỷ lệ hoàn thành, Doanh thu, Rating, Chứng chỉ).
4. `src/components/teacher/performance/performance-learning-analytics.tsx`: Phân tích tiến độ học tập, trạng thái học viên, tổng quan giáo trình và phân bố rating 1–5 sao.
5. `src/components/teacher/performance/performance-lesson-funnel.tsx`: Phễu hoàn thành bài học, độ giảm từ bài trước, lọc bài < 50%, banner cảnh báo điểm rơi rớt và ghi chú minh bạch dữ liệu.
6. `src/components/teacher/performance/performance-quiz-analytics.tsx`: Thống kê tổng quan và bảng kết quả kiểm tra quiz từng bài.
7. `src/app/teacher/courses/[id]/performance/page.tsx`: Trang Route chính điều phối fetch API, quản lý 6 trạng thái UX, phân quyền 403, 404 và làm mới dữ liệu.

---

## 6. Files Updated

1. `src/services/teacher-statistics.service.ts`: Bổ sung phương thức `getCoursePerformance(courseId: string, options?: { signal?: AbortSignal })`.
2. `src/app/teacher/courses/page.tsx`: Thêm nút hành động biểu tượng `BarChart3` liên kết tới trang Hiệu suất của khóa học trong bảng danh sách.
3. `src/components/teacher/students/students-header.tsx`: Thêm nút "Hiệu suất" dẫn tới `/teacher/courses/[id]/performance`.
4. `src/components/teacher/curriculum/curriculum-header.tsx`: Thêm nút "Hiệu suất" dẫn tới `/teacher/courses/[id]/performance`.

---

## 7. Backend Gaps

Không có Backend Gap cản trở. Backend đã cung cấp đầy đủ dữ liệu thống kê từ endpoint `GET /api/teacher/statistics/course-performance/:courseId` đúng theo Source of Truth `api/COURSE_PERFORMANCE_API.md`.

*Lưu ý minh bạch dữ liệu*: Dữ liệu tỷ lệ hoàn thành bài học và độ rơi rớt được tính theo `Progress.completed = true` trong CSDL, không phải dữ liệu xem video liên tục (player telemetry). Frontend đã đặt ghi chú chú thích rõ ràng cho giảng viên.

---

## 8. Dependency Changes

**KHÔNG có dependency mới nào được cài đặt.**
Tất cả biểu đồ cột, thanh phân bố tiến độ, thanh đánh giá sao và phễu hoàn thành đều được hiện thực bằng SVG và CSS/Tailwind thuần túy, đảm bảo hiệu năng tối đa và không làm tăng bundle size.

---

## 9. Validation Results

1. **TypeScript Check**:
   ```bash
   cmd /c npx tsc --noEmit
   # Exit code: 0 (Zero errors)
   ```
2. **ESLint**:
   ```bash
   cmd /c npm run lint
   # Exit code: 0 (0 errors)
   ```
3. **Next.js Dev Server**: Chạy ổn định trên `http://localhost:3000`.

---

## 10. Browser Verification

Đã xác minh toàn diện qua công cụ tự động `browser_subagent`:
1. **Dữ liệu thật**: Mở khóa học `"Làm Chủ Next.js 15: Kiến Trúc App Router và Server Actions Chuyên Sâu"` (`12bee1d8-7bf7-56dc-b960-16bd865e7942`):
   - Header hiển thị đầy đủ thông tin: Danh mục "Lập trình Web", cấp độ "Nâng cao", 1.849 lượt xem, giá 799.000 đ, tổng doanh thu 13.583.000 đ.
   - 6 KPI hiển thị số liệu thực tế: 17 học viên (13 đang học), tiến độ 27%, hoàn thành 24% (4 học viên hoàn thành), doanh thu 13.583.000 đ (17 đơn hàng), rating 4.9 sao (8 đánh giá), 4 chứng chỉ đã cấp.
   - Phân tích đánh giá: 7 đánh giá 5 sao (88%), 1 đánh giá 4 sao (13%).
   - Phễu bài giảng: Hiển thị 9 bài học theo thứ tự, các badge Demo/Quiz, thanh tỷ lệ hoàn thành từ 100% giảm dần đến 24%, và cảnh báo điểm dừng tại bài số 5 ("Parallel Routes & Intercepting Routes" - giảm 24%).
   - Kiểm tra quiz: Hiển thị 2 bài quiz với điểm TB 79.5/100 và tỷ lệ đạt 75%.
2. **Bộ lọc bài học**: Click nút "Chỉ xem bài < 50%" lọc chính xác các bài có tỷ lệ hoàn thành thấp.
3. **Điều hướng liên kết**:
   - Click nút `BarChart3` trong danh sách khóa học `/teacher/courses` chuyển mượt mà tới trang hiệu suất.
   - Chuyển tiếp giữa Giáo trình, Học viên và Hiệu suất diễn ra tức thì.
4. **Xử lý lỗi**:
   - Truy cập UUID không tồn tại (`/teacher/courses/00000000-0000-0000-0000-000000000000/performance`): Hiển thị màn hình lỗi với thông báo chi tiết và nút "Thử lại", "Về danh sách".
5. **Giao diện Light / Dark Mode & Responsive**: Bố cục grid tự động co dãn chuẩn từ 1 cột (mobile) tới 6 cột (desktop).

---

## 11. Execution Trace

### Workflow Used
- `feature-development.md` — **USED**
  - Thực hiện tuần tự 7 giai đoạn: 1. Read context → 2. API Discovery → 3. Design Tokens → 4. Implementation → 5. Cross-nav → 6. Automated Validation (tsc, lint) → 7. Browser verification & report.

### Skills Used
- `page-implementation` — **USED**: Xây dựng trang Next.js App Router tại `/teacher/courses/[id]/performance/page.tsx` chuẩn Client Component, hỗ trợ AbortController và xử lý 6 trạng thái UX.
- `api-integration` — **USED**: Kết nối service `teacherStatisticsService.getCoursePerformance` với contract trong `api/COURSE_PERFORMANCE_API.md`, mapping đầy đủ các type và error handling.
- `stitch-ui` — **USED**: Áp dụng hệ thống màu Modern Academic Violet, tái sử dụng `CourseStatusBadge`, thiết kế các KPI cards, thanh phân bổ sao và funnel table.
- `frontend-review` — **USED**: Kiểm tra code quality, clean up các unused imports, đảm bảo tuân thủ quy tắc React 19 không gọi setState đồng bộ trong effect body.

---

## 12. Workflow Gates

- **Context Gate**: **PASS** (Đã đọc kĩ context, API doc `COURSE_PERFORMANCE_API.md` và mã nguồn hiện tại).
- **Scope Gate**: **PASS** (Chỉ tập trung Course Performance & Analytics, không đụng vào Order Management F8.8).
- **API/Backend Boundary Gate**: **PASS** (100% frontend changes, không chạm vào repo `d:\e-learning_server`).
- **Dependency Gate**: **PASS** (Không cài đặt thêm npm package nào).
- **Validation Gate**: **PASS** (`tsc --noEmit` exit 0, `eslint` exit 0, browser subagent test PASS).

---

## 13. Next Phase

- **F8.8**: Teacher Order & Revenue Management (Quản lý đơn hàng, chi tiết đơn mua khóa học, hoàn tiền và quyết toán doanh thu).
