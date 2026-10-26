# Rule 05: Validation & Verification Standards

> **Scope**: Quy trình kiểm tra, thẩm định mã nguồn và nghiệm thu trước khi bàn giao cho TMdemy Frontend.  
> **Nguyên tắc vàng**: "Không báo PASS nếu validation chưa thực sự chạy và thành công."

---

## 1. Bộ Lệnh Xác Thực Bắt Buộc (Automated Validation Suite)

Sau bất kỳ đợt triển khai hoặc sửa đổi code nào, AI bắt buộc phải chạy và kiểm tra kết quả của các lệnh terminal sau:

1. **Kiểm tra Kiểu dữ liệu (Type Checking)**:
   ```bash
   npx tsc --noEmit
   ```
   - Đảm bảo 0 lỗi TypeScript. Không bỏ qua warning liên quan đến type.
2. **Kiểm tra Quy chuẩn Mã nguồn (Linting)**:
   ```bash
   npm run lint
   ```
   - Đảm bảo không vi phạm quy tắc ESLint.
3. **Kiểm tra Đóng gói Ứng dụng (Build Verification)**:
   ```bash
   npm run build
   ```
   - Chạy build Next.js để phát hiện các lỗi biên dịch trang tĩnh (SSG), dynamic imports, hoặc lỗi Server Component / Client Component bị xung đột lúc build.

---

## 2. Tiêu Chí Xác Thực Cho Tác Vụ Giao Diện (UI Task Checklist)

Khi tác vụ liên quan đến xây dựng hoặc cập nhật UI, phải kiểm tra các tiêu chí sau:

- [ ] **Tính thích ứng (Responsive)**: Giao diện hiển thị đúng và không vỡ layout trên cả 3 mốc: Mobile (375px - 430px), Tablet (768px - 1024px), Desktop ($\ge 1280px$).
- [ ] **Trạng thái giao diện đầy đủ (States Coverage)**:
  - Có hiển thị Skeleton khi đang tải dữ liệu (Loading State)?
  - Có giao diện thông báo và hình minh họa khi danh sách rỗng (Empty State)?
  - Có bắt lỗi và hiển thị nút retry khi gặp sự cố mạng (Error State)?
  - Có vô hiệu hóa các nút bấm khi đang thực thi hành động (Disabled State)?
- [ ] **Điều hướng & Liên kết (Navigation & Routing)**: Các nút bấm, đường link trỏ đúng URL theo sơ đồ Route Map của App Router.
- [ ] **Phân quyền hiển thị (Auth & Role Access)**: Các phần tử đặc quyền (ví dụ nút Chỉnh sửa bài học chỉ dành cho Teacher/Admin) được ẩn/hiện chính xác theo vai trò người dùng (`user`, `teacher`, `admin`).
- [ ] **Thẩm mỹ & Trải nghiệm (Visual Polish)**: Kiểm tra khoảng cách spacing, padding, màu sắc badge, định dạng tiền tệ VND, không có text bị tràn khung.

---

## 3. Tiêu Chí Xác Thực Cho Tác Vụ Tích Hợp API (API Task Checklist)

Khi tác vụ liên quan đến kết nối REST API hoặc sự kiện Socket.IO:

- [ ] **Đối chiếu Hợp đồng Nguồn (`api/`)**:
  - Endpoint URL, HTTP Method và tiền tố `/api/...` khớp 100% với tài liệu tại `api/API_INDEX.md`.
  - Tên các trường trong query params và request body khớp chính xác với contract.
- [ ] **Kiểm tra Cấu trúc Phản hồi (Response Handling)**:
  - Khớp với cấu trúc `ApiResponse<T>` (`success`, `data`, `message`, `pagination`).
  - Dữ liệu trả về được parse và ép kiểu đúng TypeScript interface.
- [ ] **Kiểm tra Xác thực & Header (Auth Header)**:
  - Request có tự động đính kèm `Authorization: Bearer <token>` thông qua API client hay không.
  - Xử lý mã lỗi `401 Unauthorized` có kích hoạt luồng refresh token hay không.
- [ ] **Xử lý Ngoại lệ (Error Handling)**:
  - Bắt trọn vẹn các mã lỗi HTTP phổ biến: `400 Bad Request`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.
  - Hiển thị thông báo lỗi rõ ràng qua Toast hoặc Error State của component.

---

## 4. Báo Cáo Kết Quả Trung Thực (Honest Reporting Policy)

- **TUYỆT ĐỐI KHÔNG**:
  - Tuyên bố "Đã kiểm tra thành công" hay "Validation PASSED" khi chưa thực sự chạy lệnh terminal.
  - Bỏ qua các lỗi compile hoặc lint rồi âm thầm hoàn thành tác vụ.
- **Nếu phát sinh lỗi trong quá trình chạy validation**:
  - Báo cáo rõ mã lỗi, vị trí file và dòng code bị lỗi.
  - Tiến hành sửa chữa dứt điểm lỗi đó trước khi kết thúc task.
  - Nếu lỗi thuộc về [BACKEND GAP] hoặc vấn đề môi trường ngoài tầm kiểm soát, phải ghi chú minh bạch vào báo cáo tiến độ.
