---
name: stitch-ui
description: Chuyển đổi thiết kế từ Stitch sang frontend TMdemy bằng Tailwind CSS và shadcn/ui, ưu tiên tái sử dụng component và bảo toàn visual hierarchy.
---

# Skill: Stitch UI Implementation

## 1. Khi Nào Sử Dụng (When to Use)

- Khi được giao xây dựng hoặc tinh chỉnh giao diện người dùng dựa trên màn hình thiết kế hoặc mẫu thiết kế từ Stitch (Dự án: `tmdemy`).
- Khi cần chuẩn hóa layout, chuyển đổi mockup sang React components theo ngôn ngữ thiết kế của TMdemy.

---

## 2. Quy Trình Thực Thi (Step-by-Step Workflow)

```text
Stitch Reference
       ↓
Inspect Existing Components
       ↓
Identify Layout & Structure
       ↓
Identify Reusable Components
       ↓
Implement Component / View
       ↓
Responsive Adaptation (Mobile/Tablet/Desktop)
       ↓
Implement 6 UX States
       ↓
Visual & Interaction Validation
```

### Bước 1: Khảo sát Tham chiếu Stitch (Stitch Reference)
- Xem màn hình Stitch hoặc file tài liệu tương ứng (`DESIGN_SCREENS.md`, `docs/UI_UX_GUIDELINES.md`).
- Xác định rõ:
  - Phân cấp thị giác (visual hierarchy): Vị trí tiêu đề, khối nội dung chính, thanh điều hướng phụ.
  - Spacing, padding, tỉ lệ chia cột (Grid/Flexbox).
  - Tông màu sắc ngữ nghĩa (Primary Indigo, Accent Teal, Badges trạng thái).

### Bước 2: Khảo sát Components Sẵn Có (Inspect Existing Components)
- Rà soát `src/components/ui/` (shadcn primitives: Button, Card, Dialog, Badge, Input,...).
- Rà soát `src/components/common/` và `src/features/` xem đã có component tương tự chưa.
- **Quy tắc**: Tuyệt đối không viết lại component mới nếu component hiện tại có thể tái sử dụng hoặc mở rộng qua props/variants.

### Bước 3: Xác định Khung Bố Cục (Layout & Structure)
- Phân định ranh giới giữa Server Component (vỏ trang, tiêu đề tĩnh) và Client Component (nút tương tác, dropdown, form).
- Đảm bảo component tree gọn gàng, tuân thủ nguyên tắc "đẩy Client Component xuống lá".

### Bước 4: Triển Khai Giao Diện (Implementation)
- Sử dụng các token Tailwind chuẩn: bo góc (`rounded-xl`, `rounded-2xl`), shadow mờ (`shadow-sm`, `shadow-md`), transition mượt mà (`transition-all duration-200`).
- Áp dụng helper `cn()` từ `src/lib/utils.ts` để merge class có điều kiện.

### Bước 5: Tối Ưu Thích Ứng (Responsive Adaptation)
- **Desktop ($\ge 1024px$)**: Bố cục chuẩn theo thiết kế Stitch.
- **Tablet ($768px - 1023px$)**: Thu gọn khoảng cách, co giãn số cột hợp lý.
- **Mobile ($< 768px$)**: Chuyển multi-column sang single-column; bảng dữ liệu chuyển sang dạng card view; đảm bảo touch target $\ge 44 \times 44px$.

### Bước 6: Phủ Đủ 6 Trạng Thái UX (UX States)
Mọi khối giao diện có dữ liệu phải hỗ trợ:
1. `Loading`: Skeleton layout khớp khung thực tế.
2. `Empty`: Trạng thái rỗng kèm icon và CTA phù hợp.
3. `Error`: Hộp thoại/khung báo lỗi thân thiện có nút thử lại.
4. `Disabled`: Nút bấm bị làm mờ và chặn click khi đang thao tác.
5. `Unauthorized`: Khung nhắc đăng nhập hoặc hạn chế quyền.
6. `Success Feedback`: Toast thông báo thành công sau khi thao tác.

### Bước 7: Kiểm Tra Trực Quan (Visual Validation)
- So sánh tỷ lệ với Stitch: Padding đồng đều? Font chữ đúng phân cấp? Hover states có hoạt động mượt không?
- Đảm bảo không làm vỡ các component lân cận.

---

## 3. Ranh Giới & Điều Cấm (Boundaries & Constraints)

- ❌ **Không tự ý Redesign**: Tái hiện trung thực thiết kế Stitch, không tự sáng tác thêm chi tiết hoa mỹ ngoài yêu cầu.
- ❌ **Không sửa layout ngoài phạm vi**: Chỉ can thiệp component/view được chỉ định trong task.
- ❌ **Không hardcode dữ liệu giả**: Nếu thiếu dữ liệu thực tế, chuẩn bị props interfaces rõ ràng, không hardcode mock data vĩnh viễn trong JSX.

---

## 4. Kết Hợp Kỹ Năng (Composition)

- `page-implementation` + **`stitch-ui`**: Khi xây dựng một trang hoàn chỉnh từ thiết kế Stitch.
- **`stitch-ui`** + `api-integration`: Khi nối dữ liệu từ API vào các components vừa cắt từ Stitch.
