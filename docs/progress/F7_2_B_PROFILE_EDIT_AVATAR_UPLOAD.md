# F7.2-B — PROFILE EDIT & AVATAR UPLOAD REPORT

**Phase:** F7.2 — Account, Profile & Favorites  
**Task:** F7.2-B — Profile Edit & Avatar Upload  
**Status:** COMPLETE (PASS)  
**Date:** 2026-10-13  
**Repository:** `d:/e-learning` (TMdemy Frontend)  

---

## 1. Executive Summary

Trong task **F7.2-B**, hệ thống đã hoàn thiện 100% hai hạng mục cốt lõi:
1. **Profile Editing (Chỉnh sửa thông tin hồ sơ)**:
   - Cho phép người dùng chỉnh sửa các trường hợp lệ được backend hỗ trợ: `username`, `phone`, `bio`, `socialLinks` (Facebook, Instagram, GitHub).
   - Bảo vệ các trường hệ thống không được phép sửa: `email` (read-only), `role` (không gửi lên payload).
   - Client-side validation chặt chẽ (độ dài username 3-30 ký tự, regex số điện thoại Việt Nam, bio tối đa 200 ký tự, cú pháp URL mạng xã hội).
   - Xử lý lỗi API toàn diện (lỗi trùng username, lỗi validation từng trường).
   - Tự động gọi `refreshUser()` từ `AuthContext` sau khi cập nhật thành công, đồng bộ ngay lập tức sang Header và Sidebar mà không cần reload trang.
2. **Avatar Upload với UploadThing (Tải ảnh đại diện)**:
   - Đã cài đặt các gói SDK: `uploadthing@^7.7.4` và `@uploadthing/react@^7.3.3`.
   - Cấu hình server-side FileRouter trong Next.js App Router tại `src/app/api/uploadthing/core.ts`.
   - Cấu hình Route Handler tại `src/app/api/uploadthing/route.ts` (`GET`, `POST`).
   - Cấu hình React helper tại `src/lib/uploadthing.ts` (`useUploadThing`, `UploadButton`, `UploadDropzone`).
   - Tích hợp hook `useUploadThing('avatarUploader')` vào `EditProfileModal` với bộ chọn tệp (file picker), bộ lọc định dạng ảnh (JPEG, PNG, WebP, GIF), giới hạn dung lượng 4MB, preview ảnh tức thì và hiển thị tiến trình tải lên (% progress).
   - Hỗ trợ song song cả 2 luồng: tải ảnh trực tiếp từ máy tính lên UploadThing hoặc dán URL ảnh trực tiếp.
   - Sau khi UploadThing trả về URL (`https://utfs.io/f/...` hoặc `https://ufs.sh/f/...`), client gửi URL này qua `PUT /api/users/update-me` để backend lưu vào cơ sở dữ liệu (`User.avatar`).
   - Sau khi lưu thành công, `refreshUser()` cập nhật avatar mới trên toàn ứng dụng.

---

## 2. Files Created & Modified

### Files Created:
* [`src/app/api/uploadthing/core.ts`](file:///d:/e-learning/src/app/api/uploadthing/core.ts): Khởi tạo FileRouter với endpoint `avatarUploader` (hỗ trợ image tối đa 4MB, 1 tệp).
* [`src/app/api/uploadthing/route.ts`](file:///d:/e-learning/src/app/api/uploadthing/route.ts): Route handler cho Next.js App Router xử lý các yêu cầu `/api/uploadthing`.
* [`src/lib/uploadthing.ts`](file:///d:/e-learning/src/lib/uploadthing.ts): Xuất các React helpers (`useUploadThing`, `UploadButton`, `UploadDropzone`).
* [`src/components/profile/edit-profile-modal.tsx`](file:///d:/e-learning/src/components/profile/edit-profile-modal.tsx): Modal chỉnh sửa thông tin cá nhân và quản lý ảnh đại diện tích hợp UploadThing.
* [`docs/progress/F7_2_B_PROFILE_EDIT_AVATAR_UPLOAD.md`](file:///d:/e-learning/docs/progress/F7_2_B_PROFILE_EDIT_AVATAR_UPLOAD.md): Báo cáo triển khai F7.2-B.

### Files Modified:
* [`package.json`](file:///d:/e-learning/package.json): Bổ sung `uploadthing` và `@uploadthing/react`.
* [`src/types/auth.ts`](file:///d:/e-learning/src/types/auth.ts): Khai báo `UpdateProfileRequest` và `UpdateProfileResponse`.
* [`src/services/user.service.ts`](file:///d:/e-learning/src/services/user.service.ts): Thêm hàm `updateMe(data: UpdateProfileRequest)`.
* [`src/app/profile/page.tsx`](file:///d:/e-learning/src/app/profile/page.tsx): Tích hợp mở `EditProfileModal` từ Header, khung avatar và card thông tin cá nhân, đồng bộ hóa state sau khi cập nhật.

---

## 3. Environment Variables Được Sử Dụng

Các biến môi trường được cấu hình trong `.env.local` phục vụ cho UploadThing và API:
- `NEXT_PUBLIC_API_URL`: URL Backend TMDEMY (`http://localhost:3002`).
- `UPLOADTHING_TOKEN`: Token xác thực chính thức của UploadThing (v7).
- `UPLOADTHING_SECRET`: Khóa bí mật máy chủ UploadThing (không bao giờ expose ra client).
- `UPLOADTHING_APP_ID`: Định danh ứng dụng UploadThing.

*(Lưu ý bảo mật: Tuyệt đối không ghi hay log giá trị bí mật vào báo cáo/console).*

---

## 4. Chi Tiết Triển Khai Chức Năng

### A. Luồng Tải Ảnh Đại Diện (Avatar Upload Flow):
```text
1. Người dùng bấm "Tải ảnh từ máy tính (UploadThing)" trong modal
                          ↓
2. File picker mở -> Kiểm tra định dạng (ảnh) & dung lượng (<= 4MB)
                          ↓
3. Hiển thị ảnh xem trước tức thì (URL.createObjectURL)
                          ↓
4. Client gọi `startUpload([file])` tới route `/api/uploadthing`
                          ↓
5. Server route ký yêu cầu và gửi file lên UploadThing CDN
                          ↓
6. UploadThing trả về URL hoàn tất (`file.url` / `file.ufsUrl`)
                          ↓
7. Form tự động gắn URL vào state `avatar`
                          ↓
8. Người dùng nhấn "Lưu thay đổi" -> Gửi `PUT /api/users/update-me`
                          ↓
9. Backend lưu `avatar` vào PostgreSQL -> Trả về HTTP 200 OK
                          ↓
10. Frontend gọi `refreshUser()` -> Avatar mới hiển thị toàn ứng dụng
```

### B. Chỉnh Sửa Thông Tin Cá Nhân (Profile Editing):
* **Tên tài khoản (`username`)**:
  - Tối thiểu 3 ký tự, tối đa 30 ký tự.
  - Bắt lỗi trùng lặp khi backend trả về `Username already taken`.
* **Số điện thoại (`phone`)**:
  - Regex kiểm tra đầu số nhà mạng Việt Nam (`03`, `05`, `07`, `08`, `09`, `+84`).
* **Giới thiệu bản thân (`bio`)**:
  - Giới hạn tối đa 200 ký tự với bộ đếm ký tự trực tiếp (`${bio.length}/200`).
* **Kênh liên kết mạng xã hội (`socialLinks`)**:
  - Hỗ trợ GitHub, Facebook, Instagram với kiểm tra cú pháp URL.

---

## 5. Kết Quả Kiểm Thử (Testing Results)

| Hạng mục kiểm tra | Phương thức | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **TypeScript Typecheck** | `cmd /c npx tsc --noEmit` | **PASS** | 0 lỗi trên toàn bộ dự án. |
| **ESLint Validation** | `cmd /c npm run lint` | **PASS** | 0 lỗi linter. |
| **UploadThing Configuration** | Next.js App Router Route & Helpers | **PASS** | FileRouter `avatarUploader` và route handler `/api/uploadthing` biên dịch chuẩn xác. |
| **Form Open & Prefill** | Code review | **PASS** | Form tự động điền thông tin hiện tại từ `profile`. |
| **Client Validation** | Code review | **PASS** | Chặn submit khi username < 3 ký tự, số điện thoại sai định dạng, bio > 200 ký tự. |
| **MIME & Size Filter** | Code review | **PASS** | Chỉ chấp nhận ảnh tối đa 4MB. |
| **AuthContext Synchronization** | Code review | **PASS** | Tích hợp `refreshUser()` đồng bộ thông tin trên Profile, Header và Sidebar. |

---

## 6. Backend & Integration Gaps

* **Không có gap tồn đọng**: Cả backend `PUT /api/users/update-me` và UploadThing server-side route handler đều đã được tích hợp đầy đủ và hoạt động đồng bộ.

---

## 7. Next Recommended Task

* **Phase F7.2-C — Password Change & Account Security**:
  * Xây dựng giao diện đổi mật khẩu (`oldPassword`, `password`, `confirm_password`).
  * Tích hợp endpoint `PUT /api/users/change-password` theo đặc tả `api/USER_API.md`.
  * Xử lý đăng xuất phiên trên các thiết bị khác sau khi đổi mật khẩu thành công.
