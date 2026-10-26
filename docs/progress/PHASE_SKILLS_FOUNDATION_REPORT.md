# TMdemy Frontend — Phase Report: Skills Foundation

## 1. Trạng thái (Status)

**COMPLETED**

---

## 2. Tổng quan Giai đoạn (Phase Overview)

Thiết lập toàn diện bộ khung **Skills Foundation** cho TMdemy Frontend tại thư mục `.agents/skills/` gồm đúng 6 kỹ năng chuyên biệt và đồng bộ với [AGENTS.md](file:///d:/e-learning/AGENTS.md). 

Nếu như **Rules** trả lời câu hỏi *"AI được phép và không được phép làm gì"*, thì **Skills** đóng vai trò là cẩm nang trả lời *"Khi đối mặt với một loại công việc cụ thể, AI nên thực hiện như thế nào"* theo quy trình tuần tự, thực tế và có khả năng kết hợp linh hoạt (composable).

---

## 3. Danh sách 6 Skills Đã Tạo (`.agents/skills/`)

| Skill | Đường dẫn | Mục đích cốt lõi | Trigger / Use Case |
| :--- | :--- | :--- | :--- |
| **`stitch-ui`** | [`.agents/skills/stitch-ui/SKILL.md`](file:///d:/e-learning/.agents/skills/stitch-ui/SKILL.md) | Chuyển đổi thiết kế từ Stitch (`tmdemy`) thành mã nguồn giao diện React/Tailwind/shadcn/ui, bảo toàn visual hierarchy và ưu tiên tái sử dụng components. | Khi cắt giao diện từ Stitch screens, tạo component UI mới, chuẩn hóa visual layout và xử lý responsive/UX states. |
| **`api-integration`** | [`.agents/skills/api-integration/SKILL.md`](file:///d:/e-learning/.agents/skills/api-integration/SKILL.md) | Kết nối an toàn giữa UI và REST API dựa trên Source of Truth tại `api/`, tận dụng Centralized API Client và xử lý đầy đủ các trạng thái mạng. | Khi tích hợp endpoint mới, viết service layer (`src/services/`), định nghĩa DTO types, hoặc khi phát hiện thiếu API cần báo cáo `[BACKEND GAP]`. |
| **`auth-integration`** | [`.agents/skills/auth-integration/SKILL.md`](file:///d:/e-learning/.agents/skills/auth-integration/SKILL.md) | Xử lý và bảo vệ luồng định danh người dùng (JWT Dual-Token), điều hướng route nhạy cảm và ma trận phân quyền vai trò (`user`, `teacher`, `admin`). | Khi xây dựng tính năng cần đăng nhập, phân quyền hiển thị theo role, xử lý đăng xuất, hoặc tự động làm mới access token khi gặp 401. |
| **`page-implementation`** | [`.agents/skills/page-implementation/SKILL.md`](file:///d:/e-learning/.agents/skills/page-implementation/SKILL.md) | Xây dựng và hoàn thiện tuyến đường (page/route) trong Next.js App Router, phân định Server/Client Components và lắp ghép các modules giao diện. | Khi tạo mới hoặc hoàn thiện một trang trong `src/app/`, kết nối layout cha con, tích hợp SEO metadata và điều hướng. |
| **`frontend-review`** | [`.agents/skills/frontend-review/SKILL.md`](file:///d:/e-learning/.agents/skills/frontend-review/SKILL.md) | Đánh giá độc lập chất lượng mã nguồn trên 10 khía cạnh tiêu chuẩn (Architecture, API, TypeScript, UI/UX, Responsive, a11y, Auth, Errors, Perf, Scope) và phân loại findings. | Khi kết thúc một tính năng cần nghiệm thu, khi người dùng yêu cầu review/audit code, phát hiện rủi ro trước khi bàn giao. |
| **`bug-investigation`** | [`.agents/skills/bug-investigation/SKILL.md`](file:///d:/e-learning/.agents/skills/bug-investigation/SKILL.md) | Điều tra, tái hiện và khắc phục sự cố theo quy trình 6 bước có hệ thống, cô lập nguyên nhân gốc rễ và áp dụng bản sửa tối thiểu, chống lỗi hồi quy. | Khi phát hiện bug giao diện, runtime exception, lỗi luồng dữ liệu, hoặc khi test phát hiện lỗi hồi quy. |

---

## 4. Cơ chế Kết hợp Kỹ năng (Skill Composition)

Các kỹ năng được thiết kế độc lập, không chồng chéo và có thể kết hợp dạng ma trận giải quyết bài toán phức tạp mà không cần sinh thêm kỹ năng thừa:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      TÌNH HUỐNG THỰC TẾ & KẾT HỢP                      │
├────────────────────────────────┬───────────────────────────────────────┤
│ Xây dựng trang mới từ Stitch & │ page-implementation                   │
│ kết nối dữ liệu mạng           │  + stitch-ui + api-integration        │
├────────────────────────────────┼───────────────────────────────────────┤
│ Xây dựng trang bảo mật nghiệp  │ page-implementation                   │
│ vụ (Teacher Studio / Checkout) │  + auth-integration + api-integration │
├────────────────────────────────┼───────────────────────────────────────┤
│ Khắc phục lỗi và nghiệm thu    │ bug-investigation                     │
│ chất lượng sau vá lỗi          │  + frontend-review                    │
├────────────────────────────────┼───────────────────────────────────────┤
│ Tinh chỉnh giao diện và kiểm tra│ stitch-ui                             │
│ độ phủ trạng thái UX           │  + frontend-review                    │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 5. Rà soát Độ Tương thích & Xung đột với Rules (Rules Compatibility)

Toàn bộ 6 skills đều được đối chiếu chặt chẽ với 6 bộ Quy tắc nền tảng (`.agents/rules/`):

1. **Tuân thủ [Rule 00 (Core)](file:///d:/e-learning/.agents/rules/00-core.md)**: Mọi skill đều bắt đầu bằng bước khảo sát context và component hiện có; ưu tiên reuse; không tự ý mở rộng scope; không sửa backend.
2. **Tuân thủ [Rule 01 (Architecture)](file:///d:/e-learning/.agents/rules/01-architecture.md)**: `page-implementation` và `stitch-ui` giữ nguyên tắc Server Component mặc định, chỉ dùng `"use client"` ở component lá; cấm kết nối DB trực tiếp.
3. **Tuân thủ [Rule 02 (API Boundary)](file:///d:/e-learning/.agents/rules/02-api-boundary.md)**: `api-integration` và `bug-investigation` khẳng định `api/` là Source of Truth duy nhất; khi thiếu API bắt buộc dùng `[BACKEND GAP]`, cấm mock data giả tạo.
4. **Tuân thủ [Rule 03 (UI/UX)](file:///d:/e-learning/.agents/rules/03-ui-ux.md)**: `stitch-ui` và `page-implementation` cam kết bám sát Stitch reference `tmdemy`, bao quát đủ 6 trạng thái UX và responsive 3 mốc màn hình.
5. **Tuân thủ [Rule 04 (Code Quality)](file:///d:/e-learning/.agents/rules/04-code-quality.md)**: `api-integration` và `frontend-review` thực thi nghiêm ngặt TypeScript strict (không `any`, không `@ts-ignore`), dọn dẹp debug `console.log`.
6. **Tuân thủ [Rule 05 (Validation)](file:///d:/e-learning/.agents/rules/05-validation.md)**: Mỗi skill đều kết thúc bằng bước kiểm tra xác thực thực tế, không báo PASS khi chưa chạy kiểm tra.

**Kết luận Xung đột**: **0 xung đột (0 conflicts)** giữa Skills và Rules.

---

## 6. Danh sách Files đã Tạo & Cập nhật trong Phase này

### Files Mới Tạo
- [`.agents/skills/stitch-ui/SKILL.md`](file:///d:/e-learning/.agents/skills/stitch-ui/SKILL.md)
- [`.agents/skills/api-integration/SKILL.md`](file:///d:/e-learning/.agents/skills/api-integration/SKILL.md)
- [`.agents/skills/auth-integration/SKILL.md`](file:///d:/e-learning/.agents/skills/auth-integration/SKILL.md)
- [`.agents/skills/page-implementation/SKILL.md`](file:///d:/e-learning/.agents/skills/page-implementation/SKILL.md)
- [`.agents/skills/frontend-review/SKILL.md`](file:///d:/e-learning/.agents/skills/frontend-review/SKILL.md)
- [`.agents/skills/bug-investigation/SKILL.md`](file:///d:/e-learning/.agents/skills/bug-investigation/SKILL.md)
- [`docs/progress/PHASE_SKILLS_FOUNDATION_REPORT.md`](file:///d:/e-learning/docs/progress/PHASE_SKILLS_FOUNDATION_REPORT.md)

### File Cập nhật Đồng bộ
- [`AGENTS.md`](file:///d:/e-learning/AGENTS.md): Bổ sung liên kết và tóm tắt ngắn cho 6 kỹ năng tại mục `## 6. Skills`.

---

## 7. Đánh giá Thẩm định Giai đoạn (Validation Summary)

- [x] **Đúng 6 kỹ năng độc lập**: Mỗi kỹ năng phục vụ một nhóm công việc riêng biệt, không tạo dư thừa cho từng trang hay feature cụ thể.
- [x] **Khả năng kết hợp cao (Composable)**: Thiết kế modular hỗ trợ phối hợp nhiều skill cho các tác vụ phức tạp.
- [x] **Ranh giới an toàn tuyệt đối**: Không có kỹ năng nào vượt quyền sang backend (`d:/e-learning_server`) hoặc can thiệp database trực tiếp.
- [x] **Tuân thủ phân cấp chỉ thị**: Hoạt động dưới sự kiểm soát của Rules và `AGENTS.md`.
- [x] **Source code bất biến**: Thư mục `src/`, `api/`, database và các file cấu hình ứng dụng được giữ nguyên vẹn 100%.

---

## 8. Vấn đề Còn Lại & Trạng thái Kết thúc

- **Vấn đề còn lại (Open Issues)**: Không có.
- **Trạng thái**: Giai đoạn **Skills Foundation** đã hoàn thành trọn vẹn. 
- **Quy tắc dừng**: Hệ thống **DỪNG TẠI ĐÂY**, không tự ý tiến hành xây dựng Workflows hay Specialized Agents khi chưa có chỉ thị từ người dùng.
