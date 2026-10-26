# Rule 00: Core Principles

> **Scope**: Tất cả AI Agents & nhà phát triển làm việc trên TMdemy Frontend.  
> **Ưu tiên**: Bắt buộc tuân thủ ở mức cao nhất, chỉ đứng sau chỉ thị trực tiếp từ người dùng.

---

## 1. Đọc và Thấu hiểu Context Trước Khi Thay Đổi (Inspect Before Modifying)

- **Trước khi viết hoặc sửa bất kỳ dòng mã nào**, AI phải:
  1. Đọc kỹ file context liên quan (`AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/FRONTEND_ARCHITECTURE.md`, `docs/UI_UX_GUIDELINES.md`,...).
  2. Khảo sát các thành phần hiện có trong `src/` để nắm rõ cấu trúc và mẫu thiết kế (design patterns) đã được áp dụng.
  3. Đối chiếu hợp đồng API (`api/`) nếu tác vụ liên quan đến dữ liệu mạng.
- **Tuyệt đối không thực thi dựa trên phỏng đoán mù quáng**.

---

## 2. Không Suy Đoán Khi Thiếu Thông Tin (Do Not Guess)

- Khi gặp yêu cầu không rõ ràng, hợp đồng API bị thiếu, hoặc hành vi hệ thống chưa được định nghĩa:
  - **DỪNG LẠI và đặt câu hỏi làm rõ** cho người dùng.
  - Không tự bịa đặt schema, không tự chế endpoint giả định, không tự đưa ra quy ước nghiệp vụ ngoài tài liệu.
  - Khi phát hiện lỗ hổng API backend, báo cáo rõ ràng theo định dạng `[BACKEND GAP]`.

---

## 3. Kiểm Soát Phạm Vi Tuyệt Đối (Strict Scope Control)

- **Chỉ thực hiện chính xác những gì được giao trong prompt hiện tại**.
- **Nghiêm cấm tự ý**:
  - Thêm tính năng "tiện tay" ngoài phạm vi yêu cầu.
  - Refactor lại các file/thư mục không liên quan đến tác vụ.
  - Tái cấu trúc (redesign) lại giao diện hoặc luồng người dùng đã hoàn thành.
  - Chuyển tiếp tự động sang phase hoặc task tiếp theo khi chưa có chỉ thị mới.

---

## 4. Tôn Trọng và Bảo Vệ Kiến Trúc Hệ Thống (Preserve Architecture)

- Tuân thủ nghiêm ngặt kiến trúc chuẩn đã định nghĩa: Next.js App Router, Server Components by default, Tailwind CSS, shadcn/ui.
- Không tự ý thay đổi thư viện cốt lõi, không thay thế App Router bằng Pages Router, không đảo lộn kiến trúc phân tầng (Presentation - Service - State - Lib).

---

## 5. Chính Sách Quản Lý Phụ Thuộc (Dependency Policy)

- **Không tự ý cài đặt package npm mới** (`npm install`, `npx`, `pnpm add`).
- Luôn ưu tiên giải quyết bài toán bằng stack có sẵn trong `package.json` và code thuần (TypeScript/React/Tailwind).
- Nếu bắt buộc phải có dependency mới, phải dừng lại và đưa ra đề xuất theo định dạng `[DEPENDENCY REQUEST]` với đầy đủ lý do, mục đích, và so sánh giải pháp.

---

## 6. Ưu Tiên Tái Sử Dụng (Reuse Over Reinvent)

- Luôn kiểm tra xem component, hook, utility, hay pattern tương tự đã tồn tại trong `src/components/`, `src/lib/`, `src/hooks/` chưa trước khi tạo mới.
- Thứ tự ưu tiên:
  $$\text{Existing Component} \longrightarrow \text{Small Reusable Component} \longrightarrow \text{New Abstraction}$$
- Tránh tạo ra nhiều phiên bản trùng lặp của các phần tử phổ biến (Button, Modal, Card, Toast, Loading Skeleton).

---

## 7. Ranh Giới Backend Bất Khả Xâm Phạm (Do Not Touch Backend)

- Dự án `d:/e-learning` là **Frontend độc lập**.
- AI hoạt động với tư cách **Frontend Engineer**.
- Tuyệt đối không can thiệp, không đọc/ghi trực tiếp database, không sửa code trong repository backend (`d:/e-learning_server`) trừ khi người dùng giao nhiệm vụ backend trong phiên làm việc riêng biệt.

---

## 8. Báo Cáo Xung Đột Ngay Lập Tức (Report Conflicts Promptly)

- Khi phát hiện mâu thuẫn giữa:
  - Hướng dẫn của người dùng vs `AGENTS.md` / `rules/`
  - Hợp đồng API (`api/`) vs Code thực tế
  - Tài liệu UI/UX vs Stitch specs
- Phải dừng lại, nêu rõ điểm xung đột và xin ý kiến giải quyết, không tự ý chọn một bên và im lặng bỏ qua bên còn lại.

---

## 9. Hoàn Thành Đúng Phase và Dừng Lại (Finish Current Phase and Stop)

- Mỗi tác vụ/phase sau khi hoàn thành phải:
  1. Chạy xác thực đầy đủ (build, typecheck, lint).
  2. Viết báo cáo tiến độ chuẩn mực vào thư mục `docs/progress/`.
  3. **DỪNG LẠI**, tóm tắt kết quả cho người dùng và chờ chỉ thị tiếp theo.
  4. Tuyệt đối không tự động vượt rào sang phase kế tiếp.
