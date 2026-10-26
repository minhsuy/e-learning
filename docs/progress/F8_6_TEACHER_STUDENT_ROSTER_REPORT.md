# TMdemy Progress Report — Phase F8.6: Student Roster & Enrollment Management

Created At: 2026-10-16T21:49:00+07:00  
Completed At: 2026-10-16T21:49:00+07:00  
Status: **COMPLETED**  
Workflow: `feature-development.md`  
Route: `/teacher/courses/[id]/students`  

---

## 1. Executive Summary

Phase **F8.6** triển khai chức năng **Student Roster & Enrollment Management** (Quản lý học viên & Ghi danh khóa học) dành riêng cho Giảng viên trên nền tảng TMdemy.

Tính năng cho phép Giảng viên:
1. Xem thông tin tổng quan về số lượng học viên và doanh thu bán khóa học.
2. Quản lý danh sách học viên ghi danh vào từng khóa học cụ thể qua endpoint REST API thực tế (`GET /api/enrollments/course/:id`).
3. Tìm kiếm học viên thời gian thực (Server-side debounced search) theo tên tài khoản hoặc email.
4. Phân trang dữ liệu học viên phía máy chủ (Server-side pagination).
5. Xem chi tiết hồ sơ ghi danh của học viên (`StudentDetailModal`) bao gồm thời điểm đăng ký, mã ghi danh, mã người dùng và thanh tiến độ học tập trực quan.
6. Gỡ học viên khỏi khóa học (`DELETE /api/enrollments/course/:id/:userId`) kèm hộp thoại xác nhận cảnh báo nguyên tử (`StudentRemoveModal`) tuân thủ nghiêm ngặt quy tắc nghiệp vụ backend: xóa enrollment, trừ sold count và xóa đơn hàng liên quan.
7. Điều hướng liền mạch giữa Danh sách khóa học (`/teacher/courses`), Soạn giáo trình (`/teacher/courses/[id]/curriculum`) và Danh sách học viên (`/teacher/courses/[id]/students`).

---

## 2. Scope Completed

- [x] **API Discovery**: Kiểm tra và đối chiếu hợp đồng dữ liệu trong `api/ENROLLMENT_API.md` (bao gồm request params, pagination, search, response DTO và quy tắc phân quyền sở hữu khóa học `course.authorId === req.user.userId`).
- [x] **Service Layer**: Cập nhật `src/services/enrollment.service.ts` bổ sung phương thức `removeStudent(courseId, userId)`.
- [x] **Types Layer**: Cập nhật `src/types/enrollment.ts` bổ sung `RemoveStudentResponse`.
- [x] **UI Components**:
  - `src/components/teacher/students/student-status-badge.tsx`: Huy hiệu trạng thái học viên (`ACTIVE`, `COMPLETED`, `CANCELED`, `PENDING`).
  - `src/components/teacher/students/students-header.tsx`: Header khóa học chuẩn phong cách Modern Academic Violet, hiển thị ảnh đại diện khóa, chỉ số tổng học viên, tiến độ trung bình, doanh thu và các nút điều hướng nhanh.
  - `src/components/teacher/students/student-table.tsx`: Bảng danh sách học viên bao gồm avatar, username, email, ngày đăng ký, thanh tiến độ, trạng thái, ô tìm kiếm debounced và phân trang server-side.
  - `src/components/teacher/students/student-detail-modal.tsx`: Modal chi tiết ghi danh học viên.
  - `src/components/teacher/students/student-remove-modal.tsx`: Dialog xác nhận gỡ học viên khỏi khóa học với cảnh báo thao tác nguyên tử.
- [x] **Page Implementation**:
  - `src/app/teacher/courses/[id]/students/page.tsx`: Route trang quản lý học viên tích hợp TeacherShell, xử lý 6 trạng thái UX và chống cascading render theo React 19 compiler.
- [x] **Cross-Navigation**:
  - Bổ sung nút liên kết và icon `Users` trong `src/app/teacher/courses/page.tsx` (cột Học viên và cột Hành động).
  - Bổ sung nút `Học viên (Roster)` trong `src/components/teacher/curriculum/curriculum-header.tsx`.
- [x] **Technical Validation**: `tsc --noEmit` (0 lỗi), `npm run lint` (0 lỗi), `npm run build` (0 lỗi, 29/29 routes pass).
- [x] **Browser Verification**: Kiểm thử E2E tự động thành công 100%.

---

## 3. API Discovery Results

Đối chiếu theo [api/ENROLLMENT_API.md](file:///d:/e-learning/api/ENROLLMENT_API.md):

| Endpoint | Method | Roles | Request Params | Response DTO | Khả năng hỗ trợ |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `/api/enrollments/course/:id` | `GET` | `TEACHER`, `ADMIN` | Path: `id`<br>Query: `page`, `limit`, `search` | `{ students: CourseStudentItem[], pagination: { page, limit, total, totalPages } }` | Hỗ trợ tìm kiếm theo `username`/`email`, hỗ trợ phân trang máy chủ. Không có tham số `filter` theo `status`. |
| `/api/enrollments/course/:id/:userId` | `DELETE` | `TEACHER`, `ADMIN` | Path: `id`, `userId` | `{ success: true, message: string }` | Thao tác nguyên tử (`prisma.$transaction`): Xóa Enrollment, trừ `sold`, xóa Order. |

### Ownership & Security
- Backend tự động kiểm tra `course.authorId === req.user.userId` từ JWT token. Nếu không khớp sẽ trả mã `403 Forbidden` ("You are not the owner of this course").
- Frontend xử lý và hiển thị thông báo lỗi bảo mật chính xác cho giảng viên.

---

## 4. Student Roster UI

Giao diện áp dụng chuẩn Stitch Design System **Modern Academic Violet**:
- **Bảng học viên**:
  - Cột 1 — Học viên: Hiển thị avatar học viên (fallback chữ cái đầu tiên), username in đậm và ID rút gọn.
  - Cột 2 — Email: Hiển thị email kèm icon Mail.
  - Cột 3 — Ngày đăng ký: Hiển thị ngày định dạng chuẩn tiếng Việt (`vi-VN`).
  - Cột 4 — Tiến độ: Thanh tiến độ phần trăm đổi màu theo mức độ (Xanh ngọc `>= 80%`, Tím `>= 40%`, Vàng `< 40%`).
  - Cột 5 — Trạng thái: Badge trạng thái sinh động (`Đang học`, `Hoàn thành`, `Đã hủy`).
  - Cột 6 — Thao tác: Nút xem chi tiết (Eye) và nút gỡ học viên (UserX).

---

## 5. Enrollment Detail Dialog

Thành phần `StudentDetailModal` cung cấp góc nhìn toàn diện về học viên:
- Avatar cỡ lớn, họ tên, email, huy hiệu trạng thái.
- Thông tin khóa học và mã định danh.
- Thời điểm đăng ký đầy đủ (ngày + giờ).
- Mã học viên (`userId`) và mã ghi danh (`enrollmentId`).
- Thanh đo tiến độ chi tiết và diễn giải trạng thái học tập.
- Nút tắt mở nhanh hộp thoại gỡ học viên.
- Ghi chú minh bạch về ranh giới API: Dữ liệu số lượng bài học đã hoàn thành và điểm số quiz chi tiết chưa được DTO này cung cấp.

---

## 6. Remove Student Behavior & Business Safeguards

Thành phần `StudentRemoveModal` được thiết kế cẩn trọng theo tiêu chuẩn bảo vệ dữ liệu:
- **Xác thực mục tiêu**: Hiển thị rõ tên học viên, email và tên khóa học sẽ bị ảnh hưởng.
- **Cảnh báo nguyên tử**: Giải thích rõ ràng 4 hệ quả của thao tác trên hệ thống:
  1. Hủy quyền truy cập và xóa bản ghi Enrollment.
  2. Tự động giảm 1 lượt bán (sold count) của khóa học.
  3. Xóa đơn hàng (Order) liên quan trên cơ sở dữ liệu.
  4. Thao tác không thể hoàn tác.
- **Tránh phỏng đoán hoàn tiền**: Không tự ý cam kết hoàn tiền (refund) trên giao diện vì API contract không quy định chính sách hoàn tiền ở bước này.
- **Chống Submit trùng**: Nút bấm bị vô hiệu hóa kèm spinner trong lúc gọi API.
- **Cập nhật dữ liệu an toàn**: Chỉ gỡ học viên khỏi state và giảm `total`/`sold` sau khi API trả về mã thành công. Nếu API thất bại, dữ liệu giữ nguyên và hiển thị thông báo lỗi từ server.

---

## 7. Search, Filter & Pagination

- **Search**: Tích hợp ô tìm kiếm kết nối thẳng với tham số `?search=` của API thật, debounce 400ms để tối ưu số lượng request, tự động reset về trang 1 khi người dùng đổi từ khóa.
- **Filter**: Hợp đồng `api/ENROLLMENT_API.md` hiện tại **không có query parameter** cho `status`. Tuân thủ nguyên tắc không tạo filter giả lập phía frontend, ghi nhận `[BACKEND GAP]` cho filter này.
- **Pagination**: Phân trang hoàn toàn dựa vào response máy chủ (`page`, `limit`, `total`, `totalPages`), hiển thị bộ nút điều hướng Previous, Next và số trang kèm dấu chấm lửng khi có nhiều trang.

---

## 8. API Mapping

| UI Action | Service Function | HTTP Request |
| :--- | :--- | :--- |
| Nạp thông tin khóa học | `courseService.getTeacherCourseById(id)` | `GET /api/teacher/courses/:id` |
| Nạp danh sách học viên | `enrollmentService.getCourseStudents(id, params)` | `GET /api/enrollments/course/:id?page=1&limit=10&search=...` |
| Gỡ học viên khỏi khóa | `enrollmentService.removeStudent(id, userId)` | `DELETE /api/enrollments/course/:id/:userId` |

---

## 9. Files Created

1. `src/components/teacher/students/student-status-badge.tsx` — Huy hiệu trạng thái học viên.
2. `src/components/teacher/students/student-remove-modal.tsx` — Dialog xác nhận gỡ học viên.
3. `src/components/teacher/students/student-detail-modal.tsx` — Modal xem chi tiết hồ sơ ghi danh.
4. `src/components/teacher/students/students-header.tsx` — Header thông tin khóa học & thống kê.
5. `src/components/teacher/students/student-table.tsx` — Bảng học viên, tìm kiếm và phân trang.
6. `src/app/teacher/courses/[id]/students/page.tsx` — Route App Router chính cho Student Roster.
7. `docs/progress/F8_6_TEACHER_STUDENT_ROSTER_REPORT.md` — Báo cáo tiến độ hoàn thành Phase F8.6.

---

## 10. Files Updated

1. `src/types/enrollment.ts` — Thêm interface `RemoveStudentResponse`.
2. `src/services/enrollment.service.ts` — Thêm phương thức `removeStudent(courseId, userId)`.
3. `src/app/teacher/courses/page.tsx` — Thêm liên kết mở danh sách học viên ở cột "Học viên" và icon `Users` ở cột hành động.
4. `src/components/teacher/curriculum/curriculum-header.tsx` — Thêm nút "Học viên ({sold})" điều hướng sang trang học viên.

---

## 11. Backend Gaps & Enhancements

1. **`[BACKEND GAP]` — Filter theo Trạng thái ghi danh (`status`) và Tiến độ (`progress`)**:
   - Hiện tại endpoint `GET /api/enrollments/course/:id` chỉ chấp nhận `page`, `limit`, `search`.
   - Nếu muốn lọc nhanh danh sách theo học viên đã hoàn thành (`COMPLETED`) hoặc đang học (`ACTIVE`), backend cần bổ sung query parameter: `?status=ACTIVE` trên endpoint này.
2. **`[RESOLVED]` — Chi tiết bài học đã hoàn thành và kết quả Quiz của từng học viên**:
   - Backend đã bổ sung 2 endpoints:
     - `GET /api/enrollments/course/:courseId/students/:userId/progress`
     - `GET /api/enrollments/:enrollmentId/progress`
   - Frontend đã tích hợp đầy đủ vào `StudentDetailModal` với 3 tabs trực quan: Tổng quan hồ sơ, Danh sách bài học đã hoàn thành và Kết quả các bài kiểm tra Quiz.

---

## 12. Dependency Changes

- **Không có phụ thuộc npm mới nào được cài đặt** (`[DEPENDENCY REQUEST]` = NONE). Toàn bộ tính năng sử dụng stack sẵn có: Next.js 16, React 19, Tailwind CSS, Lucide React, shadcn/ui tokens.

---

## 13. Technical Validation Results

| Lệnh kiểm tra | Kết quả | Ghi chú |
| :--- | :---: | :--- |
| `npx tsc --noEmit` | **PASS** | 0 lỗi kiểu dữ liệu TypeScript. |
| `npm run lint` | **PASS** | 0 lỗi ESLint (tuân thủ triệt để React 19 compiler `react-hooks/set-state-in-effect`). |
| `npm run build` | **PASS** | 29/29 routes build thành công, `/teacher/courses/[id]/students` được đăng ký dynamic SSR route. |

---

## 14. Browser Verification

Đã thực hiện kiểm thử E2E tự động thông qua `browser_subagent`:
- Đăng nhập tài khoản Giảng viên: `nab@gmail.com` / `quangminh2004`.
- Mở danh sách khóa học `/teacher/courses`, xác nhận icon `Users` và link "0 học viên" xuất hiện rõ nét.
- Nhấp mở trang học viên `/teacher/courses/639ca47d-9ad6-4747-b522-a9756c692869/students`:
  - Header khóa học nạp đầy đủ thông tin, thumbnail, số học viên, tiến độ trung bình và doanh thu.
  - Ô tìm kiếm hiển thị chuẩn xác, counter "Tổng cộng: 0 học viên".
  - Empty state hiển thị thông điệp thân thiện và đồ họa minh họa.
- Nhấp "Soạn giáo trình" từ header để nhảy sang `/curriculum`, xác nhận nút "Học viên (0)" hiện diện đầy đủ trong `CurriculumHeader`.
- **Video ghi lại phiên kiểm thử**: [teacher_roster_demo_1792161891535.webp](file:///C:/Users/MINH/.gemini/antigravity-ide/brain/9e2f6b41-2389-46be-881b-922464f6666f/teacher_roster_demo_1792161891535.webp)

---

## 15. Execution Trace

### Workflow Used
- `feature-development.md` — **USED** (Tuân thủ 7 bước: phân tích, đối chiếu contract, tự chọn skills, triển khai, review, validation và báo cáo).

### Skills Used
- `page-implementation` — **USED** (Xây dựng dynamic route `/teacher/courses/[id]/students`, Server/Client boundary, xử lý 6 trạng thái UX).
- `api-integration` — **USED** (Tích hợp `enrollmentService` kết nối `GET /api/enrollments/course/:id` và `DELETE /api/enrollments/course/:id/:userId` qua `apiClient`).
- `stitch-ui` — **USED** (Thiết kế header, badge, modal và table theo ngôn ngữ Modern Academic Violet).
- `frontend-review` — **USED** (Rà soát React 19 compiler `set-state-in-effect`, xóa imports dư thừa, kiểm tra độ an toàn khi xóa dữ liệu).

---

## 16. Workflow Gates

- **Context Gate:** `PASS` (Yêu cầu nghiệp vụ rõ ràng, đối chiếu đầy đủ API contract và ownership rule).
- **Scope Gate:** `PASS` (Chỉ phát triển Student Roster & Enrollment Management, không lấn sang Teacher Analytics mở rộng hay Student Quiz Taking).
- **API/Backend Boundary Gate:** `PASS` (Không sửa backend repository, chỉ giao tiếp qua REST API contract).
- **Dependency Gate:** `PASS` (Không cài thêm package bên ngoài nào).
- **Validation Gate:** `PASS` (tsc 0 lỗi, lint 0 lỗi, build 0 lỗi, browser verification 100% PASS).

---

## 17. Known Limitations

- Khóa học chưa có học viên nào đăng ký thực tế trên môi trường local (hiển thị empty state chuẩn xác).
- API backend chưa hỗ trợ query parameter lọc theo trạng thái (`status`) và tiến độ (`progress`).

---

## 18. Next Recommended Phase

- Dừng lại tại đây theo quy định để người dùng nghiệm thu Phase **F8.6**.
- Phase tiếp theo khuyến nghị theo roadmap: **F8.7 — Teacher Course Pricing, Coupon & Promotion Management** (Quản lý giá khóa học, mã giảm giá và chiến dịch khuyến mãi cho giảng viên).
