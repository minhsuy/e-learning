---
name: frontend-review
description: Đánh giá và kiểm tra toàn diện chất lượng mã nguồn, kiến trúc, UI/UX và độ tuân thủ API của một tính năng hoặc trang sau triển khai.
---

# Skill: Frontend Code & Feature Review

## 1. Khi Nào Sử Dụng (When to Use)

- Khi hoàn thành việc triển khai một tính năng hoặc một trang và cần đánh giá chất lượng toàn diện.
- Khi người dùng yêu cầu kiểm tra (review/audit) mã nguồn hiện có trong thư mục `src/`.
- Khi cần xác định rủi ro, lỗi tiềm ẩn hoặc kiểm chứng độ tuân thủ so với các bộ Quy tắc (Rules) của dự án.

---

## 2. Các Hạng Mục Kiểm Tra Toàn Diện (Review Checklist Dimensions)

Quá trình review được phân chia thành 10 nhóm tiêu chuẩn:

1. **Architecture (Kiến trúc)**:
   - Có tuân thủ Next.js App Router không?
   - Đã áp dụng Server Component mặc định chưa? Có bị lạm dụng `"use client"` ở root không?
   - Sự phân tách giữa Presentation, Service, State và Utility có rõ ràng không?
2. **API Contract (Độ khớp API)**:
   - Endpoint URL, HTTP Method và tiền tố `/api/...` có khớp chính xác với `api/API_INDEX.md` không?
   - Request DTO và Response types có bọc chuẩn trong `ApiResponse<T>` không?
3. **TypeScript**:
   - Có bị dùng `any` không?
   - Có dùng `@ts-ignore` hoặc `@ts-nocheck` để che lỗi không?
   - Interfaces/types có đầy đủ và tường minh không?
4. **UI/UX**:
   - Có bám sát phong cách thiết kế của TMdemy (Stitch reference) không?
   - Đã xử lý đầy đủ 6 trạng thái UX: Loading, Empty, Error, Disabled, Unauthorized, Success chưa?
5. **Responsive**:
   - Layout có hiển thị tốt trên Desktop, Tablet và Mobile không?
   - Có thành phần nào bị tràn ngang (overflow-x) trên thiết bị nhỏ không?
6. **Accessibility (Trợ năng - a11y)**:
   - Các icon buttons có `aria-label` không?
   - Cấu trúc thẻ HTML có mang tính ngữ nghĩa (semantic) không?
7. **Authentication & Authorization (Bảo mật & Phân quyền)**:
   - Các route nhạy cảm có được bảo vệ và kiểm tra đúng role (`user`, `teacher`, `admin`) không?
   - Token có được đính kèm đúng header Bearer không?
8. **Error Handling (Xử lý Ngoại lệ)**:
   - Các lời gọi mạng có khối try/catch hoặc error boundary bắt lỗi không?
   - Thông báo lỗi hiển thị có thân thiện với người dùng cuối không?
9. **Performance (Hiệu năng)**:
   - Có hiện tượng re-render không cần thiết không?
   - Có import thừa thư viện cồng kềnh không?
10. **Scope Control (Kiểm soát Phạm vi)**:
    - Code thay đổi có nằm đúng trong phạm vi yêu cầu không? Có vô tình sửa file ngoài lề không?

---

## 3. Phân Loại Kết Quả Đánh Giá (Findings Classification)

Mỗi phát hiện trong quá trình review bắt buộc phải được gắn một trong 4 nhãn chuẩn:

- `[PASS]`: Hạng mục đạt tiêu chuẩn chất lượng, hoạt động đúng và an toàn.
- `[WARNING]`: Điểm chưa tối ưu nhưng không gây crash hệ thống (ví dụ: thiếu `aria-label`, warning về kích thước ảnh, đề xuất tối ưu nhỏ).
- `[ISSUE]`: Lỗi thực sự cần khắc phục (ví dụ: type error tiềm ẩn, thiếu xử lý lỗi mạng, route bảo mật bị hở, logic sai lệch).
- `[BACKEND GAP]`: Nhu cầu phía frontend nhưng backend chưa cung cấp hoặc sai khác với contract.

---

## 4. Nguyên Tắc Review Minh Bạch

- **Phân biệt rõ ràng**:
  1. Lỗi thực sự cần fix (Issues).
  2. Đề xuất cải thiện (Improvement suggestions).
  3. Vấn đề nằm ngoài scope của task hiện tại (Out-of-scope notes).
- **Quy tắc bất biến**:
  - **Không tự ý sửa code trong quá trình review** trừ khi người dùng đưa ra yêu cầu sửa cụ thể.
  - Trình bày báo cáo review mạch lạc, chỉ rõ tên file và dòng code liên quan.

---

## 5. Kết Hợp Kỹ Năng (Composition)

- `page-implementation` + **`frontend-review`**: Thẩm định chất lượng trang vừa xây dựng xong.
- `bug-investigation` + **`frontend-review`**: Đánh giá lại giải pháp sau khi sửa lỗi để phòng ngừa lỗi hồi quy (regression).
