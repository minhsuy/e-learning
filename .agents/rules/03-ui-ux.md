# Rule 03: UI & UX Standards

> **Scope**: Quy chuẩn thiết kế giao diện, trải nghiệm người dùng và hệ thống Design System cho TMdemy Frontend.  
> **Tham chiếu chuẩn**: Tài liệu `docs/UI_UX_GUIDELINES.md` và Stitch Project `tmdemy`.

---

## 1. Nguồn Tham Chiếu Thị Giác (Primary Visual Reference)

- **Stitch Project**: Dự án `tmdemy` trên Stitch là nguồn tham chiếu thị giác và cấu trúc giao diện chính thức.
- Khi triển khai màn hình từ Stitch hoặc tài liệu hướng dẫn:
  - Phải tái hiện đúng cấu trúc phân cấp thị giác (visual hierarchy), tỷ lệ không gian, bố cục khối và luồng người dùng dự kiến.
  - Không tự ý sáng tác một phong cách giao diện hoàn toàn xa lạ hoặc phá vỡ ngôn ngữ thiết kế đã có của TMdemy.

---

## 2. Ngôn Ngữ Thiết Kế & Hệ Thống Công Cụ (Design Language & Tech)

- **Công nghệ nền tảng**: **Tailwind CSS** kết hợp **shadcn/ui** (dựa trên Radix UI / Base UI).
- **Thẩm mỹ cao cấp**:
  - Tận dụng bo tròn tinh tế (`rounded-xl`, `rounded-2xl`).
  - Đổ bóng nhẹ nhàng, phân tầng rõ ràng (`shadow-sm`, `shadow-md`, `shadow-lg`).
  - Hiệu ứng chuyển động vi mô (Micro-interactions: transition 150ms-250ms khi hover, click).
  - Màu sắc ngữ nghĩa: Primary (Indigo/Blue), Secondary (Teal/Sky), Success (Emerald), Pending (Amber), Danger (Rose).
  - Phù hợp cả chế độ Sáng (Light) và Tối (Dark).

---

## 3. Quy Tắc Tái Sử Dụng Thành Phần (Component Reuse First)

- Tuyệt đối ưu tiên tái sử dụng các components đã có sẵn trong `src/components/ui/` và `src/components/common/`.
- Không tạo các phiên bản trùng lặp (ví dụ: tự viết thẻ card khác trong khi `CourseCard` hoặc `Card` đã có sẵn).
- Nếu cần điều chỉnh hành vi hoặc biến thể giao diện, mở rộng component thông qua `props` hoặc `variants` (sử dụng `class-variance-authority - cva`).

---

## 4. Thiết Kế Thích Ứng Toàn Diện (Responsive Design)

Mọi trang và thành phần giao diện bắt buộc phải hiển thị chuẩn mực và tiện dụng trên 3 phân khúc màn hình:
1. **Desktop ($ \ge 1024px $)**: Bố cục đa cột (Grid, Sidebar + Content), bảng dữ liệu đầy đủ các cột và công cụ lọc.
2. **Tablet ($ 768px - 1023px $)**: Tối ưu cột, điều chỉnh kích thước sidebar và kích thước padding.
3. **Mobile ($ < 768px $)**:
   - Menu điều hướng chuyển sang dạng Sheet / Drawer hoặc Bottom Bar.
   - Bảng dữ liệu (Data Table) tự chuyển đổi sang dạng thẻ rút gọn (Card View) để không bị tràn màn hình ngang.
   - Các nút bấm, touch target đảm bảo kích thước tối thiểu $ 44 \times 44px $.

---

## 5. Quy Chuẩn Xử Lý 6 Trạng Thái Giao Diện (State UX Requirements)

Mọi màn hình hoặc khối giao diện có xử lý dữ liệu mạng/tương tác bắt buộc phải triển khai đầy đủ các trạng thái sau:

1. **Loading State**: Sử dụng Skeleton Loading khớp với khung layout thực tế (`LoadingSkeleton`), tránh dùng spinner đơn điệu quay giữa màn hình trắng.
2. **Empty State**: Khi danh sách rỗng (chưa có khóa học, chưa có đơn hàng, giỏ hàng trống), hiển thị hình ảnh minh họa hoặc icon trực quan kèm lời kêu gọi hành động (Call to Action - CTA).
3. **Error State**: Bắt lỗi và thông báo bằng ngôn ngữ thân thiện với người dùng (`ErrorState`), cung cấp nút thử lại ("Thử lại" / "Tải lại trang"), không hiển thị raw JSON hay stack trace.
4. **Disabled State**: Nút bấm, ô nhập liệu đang trong quá trình submit hoặc không đủ điều kiện thao tác phải chuyển sang trạng thái disabled (`opacity-50 pointer-events-none`), hiển thị spinner nhỏ nếu đang gửi dữ liệu.
5. **Unauthorized / Forbidden State**: Xử lý rõ ràng khi người dùng chưa đăng nhập hoặc không đủ quyền truy cập (redirect về login hoặc hiển thị màn hình 403 giải thích quyền hạn).
6. **Success Feedback**: Mọi thao tác ghi/sửa/xóa thành công phải có phản hồi tức thì qua Toast notification (`sonner` / `toaster`) hoặc hộp thoại thông báo thành công.

---

## 6. Tiếp Cận & Trợ Năng (Accessibility - a11y)

- Sử dụng HTML semantic (`<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>`).
- Mọi nút bấm chỉ có icon phải có thuộc tính `aria-label`.
- Form inputs phải luôn gắn liền với `<label>` hoặc `aria-label` tương ứng.
- Đảm bảo độ tương phản màu sắc giữa chữ và nền (Contrast Ratio) đạt chuẩn WCAG AA.

---

## 7. Ranh Giới Phạm Vi Giao Diện (Scope Boundary)

- **Nghiêm cấm tự ý Redesign**:
  - Không tự ý sửa giao diện của những trang, layout, hoặc module không thuộc phạm vi task hiện tại.
  - Khi được giao sửa một component, chỉ tập trung vào component đó, không lan sang các component lân cận nếu không có yêu cầu rõ ràng.
