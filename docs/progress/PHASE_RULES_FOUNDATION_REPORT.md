# TMdemy Frontend — Phase Report: Rules Foundation

## 1. Trạng thái (Status)

**COMPLETED**

---

## 2. Tổng quan Giai đoạn (Phase Overview)

Thiết lập toàn diện bộ khung **Rules Foundation** cho TMdemy Frontend tại thư mục `.agents/rules/` và đồng bộ với [AGENTS.md](file:///d:/e-learning/AGENTS.md). Bộ quy chuẩn này đóng vai trò là kim chỉ nam điều chỉnh hành vi, kiến trúc, ranh giới và chuẩn mực code cho AI Frontend Engineer, ngăn ngừa việc vi phạm kiến trúc độc lập giữa Frontend và Backend.

---

## 3. Danh sách Files đã Tạo & Cập nhật (Files Created & Modified)

### 3.1. Các file Rules mới tạo (`.agents/rules/`)

| File | Mục đích & Trách nhiệm chính |
| :--- | :--- |
| [`00-core.md`](file:///d:/e-learning/.agents/rules/00-core.md) | **Nguyên tắc cốt lõi**: Khảo sát và thấu hiểu context trước khi sửa; không suy đoán khi thiếu thông tin; kiểm soát scope chặt chẽ; tôn trọng kiến trúc hiện tại; chính sách dependency nghiêm ngặt; ưu tiên reuse; không can thiệp backend; dừng lại khi hoàn thành phase. |
| [`01-architecture.md`](file:///d:/e-learning/.agents/rules/01-architecture.md) | **Kiến trúc Frontend**: Next.js App Router; TypeScript strict mode; Server Components (RSC) mặc định; Client Components chỉ khi cần interactivity/browser API/state ("đẩy xuống lá"); phân tách rõ 4 tầng Presentation - State - Service - Types/Lib; cấm kết nối DB trực tiếp. |
| [`02-api-boundary.md`](file:///d:/e-learning/.agents/rules/02-api-boundary.md) | **Ranh giới Backend & API**: Giao tiếp backend CHỈ qua REST API và Socket.IO; cấm import backend source/Prisma/Mongoose/SQL drivers; thư mục `api/` là Source of Truth; quy trình khai báo `[BACKEND GAP]` khi thiếu endpoint; cấm mock data lén lút rồi giả vờ feature đã hoạt động. |
| [`03-ui-ux.md`](file:///d:/e-learning/.agents/rules/03-ui-ux.md) | **Tiêu chuẩn UI/UX**: Stitch `tmdemy` là tham chiếu thị giác chính; Tailwind CSS + shadcn/ui; ưu tiên tái sử dụng components; thiết kế responsive (Desktop/Tablet/Mobile); xử lý bắt buộc 6 trạng thái UX (Loading, Empty, Error, Disabled, Unauthorized, Success); trợ năng a11y; cấm redesign ngoài scope. |
| [`04-code-quality.md`](file:///d:/e-learning/.agents/rules/04-code-quality.md) | **Chất lượng Mã nguồn**: TypeScript strict (tránh `any`, cấm `@ts-ignore` che lỗi); ESLint nghiêm ngặt (không tắt linter tùy tiện, cấm debug `console.log`); triết lý "Clarity over Cleverness", tránh trừu tượng hóa sớm; giao thức `[DEPENDENCY REQUEST]` khi cần package mới. |
| [`05-validation.md`](file:///d:/e-learning/.agents/rules/05-validation.md) | **Tiêu chuẩn Thẩm định**: Chạy bắt buộc `tsc`, `lint`, `build` sau mỗi đợt triển khai; checklist kiểm tra UI (responsive, 6 states, navigation, role); checklist tích hợp API (đối chiếu `api/`, HTTP status, Bearer token, error handling); nguyên tắc trung thực: cấm báo PASS khi chưa chạy kiểm tra. |

### 3.2. Cập nhật Đồng bộ

- [`AGENTS.md`](file:///d:/e-learning/AGENTS.md): Cập nhật mục `## 5. Rules` từ dạng dự kiến ("Expected rule areas include") sang dạng đã thiết lập và kích hoạt chính thức ("Active established rules") kèm mô tả tóm tắt cho từng rule.

---

## 4. Phân cấp Chỉ thị (Instruction Hierarchy)

Hệ thống tuân thủ nghiêm ngặt chuỗi thứ bậc ưu tiên từ trên xuống dưới:

```text
User's Current Task (Yêu cầu trực tiếp của người dùng)
        ↓
AGENTS.md (Hiến pháp dự án)
        ↓
.agents/rules/ (6 bộ quy chuẩn nền tảng)
        ↓
Relevant Skills (Kỹ năng chuyên môn - theo yêu cầu)
        ↓
Relevant Workflows (Quy trình chuẩn - theo yêu cầu)
        ↓
Relevant Specialized Agents (Vai trò chuyên trách)
        ↓
Implementation (Thực thi mã nguồn)
```

- Quy tắc cấp cao hơn không bị ghi đè ngầm định bởi quy tắc cấp thấp hơn.
- Khi có xung đột hoặc thông tin không rõ ràng: Dừng lại và báo cáo, không suy đoán.

---

## 5. Các Ranh giới Quan trọng Đã Thiết Lập (Critical Boundaries)

1. **Ranh giới Độc lập Frontend & Backend**:
   - Frontend không có quyền truy cập trực tiếp vào DB, không import mã backend.
   - Giao tiếp duy nhất qua HTTP REST API và WebSocket (Socket.IO).
2. **Nguồn Chân Lý API**:
   - 29 file tài liệu trong `api/` (đặc biệt là `api/API_INDEX.md` và `api/AUTH_FLOW.md`) là hợp đồng bất biến.
   - Bất kỳ tính năng nào thiếu endpoint từ backend phải gắn nhãn `[BACKEND GAP]` rõ ràng.
3. **Kiểm soát Scope**:
   - Không tự ý mở rộng tính năng, không tự ý refactor các module nằm ngoài yêu cầu của người dùng.
   - Không tự cài đặt dependency mà không có `[DEPENDENCY REQUEST]`.
4. **Không Tạo Thành Phần Vượt Phase**:
   - Tuyệt đối không tự động chuyển sang tạo Skills, Workflows, hay Specialized Agents trong giai đoạn này.

---

## 6. Kết quả Xác thực (Validation Results)

Đã thực hiện đầy đủ bộ xác thực theo chuẩn [Rule 05](file:///d:/e-learning/.agents/rules/05-validation.md):

| Lệnh Kiểm tra | Kết quả | Chi tiết |
| :--- | :---: | :--- |
| `npx tsc --noEmit` | **PASS** | Exit code 0, 0 lỗi kiểu dữ liệu TypeScript. |
| `npm run lint` | **PASS** | Exit code 0, 0 lỗi ESLint (28 warnings liên quan tối ưu thẻ ảnh `<img>` kế thừa từ code cũ). |
| `npm run build` | **PASS** | Exit code 0, Turbopack biên dịch thành công 17 static & dynamic routes trong 7.1s. |

---

## 7. Xung đột & Vấn đề Chưa Giải Quyết (Conflicts & Open Issues)

- **Xung đột (Conflicts)**: Không có. Tất cả 6 rules hoàn toàn tương thích và đồng bộ với `AGENTS.md` và các tài liệu kiến trúc trong `docs/`.
- **Vấn đề Chưa giải quyết (Open Issues)**: Không có. Toàn bộ yêu cầu của giai đoạn Rules Foundation đã hoàn tất trọn vẹn.

---

## 8. Trạng thái Kết thúc

Phase **Rules Foundation** đã hoàn thành. Hệ thống dừng tại đây và sẵn sàng nhận chỉ thị tiếp theo từ người dùng.
