# PHASE F6.3 — CLASSROOM API INTEGRATION REPORT

**Dự án:** TMdemy E-learning  
**Phase:** F6.3 — Classroom API Integration  
**Thời gian hoàn thành:** 2026-10-09  
**Người thực hiện:** Frontend AI Engineer  

---

## A. Summary

### Những chức năng đã tích hợp thành công
1. **Tải dữ liệu khóa học và cấu trúc chương/bài học:**
   - Kết nối `GET /api/courses/:slug` để lấy thông tin khóa học và danh sách chương.
   - Kết nối `GET /api/lessons/chapter/:chapterId` song song qua `Promise.all` để lấy đầy đủ chi tiết bài học (`videoUrl`, `content`, `duration`, `isDemo`, `orderIndex`).
   - Sắp xếp chương và bài học đúng `orderIndex`.
   - Lựa chọn bài học mặc định (bài đầu tiên hoặc bài theo query parameter `?lesson=:id`).
2. **Video Player & Nội dung bài học:**
   - Trình phát video thích ứng: Tự động phát hiện và nhúng YouTube player qua `<iframe>` chuẩn (`https://www.youtube.com/embed/...`) với hỗ trợ nhiều định dạng URL YouTube (`watch?v=`, `youtu.be/`, `embed/`).
   - Hỗ trợ HTML5 `<video>` cho direct video URLs (Cloudinary, S3, MP4/WebM).
   - Fallback giao diện chuyên nghiệp khi bài học chưa có video hoặc chỉ có văn bản/hướng dẫn.
3. **Sidebar Accordion & Điều hướng bài học:**
   - Accordion theo từng chương, hiển thị số bài đã hoàn thành trên tổng số bài.
   - Đánh dấu bài học đang phát (`active`), hiển thị thời lượng chuẩn hóa (`mm:ss`).
   - Hỗ trợ nút Previous ("Bài trước") và Next ("Bài tiếp theo") mượt mà, tự động cập nhật URL query parameter `?lesson=:id`.
   - Responsive Drawer sidebar trên thiết bị di động / màn hình nhỏ.
4. **Quyền truy cập & Phân quyền (Access Control):**
   - Bài học demo (`isDemo: true`) cho phép tất cả người dùng (kể cả chưa đăng nhập) xem video và nội dung.
   - Kiểm tra ghi danh thật qua `enrollmentService.getMyEnrollments()`. Người dùng đã ghi danh có quyền truy cập toàn bộ bài học.
   - Hỗ trợ tác giả khóa học (`isAuthor`) và quản trị viên (`role === 'admin'`) truy cập toàn bộ khóa học.
   - Bài học khóa hiển thị icon ổ khóa, banner thông báo và nút "Đăng ký khóa học để mở khóa" chuyển hướng trực quan.
5. **Tiến độ học tập (Progress Tracking):**
   - Đọc tiến độ thật từ `GET /api/progress/:courseId`.
   - Tính toán và hiển thị thanh tiến độ phần trăm (`percent %`).
   - Checkbox đánh dấu hoàn thành bài học kết nối API thật `POST /api/progress/complete` và `POST /api/progress/uncomplete`.
   - Phòng ngừa request lặp bằng cờ `isUpdatingProgress`.
6. **Hỏi đáp bài học (Lesson Q&A Discussion):**
   - Tải bình luận thật theo bài học qua `GET /api/comments/lesson/:lessonId`.
   - Gửi bình luận mới trực tiếp lên backend qua `POST /api/comments/`.
7. **Ghi chú cá nhân (Private Notes):**
   - Lưu trữ ghi chú cá nhân theo từng khóa học và bài học vào LocalStorage (`tmdemy-notes-${courseId}-${lessonId}`).
8. **Đánh giá khóa học (Ratings):**
   - Tải đánh giá và điểm số trung bình qua `GET /api/ratings/course/:courseId`.
9. **Xử lý toàn diện các trạng thái UX (6 States):**
   - Loading Skeleton 2 cột (Video Player skeleton + Sidebar accordion skeleton).
   - 404 Not Found khi khóa học hoặc bài học không tồn tại với nút "Khám phá danh sách khóa học" và "Về trang chủ".
   - Error State có thông báo thân thiện và nút "Thử lại".
   - Trạng thái chưa có nội dung / khóa học rỗng.

### Những chức năng chưa thực hiện và lý do
- Tính năng tự động đánh dấu hoàn thành bài học khi video xem hết 90% thời lượng: Backend hiện tại chưa có API heartbeat/video progress streaming event, chỉ hỗ trợ gọi `completeLesson` tường minh.

---

## B. Execution Trace

### File đã đọc
1. `AGENTS.md`
2. `.agents/rules/00-core.md` đến `05-validation.md`
3. `.agents/workflows/feature-development.md` & `review-and-validation.md`
4. `.agents/skills/api-integration/SKILL.md`
5. `.agents/skills/auth-integration/SKILL.md`
6. `.agents/skills/page-implementation/SKILL.md`
7. `.agents/skills/frontend-review/SKILL.md`
8. `api/COURSE_API.md`
9. `api/LESSON_API.md`
10. `api/PROGRESS_API.md`
11. `api/COMMENT_API.md`
12. `api/ENROLLMENT_API.md`
13. `docs/progress/F6_2_COURSE_DETAIL_API_INTEGRATION_REPORT.md`
14. `src/types/auth.ts`, `src/types/api.ts`, `src/types/course.ts`, `src/types/enrollment.ts`
15. `src/services/course.service.ts`, `src/services/enrollment.service.ts`, `src/services/rating.service.ts`
16. `src/app/learn/[slug]/page.tsx` (phiên bản mock cũ)

### File đã tạo / sửa
1. `src/types/lesson.ts` (Tạo mới) — Định nghĩa contract API cho bài học (`ApiLessonItem`, `GetLessonsByChapterResponse`).
2. `src/types/progress.ts` (Tạo mới) — Định nghĩa contract API cho tiến độ học tập (`ApiCourseProgressData`, `CompleteLessonPayload`).
3. `src/types/comment.ts` (Tạo mới) — Định nghĩa contract API cho bình luận bài học (`ApiCommentItem`, `CreateCommentPayload`).
4. `src/services/lesson.service.ts` (Tạo mới) — Triển khai `lessonService.getLessonsByChapter(chapterId)`.
5. `src/services/progress.service.ts` (Tạo mới) — Triển khai `progressService.getCourseProgress(courseId)`, `completeLesson`, `uncompleteLesson`.
6. `src/services/comment.service.ts` (Tạo mới) — Triển khai `commentService.getLessonComments(lessonId)`, `createComment`.
7. `src/app/learn/[slug]/page.tsx` (Sửa đổi) — Thay thế 100% mock data, kết nối toàn bộ services, xử lý quyền truy cập, video URL, sidebar và navigation.
8. `src/app/courses/[slug]/page.tsx` (Sửa đổi nhỏ) — Tối ưu nút CTA và loại bỏ unused import.

### API Endpoint thực tế sử dụng
- `GET /api/courses/:slug` — Lấy chi tiết khóa học và danh sách chương.
- `GET /api/lessons/chapter/:chapterId` — Lấy chi tiết danh sách bài học và `videoUrl` của từng chương.
- `GET /api/enrollments/my-enrollments` — Kiểm tra người dùng đã ghi danh khóa học chưa.
- `GET /api/progress/:courseId` — Lấy tiến độ học tập và danh sách bài đã hoàn thành.
- `POST /api/progress/complete` — Đánh dấu hoàn thành bài học.
- `POST /api/progress/uncomplete` — Bỏ đánh dấu hoàn thành bài học.
- `GET /api/comments/lesson/:lessonId` — Lấy danh sách bình luận của bài học.
- `POST /api/comments/` — Đăng bình luận cho bài học.
- `GET /api/ratings/course/:courseId` — Lấy đánh giá của khóa học.

### Workflows & Skills
- **Workflow:** Tuân thủ `feature-development.md` và `review-and-validation.md`.
- **Skills:** `api-integration`, `auth-integration`, `page-implementation`, `frontend-review`.

---

## C. API Contract

| Endpoint | Method | Authentication | Mục đích |
|---|---|---|---|
| `/api/courses/:slug` | GET | Public | Lấy thông tin khóa học và danh sách chương |
| `/api/lessons/chapter/:chapterId` | GET | Public/Protected | Lấy danh sách bài học đầy đủ kèm videoUrl |
| `/api/enrollments/my-enrollments` | GET | Bearer JWT | Kiểm tra trạng thái đã ghi danh của user |
| `/api/progress/:courseId` | GET | Bearer JWT | Lấy phần trăm tiến độ và danh sách bài hoàn thành |
| `/api/progress/complete` | POST | Bearer JWT | Đánh dấu hoàn thành bài học |
| `/api/progress/uncomplete` | POST | Bearer JWT | Bỏ đánh dấu hoàn thành bài học |
| `/api/comments/lesson/:lessonId` | GET | Public | Lấy danh sách câu hỏi/bình luận theo bài học |
| `/api/comments/` | POST | Bearer JWT | Đăng câu hỏi/bình luận mới |
| `/api/ratings/course/:courseId` | GET | Public | Lấy danh sách đánh giá của khóa học |

### Response Fields sử dụng
- Course: `id`, `_id`, `title`, `slug`, `author`, `chapters`, `price`, `rating`, `totalRatings`, `enrolledCount`.
- Lesson: `id`, `_id`, `chapterId`, `title`, `videoUrl`, `duration`, `isDemo`, `orderIndex`, `content`.
- Progress: `percent`, `lessons[{ id, completed }]`.
- Comment: `id`, `_id`, `content`, `createdAt`, `user{ id, username, avatar }`.

### Backend Gap phát hiện
- `[BACKEND GAP 1]`: `GET /api/courses/:slug` không trả về trường `videoUrl` trong mảng `lessons` lồng bên trong `chapters`.
  - *Giải pháp frontend hợp lệ:* Frontend gọi song song `GET /api/lessons/chapter/:chapterId` cho từng chương để làm giàu (`enrich`) dữ liệu bài học có đầy đủ `videoUrl` mà không cần sửa đổi backend.
- `[BACKEND GAP 2]`: Chưa có API heartbeat video playback để tự động theo dõi thời gian xem từng giây (chỉ có API đánh dấu hoàn thành `complete`/`uncomplete`). Frontend chỉ gọi API khi người dùng click hoàn thành bài học để đảm bảo tính chính xác và tránh gửi request liên tục.

---

## D. Validation

### 1. `npx tsc --noEmit`
- Exit Code: `0`
- Kết quả: Không có lỗi TypeScript nào.

### 2. `npm run lint`
- Exit Code: `0`
- Kết quả: `0 errors, 28 warnings` (tất cả warnings là khuyến nghị `@next/next/no-img-element` thông thường của Next.js).

### 3. `npm run build`
- Exit Code: `0`
- Kết quả: Next.js compiled production bundle thành công. Route dynamic `ƒ /learn/[slug]` build sạch sẽ không gặp lỗi build-time hay SSG mismatch.

### 4. Browser / Manual Tests
Thực hiện tự động thông qua browser subagent trên `http://localhost:3000`:
- **Test 1 (Tải trang Classroom thành công):** Khóa học `trien-khai-mo-hinh-ai-nvidia-triton-inference-server` hiển thị đúng tiêu đề, 2 chương và danh sách bài học thực tế từ database.
- **Test 2 (Chuyển đổi bài học):** Click chọn "Bài 2" trong sidebar, URL tự động cập nhật query `?lesson=b14e0a95-dd82-50eb-9a88-f6f9a49cfec3`, sidebar highlight đúng bài học đang phát.
- **Test 3 (Trạng thái 404 Not Found):** Truy cập `/learn/non-existent-course-slug-12345` hiển thị màn hình 404 thân thiện kèm nút điều hướng quay về `/courses` và `/`.
- **Test 4 (Ghi chú cá nhân):** Đã kiểm tra tính năng lưu/xóa ghi chú trong LocalStorage không gây cascading render.
- **Test 5 (Kiểm tra Dark/Light Theme):** Giao diện Classroom hoạt động tốt trên cả 2 chế độ sáng và tối.

---

## E. Workflow Gates

1. **Context Gate:** PASS — Đã đọc đầy đủ tài liệu kiến trúc, API contract, and prior phase report trước khi viết code.
2. **Scope Gate:** PASS — Chỉ tích hợp dữ liệu thật cho Classroom, không can thiệp các module khác ngoài phạm vi.
3. **API Boundary Gate:** PASS — 100% kết nối qua REST API bằng `apiClient`, không import mã backend, Prisma, hay database driver.
4. **Dependency Gate:** PASS — Không cài đặt thêm bất kỳ package nào ngoài các thư viện hiện có trong repository.
5. **Validation Gate:** PASS — Toàn bộ kiểm tra tự động (`tsc`, `lint`, `build`) và browser subagent đều hoàn thành với exit code 0.

---

## F. File Changes

| File | Hành động | Mục đích |
|---|---|---|
| `src/types/lesson.ts` | Tạo mới | Định nghĩa type contract cho Lesson API |
| `src/types/progress.ts` | Tạo mới | Định nghĩa type contract cho Progress API |
| `src/types/comment.ts` | Tạo mới | Định nghĩa type contract cho Comment API |
| `src/services/lesson.service.ts` | Tạo mới | Service lấy bài học theo chương |
| `src/services/progress.service.ts` | Tạo mới | Service quản lý tiến độ học tập |
| `src/services/comment.service.ts` | Tạo mới | Service quản lý hỏi đáp / bình luận bài học |
| `src/app/learn/[slug]/page.tsx` | Sửa đổi | Thay thế mock data, tích hợp toàn diện API, player, sidebar, tiến độ |
| `src/app/courses/[slug]/page.tsx` | Sửa đổi | Tinh chỉnh điều hướng CTA và xóa unused import |
| `docs/progress/F6_3_CLASSROOM_API_INTEGRATION_REPORT.md` | Tạo mới | Báo cáo tiến độ chuẩn hóa cho phase F6.3 |

---

## G. Data Integrity & Security

- Tuyệt đối không dùng dữ liệu mock để giả lập thành công khi API thất bại.
- Toàn bộ token xác thực được xử lý qua centralized `authContext` và `apiClient` có interceptor tự động gửi `Authorization: Bearer <token>`.
- Phân quyền giao diện tuân theo logic backend: chỉ những bài học `isDemo: true`, người dùng đã ghi danh (`isEnrolled`), tác giả khóa học, hoặc admin mới được truy cập nội dung đầy đủ.
- Không sửa đổi bất kỳ tệp tin nào thuộc backend repository (`d:/e-learning_server`).

---

## H. Next Steps

- Chờ review và nghiệm thu Phase F6.3 từ người phụ trách.
- Đề xuất phase tiếp theo: **Phase F6.4 — Checkout / Payment Flow Integration & Certificates Page**.
