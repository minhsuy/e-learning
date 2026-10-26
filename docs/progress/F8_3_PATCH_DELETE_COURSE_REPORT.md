# Báo Cáo Nghiệm Thu: F8.3 PATCH — Delete Course (Teacher Course Management)

- **Ngày thực hiện**: 2026-10-16
- **Trạng thái**: Hoàn thành (COMPLETED)
- **Kỹ năng áp dụng**: `api-integration`, `frontend-review`, `feature-development`
- **Route ảnh hưởng**: `/teacher/courses`

---

## 1. Mục Tiêu & Phạm Vi (Scope)

Triển khai chức năng xóa khóa học cho giảng viên tại trang Quản lý khóa học (`/teacher/courses`), tuân thủ chặt chẽ các quy tắc nghiệp vụ hệ thống và hợp đồng API trong `api/TEACHER_API.md`:
- Chỉ cho phép xóa khóa học khi đang ở trạng thái `PENDING`.
- Tuyệt đối không hiển thị hành động xóa đối với các khóa học đã được duyệt (`APPROVED`) hoặc đã bị từ chối (`REJECTED`) để bảo toàn tính toàn vẹn dữ liệu đơn hàng và lịch sử học tập.
- Hiển thị Dialog xác nhận thao tác trước khi gọi API, ngăn chặn spam bấm nút nhiều lần (double submit/concurrent requests).
- Tự động cập nhật danh sách và xử lý quay lại trang trước nếu trang hiện tại không còn dữ liệu sau khi xóa.

---

## 2. Các Tệp Sửa Đổi (Files Changed)

| STT | File | Loại thay đổi | Mô tả chi tiết |
|:---:|:---|:---:|:---|
| 1 | `src/components/teacher/courses/course-delete-modal.tsx` | Modified | Cập nhật tiêu đề dialog chuẩn `"Xóa khóa học?"`, thông điệp cảnh báo `"Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác."`, nhãn nút `"Hủy"` và `"Xác nhận xóa"`, loading state spinner `"Đang xóa..."`, vô hiệu hóa nút bấm khi đang gọi API, và chặn triệt để xóa khóa học không phải `PENDING`. |
| 2 | `src/app/teacher/courses/page.tsx` | Modified | Cập nhật hiển thị action xóa bằng icon Trash (`Trash2`) chỉ dành cho khóa học `PENDING` (không hiển thị với `APPROVED`/`REJECTED`); bổ sung kiểm tra an toàn trong `openDeleteModal`; hoàn thiện `handleCourseDeleted` với logic xử lý pagination thông minh khi trang hiện tại hết item (`courses.length <= 1 && pagination.page > 1`). |
| 3 | `docs/progress/F8_3_PATCH_DELETE_COURSE_REPORT.md` | Created | Báo cáo tiến độ nghiệm thu chi tiết theo đúng cấu trúc tiêu chuẩn. |

---

## 3. Tích Hợp API (API Integration)

- **Endpoint**: `DELETE /api/teacher/courses/:id`
- **Tài liệu tham chiếu**: `api/TEACHER_API.md` (Mục 3: `DELETE /api/teacher/courses/:id`)
- **Phương thức HTTP**: `DELETE`
- **Xác thực**: Bearer JWT Token (`Authorization: Bearer <TEACHER_ACCESS_TOKEN>`) được tự động xử lý bởi `apiClient`.
- **Vai trò yêu cầu**: `TEACHER`
- **Tham số**:
  - Path parameter: `id` (UUID khóa học)
  - Frontend **không gửi** `teacherId` trong body hoặc query params.
- **Service Layer**: Tái sử dụng `courseService.deleteTeacherCourse(id)` trong `src/services/course.service.ts`.
- **Response Format**:
  ```json
  {
    "success": true,
    "message": "Course deleted successfully!"
  }
  ```

---

## 4. Xác Minh Quy Tắc Nghiệp Vụ (Business Rule Verification)

| Điều kiện kiểm tra | Hành vi giao diện / logic | Kết quả |
|:---|:---|:---:|
| Khóa học có `status === 'PENDING'` | Hiển thị nút xóa (icon `Trash2` màu đỏ), click mở dialog xác nhận | **PASS** |
| Khóa học có `status === 'APPROVED'` | Không hiển thị action xóa trong bảng hành động | **PASS** |
| Khóa học có `status === 'REJECTED'` | Không hiển thị action xóa trong bảng hành động | **PASS** |
| Không bypass trạng thái | `openDeleteModal` và `CourseDeleteModal` có safeguard kiểm tra `status === 'pending'` trước khi thực hiện | **PASS** |
| Không fake xóa ở frontend | Luôn gọi `courseService.deleteTeacherCourse(id)` và chỉ cập nhật state khi nhận response thành công | **PASS** |

---

## 5. Hành Vi Confirmation Dialog & UX

1. **Hiển thị Dialog**:
   - Khi giảng viên nhấn nút Xóa trên hàng khóa học PENDING:
     - Tiêu đề: **Xóa khóa học?**
     - Thông tin nhận diện: Tên khóa học, mã UUID, badge trạng thái `CHỜ DUYỆT (PENDING)`.
     - Nội dung cảnh báo: *"Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác."*
     - Nút hành động: Nút **Hủy** và nút **Xác nhận xóa**.
2. **Hủy bỏ thao tác**:
   - Nhấn nút "Hủy", icon `X`, hoặc click backdrop ngoài modal: Modal đóng lại, **hoàn toàn không gọi API**.
3. **Xác nhận xóa & Chống gửi request trùng lặp (Anti-spam/Concurrent protection)**:
   - Khi nhấn "Xác nhận xóa":
     - Trạng thái `isDeleting = true`.
     - Nút "Xác nhận xóa" hiển thị spinner `<Loader2 className="w-4 h-4 animate-spin" />` kèm nhãn `"Đang xóa..."` và bị vô hiệu hóa (`disabled={isDeleting}`).
     - Nút "Hủy" và icon "X" bị vô hiệu hóa (`disabled={isDeleting}`) để tránh người dùng thao tác gây race condition.
     - `handleDelete` chặn gọi hàm nếu `isDeleting === true`.
4. **Xử lý khi xóa thành công**:
   - Hiển thị Toast thông báo thành công: `toast.success(res?.message || 'Xóa khóa học thành công!')`.
   - Đóng dialog xác nhận.
   - Loại bỏ khóa học khỏi danh sách hiện tại.
   - Nếu khóa học bị xóa là item cuối cùng của trang hiện tại (và trang > 1): Tự động chuyển người dùng về trang trước (`pagination.page - 1`) và fetch lại dữ liệu mới.
   - Nếu còn item hoặc ở trang 1: Gọi `setReloadTrigger` để đồng bộ lại danh sách và số lượng tổng từ server.
5. **Xử lý khi gặp lỗi (Error Handling)**:
   - Giữ nguyên khóa học trong danh sách (không loại bỏ giả).
   - Dialog vẫn mở để người dùng đọc thông tin lỗi.
   - Hiển thị Alert banner màu đỏ trong dialog và Toast thông báo lỗi chi tiết từ `AppApiError` hoặc máy chủ.
   - Trả lại trạng thái `isDeleting = false` để người dùng có thể thử lại hoặc nhấn "Hủy".

---

## 6. Kết Quả Kiểm Thử Kỹ Thuật (Validation Results)

- **TypeScript Typecheck (`npx tsc --noEmit`)**:
  - Kết quả: **PASS** (Exit code: 0, 0 errors).
- **ESLint (`npm run lint`)**:
  - Kết quả: **PASS** (Exit code: 0, 0 errors, 38 warnings liên quan đến tag `img` có sẵn từ trước trong dự án).
- **Production Build (`npm run build`)**:
  - Kết quả: **PASS** (Exit code: 0, 29/29 routes build thành công bao gồm cả `/teacher/courses`).

---

## 7. Giới Hạn & Ranh Giới (Known Limitations & Boundaries)

- Không thay đổi mã nguồn backend (`d:/e-learning_server`).
- Không thay đổi database hay API contract.
- Không can thiệp vào các màn hình tạo khóa học (`/teacher/courses/new`), sửa khóa học (`/teacher/courses/[id]/edit`) hay biên soạn giáo trình (`/teacher/courses/[id]/curriculum`).
- Không cài đặt thêm bất kỳ thư viện npm bên ngoài nào.
