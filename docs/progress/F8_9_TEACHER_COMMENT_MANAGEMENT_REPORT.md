# Báo cáo Triển khai: Quản Lý Bình Luận Giảng Viên (Teacher Comment Management)

> **Mã công việc:** F8.9 — Teacher Comment Management  
> **Thời gian hoàn thành:** 20/10/2026  
> **Người thực hiện:** Antigravity (Frontend Engineer)  
> **Trạng thái:** Hoàn thành & Sẵn sàng đưa vào sử dụng (Production-Ready)

---

## 1. Tổng quan & Mục tiêu

Tích hợp tính năng quản lý bình luận cho Giảng viên tại đường dẫn `/teacher/comments`, cho phép giảng viên:
- Theo dõi toàn bộ trao đổi, thảo luận của học viên trong các khóa học do giảng viên trực tiếp phụ trách.
- Tìm kiếm theo nội dung trao đổi hoặc tên học viên.
- Lọc theo khóa học thuộc quyền sở hữu của giảng viên.
- Lọc nhanh theo phân loại bình luận (*Tất cả thảo luận*, *Bình luận gốc*, *Câu trả lời*).
- Xem chi tiết thảo luận, thông tin học viên, số lượt tương tác (Like/Dislike), bài học và chuỗi phản hồi (Thread hierarchy).
- Quyền gỡ bỏ bình luận bài giảng vi phạm dựa trên API chuyên biệt dành riêng cho giảng viên: `DELETE /api/comments/teacher/:id`.
- Tích hợp mục điều hướng **Bình luận** vào Teacher Sidebar (`/teacher/comments`).

---

## 2. API Contracts & Ranh giới Backend (Backend Boundary)

Tuân thủ nghiêm ngặt Source of Truth từ `api/COMMENT_API.md`:

| Hành động | Endpoint | Method | Vai trò | Ghi chú |
| :--- | :--- | :---: | :---: | :--- |
| **Lấy danh sách bình luận** | `/api/comments/` | `GET` | `TEACHER` | Tự động giới hạn (scope) trong các khóa học của giảng viên đăng nhập. Query params: `page`, `limit`, `search`, `courseId`, `status`. |
| **Lấy danh sách khóa học** | `/api/teacher/courses/` | `GET` | `TEACHER` | Cung cấp danh sách khóa học của giảng viên cho bộ lọc dropdown. |
| **Xóa / Gỡ bỏ bình luận** | `/api/comments/teacher/:id` | `DELETE` | `TEACHER` | API chuyên biệt cho Giảng viên (khác với `/api/comments/admin/:id` của Admin). Kiểm tra quyền sở hữu bài giảng/khóa học. |

> [!NOTE]
> Không truy cập trực tiếp database, không sửa mã nguồn backend `d:/e-learning_server`. Toàn bộ dữ liệu đi qua API client tập trung `apiClient` (`src/lib/api-client.ts`).

---

## 3. Các tệp đã tạo & Chỉnh sửa

### A. Tệp mới tạo:
1. [`src/types/teacher-comment.ts`](file:///d:/e-learning/src/types/teacher-comment.ts): Định nghĩa kiểu dữ liệu `TeacherCommentItem`, `TeacherCommentsPagination`, `TeacherCommentKpis`, `TeacherCommentFilterType`, `GetTeacherCommentsParams`.
2. [`src/services/teacher-comment.service.ts`](file:///d:/e-learning/src/services/teacher-comment.service.ts): Tầng Service tích hợp API `getComments`, `deleteComment` (`DELETE /api/comments/teacher/:id`), `getTeacherCourses`, và chuẩn hóa lỗi `normalizeTeacherCommentError`.
3. [`src/components/teacher/comments/comment-kpi-cards.tsx`](file:///d:/e-learning/src/components/teacher/comments/comment-kpi-cards.tsx): Hiển thị 4 thẻ KPI tóm lược:
   - Tổng bình luận khóa học
   - Trạng thái kiểm duyệt (Đã duyệt / Hiển thị)
   - Thảo luận mở đầu (Chủ đề gốc)
   - Câu trả lời & Phản hồi (Trao đổi)
4. [`src/components/teacher/comments/comment-filters-bar.tsx`](file:///d:/e-learning/src/components/teacher/comments/comment-filters-bar.tsx): Thanh công cụ lọc: ô tìm kiếm debounced (400ms), dropdown chọn khóa học, tab lọc loại bình luận, nút đặt lại bộ lọc.
5. [`src/components/teacher/comments/comment-table.tsx`](file:///d:/e-learning/src/components/teacher/comments/comment-table.tsx): Bảng dữ liệu hiển thị trên Desktop (>= 1024px) và chế độ thẻ Card tiện lợi trên Mobile/Tablet (< 1024px), bao gồm 6 trạng thái UX (Loading skeleton, Empty có/không filter, Error retry, Data display).
6. [`src/components/teacher/comments/comment-pagination.tsx`](file:///d:/e-learning/src/components/teacher/comments/comment-pagination.tsx): Phân trang phía máy chủ với các nút trang chuẩn, nút Trước/Sau và tùy chọn kích thước trang (10, 20, 50).
7. [`src/components/teacher/comments/comment-detail-modal.tsx`](file:///d:/e-learning/src/components/teacher/comments/comment-detail-modal.tsx): Modal xem toàn văn nội dung bình luận, thông tin tác giả, ngữ cảnh khóa học/bài học, lượt like/dislike và nút mở modal xóa.
8. [`src/components/teacher/comments/comment-delete-modal.tsx`](file:///d:/e-learning/src/components/teacher/comments/comment-delete-modal.tsx): Modal xác nhận gỡ bỏ bình luận vi phạm bài giảng, hiển thị trích dẫn và thông báo lưu ý khi xóa.
9. [`src/components/teacher/comments/teacher-comments-view.tsx`](file:///d:/e-learning/src/components/teacher/comments/teacher-comments-view.tsx): Client view điều phối trạng thái dữ liệu, gọi API, quản lý bộ lọc, modal và phân trang.
10. [`src/app/teacher/comments/page.tsx`](file:///d:/e-learning/src/app/teacher/comments/page.tsx): Route Server Component với metadata chuẩn SEO (`Quản Lý Bình Luận | TMdemy Teacher`).

### B. Tệp chỉnh sửa:
1. [`src/components/teacher/teacher-sidebar.tsx`](file:///d:/e-learning/src/components/teacher/teacher-sidebar.tsx): Thêm mục `{ label: 'Bình luận', path: '/teacher/comments', icon: 'forum' }` vào danh mục điều hướng Quản trị giảng dạy.

---

## 4. Kết quả Kiểm thử & Xác thực (Validation)

1. **TypeScript compilation (`npx tsc --noEmit`)**:
   - Kết quả: **Thành công 0 lỗi** (Exit code 0).
2. **ESLint (`npm run lint`)**:
   - Kết quả: **Thành công 0 lỗi** (Exit code 0), các tệp mới tuân thủ 100% quy chuẩn hooks và accessibility.
3. **Next.js Production Build (`npm run build`)**:
   - Kết quả: **Thành công 0 lỗi** (Exit code 0). Trang `○ /teacher/comments` được tối ưu hóa và xuất bản chính xác.
4. **Browser E2E Verification (`browser_subagent`)**:
   - Đăng nhập tài khoản giảng viên và truy cập `http://localhost:3000/teacher/comments`.
   - Kiểm tra thành công tải 16 bình luận thực tế từ backend.
   - Thử nghiệm lọc tab *Bình luận gốc*: Bảng cập nhật tức thì.
   - Mở *Modal chi tiết bình luận*: Hiển thị đầy đủ thông tin học viên, bài học, lượt tương tác.
   - Mở *Modal xác nhận xóa*: Hiển thị thông báo xác nhận và hủy bỏ an toàn thành công.
   - Kiểm tra sidebar: Mục *Bình luận* hiển thị sắc nét và active đúng route.

---

## 5. Kết luận & Đề xuất

Module Quản lý Bình luận cho Giảng viên đã hoàn thành toàn diện, bảo toàn ngôn ngữ thiết kế TMdemy và ranh giới kiến trúc độc lập với Backend.
