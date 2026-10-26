# Rule 04: Code Quality & Engineering Standards

> **Scope**: Tiêu chuẩn chất lượng mã nguồn, TypeScript, Linting và quản lý gói phụ thuộc cho TMdemy Frontend.  
> **Mục tiêu**: Đảm bảo mã nguồn trong sạch, tường minh, chuẩn mực theo tiêu chuẩn công nghiệp và dễ bảo trì.

---

## 1. Tiêu Chuẩn TypeScript Khắt Khe (Strict TypeScript)

- Dự án chạy ở chế độ **Strict Mode**.
- **Tuyệt đối tránh kiểu `any`**:
  - Không sử dụng `any` cho props, state, tham số hàm, hoặc response payload.
  - Sử dụng `unknown` kết hợp type narrowing / type guard nếu kiểu dữ liệu chưa xác định rõ.
  - Khai báo đầy đủ interface hoặc type cho tất cả các đối tượng dữ liệu API trong `src/types/`.
- **Nghiêm cấm che đậy lỗi bằng chỉ thị trình biên dịch**:
  - ❌ **KHÔNG** sử dụng `@ts-ignore` hoặc `@ts-nocheck` để trốn tránh sửa lỗi biên dịch.
  - Chỉ chấp nhận `@ts-expect-error` trong trường hợp bất khả kháng của thư viện bên thứ 3 và BẮT BUỘC phải kèm dòng comment giải thích lý do cụ thể ngay bên trên.

---

## 2. Quy Chuẩn Linting & Mã Sạch (ESLint & Clean Code)

- **Không tùy tiện tắt luật linter**:
  - ❌ **KHÔNG** chèn `/* eslint-disable */` trên phạm vi toàn file hoặc cụm code trừ khi có lý do kỹ thuật đặc biệt chính đáng đã được ghi chú.
  - Sửa dứt điểm các cảnh báo về unused variables, unhandled promises, missing hook dependencies (`react-hooks/exhaustive-deps`).
- **Dọn dẹp mã debug**:
  - ❌ **KHÔNG** để lại các dòng `console.log`, `console.dir`, `debugger` trong code production.
  - Chỉ sử dụng `console.error` hoặc `console.warn` có chủ đích tại các khối bắt lỗi trung tâm (Error Boundary, API client error handler).

---

## 3. Triết Lý Lập Trình (Coding Philosophy)

1. **Rõ ràng hơn Khéo léo (Clarity over Cleverness)**:
   - Viết code dễ đọc, dễ hiểu, trực quan.
   - Tránh các biểu thức một dòng (one-liners) phức tạp lồng nhau nhiều tầng, toán tử 3 ngôi (nested ternaries) khó theo dõi.
2. **Không trừu tượng hóa quá sớm (Avoid Premature Abstraction)**:
   - Không vội vàng viết các generic phức tạp hay base classes cồng kềnh khi mới chỉ có 1 hoặc 2 trường hợp sử dụng cụ thể (tuân thủ nguyên tắc YAGNI và Rule of Three).
3. **Tránh trùng lặp logic (DRY - Don't Repeat Yourself)**:
   - Gom các logic tính toán chung, format dữ liệu (ví dụ format tiền tệ VND, thời lượng video, tỉ lệ hoàn thành) vào `src/lib/utils.ts` hoặc custom hooks dùng chung.

---

## 4. Quy Trình Yêu Cầu Gói Phụ Thuộc (Dependency Request Protocol)

- Tuyệt đối không tự ý chạy `npm install <package>` khi chưa được đồng thuận.
- Nếu giải pháp hiện tại bằng code thuần hoặc thư viện có sẵn không đáp ứng được yêu cầu kỹ thuật của task, AI phải gửi yêu cầu theo định dạng chuẩn:

```markdown
[DEPENDENCY REQUEST]
- Tên Package (Package Name): <tên package> (kèm phiên bản khuyến nghị)
- Mục đích sử dụng (Purpose): <mô tả ngắn gọn chức năng cần giải quyết>
- Lý do giải pháp hiện tại không đủ (Justification): <tại sao stack sẵn có không làm được hoặc chi phí tự viết quá cao>
- Đánh giá dung lượng & rủi ro (Impact Assessment): <bundle size, tương thích Next.js 16/React 19>
```

- Sau khi gửi yêu cầu, AI phải chờ người dùng xác nhận trước khi tiến hành cài đặt.
