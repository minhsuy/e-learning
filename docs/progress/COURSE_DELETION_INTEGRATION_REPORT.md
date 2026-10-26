# TMdemy — Báo cáo Tích hợp Tính năng Xóa Khóa học (Delete Course by Admin & Teacher)

**Thời gian thực hiện**: 19/10/2026  
**Phạm vi**: TMdemy Frontend (`d:\e-learning`)  
**Người thực hiện**: AI Frontend Engineer  
**Workflow**: `feature-development.md`  

---

## 1. Mục tiêu & Yêu cầu nghiệp vụ

Người dùng yêu cầu tích hợp đồng bộ tính năng xóa khóa học cho cả hai phân hệ:
1. **Phân hệ Quản trị viên (Admin Portal - `/admin/courses`)**: Admin có quyền xóa mềm (soft-delete) bất kỳ khóa học nào trong hệ thống (`pending`, `approved`, `rejected`).
2. **Phân hệ Giảng viên (Teacher Portal - `/teacher/courses`)**: Giảng viên có quyền xóa khóa học do mình sở hữu, tuân thủ nghiêm ngặt quy tắc backend: **chỉ xóa được các khóa học ở trạng thái `pending`**.

---

## 2. API Contract & Business Rules Comparison

Dựa trên Source of Truth trong `api/ADMIN_API.md` và `api/TEACHER_API.md`:

| Tiêu chí | Admin Course Deletion | Teacher Course Deletion |
|---|---|---|
| **Endpoint** | `DELETE /api/admin/courses/:id` | `DELETE /api/teacher/courses/:id` |
| **Quyền truy cập (Role)** | `ADMIN` (Bearer JWT) | `TEACHER` (Bearer JWT) |
| **Hành vi nghiệp vụ** | Soft-delete (`isDestroyed = true`). Khóa học bị ẩn khỏi danh mục học viên nhưng bảo toàn lịch sử đơn hàng và doanh thu. | Xóa khóa học do giảng viên tạo. |
| **Ràng buộc trạng thái** | **Mọi trạng thái** (`pending`, `approved`, `rejected`). | **Chỉ `pending`**. Nếu cố xóa khóa học `approved` hoặc `rejected`, backend trả về `403 Forbidden` (`"Only pending courses can be deleted by teacher"`). |
| **Cơ chế xác nhận UI** | Confirmation Dialog (`DeleteCourseModal`) với cảnh báo chi tiết soft-delete. | Confirmation Dialog (`CourseDeleteModal`) với cảnh báo không thể hoàn tác. |
| **Xử lý khóa học đã duyệt** | Admin có thể xóa bất kỳ lúc nào để gỡ khóa học vi phạm. | Hiển thị nút thùng rác bị vô hiệu hóa (disabled) kèm tooltip giải thích rõ: *"Chỉ có thể xóa khóa học ở trạng thái Chờ duyệt (PENDING). Liên hệ Admin để xóa khóa học đã duyệt."* |

---

## 3. Danh sách File đã tạo & Chỉnh sửa

### 3.1. File tạo mới:
1. [`src/components/admin/courses/delete-course-modal.tsx`](file:///d:/e-learning/src/components/admin/courses/delete-course-modal.tsx):
   - Modal xác nhận xóa khóa học dành riêng cho Admin.
   - Hiển thị tóm tắt khóa học: Thumbnail, tiêu đề, giảng viên, giá bán, danh mục, trạng thái.
   - Hộp cảnh báo xóa mềm (`isDestroyed = true`) bảo vệ dữ liệu lịch sử đơn hàng.
   - Tích hợp phím `Escape`, nút Hủy và Xác nhận xóa với loading spinner.

### 3.2. File cập nhật:
1. [`src/types/admin-course.ts`](file:///d:/e-learning/src/types/admin-course.ts):
   - Bổ sung interface `AdminCourseDeleteResponse` (`success: boolean; message: string`).
2. [`src/services/admin-course.service.ts`](file:///d:/e-learning/src/services/admin-course.service.ts):
   - Thêm phương thức `deleteCourse(courseId: string, options?: { signal?: AbortSignal })` gọi `DELETE /api/admin/courses/:id`.
3. [`src/components/admin/courses/course-table.tsx`](file:///d:/e-learning/src/components/admin/courses/course-table.tsx):
   - Bổ sung prop `onDelete: (course: AdminCourseItem) => void`.
   - Thêm nút `Trash2` ở cột Thao tác trên Desktop Table (kèm `data-testid`).
   - Thêm nút "Xóa" kèm icon `Trash2` ở thẻ Mobile Card.
4. [`src/components/admin/courses/course-detail-modal.tsx`](file:///d:/e-learning/src/components/admin/courses/course-detail-modal.tsx):
   - Bổ sung prop `onDelete?: (course: AdminCourseItem) => void`.
   - Thêm nút "Xóa khóa học" ở footer modal chi tiết giúp Admin có thể xóa ngay sau khi thẩm định nội dung giáo trình.
5. [`src/components/admin/courses/admin-courses-view.tsx`](file:///d:/e-learning/src/components/admin/courses/admin-courses-view.tsx):
   - Quản lý state `courseToDelete`.
   - Kết nối `DeleteCourseModal`, tự động cập nhật lại danh sách và 4 chỉ số KPI sau khi xóa thành công.
6. [`src/components/teacher/courses/course-delete-modal.tsx`](file:///d:/e-learning/src/components/teacher/courses/course-delete-modal.tsx):
   - Bổ sung lắng nghe phím `Escape` đóng modal an toàn.
   - Bổ sung `data-testid="teacher-confirm-delete-btn"` cho testing.
7. [`src/app/teacher/courses/page.tsx`](file:///d:/e-learning/src/app/teacher/courses/page.tsx):
   - Cập nhật hiển thị nút xóa: Nút thùng rác đỏ kích hoạt với khóa học `pending`; nút thùng rác xám mờ bị disabled kèm tooltip giải thích lý do đối với khóa học đã duyệt/từ chối.

---

## 4. Kết quả Kiểm thử & Xác thực Tự động

| Kiểm tra | Lệnh | Kết quả | Ghi chú |
|---|---|---|---|
| **TypeScript Compilation** | `cmd /c npx tsc --noEmit` | **PASS (Code 0)** | Không có bất kỳ lỗi TypeScript nào trong toàn dự án. |
| **ESLint Check** | `cmd /c npm run lint` | **PASS (Code 0)** | 0 errors. Tất cả các file mới và sửa đổi tuân thủ 100% rules. |
| **Next.js Production Build** | `cmd /c npm run build` | **PASS (Code 0)** | 39 static & dynamic pages được biên dịch thành công. |

---

## 5. Kết quả Kiểm thử Trực quan trên Trình duyệt

### 5.1. Phân hệ Admin (`/admin/courses`):
1. **Bảng khóa học Desktop**: Cột thao tác hiển thị icon Xem chi tiết (`Eye`), Phê duyệt (`CheckCircle2` khi pending), Từ chối (`XCircle` khi pending) và Xóa (`Trash2`).
2. **Modal Xóa Khóa học (Admin)**: Mở dialog xác nhận, hiển thị thông tin khóa học, cảnh báo soft-delete, nút Hủy và Xác nhận xóa.
3. **Modal Chi tiết Khóa học**: Footer hiển thị nút "Xóa khóa học", khi bấm sẽ đóng modal chi tiết và mở trực tiếp modal xác nhận xóa.
4. **Bằng chứng**:
   - Ảnh chụp modal xóa: `admin_delete_modal_1792415847539.png`
   - Ảnh chụp nút xóa trong modal chi tiết: `admin_course_detail_modal_delete_1792415865730.png`

### 5.2. Phân hệ Giảng viên (`/teacher/courses`):
1. **Khóa học Đã duyệt (`status: approved`)**:
   - Đăng nhập tài khoản Giảng viên: `nab@gmail.com` / `quangminh2004`.
   - Nút Xóa luôn cho phép bấm mở **Modal Giải thích Chính sách (`Chính sách xóa khóa học`)**, giải thích minh bạch vì sao giảng viên không thể tự xóa khóa học đã duyệt (nhằm bảo vệ quyền học tập của học viên và lịch sử đơn hàng) và cung cấp nút liên kết trực tiếp sang **Cổng Quản trị Admin (`/admin/courses`)**.
   - Bằng chứng ảnh: `teacher_delete_policy_modal_1792416628484.png`.
2. **Khóa học Chờ duyệt (`status: pending`)**:
   - Khởi tạo khóa học mới `Khoa hoc Thu Nghiem Xoa Pending` (trạng thái ban đầu: `PENDING`).
   - Nút Xóa hiển thị màu đỏ kích hoạt, bấm vào mở **Modal Xác nhận Xóa (`Xóa khóa học?`)** với cảnh báo không thể hoàn tác.
   - Bấm `Xác nhận xóa` (`data-testid="teacher-confirm-delete-btn"`): Gọi thành công `DELETE /api/teacher/courses/:id`, khóa học bị xóa sạch khỏi danh sách và số lượng chờ duyệt cập nhật về 0.
   - Bằng chứng ảnh: `teacher_delete_pending_modal_1792416772545.png`.
   - Video toàn bộ luồng E2E: `teacher_delete_e2e_1792416615734.webp`.

