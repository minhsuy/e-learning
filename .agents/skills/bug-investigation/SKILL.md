---
name: bug-investigation
description: Điều tra, khoanh vùng và xử lý lỗi (bug) trong TMdemy Frontend theo phương pháp có hệ thống, tập trung sửa chữa tối thiểu và bảo vệ ranh giới backend.
---

# Skill: Bug Investigation & Troubleshooting

## 1. Khi Nào Sử Dụng (When to Use)

- Khi phát sinh lỗi giao diện, lỗi luồng người dùng, hoặc lỗi xử lý dữ liệu trong TMdemy Frontend.
- Khi người dùng báo cáo lỗi hoặc khi quá trình kiểm tra (testing/linting/build) phát hiện điểm bất thường.

---

## 2. Quy Trình Thực Thi 6 Bước (Step-by-Step Workflow)

```text
Reproduce the Bug
       ↓
Locate Affected Architecture Layer
       ↓
Trace Data Flow & State Mutation
       ↓
Identify Root Cause
       ↓
Implement Minimal & Targeted Fix
       ↓
Regression Validation (tsc / lint / build / UX)
```

### Bước 1: Tái Hiện Lỗi (Reproduce the Bug)
- Xác định ngữ cảnh xuất hiện lỗi:
  - Lỗi xảy ra ở URL nào? Trình duyệt hay thiết bị nào?
  - Dưới vai trò người dùng nào: Public, `user`, `teacher`, hay `admin`?
  - Các bước thao tác dẫn tới lỗi (Steps to reproduce).

### Bước 2: Khoanh Vùng Tầng Kiến Trúc Bị Ảnh Hưởng (Locate Affected Layer)
- Xác định tầng xuất phát điểm của lỗi:
  - **Tầng Giao diện (Presentation)**: Lỗi CSS, lỗi render component, layout bị vỡ.
  - **Tầng Trạng thái (State/Hook)**: Lỗi stale state, race condition, useEffect dependency loop.
  - **Tầng Dịch vụ Mạng (Service/Client)**: Lỗi format request payload, thiếu Authorization header, sai endpoint.
  - **Tầng Hợp đồng Dữ liệu (Types/Contract)**: Lỗi ép kiểu dữ liệu không khớp với JSON thực tế trả về.

### Bước 3: Lần Dấu Luồng Dữ Liệu (Trace Data Flow)
- Lần theo luồng di chuyển của dữ liệu từ điểm tiếp nhận (User Event / API Response) qua các hàm trung gian đến lúc cập nhật vào React DOM.
- Đọc kỹ log thông báo lỗi trong console hoặc terminal để tìm chính xác tên file và dòng code phát sinh ngoại lệ.

### Bước 4: Xác Định Nguyên Nhân Gốc Rễ (Identify Root Cause)
- Tìm ra nguyên nhân cốt lõi thay vì chỉ nhìn vào triệu chứng bề mặt.
- **Nếu lỗi bắt nguồn từ Backend**:
  - Ví dụ: API trả về mã lỗi 500 bất thường, thiếu trường dữ liệu trong contract, hoặc logic DB bị sai.
  - **Hành động bắt buộc**:
    1. Báo cáo `[BACKEND GAP]` kèm chi tiết nguyên nhân bên phía server.
    2. **TUYỆT ĐỐI KHÔNG mở code backend để tự sửa**.
    3. Triển khai fallback an toàn ở frontend để người dùng không bị crash giao diện.

### Bước 5: Thực Hiện Bản Sửa Tối Thiểu (Implement Minimal Fix)
- **Nguyên tắc "Tối thiểu và Chính xác" (Minimal & Targeted Fix)**:
  - Chỉ sửa đúng vị trí gây ra lỗi.
  - **Tuyệt đối không sửa mò**: Không thử ngẫu nhiên nhiều chỗ hay thay đổi lung tung với hy vọng "may mắn chạy được".
  - **Không biến bug fix thành refactoring lớn**: Không tự ý viết lại toàn bộ component hay đổi cấu trúc thư viện khi bug chỉ là lỗi logic vài dòng.

### Bước 6: Kiểm Tra Chống Lỗi Hồi Quy (Regression Validation)
- Kiểm tra lại kịch bản lỗi ban đầu xem đã được giải quyết dứt điểm chưa.
- Kiểm tra các tính năng lân cận để đảm bảo bản sửa không gây phát sinh lỗi mới.
- Chạy lại các công cụ kiểm tra tĩnh:
  ```bash
  npx tsc --noEmit
  npm run lint
  ```

---

## 3. Ranh Giới & Điều Cấm (Boundaries & Constraints)

- ❌ **Không can thiệp Backend**: Nếu bug nằm ở backend, báo cáo `[BACKEND GAP]`, không sửa source code trong `e-learning_server`.
- ❌ **Không che lỗi bằng hack bẩn**: Không dùng `@ts-ignore` hoặc `catch (e) {}` rỗng để giấu lỗi.
- ❌ **Không mở rộng phạm vi sửa đổi**: Giữ diff code ở mức nhỏ nhất có thể.

---

## 4. Kết Hợp Kỹ Năng (Composition)

- **`bug-investigation`** + `frontend-review`: Dùng để kiểm tra tổng thể mã nguồn sau khi đã vá lỗi xong.
- **`bug-investigation`** + `api-integration`: Khi lỗi liên quan trực tiếp đến luồng request/response và xử lý mã lỗi HTTP.
