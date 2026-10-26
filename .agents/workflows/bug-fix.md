# Workflow: Bug Fix

> **Scope**: Quy trình điều phối chuẩn cho việc tiếp nhận, điều tra, khoanh vùng, khắc phục lỗi (bug) và phòng ngừa lỗi hồi quy (regression) trong TMdemy Frontend.  
> **Nguyên tắc**: Sửa chữa tối thiểu và chính xác (Minimal & Targeted), bảo vệ tuyệt đối ranh giới backend, xác thực chống lỗi hồi quy trước khi dừng.

---

## 1. Mục Đích & Phạm Vi (Purpose)

Điều phối quy trình xử lý sự cố có hệ thống trong TMdemy Frontend: từ việc tiếp nhận thông tin lỗi, tái hiện hành vi bất thường, khoanh vùng nguyên nhân gốc rễ, áp dụng bản sửa tối thiểu, đến việc xác thực toàn diện nhằm đảm bảo giải quyết dứt điểm lỗi mà không gây ảnh hưởng tiêu cực tới các thành phần khác.

---

## 2. Khi Nào Kích Hoạt (Trigger & When to Use)

Workflow này được tự động kích hoạt khi:
- Người dùng báo cáo sự cố giao diện (vỡ layout, responsive sai, component không render).
- Phát sinh lỗi tương tác người dùng (nút bấm không phản hồi, form submit thất bại, modal không mở/đóng).
- Lỗi luồng dữ liệu mạng hoặc phân quyền (lỗi 401/403 bất thường, loop điều hướng, dữ liệu parse sai).
- Lỗi biên dịch hoặc lỗi phát hiện trong quá trình kiểm tra tự động (`npx tsc`, `npm run lint`, `npm run build`).

---

## 3. Đầu Vào Cần Thiết (Inputs)

Trước khi tiến hành sửa lỗi, AI cần thu thập:
1. **Mô tả sự cố (Bug Description)**: Hiện tượng lỗi quan sát được và hành vi đúng kỳ vọng.
2. **Ngữ cảnh xuất hiện**:
   - URL / Tuyến đường (Route) xảy ra sự cố.
   - Vai trò người dùng khi gặp lỗi: Khách vãng lai, Học viên (`user`), Giảng viên (`teacher`), hay Quản trị viên (`admin`).
   - Môi trường: Màn hình Mobile, Tablet hay Desktop.
3. **Bằng chứng kỹ thuật**: Thông báo lỗi trong browser console, network tab, hoặc terminal stack trace.

---

## 4. Các Cổng Kiểm Soát Bắt Buộc (Gates / Stop Conditions)

| Cổng (Gate) | Điều kiện kiểm tra | Hành động khi vi phạm |
| :--- | :--- | :--- |
| **Context Gate** | Đã hiểu rõ hành vi lỗi và có đủ dữ liệu để tái hiện chưa? | **STOP** và đề nghị người dùng cung cấp thêm console log hoặc các bước tái hiện (reproduce steps). Không sửa mò. |
| **Scope Gate** | Bản sửa có vượt ra khỏi vị trí gây lỗi không? Có biến việc fix bug thành refactor diện rộng không? | **STOP** và thu hẹp thay đổi về mức tối thiểu (Minimal Fix). Không tự ý thiết kế lại code ngoài lề. |
| **Backend Boundary Gate** | Lỗi có bắt nguồn từ phía server (`d:/e-learning_server`) hoặc database không? | **KÍCH HOẠT `[BACKEND GAP]` và STOP**. Tuyệt đối không mở repo backend để sửa. Triển khai fallback an toàn ở UI nếu cần. |
| **Quality Gate** | Bản sửa có dùng mẹo bẩn (hack) như `@ts-ignore`, `any`, hoặc `catch (e) {}` rỗng không? | **STOP**. Bắt buộc xử lý lỗi tận gốc bằng type narrowing hoặc xử lý ngoại lệ đúng chuẩn. |
| **Validation Gate** | Đã kiểm tra kịch bản lỗi gốc và chạy `tsc` / `lint` chưa? | **STOP báo cáo PASS**. Phải chạy lệnh thực tế và kiểm tra chống lỗi hồi quy. |

---

## 5. Quy Trình Điều Phối 6 Bước (Execution Steps)

```text
[1. Tiếp nhận & Tái hiện] ──> [2. Khoanh vùng Tầng lỗi] ──> [3. Tự chọn Skills]
                                                                  │
                                                                  ▼
[6. Báo cáo & Dừng] <── [5. Validation & Chống hồi quy] <── [4. Sửa Tối thiểu]
```

### Bước 1: Tiếp Nhận & Tái Hiện Lỗi (Understand & Reproduce)
- Phân tích thông tin lỗi, xác định luồng thao tác gây lỗi.
- Vượt qua **Context Gate**.

### Bước 2: Khoanh Vùng Tầng Kiến Trúc Bị Ảnh Hưởng (Locate Affected Layer)
Xác định chính xác vị trí xuất phát của lỗi trong 4 tầng kiến trúc:
- **Tầng Giao diện (Presentation)**: CSS/Tailwind, Responsive, JSX markup, Shadcn components.
- **Tầng Trạng thái (State/Hook)**: React state, lifecycle hook, race condition, stale closure.
- **Tầng Dịch vụ Mạng (Service/API)**: URL, HTTP method, payload formatting, headers.
- **Tầng Hợp đồng & Kiểu dữ liệu (Types/Contract)**: Khác biệt giữa interface frontend và dữ liệu backend trả về.
- *Nếu tầng bị lỗi là Backend*: Kiểm tra **Backend Boundary Gate**, báo cáo `[BACKEND GAP]` và dừng lại.

### Bước 3: Tự Động Lựa Chọn Skills Phù Hợp (Skill Selection)
AI **tự động kích hoạt tập hợp Skills** dựa trên bản chất của lỗi:

| Bản chất lỗi | Skills Được Chọn | Vai trò của Skill trong Task |
| :--- | :--- | :--- |
| Mọi tác vụ sửa lỗi (Bắt buộc cốt lõi) | `bug-investigation` | Điều tra nguyên nhân gốc rễ, lần dấu luồng dữ liệu và thiết kế bản sửa tối thiểu. |
| Lỗi liên quan đến gọi API, sai format body, mã HTTP lỗi | `api-integration` | Đối chiếu với `api/API_INDEX.md`, chuẩn hóa service và DTO types. |
| Lỗi liên quan đến token hết hạn, quyền truy cập role, loop redirect | `auth-integration` | Rà soát AuthContext, middleware bảo vệ route và luồng refresh token 401. |
| Lỗi vỡ giao diện trên thiết bị di động, sai hierarchy | `stitch-ui` | Đối chiếu lại màn hình Stitch `tmdemy`, sửa responsive classes. |
| Nghiệm thu sau khi vá lỗi (Bắt buộc) | `frontend-review` | Rà soát code diff sau khi sửa để đảm bảo không vi phạm Rules và không gây lỗi hồi quy. |

### Bước 4: Thực Hiện Bản Sửa Tối Thiểu (Implement Minimal Fix)
- Chỉ sửa đúng các dòng code gây ra lỗi.
- Không sửa code lân cận nếu không liên quan.
- Vượt qua **Scope Gate** và **Quality Gate**.

### Bước 5: Kiểm Tra Chống Lỗi Hồi Quy & Xác Thực (Regression Check & Validation)
- Kiểm tra lại kịch bản lỗi ban đầu: xác nhận lỗi đã biến mất.
- Kiểm tra các chức năng lân cận liên quan để đảm bảo không bị ảnh hưởng phụ (side-effects).
- Chạy bộ kiểm tra tĩnh bắt buộc theo **Rule 05**:
  - `npx tsc --noEmit` (0 lỗi type).
  - `npm run lint` (0 lỗi linter).
- Vượt qua **Validation Gate**.

### Bước 6: Báo Cáo Nghiệm Thu & Dừng Lại (Report & Stop)
- Tổng hợp báo cáo kết quả khắc phục lỗi theo mẫu tại Mục 6.
- **DỪNG LẠI (STOP)**.

---

## 6. Mẫu Báo Cáo Khắc Phục Lỗi (Report Format)

Mỗi khi kết thúc workflow `bug-fix`, AI xuất báo cáo theo cấu trúc:

```markdown
### Bug Fix Report

- **Task**: <Mô tả lỗi đã xử lý>
- **Trạng thái**: RESOLVED / BLOCKED
- **Nguyên Nhân Gốc Rễ (Root Cause)**: <Giải thích ngắn gọn tại sao lỗi xảy ra>
- **Tầng Kiến Trúc Bị Ảnh Hưởng**: Presentation / State / Service / Types
- **Skills Đã Sử Dụng**: <Danh sách skills được kích hoạt>
- **Files Sửa Đổi**:
  - `path/to/file` (Modified lines)
- **Giải Pháp Thực Hiện (Fix Summary)**: <Tóm tắt bản sửa tối thiểu>
- **Kiểm Tra Chống Hồi Quy (Regression Check)**:
  - Kịch bản lỗi gốc: RESOLVED
  - Chức năng lân cận: VERIFIED (Không ảnh hưởng)
- **Kết Quả Validation**:
  - `npx tsc --noEmit`: <PASS / FAIL>
  - `npm run lint`: <PASS / FAIL>
- **Backend Gaps (nếu có)**: <None / Chi tiết [BACKEND GAP]>
- **Khuyến Nghị**: <Đề xuất hành động tiếp theo>
```
