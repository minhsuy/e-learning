# Workflow: Feature Development

> **Scope**: Quy trình điều phối chuẩn cho mọi tác vụ phát triển tính năng mới, xây dựng trang (page), tạo thành phần giao diện (UI components), hoặc tích hợp dữ liệu API trên TMdemy Frontend.  
> **Nguyên tắc**: Luôn đi qua các Cổng kiểm soát (Gates), tự động chọn Skills phù hợp, kiểm tra độc lập và báo cáo trước khi dừng.

---

## 1. Mục Đích & Phạm Vi (Purpose)

Điều phối toàn bộ vòng đời phát triển một tính năng frontend: từ tiếp nhận yêu cầu, khảo sát kiến trúc, điều phối các kỹ năng chuyên biệt (Skills), đến thẩm định chất lượng (Review), xác thực kỹ thuật (Validation) và báo cáo nghiệm thu.

---

## 2. Khi Nào Kích Hoạt (Trigger & When to Use)

Workflow này được tự động kích hoạt khi người dùng đưa ra các yêu cầu:
- Xây dựng trang mới hoặc bổ sung route trong Next.js App Router (ví dụ: Course Detail, Checkout, Leaderboard).
- Cắt và chuyển đổi thiết kế giao diện từ Stitch (`tmdemy`).
- Tích hợp endpoint REST API hoặc kênh thời gian thực Socket.IO vào giao diện.
- Bổ sung logic nghiệp vụ hoặc phân quyền hiển thị theo vai trò (`user`, `teacher`, `admin`).

---

## 3. Đầu Vào Cần Thiết (Inputs)

Trước khi bắt đầu, AI cần xác định các thông tin đầu vào:
1. **Yêu cầu tác vụ (Task Prompt)**: Mô tả chức năng, trang mục tiêu, hoặc hành vi mong đợi từ người dùng.
2. **Tài liệu tham chiếu liên quan**:
   - Route & Kiến trúc: `docs/FRONTEND_ARCHITECTURE.md`, `docs/USER_FLOWS.md`.
   - Thiết kế thị giác: Màn hình Stitch (`tmdemy`), `docs/UI_UX_GUIDELINES.md`.
   - Hợp đồng dữ liệu: `api/API_INDEX.md` và các tài liệu chi tiết trong `api/`.
   - Phân quyền & Định danh: `docs/AUTHENTICATION.md`, `docs/ROLE_PERMISSIONS.md`.
3. **Mã nguồn hiện có**: Các components tại `src/components/`, services tại `src/services/`, types tại `src/types/`.

---

## 4. Các Cổng Kiểm Soát Bắt Buộc (Gates / Stop Conditions)

Tại mỗi chặng, AI bắt buộc phải vượt qua Cổng kiểm soát tương ứng. Nếu vi phạm, phải **DỪNG LẠI NGAY LẬP TỨC**:

| Cổng (Gate) | Điều kiện kiểm tra | Hành động khi vi phạm |
| :--- | :--- | :--- |
| **Context Gate** | Yêu cầu nghiệp vụ có rõ ràng không? Đã xác định được route/component đích chưa? | **STOP** và đặt câu hỏi làm rõ cho người dùng. Không được phỏng đoán. |
| **Scope Gate** | Thay đổi dự kiến có vượt ra ngoài phạm vi tính năng được yêu cầu không? Có chạm vào code ngoài lề không? | **STOP** và báo cáo xung đột scope. Giới hạn lại trong đúng ranh giới của task. |
| **API Gate** | Feature cần dữ liệu từ backend nhưng endpoint hoặc fields chưa có trong `api/`? | **KÍCH HOẠT `[BACKEND GAP]` và STOP** việc giả lập. Tuyệt đối không mock data để nhận hoàn thành. Chỉ tạo fallback UI nếu được yêu cầu. |
| **Dependency Gate** | Giải pháp có yêu cầu cài đặt thêm thư viện npm mới không? | **KÍCH HOẠT `[DEPENDENCY REQUEST]` và STOP**. Chờ người dùng phê duyệt trước khi cài đặt. |
| **Validation Gate** | Lệnh kiểm tra tĩnh (`tsc`, `lint`, `build`) có trả về lỗi không? | **STOP báo cáo PASS**. Sửa dứt điểm lỗi phát sinh trước khi hoàn tất. |

---

## 5. Quy Trình Điều Phối 7 Bước (Execution Steps)

```text
[1. Tiếp nhận Task] ──> [2. Khảo sát & Vượt Gates] ──> [3. Tự chọn Skills]
                                                              │
                                                              ▼
[6. Báo cáo & Dừng] <── [5. Validation (tsc/lint)] <── [4. Thực thi & Review]
```

### Bước 1: Phân Tích & Xác Định Phạm Vi (Understand & Scope)
- Đọc kỹ prompt của người dùng, xác định rõ: Target Route, đối tượng người dùng, dữ liệu cần thiết.
- Vượt qua **Context Gate** và **Scope Gate**.

### Bước 2: Khảo Sát Tài Liệu & Tài Sản Sẵn Có (Inspect Assets)
- Đối chiếu Hợp đồng API tại `api/` (Vượt qua **API Gate**).
- Khảo sát các components sẵn có trong `src/components/` để tái sử dụng tối đa, tránh viết lại.
- Kiểm tra thiết kế Stitch hoặc quy chuẩn UI tại `docs/UI_UX_GUIDELINES.md`.

### Bước 3: Tự Động Lựa Chọn Skills Phù Hợp (Skill Selection)
Dựa trên đặc điểm cụ thể của task, AI **tự động kích hoạt tập hợp Skills cần thiết** theo ma trận điều phối:

| Đặc điểm của Task | Skills Được Chọn | Vai trò của Skill trong Task |
| :--- | :--- | :--- |
| Tạo hoặc hoàn thiện Route / Page trong `src/app/` | `page-implementation` | Định hình khung Server/Client Component, SEO metadata, layout nhóm. |
| Cắt giao diện từ Stitch, tạo UI component, responsive | `stitch-ui` | Tái hiện visual hierarchy, token Tailwind, shadcn/ui, đủ 6 trạng thái UX. |
| Cần gọi REST API, xử lý DTO, service layer | `api-integration` | Kết nối `src/services/`, dùng Centralized Client, chuẩn hóa type từ `api/`. |
| Trang hoặc hành động yêu cầu đăng nhập, kiểm tra Role | `auth-integration` | Bảo vệ route, tận dụng `useAuth()`, kiểm tra role (`user`/`teacher`/`admin`). |
| Mọi task tính năng sau khi viết mã xong (Bắt buộc) | `frontend-review` | Rà soát độc lập trên 10 khía cạnh chất lượng trước khi bàn giao. |

*Lưu ý: Chỉ chọn đúng các kỹ năng liên quan trực tiếp đến task. Không kích hoạt kỹ năng thừa.*

### Bước 4: Triển Khai Mã Nguồn (Implementation)
- Thực thi lần lượt theo quy trình của các Skills đã chọn.
- Duy trì nguyên tắc Server Component mặc định, chỉ dùng `"use client"` ở component lá.
- Bao quát đầy đủ 6 trạng thái UX: Loading, Empty, Error, Disabled, Unauthorized, Success Feedback.

### Bước 5: Đánh Giá Nội Bộ (Review Phase)
- Áp dụng kỹ năng `frontend-review`:
  - Rà soát TypeScript strict (không `any`, không `@ts-ignore`).
  - Kiểm tra tính thích ứng (Mobile, Tablet, Desktop).
  - Phân loại phát hiện theo: `[PASS]`, `[WARNING]`, `[ISSUE]`, `[BACKEND GAP]`.
  - Khắc phục các `[ISSUE]` phát hiện trong phạm vi task.

### Bước 6: Xác Thực Kỹ Thuật (Validation Phase)
- Tuân thủ nghiêm ngặt **Rule 05** và vượt qua **Validation Gate**:
  - Chạy `npx tsc --noEmit` để đảm bảo 0 lỗi kiểu dữ liệu.
  - Chạy `npm run lint` để đảm bảo sạch sẽ quy chuẩn code.
  - Chạy `npm run build` khi có thay đổi liên quan đến routing, layout hoặc cấu hình build.
- **Tuyệt đối không báo PASS nếu chưa chạy xác thực thực tế**.

### Bước 7: Báo Cáo Nghiệm Thu & Dừng Lại (Report & Stop)
- Tổng hợp báo cáo tiến độ theo mẫu chuẩn tại Mục 6.
- **DỪNG LẠI (STOP)**. Không tự ý thực hiện task tiếp theo.

---

## 6. Mẫu Báo Cáo Hoàn Thành (Report Format)

Mỗi khi kết thúc workflow `feature-development`, AI xuất báo cáo nghiệm thu theo cấu trúc:

```markdown
### Feature Implementation Report

- **Task**: <Tên tính năng / yêu cầu>
- **Trạng thái**: COMPLETED / BLOCKED
- **Phạm vi (Scope)**: <Route / Modules bị ảnh hưởng>
- **Skills Đã Sử Dụng**: <Danh sách skills được kích hoạt>
- **Files Tạo Mới / Sửa Đổi**:
  - `path/to/file1` (Created / Modified)
- **6 Trạng Thái UX**: Loading [x], Empty [x], Error [x], Disabled [x], Unauthorized [x], Success [x]
- **Kết Quả Validation**:
  - `npx tsc --noEmit`: <PASS / FAIL> (kèm output tóm tắt)
  - `npm run lint`: <PASS / FAIL>
  - `npm run build`: <PASS / FAIL / Skipped (nêu lý do)>
- **Cảnh Báo / Ghi Chú (Warnings)**: <Nếu có>
- **Backend Gaps / Dependency Requests**: <None / Chi tiết [BACKEND GAP] / [DEPENDENCY REQUEST]>
- **Bước Khuyến Nghị Tiếp Theo**: <Hành động đề xuất cho người dùng>
```
