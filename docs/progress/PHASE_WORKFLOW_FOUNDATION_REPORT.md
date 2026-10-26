# TMdemy Frontend — Phase Report: Workflow Foundation

## 1. Trạng thái (Status)

**COMPLETED**

---

## 2. Tổng quan Giai đoạn (Phase Overview)

Thiết lập toàn diện bộ khung **Workflow Foundation** cho quy trình phát triển AI Frontend TMdemy tại thư mục `.agents/workflows/`. 

Kiến trúc phân cấp chỉ thị của dự án:
```text
User Task
    ↓
AGENTS.md
    ↓
.agents/rules/        (Mandatory Constraints: What AI must and must not do)
    ↓
.agents/workflows/    (Task Execution Process: How tasks progress and orchestrate skills)
    ↓
.agents/skills/       (Specialized Implementation Playbooks: How to perform capabilities)
    ↓
Implementation / Investigation / Review
    ↓
Validation
    ↓
Report
    ↓
STOP
```

Workflows đóng vai trò là **quy trình điều phối công việc**: tự động nhận diện loại task, kiểm tra các Cổng kiểm soát (Gates), kích hoạt đúng tập hợp Skills cần thiết theo nhu cầu thực tế, thực hiện đánh giá (Review), xác thực kỹ thuật (Validation) và dừng lại sau khi báo cáo. Workflows tuyệt đối không sao chép chi tiết từ Rules hay Skills, không chứa hướng dẫn viết mã cụ thể, và không yêu cầu người dùng phải tự chỉ định Skill trong prompt thông thường.

---

## 3. Kiến Trúc Workflows Đã Tạo (`.agents/workflows/`)

Hệ thống được thiết kế tinh gọn, gồm đúng 3 workflows nòng cốt, mang tính composable cao và bao quát 100% các loại tác vụ kỹ thuật frontend của TMdemy:

| Workflow | Đường dẫn | Mục đích cốt lõi | Khi nào kích hoạt (Trigger) |
| :--- | :--- | :--- | :--- |
| **`feature-development`** | [`.agents/workflows/feature-development.md`](file:///d:/e-learning/.agents/workflows/feature-development.md) | Điều phối toàn diện vòng đời phát triển tính năng: từ xây dựng route, cắt giao diện từ Stitch, kết nối REST API / Socket.IO, đến review chất lượng và xác thực. | Khi người dùng yêu cầu tạo mới hoặc hoàn thiện trang/route, module UI, tính năng nghiệp vụ, hoặc tích hợp API. |
| **`bug-fix`** | [`.agents/workflows/bug-fix.md`](file:///d:/e-learning/.agents/workflows/bug-fix.md) | Điều phối quy trình xử lý sự cố có hệ thống: tái hiện, khoanh vùng 4 tầng kiến trúc, áp dụng bản sửa tối thiểu (minimal fix), bảo vệ ranh giới backend và chống lỗi hồi quy. | Khi phát sinh lỗi giao diện, vỡ responsive, lỗi runtime exception, lỗi luồng token/phân quyền, hoặc lỗi từ automated test. |
| **`review-and-validation`** | [`.agents/workflows/review-and-validation.md`](file:///d:/e-learning/.agents/workflows/review-and-validation.md) | Điều phối việc thẩm định, audit độc lập chất lượng mã nguồn trên 10 khía cạnh tiêu chuẩn, phân loại findings và chạy xác thực khách quan mà **không can thiệp sửa mã nguồn**. | Khi người dùng yêu cầu review mã nguồn, kiểm tra độ tuân thủ kiến trúc/quy tắc, hoặc nghiệm thu chất lượng sau một phase. |

---

## 4. Điều Phối Kỹ Năng Tự Động (Skill Orchestration)

AI tự động chọn Skills dựa trên bản chất của task, người dùng **không cần phải chỉ định Skill trong prompt**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MA TRẬN ĐIỀU PHỐI KỸ NĂNG                                 │
├─────────────────────────┬───────────────────────────────┬──────────────────────────────┤
│ Workflow                │ Tình huống cụ thể của Task   │ Skills được tự động kích hoạt│
├─────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ feature-development     │ Tạo / bổ sung Route hoặc Page │ page-implementation          │
│                         │ Cắt layout từ Stitch / CSS UI │ stitch-ui                    │
│                         │ Kết nối REST API / Network    │ api-integration              │
│                         │ Route cần Auth / Phân quyền   │ auth-integration             │
│                         │ Nghiệm thu sau khi code xong  │ frontend-review (Bắt buộc)   │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ bug-fix                 │ Bắt đầu điều tra mọi lỗi      │ bug-investigation (Cốt lõi)  │
│                         │ Lỗi gọi API / Sai format JSON │ api-integration              │
│                         │ Lỗi Token 401 / Loop Redirect │ auth-integration             │
│                         │ Lỗi vỡ giao diện / Responsive │ stitch-ui                    │
│                         │ Kiểm tra chống lỗi hồi quy    │ frontend-review (Bắt buộc)   │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ review-and-validation   │ Kiểm toán mã nguồn, kiểm tra  │ frontend-review (Cốt lõi)    │
│                         │ chất lượng 10 tiêu chuẩn      │                              │
└─────────────────────────┴───────────────────────────────┴──────────────────────────────┘
```

---

## 5. Hệ Thống Cổng Kiểm Soát (Gates / Stop Conditions)

Mỗi workflow được trang bị các cổng kiểm soát nghiêm ngặt. Nếu vi phạm bất kỳ cổng nào, AI bắt buộc phải **STOP**:

1. **Context Gate**:
   - *Điều kiện*: Yêu cầu nghiệp vụ hoặc ngữ cảnh tái hiện lỗi phải rõ ràng.
   - *Khi vi phạm*: **STOP**, đặt câu hỏi làm rõ cho người dùng. Không được phỏng đoán.
2. **Scope Gate**:
   - *Điều kiện*: Phạm vi thay đổi chỉ được nằm đúng trong task được giao.
   - *Khi vi phạm*: **STOP**, thu hẹp thay đổi về đúng ranh giới của task. Không tự ý refactor lan man.
3. **API / Backend Boundary Gate**:
   - *Điều kiện*: Khi feature cần endpoint chưa có trong `api/`, hoặc lỗi xuất phát từ server (`d:/e-learning_server`) / database.
   - *Khi vi phạm*: **Kích hoạt `[BACKEND GAP]` và STOP**. Tuyệt đối không mở repo backend để sửa, không can thiệp DB, không fake API để nhận hoàn thành.
4. **Dependency Gate**:
   - *Điều kiện*: Khi giải pháp kỹ thuật cần cài thêm package npm mới.
   - *Khi vi phạm*: **Kích hoạt `[DEPENDENCY REQUEST]` và STOP**. Chờ người dùng chấp thuận trước khi cài đặt.
5. **Non-Modification Gate (dành riêng cho `review-and-validation`)**:
   - *Điều kiện*: Quá trình review chỉ dùng để đánh giá và báo cáo findings.
   - *Khi vi phạm*: **STOP**. Tuyệt đối không tự ý sửa file mã nguồn trong lúc review.
6. **Validation Gate**:
   - *Điều kiện*: Bắt buộc phải chạy các lệnh kiểm tra tự động (`npx tsc --noEmit`, `npm run lint`, `npm run build` nếu cần) và đối chiếu checklist.
   - *Khi vi phạm*: **STOP báo cáo PASS**. Không được nhận hoàn thành khi chưa chạy lệnh hoặc còn tồn tại lỗi.

---

## 6. Cập Nhật AGENTS.md

Đã cập nhật đồng bộ file [`AGENTS.md`](file:///d:/e-learning/AGENTS.md) tại 2 vị trí quan trọng:
1. **Mục 4 — Instruction Hierarchy**:
   - Điều chỉnh thứ tự phân cấp chỉ thị rõ ràng: `User Task` $\rightarrow$ `AGENTS.md` $\rightarrow$ `Rules` $\rightarrow$ `Workflows` $\rightarrow$ `Skills` $\rightarrow$ `Implementation`.
   - Bổ sung cấu trúc thư mục cấu hình `.agents/` và phân định ranh giới:
     - `rules/`: Mandatory constraints (what AI must and must not do).
     - `skills/`: Specialized implementation playbooks (how to perform capabilities).
     - `workflows/`: Task execution process (how tasks progress and orchestrate skills).
2. **Mục 7 — Workflows**:
   - Cập nhật liên kết trực tiếp tới 3 workflows đã tạo (`feature-development.md`, `bug-fix.md`, `review-and-validation.md`).
   - Định nghĩa nguyên tắc bất biến: Không bỏ qua các bước trong workflow và không vượt rào qua các Gates.

---

## 7. Xác Minh Phạm Vi Thay Đổi (Scope Verification)

Theo đúng quy tắc kiểm soát phạm vi nghiêm ngặt của Phase này:

```text
Source code (src/):       NOT MODIFIED (0 files changed)
API contracts (api/):     NOT MODIFIED (0 files changed)
Backend server:           NOT MODIFIED (0 files changed)
Database / Prisma:        NOT MODIFIED (0 files changed)
Dependencies (npm):       NOT MODIFIED (0 packages installed)
Specialized Agents:       NOT CREATED  (0 files created)
```

### Danh Sách Toàn Bộ Files Tạo Mới & Sửa Đổi:
- **Tạo mới**:
  - [`.agents/workflows/feature-development.md`](file:///d:/e-learning/.agents/workflows/feature-development.md)
  - [`.agents/workflows/bug-fix.md`](file:///d:/e-learning/.agents/workflows/bug-fix.md)
  - [`.agents/workflows/review-and-validation.md`](file:///d:/e-learning/.agents/workflows/review-and-validation.md)
  - [`docs/progress/PHASE_WORKFLOW_FOUNDATION_REPORT.md`](file:///d:/e-learning/docs/progress/PHASE_WORKFLOW_FOUNDATION_REPORT.md)
- **Sửa đổi**:
  - [`AGENTS.md`](file:///d:/e-learning/AGENTS.md)

---

## 8. Vấn Đề Còn Lại (Open Issues)

```text
None
```

---

## 9. Trạng Thái Hoàn Thành & Dừng Lại

Giai đoạn **WORKFLOW FOUNDATION** đã hoàn thành trọn vẹn và đạt toàn bộ tiêu chí đặt ra. 

Tuân thủ nguyên tắc cốt lõi: **DỪNG LẠI (STOP)** và chờ chỉ thị tiếp theo từ người dùng.
