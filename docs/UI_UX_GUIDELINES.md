# TMDEMY — UI & UX GUIDELINES

> **Tài liệu quy chuẩn Thiết kế Giao diện (UI) và Trải nghiệm Người dùng (UX) cho TMDEMY Frontend.**  
> *Hướng dẫn cách xây dựng giao diện hiện đại, tinh tế, đậm tính sư phạm và tương thích tốt trên mọi thiết bị.*

---

## 1. Định hướng Thẩm mỹ Tổng thể (Visual Direction)

TMDEMY là một nền tảng giáo dục trực tuyến cao cấp (Online Course Marketplace). Thiết kế phải toát lên được 5 giá trị cốt lõi:
1. **Hiện đại & Cao cấp (Modern & Premium)**: Sử dụng các đường bo viền mềm mại (`rounded-xl` / `rounded-2xl`), hiệu ứng đổ bóng mờ (`shadow-sm`, `shadow-md`), lớp kính mờ nhẹ (`glassmorphism / backdrop-blur`).
2. **Tập trung vào Trải nghiệm Học tập (Educational Focus)**: Giao diện phòng học (`Classroom`) phải giảm thiểu tối đa các chi tiết thừa thãi gây phân tâm, ưu tiên không gian hiển thị video bài giảng và thanh điều hướng giáo trình rõ ràng.
3. **Thoát khỏi vỏ bọc "CRUD Dashboard Khô cứng"**: Các bảng điều khiển của Giảng viên và Quản trị viên phải kết hợp các thẻ thống kê trực quan (Metric Cards), biểu đồ chuyển màu mềm mại (Gradient Area / Bar Charts), huy hiệu trạng thái (Badges) tinh tế.
4. **Phản hồi Tức thời & Vi chuyển động (Micro-interactions)**: Mọi thao tác hover, click, chuyển tab đều có transition mượt mà (150ms - 250ms), hiệu ứng hover nâng nhẹ thẻ (`hover:-translate-y-1 hover:shadow-lg`).

---

## 2. Hệ thống Màu sắc (Color Philosophy & Tokens)

Hệ thống sử dụng các biến màu CSS HSL chuẩn hóa theo quy ước của **shadcn/ui** và **Tailwind CSS**, cho phép hỗ trợ hoàn hảo cả chế độ Sáng (Light Mode) và Tối (Dark Mode).

### 2.1. Phân tầng Màu sắc
- **Primary (Chủ đạo)**: Sắc xanh Indigo/Deep Blue thanh lịch — tượng trưng cho tri thức, độ tin cậy và công nghệ hiện đại.
- **Secondary (Bổ trợ)**: Sắc xanh ngọc (Teal / Sky Blue) nhẹ nhàng — tạo cảm giác tươi mới, phấn khởi trong học tập.
- **Background & Card**: Nền trắng ngà / xám nhạt ở Light mode (`hsl(0 0% 100%)`, `hsl(210 20% 98%)`) và nền Slate/Zinc sâu ở Dark mode (`hsl(222.2 84% 4.9%)`).
- **Accent & Muted**: Dùng cho viền border nhẹ, thanh progress, và vùng phân tách nội dung.

### 2.2. Màu sắc Trạng thái & Nghiệp vụ (Semantic Badges)
| Trạng thái | Màu sắc khuyến nghị | Áp dụng cho |
| :--- | :--- | :--- |
| **Success / Approved / Active** | Emerald / Xanh lá (`text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40`) | Khóa học đã duyệt, Đơn hàng hoàn tất, Đạt chứng chỉ, Bài học hoàn thành |
| **Pending / In-review** | Amber / Vàng cam (`text-amber-600 bg-amber-50 dark:bg-amber-950/40`) | Khóa học chờ duyệt, Bình luận chờ duyệt, Đơn hàng chờ thanh toán |
| **Error / Rejected / Danger** | Rose / Đỏ hồng (`text-rose-600 bg-rose-50 dark:bg-rose-950/40`) | Khóa học bị từ chối, Hủy ghi danh, Lỗi thanh toán, Điểm trượt quiz |
| **Info / Role Badge** | Indigo / Violet (`text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40`) | Huy hiệu Giảng viên, Thẻ danh mục, Mã giảm giá |

---

## 3. Kiểu chữ (Typography)

Sử dụng font chữ không chân hiện đại từ Google Fonts: **Inter** hoặc **Plus Jakarta Sans**.
- **Tiêu đề lớn (Hero Title)**: `font-bold text-4xl lg:text-5xl tracking-tight leading-tight`.
- **Tiêu đề mục (Section Heading)**: `font-semibold text-2xl lg:text-3xl tracking-tight`.
- **Tiêu đề thẻ (Card Title)**: `font-medium text-lg leading-snug line-clamp-2`.
- **Nội dung văn bản (Body)**: `text-sm lg:text-base text-muted-foreground leading-relaxed`.
- **Số liệu thống kê (Metric Numbers)**: `font-extrabold text-2xl lg:text-3xl tabular-nums`.

---

## 4. Quy chuẩn Thiết kế Thành phần (Component Guidelines)

### 4.1. Thẻ Khóa học (Course Card)
- **Tỉ lệ ảnh Thumbnail**: `aspect-video` (16:9) với bo góc mềm, gắn tag Cấp độ (`Beginner`, `Intermediate`, `Advanced`) và Danh mục trên góc ảnh.
- **Thông tin**: Tiêu đề khóa học (tối đa 2 dòng kèm `line-clamp-2`), tên giảng viên kèm avatar nhỏ, số lượng học viên, điểm đánh giá trung bình kèm sao vàng.
- **Giá tiền**: Hiển thị giá gốc gạch ngang (nếu có giảm giá) và giá bán nổi bật bằng định dạng tiền tệ Việt Nam (`Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`). Khóa học 0 VND hiển thị badge "Miễn phí" nổi bật.
- **Tương tác**: Nút thả tim (Favorite) nằm góc trên ảnh; toàn bộ thẻ có thể bấm để điều hướng sang trang chi tiết.

### 4.2. Trình phát Bài học (Lesson Player & Classroom Layout)
- **Bố cục 2 cột (Desktop)**:
  - Cột chính (70% - 75% chiều rộng): Video Player với tỉ lệ cố định, thanh tiêu đề bài học, tab chuyển đổi giữa "Nội dung ghi chú", "Thảo luận / Bình luận bài học" và "Tài liệu đính kèm".
  - Cột bên phải (25% - 30% chiều rộng): Đề cương toàn bộ khóa học dạng Accordion theo từng chương. Mỗi bài học có icon trạng thái (Đã xem xanh lá, Đang xem nhấp nháy, Chưa xem xám).
- **Trên Mobile**: Tự động chuyển Accordion danh sách bài học xuống dưới video player, hỗ trợ vuốt chạm tiện lợi.

### 4.3. Bảng Dữ liệu (Data Tables)
- Dành cho Quản trị viên (Admin) và Giảng viên (Teacher):
  - Hàng tiêu đề có độ tương phản nhẹ, hỗ trợ sort khi click vào cột (ví dụ: ngày tạo, số học viên, doanh thu).
  - Có thanh công cụ phía trên gồm ô tìm kiếm debounce, bộ lọc trạng thái và nút hành động chính (Tạo mới).
  - Chân bảng tích hợp phân trang (Pagination) rõ ràng với thông tin "Hiển thị X - Y trên tổng số Z bản ghi".
  - Responsive: Trên màn hình điện thoại, tự động chuyển đổi sang dạng thẻ rút gọn (Card View) để tránh vỡ giao diện ngang.

### 4.4. Biểu đồ Thống kê (Analytics & Charts)
- Sử dụng các thư viện biểu đồ nhẹ nhàng, thẩm mỹ cao (Recharts / Chart.js phối hợp cùng Tailwind):
  - Biểu đồ đường mềm (Smooth Curve) có vùng gradient cho doanh thu theo thời gian.
  - Biểu đồ phễu bài học (Funnel Chart) minh họa số lượng học viên rơi rụng qua từng bài học.
  - Bảng xếp hạng Top khóa học bán chạy có thanh tiến độ mini (Progress bars).

---

## 5. Xử lý Trạng thái Giao diện (State UX Guidelines)

Tuyệt đối không để người dùng đối mặt với màn hình trắng trơn, nội dung nhảy đột ngột, hoặc thông báo lỗi khó hiểu.

```text
┌────────────────────────────────────────────────────────┐
│                      Giao diện UI                      │
└───────────────────────────┬────────────────────────────┘
                            │
     ┌──────────────┬───────┴───────┬──────────────┐
     ▼              ▼               ▼              ▼
┌──────────┐  ┌──────────┐    ┌──────────┐   ┌───────────┐
│ Loading  │  │ Success  │    │  Empty   │   │   Error   │
└────┬─────┘  └────┬─────┘    └────┬─────┘   └─────┬─────┘
     │             │               │               │
     ▼             ▼               ▼               ▼
 Skeleton      Render        Minh họa icon,   Thông báo
 Shimmer       Dữ liệu       thông điệp &     lỗi thân thiện
 cấu trúc      hoàn tất      nút kêu gọi      + Nút bấm
 thực tế                     hành động (CTA)  "Thử lại"
```

### 5.1. Skeleton Loading
- Luôn hiển thị khung xương xám nhấp nháy nhẹ mô phỏng đúng kích thước các phần tử: thumbnail, avatar, dòng tiêu đề, giá tiền.

### 5.2. Empty State
- Khi học viên chưa mua khóa học nào: Hiển thị icon ba lô / cuốn sách, dòng chữ "Bạn chưa tham gia khóa học nào. Hãy khám phá kho tàng kiến thức ngay hôm nay!" cùng nút "Khám phá khóa học".

### 5.3. Error State
- Bắt lỗi mạng hoặc lỗi API, hiển thị thông điệp dễ hiểu (ví dụ: "Không thể tải danh sách khóa học. Vui lòng kiểm tra lại kết nối."). Luôn có nút "Thử lại" kích hoạt fetch lại dữ liệu.

---

## 6. Đáp ứng Đa thiết bị (Responsive Design Strategy)

Hệ thống ưu tiên trải nghiệm trên 3 dải độ phân giải:
1. **Desktop (>= 1024px)**: Giao diện tiêu chuẩn cho việc học chuyên sâu, quản lý giáo trình và xem biểu đồ phân tích.
2. **Tablet (768px - 1023px)**: Tối ưu hóa thanh sidebar thành dạng drawer trượt, bố cục lưới tự co về 2 cột.
3. **Mobile (< 768px)**: Thanh điều hướng chuyển xuống đáy màn hình (Bottom Navigation) hoặc hamburger menu, thẻ khóa học xếp dọc 1 cột đầy đủ chiều ngang.

---

## 7. Khả năng Tiếp cận (Accessibility - a11y)

- Tương phản màu sắc văn bản đạt chuẩn WCAG AA tối thiểu 4.5:1.
- Mọi nút bấm chỉ có icon đều phải có `aria-label` mô tả hành động (ví dụ: `aria-label="Xóa bài học"`).
- Bàn phím có thể điều hướng qua toàn bộ các liên kết và form input bằng phím `Tab`.
