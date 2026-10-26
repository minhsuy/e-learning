# F7.2-C — PASSWORD CHANGE & ACCOUNT SECURITY REPORT

**Phase:** F7.2 — Account, Profile & Favorites  
**Task:** F7.2-C — Password Change & Account Security  
**Status:** COMPLETE (PASS)  
**Date:** 2026-10-13  
**Repository:** `d:/e-learning` (TMdemy Frontend)  

---

## 1. Executive Summary

Trong task **F7.2-C**, chúng tôi đã xây dựng hoàn chỉnh khu vực **Bảo mật tài khoản & Đổi mật khẩu (Account Security & Password Change)** trong trang Profile của TMdemy:
1. **Giao diện Bảo mật & Đổi mật khẩu (`AccountSecurityCard`)**:
   - Được bố trí tại cột thông tin chính của trang `/profile` ngay dưới thẻ Thông tin cá nhân.
   - Form gồm 3 trường bảo mật bắt buộc: Mật khẩu hiện tại (`oldPassword`), Mật khẩu mới (`password`), và Xác nhận mật khẩu mới (`confirm_password`).
   - Tích hợp nút bật/tắt hiển thị mật khẩu (Show/Hide password toggle) độc lập cho từng trường.
   - Thước đo độ mạnh mật khẩu trực quan theo thời gian thực (Password Strength Meter: Yếu / Trung bình / Mạnh) kèm thanh tiến trình đổi màu linh hoạt.
   - Cơ chế bảo mật dữ liệu nhạy cảm nghiêm ngặt: Tuyệt đối không log, không đưa mật khẩu vào console, URL, localStorage hoặc sessionStorage; tự động xóa trắng form ngay khi đổi mật khẩu thành công.
2. **Tích hợp API `PUT /api/users/change-password`**:
   - Tuân thủ 100% hợp đồng API từ `api/USER_API.md`.
   - Bắt và hiển thị lỗi cụ thể: Mật khẩu hiện tại không chính xác (`Old password is incorrect`), lỗi mật khẩu xác nhận không khớp, lỗi độ dài tối thiểu (< 6 ký tự).
   - Xử lý trạng thái loading khi đang gửi request (`isSubmitting = true`), vô hiệu hóa nút submit để ngăn chặn duplicate requests.
3. **Phân tích Cơ chế Phiên & An toàn Tài khoản (Session Behavior)**:
   - Theo hợp đồng backend, sau khi đổi mật khẩu thành công, PostgreSQL đặt `users.refresh_token = null` để đăng xuất phiên làm việc trên các thiết bị khác.
   - Thông báo rõ ràng cho người dùng về chính sách vô hiệu hóa phiên thiết bị khác.
   - Cung cấp tùy chọn "Đăng nhập lại ngay" để người dùng chủ động khởi tạo cặp token mới với mật khẩu mới nếu muốn.

---

## 2. Files Created & Modified

### Files Created:
* [`src/components/profile/account-security-card.tsx`](file:///d:/e-learning/src/components/profile/account-security-card.tsx): Component bảo mật tài khoản và form đổi mật khẩu với đầy đủ tính năng show/hide, password strength meter, validation và thông báo session behavior.
* [`docs/progress/F7_2_C_PASSWORD_CHANGE_SECURITY.md`](file:///d:/e-learning/docs/progress/F7_2_C_PASSWORD_CHANGE_SECURITY.md): Báo cáo triển khai F7.2-C.

### Files Modified:
* [`src/types/auth.ts`](file:///d:/e-learning/src/types/auth.ts): Bổ sung `ChangePasswordRequest` và `ChangePasswordResponse`.
* [`src/services/user.service.ts`](file:///d:/e-learning/src/services/user.service.ts): Bổ sung phương thức `changePassword(data: ChangePasswordRequest)`.
* [`src/app/profile/page.tsx`](file:///d:/e-learning/src/app/profile/page.tsx): Nhúng thẻ `AccountSecurityCard` vào cột chính của giao diện Profile.

---

## 3. API Endpoint & Payload Thực Tế Sử Dụng

### Endpoint & Method:
* **Method**: `PUT`
* **Endpoint**: `/api/users/change-password`
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Headers:
```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### Request Payload:
```json
{
  "oldPassword": "CurrentPassword123",
  "password": "NewSecretPassword456",
  "confirm_password": "NewSecretPassword456"
}
```

### Success Response:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Error Responses Handled:
1. **Sai mật khẩu cũ**:
   - HTTP 400: `{ "success": false, "message": "Old password is incorrect" }`
   - UI hiển thị cảnh báo: "Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại." và highlight ô nhập mật khẩu cũ.
2. **Mật khẩu xác nhận không khớp**:
   - HTTP 400: `{ "errors": { "confirm_password": "Passwords do not match" } }`
   - UI hiển thị lỗi ngay dưới ô xác nhận mật khẩu.
3. **Mật khẩu quá ngắn**:
   - Bị chặn bởi client-side validation (< 6 ký tự).
4. **Mật khẩu mới trùng mật khẩu cũ**:
   - Bị chặn bởi client-side validation: "Mật khẩu mới không được trùng với mật khẩu hiện tại."

---

## 4. Validation Rules

| Trường | Bắt buộc | Quy tắc xác thực | Phản hồi lỗi UI |
| :--- | :---: | :--- | :--- |
| `oldPassword` | Có | Tối thiểu 6 ký tự | "Vui lòng nhập mật khẩu hiện tại." / "Mật khẩu hiện tại phải có tối thiểu 6 ký tự." |
| `password` | Có | Tối thiểu 6 ký tự, khác `oldPassword` | "Vui lòng nhập mật khẩu mới." / "Mật khẩu mới không được trùng với mật khẩu hiện tại." |
| `confirm_password` | Có | Khớp chính xác 100% với `password` | "Mật khẩu xác nhận không khớp với mật khẩu mới." |

---

## 5. Session Behavior & Phân Tích An Toàn

1. **Hành vi phía Backend**:
   - Backend thực thi `bcrypt.compare` để đối chiếu mật khẩu cũ.
   - Khi hợp lệ, mã hóa mật khẩu mới bằng `bcryptjs` và cập nhật vào database.
   - **Đồng thời xóa `refreshToken = null` trong PostgreSQL** để thu hồi token làm mới trên mọi thiết bị khác.
2. **Hành vi phía Frontend**:
   - Access Token hiện tại trong bộ nhớ vẫn có hiệu lực cho đến khi hết hạn (khoảng 15 phút).
   - Tuy nhiên, vì Refresh Token đã bị xóa trên server, khi Access Token hết hạn, client sẽ không thể tự động refresh phiên mà bắt buộc phải đăng nhập lại.
   - Frontend hiển thị thông báo thành công rõ ràng:
     > "Mật khẩu của bạn đã được cập nhật thành công. Các phiên làm việc trên những thiết bị khác đã được vô hiệu hóa an toàn."
   - Kèm theo nút CTA **"Đăng nhập lại ngay"** để người dùng có thể chủ động xóa token cũ và đăng nhập lại ngay lập tức nếu muốn.

---

## 6. Backend Gaps

1. **Access Token Blacklist / Immediate Revocation**:
   - Backend TMDEMY sử dụng cơ chế stateless JWT mà không có Redis Token Blacklist. Do đó, Access Token đang lưu trên các thiết bị khác chỉ bị vô hiệu hóa hoàn toàn khi hết thời hạn sống (exp - 15 phút), chứ không bị hủy ngay lập tức tại thời điểm bấm đổi mật khẩu.
   - Chỉ có `refreshToken` là bị thu hồi ngay lập tức (`refreshToken = null`).

---

## 7. Kết Quả Kiểm Thử (Testing Results)

| Hạng mục kiểm tra | Phương thức | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **TypeScript Typecheck** | `cmd /c npx tsc --noEmit` | **PASS** | 0 lỗi kiểu dữ liệu. |
| **ESLint Validation** | `cmd /c npm run lint` | **PASS** | 0 lỗi linter (`account-security-card.tsx`, `profile/page.tsx`, `user.service.ts` sạch lỗi). |
| **Show/Hide Password** | Code review | **PASS** | Hoạt động độc lập cho từng ô mật khẩu qua icon `Eye`/`EyeOff`. |
| **Password Strength Meter** | Code review | **PASS** | Đánh giá độ mạnh theo độ dài, chữ hoa, số và ký tự đặc biệt. |
| **Form Validation & Mismatch** | Code review | **PASS** | Chặn submit khi thiếu thông tin, mật khẩu < 6 ký tự hoặc confirm password không khớp. |
| **Zero Sensitive Data Leaks** | Security audit | **PASS** | Không lưu mật khẩu vào storage hay log ra console/URL. |
| **Profile Edit & Avatar Compatibility** | Code review | **PASS** | Chức năng Edit Profile và Avatar Upload (F7.2-B) vẫn hoạt động hoàn toàn độc lập và ổn định. |

---

## 8. Những Phần Chưa Thực Hiện (Out of Scope)

* **F7.2-D — Favorite Courses**: Chưa thực hiện trong task này theo đúng giới hạn phạm vi.
* **Xác thực 2 yếu tố (2FA / OTP cho việc đổi mật khẩu)**: Backend hiện tại chưa có API 2FA cho endpoint đổi mật khẩu.

---

## 9. Next Recommended Task

* **Phase F7.2-D — Favorite Courses & Bookmarks**:
  * Tích hợp `GET /api/favorites`, `POST /api/favorites/:courseId`, `DELETE /api/favorites/:courseId`.
  * Hiển thị danh sách khóa học yêu thích trong Profile hoặc trang riêng.
