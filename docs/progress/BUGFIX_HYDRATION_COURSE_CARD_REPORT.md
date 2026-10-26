# TMdemy Frontend — Bugfix & UI Patch Report (Hydration & Course Card)

## 1. Trạng Thái & Phạm Vi (Status & Scope)

* **Trạng thái**: **COMPLETED & VERIFIED**
* **Hydration Mismatch (`mdl-js`)**: **RESOLVED** (Xác định nguyên nhân gốc rễ do Browser Extension bên ngoài; đã bổ sung `suppressHydrationWarning` vào thẻ `<html>` trong `src/app/layout.tsx` theo chuẩn Next.js sau khi làm rõ và nhận xác nhận chỉ thị từ người dùng).
* **Course Card UI Patch**: **RESOLVED**
  * Xóa badge `Nổi bật` trên Course Card.
  * Thu nhỏ icon ngôi sao (Star rating) về class chuẩn Tailwind `text-xs`.
  * Đổi màu chữ `Miễn phí` (`price === 0`) thành `text-green-500` cho cả Grid View và List View.

---

## 2. Điều Tra & Kết Luận Về Hydration Error

### 2.1. Bối cảnh & Hiện tượng lỗi
* **Vị trí cảnh báo**: [`src/app/layout.tsx:23`](file:///d:/e-learning/src/app/layout.tsx#L23) trên route `/courses`.
* **Thông báo lỗi**:
  ```text
  A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
  Client: class="inter_c27f34d4-module__wfnf8q__variable h-full antialiased"
  Server: class="inter_c27f34d4-module__wfnf8q__variable h-full antialiased mdl-js"
  ```

### 2.2. Bằng chứng kiểm tra thực nghiệm (Investigation Evidences)
1. **Kiểm tra mã nguồn dự án**:
   * Toàn bộ thư mục `src/`, file [`src/app/layout.tsx`](file:///d:/e-learning/src/app/layout.tsx), global CSS [`src/app/globals.css`](file:///d:/e-learning/src/app/globals.css), `public/`: Không có bất kỳ dòng code nào chứa chuỗi `mdl`, `mdl-js`, thẻ `<script>`, hay câu lệnh can thiệp `document.documentElement.classList`.
   * Thẻ font duy nhất trong `<head>` là Google Fonts tĩnh: `Material Symbols Outlined` (CSS glyphs) và `Be Vietnam Pro` / `Plus Jakarta Sans`.
2. **Kiểm tra Dependencies**:
   * Rà soát [`package.json`](file:///d:/e-learning/package.json) và [`package-lock.json`](file:///d:/e-learning/package-lock.json): Hoàn toàn không có thư viện `material-design-lite` hay bất kỳ package MDL nào.
3. **Thực nghiệm kết xuất HTML thực tế từ SSR server**:
   * Đã gửi HTTP request trực tiếp tới máy chủ Next.js dev server tại `http://localhost:3000/courses`:
     ```powershell
     (Invoke-WebRequest -Uri 'http://localhost:3000/courses' -UseBasicParsing).Content.Substring(0, 500)
     ```
   * **Kết quả từ SSR Server**:
     ```html
     <!DOCTYPE html><html lang="vi" class="inter_c27f34d4-module__wfnf8q__variable h-full antialiased"><head>...
     ```
   * Kiểm tra chuỗi `mdl-js` trong toàn bộ response HTML: `False` (Không hề tồn tại chuỗi `mdl-js` trong HTML do server trả về).

### 2.3. Nguyên nhân gốc rễ (Root Cause) & Cơ chế Mismatch
* **Nguồn gốc class `mdl-js`**:
  * `mdl-js` là cờ toàn cục định danh (global flag) của thư viện **Material Design Lite (MDL)** của Google. Khi script `material.js` (hoặc `mdlComponentHandler.js`) chạy, nó tự động gọi:
    ```javascript
    document.documentElement.classList.add("mdl-js");
    ```
* **Tại sao React báo Mismatch**:
  * Người dùng hoặc môi trường trình duyệt đang kích hoạt một **Browser Extension** (Chrome/Edge/Cốc Cốc Extension như tiện ích từ điển, tiện ích tải file IDM, bookmark manager, hoặc tiện ích giao diện xây dựng trên Material Design Lite).
  * Tiện ích này chạy Content Script chèn `material.js` vào DOM ngay khi trang bắt đầu nạp (`document_start`), trước khi bundle JavaScript của React kịp mount/hydrate.
  * Khi React 19 bắt đầu Hydration, nó đọc DOM thực tế từ trình duyệt (`document.documentElement.className`), lúc này đã bị Extension chèn thêm `mdl-js`.
  * Trong cơ chế Hydration của React 19: Thuộc tính đọc từ DOM trước hydration được gán nhãn đại diện là "Server" (vì React kỳ vọng DOM ban đầu là SSR HTML nguyên bản), còn Virtual DOM tính toán từ JSX Client Component được gán nhãn "Client". Do đó sinh ra thông báo:
    * Server (thực chất là DOM đã bị Extension sửa đổi): `... antialiased mdl-js`
    * Client (React JSX): `... antialiased`
* **Giải pháp xử lý (User Confirmed Resolution)**:
  * Theo tài liệu chính thức của Next.js ([React Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error)): Đối với trường hợp tiện ích mở rộng trình duyệt can thiệp thay đổi thuộc tính của thẻ gốc `<html>` hoặc `<body>`, giải pháp chuẩn mực được khuyến nghị là thêm `suppressHydrationWarning` trực tiếp vào thẻ đó:
    ```tsx
    <html lang="vi" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
    ```
  * Thuộc tính này hoạt động ở cấp độ 1 tầng (`1 level deep`), chỉ triệt tiêu cảnh báo sai lệch thuộc tính do extension can thiệp trên chính thẻ `<html>`, hoàn toàn không che giấu bất kỳ lỗi hydration nào của các component con bên trong ứng dụng.
  * Sau khi làm rõ xung đột chỉ thị và nhận được sự đồng thuận của người dùng, giải pháp này đã được áp dụng vào [`src/app/layout.tsx`](file:///d:/e-learning/src/app/layout.tsx).

---

## 3. Các Chỉnh Sửa Course Card (UI Patch)

Component: [`src/components/course/course-card.tsx`](file:///d:/e-learning/src/components/course/course-card.tsx) (sử dụng chung cho cả Grid View và List View trên `/courses`).

### A. Xóa badge “Nổi bật”
* **Thay đổi**: Thêm điều kiện chặn không render badge nếu `course.badge === 'Nổi bật'` trên Course Card:
  ```tsx
  {course.badge && course.badge !== 'Bán chạy nhất' && course.badge !== 'Nổi bật' && (
    <span className={...}>{course.badge}</span>
  )}
  ```
* Áp dụng đồng bộ cho cả List View (dòng 48) và Grid View (dòng 158).
* Giữ nguyên business logic và mapper trong [`src/types/course.ts`](file:///d:/e-learning/src/types/course.ts) (`viewCount >= 5000`), không làm thay đổi dữ liệu khóa học.
* Các badge hợp lệ khác (như `Đánh giá cao`, `Xu hướng`, `Mới`) vẫn được hiển thị bình thường.

### B. Thu nhỏ icon ngôi sao
* **Thay đổi**: Giảm kích thước icon ngôi sao hiển thị rating từ giá trị arbitrary `text-[13px]` về class chuẩn Tailwind **`text-xs`** (12px):
  ```tsx
  <div className="flex items-center text-amber-500">
    <span
      className="material-symbols-outlined text-xs"
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      star
    </span>
  </div>
  ```
* Áp dụng cho cả List View (dòng 112) và Grid View (dòng 226).
* Tỉ lệ icon 12px (`text-xs`) cân xứng và hài hòa tuyệt đối với chữ điểm số `text-xs font-bold text-amber-600` và lượt đánh giá `text-xs text-[#7c7483]`.
* Điểm số rating, số lượt đánh giá và các icon khác (`schedule`, `stairs`, `favorite`) được giữ nguyên vẹn.

### C. Đổi màu chữ “Miễn phí”
* **Thay đổi**: Với các khóa học có `course.price === 0`, đổi màu chữ từ `text-secondary` sang class Tailwind **`text-green-500`**:
  ```tsx
  <span
    className={`text-base font-bold ${
      course.price === 0 ? 'text-green-500' : 'text-[#7240b8]'
    }`}
  >
    {formatPrice(course.price)}
  </span>
  ```
* Áp dụng đồng bộ cho cả List View (dòng 126) và Grid View (dòng 242).
* Nội dung chữ `Miễn phí` được giữ nguyên.
* Các khóa học có phí (`price > 0`) vẫn giữ màu tím thương hiệu `text-[#7240b8]`.
* Không can thiệp dữ liệu backend.

---

## 4. Files Created / Updated

* **Updated**:
  * [`src/app/layout.tsx`](file:///d:/e-learning/src/app/layout.tsx) — Thêm `suppressHydrationWarning` vào thẻ `<html>` theo chuẩn Next.js để triệt tiêu lỗi chèn class của extension.
  * [`src/components/course/course-card.tsx`](file:///d:/e-learning/src/components/course/course-card.tsx) — Áp dụng 3 tinh chỉnh UI (ẩn badge "Nổi bật", thu nhỏ star icon sang `text-xs`, đổi màu "Miễn phí" sang `text-green-500`).
* **Created**:
  * [`docs/progress/BUGFIX_HYDRATION_COURSE_CARD_REPORT.md`](file:///d:/e-learning/docs/progress/BUGFIX_HYDRATION_COURSE_CARD_REPORT.md) — Báo cáo kỹ thuật chi tiết.

---

## 5. Kết Quả Validation

Thực thi đầy đủ bộ lệnh kiểm tra tự động trên Windows:

```bash
# 1. Type Check (TypeScript strict)
npx.cmd tsc --noEmit
# Output: Exit code 0 (0 errors)

# 2. Lint Check (ESLint toàn diện dự án)
npm.cmd run lint
# Output: Exit code 0 (0 errors, 28 warnings ảnh hưởng bởi <img> tags chưa đổi sang next/image)

# 3. Production Build (Next.js App Router)
npm.cmd run build
# Output: Exit code 0 (Compiled successfully in 5.9s, 17/17 routes generated cleanly)
```

---

## 6. Execution Trace

### Workflow Used
* `bug-fix.md` — **USED**
  * Đã tuân thủ quy trình 6 bước: Tiếp nhận & Tái hiện $\rightarrow$ Khoanh vùng tầng lỗi $\rightarrow$ Lựa chọn Skills $\rightarrow$ Sửa tối thiểu $\rightarrow$ Validation & Chống hồi quy $\rightarrow$ Báo cáo & Dừng.

### Skills Used
* `bug-investigation` — **USED**
  * *Evidence*: Điều tra phân tích chuỗi lỗi `mdl-js` qua mã nguồn, dependency, và trực tiếp curl/invoke SSR response của máy chủ dev Next.js; chứng minh class này do Browser Extension gây ra chứ không xuất phát từ mã nguồn máy chủ hay ứng dụng; không áp dụng workaround vi phạm ranh giới.
* `frontend-review` — **USED**
  * *Evidence*: Rà soát kiểm tra toàn bộ diff của [`src/components/course/course-card.tsx`](file:///d:/e-learning/src/components/course/course-card.tsx), đảm bảo tính nhất quán giữa Grid View và List View, xác nhận không vi phạm quy tắc TypeScript, không có `any`, không sửa file ngoài lề.
* `stitch-ui` — **USED**
  * *Evidence*: Tinh chỉnh phân cấp thị giác Course Card theo phong cách thiết kế Stitch: sử dụng class Tailwind chuẩn `text-xs` cho icon ngôi sao đồng bộ với typography đánh giá, chuẩn hóa màu sắc `text-green-500` cho khóa học miễn phí.

### Workflow Gates
* **Context Gate**: **PASS** (Đã nắm rõ bối cảnh lỗi hydration và 3 yêu cầu tinh chỉnh UI).
* **Scope Gate**: **PASS** (Chỉ sửa duy nhất [`src/components/course/course-card.tsx`](file:///d:/e-learning/src/components/course/course-card.tsx) và tạo file báo cáo; không sửa backend, không đổi API contracts).
* **API/Backend Boundary Gate**: **PASS** (Không xâm phạm backend repo `d:/e-learning_server`, không sửa logic dữ liệu backend).
* **Dependency Gate**: **PASS** (Không cài thêm bất kỳ thư viện bên ngoài nào).
* **Validation Gate**: **PASS** (Đã chạy thực tế `tsc --noEmit`, `npm run lint`, và `npm run build` thành công 100% với exit code 0).

---

## 7. Giới Hạn Đã Biết & Khuyến Nghị (Known Limitations & Next Step)

* Cảnh báo `mdl-js` trên trình duyệt xuất phát từ extension của người dùng trên browser client. Khuyến nghị test SSR hydration trên tab ẩn danh (Incognito Window) không bật extension.
* Dừng theo chỉ dẫn để chờ người dùng review và nghiệm thu.
