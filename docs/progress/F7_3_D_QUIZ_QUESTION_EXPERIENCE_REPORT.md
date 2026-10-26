# TMdemy — F7.3-D Quiz & Question Experience Report

> **Document Type:** Audit, Implementation & Integration Verification Report  
> **Module:** Quiz & Question Experience (`/learn/[slug]` & Quiz Management)  
> **Status:** COMPLETED  
> **Author:** Frontend Engineering Agent  
> **Date:** 2026-10-13  

---

## 1. Existing Implementation Audit

Trước khi thực hiện phase **F7.3-D**, hệ thống đã có:
- Trực quan phòng học Classroom (`/learn/[slug]`) với danh sách chương/bài học, trình phát video và tabs tổng quan/thảo luận/ghi chú.
- Cơ chế xác thực và theo dõi tiến độ (`progressService`).

Tuy nhiên, phần **Quiz & Question** chưa được triển khai hoàn chỉnh trên frontend:
1. **Thiếu TypeScript Types:** Chưa có `src/types/quiz.ts` đặc tả cấu trúc `Quiz`, `Question`, `Option`, `Submission`.
2. **Thiếu API Service:** Chưa có `src/services/quiz.service.ts` để kết nối các endpoint `GET /api/quiz/lesson/:lessonId`, `GET /api/submissions/:quizId`, `POST /api/submissions/`.
3. **Thiếu UI Component:** Chưa có thành phần giao diện hiển thị câu hỏi, bảng chuyển câu hỏi (Question Palette), đồng hồ bấm giờ (Timer), màn hình xem lại (Review & Confirmation) trước khi nộp bài.
4. **Chưa tích hợp Classroom:** Học viên trong phòng học không thể biết bài học nào có Quiz và không có giao diện làm bài kiểm tra trong ngữ cảnh khóa học.

---

## 2. Quiz Route & Page Map

| Route / Vị trí | Mục đích | Cách tích hợp |
| :--- | :--- | :--- |
| `/learn/[slug]` (Tab `Bài kiểm tra`) | Học viên xem thông tin Quiz của bài học đang chọn, làm bài và xem lại đáp án. | Nhúng trực tiếp vào Workspace Tab của Classroom, giữ nguyên bối cảnh khóa học và không làm gián đoạn việc học. |
| `/learn/[slug]` (Action Bar Button) | Lối tắt nhanh vào Quiz | Nút `"Làm bài kiểm tra (X câu)"` hiển thị trên thanh công cụ video khi bài học có Quiz. |
| `/learn/[slug]` (Sidebar Curriculum) | Chỉ báo bài học có bài kiểm tra | Huy hiệu `"Quiz"` hiển thị cạnh bài học có bài kiểm tra đang được kích hoạt. |

---

## 3. Question Types Được Backend Hỗ Trợ

Dựa trên đối chiếu `api/QUESTION_API.md`, `api/QUIZ_API.md` và dữ liệu thực tế tại backend (`d:/e-learning_server`):

| Loại câu hỏi | Backend Type String | Cơ chế hiển thị & Nhập liệu Frontend | Trạng thái hỗ trợ |
| :--- | :---: | :--- | :---: |
| **Trắc nghiệm một lựa chọn (Single Choice)** | `multiple_choice` | Hiển thị các thẻ lựa chọn A, B, C, D với hiệu ứng hover, border active khi được chọn, radio icon và ký tự đại diện. | **HỖ TRỢ ĐẦY ĐỦ** |
| **Đúng / Sai (True / False)** | `multiple_choice` | Sử dụng cùng cơ chế `multiple_choice` với 2 lựa chọn (Đúng / Sai). | **HỖ TRỢ ĐẦY ĐỦ** |
| **Điền vào chỗ trống (Fill-in-the-blank)** | `fill_in_blank` | Trường nhập liệu văn bản rõ ràng với icon chỉnh sửa, hướng dẫn nhập chính xác để chấm điểm tự động. | **HỖ TRỢ ĐẦY ĐỦ** |
| **Coding Question** | Không có trong schema | Backend hiện tại **chưa hỗ trợ** `type: coding` trong Prisma Schema của bảng `Question`. | **KHÔNG HỖ TRỢ** |

---

## 4. API Contract Mapping

| Endpoint | Method | Contract Tài Liệu | File Triển Khai | Mô Tả & Tuân Thủ |
| :--- | :---: | :--- | :--- | :--- |
| `/api/quiz/lesson/:lessonId` | GET | `api/QUIZ_API.md` | `src/services/quiz.service.ts` | **Public**. Lấy danh sách quiz và câu hỏi. Đã kiểm tra: Tuân thủ quy tắc **Anti-Cheat** (không trả về trường `answer`). Xử lý 404 thành mảng rỗng thân thiện. |
| `/api/submissions/:quizId` | GET | `api/QUIZ_SUBMISSION_API.md` | `src/services/quiz.service.ts` | **JWT Required**. Học viên lấy kết quả bài làm trước đó của chính mình. Xử lý 404 khi chưa nộp bài. |
| `/api/submissions/` | POST | `api/QUIZ_SUBMISSION_API.md` | `src/services/quiz.service.ts` | **JWT Required**. Gửi `{ quizId, answers: [{ question, selectedAnswer }] }` để chấm điểm tự động. |

---

## 5. Features Đã Có Trước Đây

- Hệ thống AppShell, Sidebar, Layout chung.
- Quản lý trạng thái học viên (AuthContext).
- Tải danh sách khóa học, chương và bài học.
- Trình phát video bài giảng và tabs thảo luận / ghi chú / đánh giá.

---

## 6. Features Đã Bổ Sung Trong F7.3-D

1. **`src/types/quiz.ts`:**
   - Đặc tả chuẩn xác `ApiQuizQuestion`, `ApiQuizDetail`, `GetQuizByLessonResponse`, `QuizSubmissionPayload`, `QuizSubmissionAnswerPayload`, `ApiQuizSubmissionData`.
2. **`src/services/quiz.service.ts`:**
   - Cung cấp `getQuizByLesson` (bọc try/catch xử lý 404 không gây crash ứng dụng), `getMySubmission` và `submitQuiz`.
3. **`src/components/quiz/quiz-view.tsx` (Trải nghiệm Quiz toàn diện):**
   - **Màn hình Tổng quan (Overview):**
     - Tiêu đề Quiz, mô tả bài kiểm tra.
     - 4 thẻ thống kê: Số câu hỏi, Thời lượng (phút/tự do), Điểm đạt yêu cầu (%), Tổng điểm tối đa.
     - Huy hiệu lịch sử nộp bài (nếu học viên đã từng làm bài trước đó).
     - Nút `"Bắt đầu làm bài"` và `"Quay lại bài giảng"`.
   - **Màn hình Làm bài (Taking Quiz):**
     - Thanh Header: Tiêu đề, Timer đếm ngược (đổi màu cảnh báo khi còn dưới 3 phút), tiến độ (ví dụ: `2/2 câu (100%)`).
     - Thanh Progress bar mượt mà theo tỷ lệ số câu đã trả lời.
     - Khung hiển thị câu hỏi hiện tại: Số thứ tự câu, điểm của câu, huy hiệu loại câu hỏi, tiêu đề câu hỏi.
     - Khu vực câu trả lời:
       - Thẻ lựa chọn A, B, C, D cho `multiple_choice` với radio icon và trạng thái chọn.
       - Input field cho `fill_in_blank`.
     - Điều khiển điều hướng:
       - Nút `"← Câu trước"` (disabled ở câu đầu tiên).
       - Nút `"Câu tiếp theo →"` (chuyển thành `"Xem lại bài làm"` ở câu cuối cùng).
       - Nút `"Xóa câu trả lời"` để xóa lựa chọn câu hiện tại.
     - Bảng điều hướng câu hỏi (Question Palette):
       - Các nút số 1, 2, 3...
       - Phân biệt rõ ràng: Đang làm (tím), Đã trả lời (xanh ngọc lục bảo có dấu tích), Chưa trả lời (xám).
       - Click nhảy trực tiếp đến bất kỳ câu hỏi nào.
   - **Màn hình Xác nhận Trước Khi Nộp (Review Screen):**
     - Báo cáo số lượng câu đã làm vs chưa làm.
     - Cảnh báo rõ ràng nếu còn câu chưa trả lời.
     - Danh sách tóm tắt từng câu hỏi và đáp án đã chọn kèm nút `"Sửa câu này"` để quay lại sửa ngay.
     - Nút `"Tiếp tục làm bài"` và nút `"Xác nhận nộp bài"`.
   - **Màn hình Kết Quả Nộp Bài (Submission Result Screen):**
     - Hiển thị điểm số đạt được, tỷ lệ phần trăm, trạng thái Đạt / Chưa đạt chuẩn.
     - Nút `"Quay lại bài giảng"`.
4. **Tích hợp Classroom (`src/app/learn/[slug]/page.tsx`):**
   - Tự động nhận diện Quiz khi học viên chọn bài học.
   - Bổ sung Tab `"Bài kiểm tra"` kèm chỉ số số lượng câu và chấm xung nhịp (pulse indicator).
   - Bổ sung nút truy cập nhanh `"Làm bài kiểm tra (X câu)"` trong Action Bar.
   - Bảo vệ quyền truy cập: Học viên chưa ghi danh khóa học bị chặn đúng quy định qua `toast.warning`.

---

## 7. Bugs Đã Phát Hiện & Đã Sửa

| Bug ID | Mức độ | Mô tả lỗi | Giải pháp khắc phục | Trạng thái |
| :--- | :---: | :--- | :--- | :---: |
| **BUG-F73D-01** | **Low** | Lỗi TypeScript `TS2345` do biến `lessonId` trong closure `loadLessonQuiz` có kiểu `string \| undefined`. | Thu hẹp kiểu dữ liệu `const lessonId = activeLesson ? ... : undefined` và kiểm tra `if (!lessonId)` trong hàm async. | **FIXED** |
| **BUG-F73D-02** | **Low** | Lỗi ESLint `react-hooks/set-state-in-effect` khi gọi `setActiveQuiz(null)` đồng bộ ở đầu effect. | Di chuyển việc cập nhật state vào bên trong hàm callback bất đồng bộ `loadLessonQuiz()`. | **FIXED** |
| **BUG-F73D-03** | **Medium** | Người dùng truy cập bài học không có Quiz gặp lỗi 404 từ API backend. | Bổ sung xử lý lỗi 404 trong `quizService.getQuizByLesson` trả về `{ success: true, data: [] }` để UI hiển thị trạng thái trống thân thiện. | **FIXED** |

---

## 8. Files Created / Modified

- **Tạo mới:**
  - `src/types/quiz.ts` (108 lines): Đặc tả đầy đủ types cho Quiz, Question, Submission.
  - `src/services/quiz.service.ts` (68 lines): Service kết nối API Quiz & Submission.
  - `src/components/quiz/quiz-view.tsx` (550 lines): Component trải nghiệm Quiz toàn diện.
- **Chỉnh sửa:**
  - `src/app/learn/[slug]/page.tsx`: Tích hợp tải Quiz theo bài học, tab Bài kiểm tra, nút Action bar và hiển thị `QuizView`.

---

## 9. Testing Results

| Test Scenario | Loại Kiểm Thử | Kết Quả Mong Đợi | Kết Quả Thực Tế | Phân Loại |
| :--- | :--- | :--- | :--- | :---: |
| **TC-01: Tải thông tin Quiz từ backend** | API Integration Test | Gọi `GET /api/quiz/lesson/:lessonId` trả về thông tin Quiz và danh sách câu hỏi. | Lấy chính xác Quiz của bài học `6c1007a1-42e7-56db-ab5a-ae55cf9ebe16` gồm 2 câu hỏi trắc nghiệm. | **PASS** |
| **TC-02: Quy tắc bảo mật Anti-Cheat** | Code Review & API Test | Response không chứa trường `answer`. | Xác nhận 100% options không lộ đáp án đúng trong network payload. | **PASS** |
| **TC-03: Bài học không có Quiz** | API & Browser Test | Hiển thị màn hình thông báo thân thiện, không báo lỗi đỏ. | Hiển thị card "Bài học này chưa có bài kiểm tra" kèm nút quay lại nội dung bài học. | **PASS** |
| **TC-04: Hiển thị Overview Screen** | Browser Test | Hiển thị số câu, thời lượng, điểm đạt, tổng điểm và nút Bắt đầu. | Hiển thị đầy đủ 4 thẻ thống kê và nút Bắt đầu làm bài mượt mà. | **PASS** |
| **TC-05: Chặn học viên chưa ghi danh** | Browser Test | Không cho làm bài nếu chưa ghi danh khóa học. | Hiển thị toast cảnh báo: "Vui lòng ghi danh khóa học để tham gia làm bài kiểm tra". | **PASS** |
| **TC-06: Điều hướng câu hỏi & Chọn đáp án** | Browser Test | Lưu đáp án đã chọn, cập nhật bảng palette và thanh tiến trình. | Nhảy giữa các câu hỏi giữ nguyên đáp án đã chọn, palette cập nhật màu xanh khi đã trả lời. | **PASS** |
| **TC-07: Màn hình Review xác nhận** | Browser Test | Hiển thị tổng kết số câu đã làm và danh sách chi tiết. | Cho phép học viên xem lại toàn bộ bài làm và quay lại sửa câu chưa chắc chắn. | **PASS** |
| **TC-08: Nộp bài kiểm tra** | API Integration Test | Gửi payload đúng format lên `POST /api/submissions/`. | Payload khớp 100% schema backend `QuizSubmissionPayload`. | **PASS** |
| **TC-09: TypeScript Typecheck** | Automated Check | `npx tsc --noEmit` không có lỗi. | Exit code: 0 (0 errors). | **PASS** |
| **TC-10: ESLint Code Quality** | Automated Check | `npm run lint` không có lỗi. | Exit code: 0 (0 errors). | **PASS** |

---

## 10. Backend Gaps

1. **`[BACKEND GAP] Thiếu Coding Question Type`:**
   - Backend hiện chỉ hỗ trợ `multiple_choice` và `fill_in_blank`. Nếu trong tương lai cần câu hỏi lập trình (coding question), backend cần bổ sung schema và bộ sandbox chấm code.
2. **`[BACKEND GAP] Chính sách 1 lần nộp bài (Single Submission Policy)`:**
   - Backend áp dụng ràng buộc `@@unique([quizId, userId])` trong database. Học viên chỉ được nộp bài một lần duy nhất. Frontend đã bổ sung hiển thị lịch sử bài nộp trước đó để học viên không bị bối rối khi thấy thông báo bài đã nộp.

---

## 11. Remaining Issues

- Không có lỗi tồn đọng trên frontend trong phạm vi F7.3-D.
- Phần quản lý bài nộp nâng cao cho Giảng viên (Teacher Analytics & Review) và trang xem lại bài thi chi tiết sẽ tiếp tục được hoàn thiện trong phase **F7.3-E — Quiz Submission, Evaluation & Results**.

---

## 12. Đề Xuất Bước Tiếp Theo (F7.3-E)

Sau khi user review và nghiệm thu F7.3-D, tiến hành phase **F7.3-E — Quiz Submission, Evaluation & Results**:
1. Hoàn thiện trang chi tiết kết quả bài nộp của học viên (`GET /api/submissions/:quizId`) với đáp án giải thích từng câu hỏi đúng/sai.
2. Cập nhật tích hợp tiến độ khóa học: Khi Quiz đạt điểm yêu cầu (`passed === true`), tự động kích hoạt đánh dấu hoàn thành bài học tương ứng trên Learning Progress.
3. Màn hình phân tích kết quả bài kiểm tra dành cho Giảng viên (`GET /api/submissions/teacher/analytics/:quizId`).
