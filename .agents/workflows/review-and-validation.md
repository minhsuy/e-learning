# Workflow: Review and Validation

> **Scope**: Quy trình điều phối chuẩn cho việc rà soát, đánh giá chất lượng mã nguồn (audit/review), kiểm tra tính tương thích kiến trúc và thẩm định xác thực độc lập cho TMdemy Frontend.  
> **Nguyên tắc**: Khách quan, minh bạch, phân loại rõ ràng (PASS/WARNING/ISSUE/BACKEND GAP), **tuyệt đối không tự ý sửa code trong quá trình review**.

---

## 1. Mục Đích & Phạm Vi (Purpose)

Điều phối quy trình thẩm định chất lượng toàn diện cho một module, trang hoặc cụm tính năng trong frontend TMdemy. Đảm bảo mã nguồn tuân thủ nghiêm ngặt 6 bộ Quy tắc (`.agents/rules/`), đúng chuẩn hợp đồng API (`api/`), bảo toàn thiết kế Stitch và duy trì độ ổn định cao trước khi bàn giao cho người dùng.

---

## 2. Khi Nào Kích Hoạt (Trigger & When to Use)

Workflow này được tự động kích hoạt khi:
- Người dùng yêu cầu đánh giá, kiểm tra chất lượng mã nguồn của một trang hoặc component cụ thể (ví dụ: *"Review trang Course Detail"*, *"Kiểm tra chất lượng code auth"*).
- Cần thực hiện kiểm toán (audit) độc lập độ tuân thủ kiến trúc, kiểu dữ liệu hoặc khả năng responsive của một module.
- Nghiệm thu chất lượng tổng thể sau một giai đoạn (phase) hoặc trước khi bàn giao một tính năng phức tạp.

---

## 3. Đầu Vào Cần Thiết (Inputs)

Trước khi thực hiện thẩm định, AI cần xác định:
1. **Phạm vi thẩm định (Review Target)**: Đường dẫn thư mục, file hoặc tính năng cụ thể cần review.
2. **Nguồn tham chiếu tiêu chuẩn**:
   - Hệ thống Quy tắc: `.agents/rules/00-core.md` đến `05-validation.md`.
   - Hợp đồng API: `api/API_INDEX.md` và các tài liệu liên quan trong `api/`.
   - Tiêu chuẩn UI/UX & Stitch: `docs/UI_UX_GUIDELINES.md` và thiết kế Stitch `tmdemy`.
   - Kiến trúc dự án: `docs/FRONTEND_ARCHITECTURE.md`, `docs/AUTHENTICATION.md`, `docs/ROLE_PERMISSIONS.md`.

---

## 4. Các Cổng Kiểm Soát Bắt Buộc (Gates / Stop Conditions)

| Cổng (Gate) | Điều kiện kiểm tra | Hành động khi vi phạm |
| :--- | :--- | :--- |
| **Context Gate** | Đã xác định rõ module/file cần review chưa? | **STOP** và xin làm rõ phạm vi thẩm định. |
| **Non-Modification Gate** | AI có đang cố tình sửa đổi file mã nguồn trong quá trình review không? | **STOP NGAY LẬP TỨC**. Mục đích của workflow này là thẩm định và báo cáo, tuyệt đối không tự ý sửa code trừ khi người dùng yêu cầu sửa rõ ràng trong prompt riêng biệt. |
| **Honesty Gate** | Có bằng chứng cụ thể (dòng code, output lệnh) cho từng nhận định không? | **STOP**. Không đưa ra nhận xét chung chung hay khẳng định PASS khi chưa đối chiếu. |
| **Validation Gate** | Đã thực thi các lệnh terminal để thu thập bằng chứng khách quan chưa? | **STOP**. Bắt buộc chạy `npx tsc --noEmit` và `npm run lint` để lấy dữ liệu thực tế. |

---

## 5. Quy Trình Điều Phối 6 Bước (Execution Steps)

```text
[1. Tiếp nhận Target] ──> [2. Đối chiếu Tiêu chuẩn] ──> [3. Tự chọn Skills]
                                                               │
                                                               ▼
[6. Báo cáo & Dừng] <── [5. Phân loại Findings] <── [4. Thẩm định 10 Tiêu chí]
```

### Bước 1: Tiếp Nhận & Xác Định Mục Tiêu Thẩm Định (Target Scope)
- Khoanh vùng chính xác các file mã nguồn thuộc đối tượng kiểm tra.
- Vượt qua **Context Gate** và **Non-Modification Gate**.

### Bước 2: Chuẩn Bị Tài Liệu Tiêu Chuẩn Đối Chiếu (Reference Standards)
- Chuẩn bị hợp đồng API nếu module có gọi mạng.
- Chuẩn bị ma trận phân quyền nếu module có kiểm tra role.
- Chuẩn bị tiêu chuẩn Stitch nếu module là giao diện người dùng.

### Bước 3: Tự Động Lựa Chọn Skills Phù Hợp (Skill Selection)
AI **tự động kích hoạt skill cốt lõi** phục vụ thẩm định:

| Vai trò trong Workflow | Skills Được Chọn | Nhiệm vụ cụ thể |
| :--- | :--- | :--- |
| **Kỹ năng cốt lõi (Bắt buộc)** | `frontend-review` | Thẩm định chi tiết trên 10 khía cạnh chất lượng, phân loại phát hiện và lập bảng kiểm tra. |

*Lưu ý: Nếu người dùng yêu cầu kiểm tra sâu một khía cạnh chuyên biệt (ví dụ: chỉ audit API contract hoặc chỉ audit bảo mật auth), `frontend-review` sẽ tập trung sâu vào các tiêu chí tương ứng của `api-integration` hoặc `auth-integration`.*

### Bước 4: Thẩm Định Toàn Diện Trên 10 Khía Cạnh Tiêu Chuẩn (10-Dimension Audit)
Thực hiện rà soát theo 10 tiêu chuẩn được định nghĩa trong `frontend-review`:
1. **Kiến trúc (Architecture)**: Next.js App Router, RSC mặc định, không lạm dụng `"use client"`.
2. **Khớp Hợp đồng API (API Contract)**: Đúng URL, method, payload và bọc `ApiResponse<T>`.
3. **TypeScript**: Strict mode, không `any`, không `@ts-ignore`.
4. **UI/UX & Stitch**: Đúng ngôn ngữ thiết kế, bảo toàn visual hierarchy, đủ 6 trạng thái UX.
5. **Độ thích ứng (Responsive)**: Hoạt động trơn tru trên Mobile, Tablet, Desktop.
6. **Trợ năng (a11y)**: HTML ngữ nghĩa, `aria-label` cho icon buttons, label cho form inputs.
7. **Bảo mật & Phân quyền (Auth/Role)**: Đúng token header, đúng ma trận quyền `user`/`teacher`/`admin`.
8. **Xử lý Ngoại lệ (Error Handling)**: Bắt lỗi mạng, thông báo thân thiện, có nút thử lại.
9. **Hiệu năng (Performance)**: Tránh re-render thừa, không import thư viện nặng không cần thiết.
10. **Kiểm soát Phạm vi (Scope Control)**: Code gọn gàng, không có code rác hay debug artifacts.

### Bước 5: Phân Loại Phát Hiện & Xác Thực Tự Động (Classify & Validate)
- Gán nhãn cho từng phát hiện theo 4 mức chuẩn mực:
  - `[PASS]`: Đạt chuẩn chất lượng.
  - `[WARNING]`: Điểm chưa tối ưu nhưng không gây crash (thiếu aria-label, warning nhỏ).
  - `[ISSUE]`: Lỗi cần khắc phục (lỗi type, hở route, thiếu error state).
  - `[BACKEND GAP]`: Nhu cầu frontend chưa được backend đáp ứng hoặc sai khác contract.
- Chạy công cụ kiểm tra tự động để thu thập dữ liệu xác thực:
  - `npx tsc --noEmit`
  - `npm run lint`

### Bước 6: Báo Cáo Thẩm Định & Dừng Lại (Report & Stop)
- Tổng hợp báo cáo review theo mẫu tại Mục 6.
- **DỪNG LẠI (STOP)**. Không tự ý chỉnh sửa mã nguồn.

---

## 6. Mẫu Báo Cáo Thẩm Định Mã Nguồn (Report Format)

Mỗi khi kết thúc workflow `review-and-validation`, AI xuất báo cáo theo cấu trúc:

```markdown
### Review & Validation Report

- **Đối Tượng Thẩm Định (Target)**: <Đường dẫn file hoặc module>
- **Trạng thái Tổng Quan**: APPROVED / NEEDS ATTENTION / BLOCKED
- **Skills Đã Sử Dụng**: `frontend-review`
- **Kết Quả Kiểm Tra Tự Động (Automated Checks)**:
  - `npx tsc --noEmit`: <PASS / FAIL> (Output tóm tắt)
  - `npm run lint`: <PASS / FAIL>
- **Chi Tiết Thẩm Định Trên 10 Tiêu Chuẩn**:
  1. Architecture: [PASS / WARNING / ISSUE] — <Ghi chú kèm file:line>
  2. API Contract: [PASS / WARNING / ISSUE / BACKEND GAP] — <Ghi chú>
  3. TypeScript: [PASS / WARNING / ISSUE] — <Ghi chú>
  4. UI/UX (6 States): [PASS / WARNING / ISSUE] — <Ghi chú>
  5. Responsive: [PASS / WARNING / ISSUE] — <Ghi chú>
  6. Accessibility: [PASS / WARNING / ISSUE] — <Ghi chú>
  7. Auth & Roles: [PASS / WARNING / ISSUE] — <Ghi chú>
  8. Error Handling: [PASS / WARNING / ISSUE] — <Ghi chú>
  9. Performance: [PASS / WARNING / ISSUE] — <Ghi chú>
  10. Scope Control: [PASS / WARNING / ISSUE] — <Ghi chú>
- **Danh Sách Điểm Cần Hành Động (Actionable Items)**:
  - [ ] <Hạng mục cần khắc phục ưu tiên 1>
  - [ ] <Hạng mục cần khắc phục ưu tiên 2>
- **Khuyến Nghị Tiếp Theo**: <Đề xuất hành động cho người dùng>
```
