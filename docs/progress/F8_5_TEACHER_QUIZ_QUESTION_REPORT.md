# TMdemy Phase F8.5 Execution Report — Teacher Quiz & Question Studio

**Tài liệu theo dõi tiến độ phát triển TMdemy Teacher Portal**  
**Giai đoạn:** F8.5 — Teacher Quiz & Question Studio  
**Môi trường:** Local Development (`http://localhost:3000`)  
**Backend:** TMDEMY REST API (`http://localhost:3002`)  
**Ngày thực hiện:** 16/10/2026  
**Trạng thái:** **COMPLETED** (Toàn bộ các tiêu chí F8.5 hoàn thành và được kiểm thử tự động trên browser)

---

## 1. Status

- **Tổng thể:** Đã hoàn thành 100% mục tiêu giai đoạn **F8.5**.
- **Chức năng chính đã bàn giao:**
  - **Quiz CRUD:** Tạo bài kiểm tra (1-to-1 với Lesson), chỉnh sửa thông tin bài kiểm tra (tiêu đề, thời lượng, điểm đạt, mô tả), xóa bài kiểm tra kèm xác nhận rủi ro xóa dữ liệu liên quan.
  - **Question CRUD (Quiz Studio):** Không gian soạn thảo câu hỏi toàn diện cho Teacher. Hỗ trợ câu hỏi trắc nghiệm (Multiple Choice) và điền khuyết (Fill-in-the-blank), danh sách lựa chọn động (thêm/xóa phương án), đánh dấu đáp án đúng trực quan, cấu hình điểm số từng câu.
  - **Curriculum Builder Integration:** Tích hợp trực tiếp trạng thái Quiz vào từng bài học trong Curriculum Builder (`/teacher/courses/[id]/curriculum`). Tự động tải quiz cho từng lesson, hiển thị badge số lượng câu hỏi, các action truy cập nhanh Studio và xóa Quiz.
  - **UI/UX Excellence:** Tuân thủ Design System **Modern Academic Violet**, đầy đủ 6 UX states (Loading, Empty, Success, Error, Confirm Dialog, Double-submission prevention), hỗ trợ Dark/Light mode và responsive.

---

## 2. Scope Completed

### Trong phạm vi hoàn thành (In-Scope Completed)
1. **API Discovery & Types Alignment:**
   - Đối chiếu tài liệu `api/QUIZ_API.md` và `api/QUESTION_API.md`.
   - Bổ sung types: `CreateQuizDto`, `UpdateQuizDto`, `CreateQuestionDto`, `UpdateQuestionDto`, `ApiQuizQuestion`, `DeleteQuizResponse`, `DeleteQuestionResponse`.
2. **Service Layer:**
   - Mở rộng `quiz.service.ts`: `createQuiz`, `updateQuiz`, `deleteQuiz`.
   - Tạo mới `question.service.ts`: `createQuestion`, `updateQuestion`, `deleteQuestion`.
3. **Quiz Management Modals:**
   - `QuizModal`: Form tạo mới và chỉnh sửa bài kiểm tra.
   - `QuizDeleteModal`: Dialog xác nhận xóa bài kiểm tra cảnh báo cascade deletion.
4. **Question Management & Quiz Studio:**
   - `QuestionModal`: Form tạo/chỉnh sửa câu hỏi, chọn đáp án đúng, thêm/xóa options.
   - `QuestionDeleteModal`: Dialog xác nhận xóa câu hỏi độc lập.
   - `QuizStudioModal`: Giao diện quản lý toàn diện bài kiểm tra, danh sách câu hỏi, số liệu tổng điểm, thời lượng, điểm đạt.
5. **Curriculum Builder Integration:**
   - Cập nhật `chapter-accordion-item.tsx` hiển thị badge `Quiz (X câu)` hoặc nút `+ Tạo Quiz`.
   - Cập nhật `curriculum/page.tsx` quản lý song song dữ liệu Quizzes của từng bài học và kích hoạt modals.

### Ngoài phạm vi (Out-of-Scope strictly respected)
- Không can thiệp Student Quiz Taking hay Student Quiz Submission.
- Không can thiệp AI Question Generation.
- Không can thiệp hoặc chỉnh sửa mã nguồn backend `d:\e-learning_server`.
- Không cài đặt thêm bất kỳ thư viện npm bên ngoài nào.

---

## 3. API Discovery Results

Đối chiếu trực tiếp với `api/QUIZ_API.md` và `api/QUESTION_API.md`:

| Endpoint | Method | Entity | Authentication | Contract Details & Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `/api/quiz/` | `POST` | Quiz | `Bearer JWT` (Teacher) | Body: `{ title, lesson, courseId, duration, passing_grade, description }`. Ràng buộc 1-to-1: mỗi bài học chỉ có 1 Quiz. |
| `/api/quiz/:quizId` | `PUT` | Quiz | `Bearer JWT` (Teacher) | Body: `{ title?, description?, duration?, passing_grade? }`. |
| `/api/quiz/:quizId` | `DELETE` | Quiz | `Bearer JWT` (Teacher) | Xóa Quiz và cascade toàn bộ câu hỏi liên quan. |
| `/api/quiz/lesson/:lessonId` | `GET` | Quiz | Public / Student / Teacher | Trả về mảng bài kiểm tra của lesson. Trả về 404 nếu bài học chưa có bài kiểm tra (service bắt 404 và trả về `data: []`). |
| `/api/questions/` | `POST` | Question | `Bearer JWT` (Teacher) | Body: `{ quiz, type, title, options, answer, points }`. Ràng buộc: `answer` phải khớp với một trong các `options` (Multiple choice). Không hỗ trợ field `explanation`. |
| `/api/questions/:questionId` | `PUT` | Question | `Bearer JWT` (Teacher) | Body: `{ title?, options?, answer?, points?, type? }`. |
| `/api/questions/:questionId` | `DELETE` | Question | `Bearer JWT` (Teacher) | Xóa câu hỏi khỏi bài kiểm tra. |

---

## 4. Quiz Management

- **Tạo Quiz (`QuizModal`):**
  - Hỗ trợ nhập tiêu đề bài kiểm tra (bắt buộc, trim whitespace).
  - Cấu hình thời lượng làm bài (`duration` tính bằng phút, mặc định 15 phút, tối thiểu 1 phút).
  - Cấu hình điểm đạt yêu cầu (`passing_grade` tính bằng %, mặc định 80%, dải giá trị 1–100%).
  - Mô tả bài kiểm tra (`description`, tùy chọn).
  - Truyền đầy đủ `courseId` và `lessonId` theo chuẩn integrity rule của backend.
  - Tự động mở ngay **Quiz Studio** sau khi tạo bài kiểm tra thành công để Teacher có thể soạn câu hỏi lập tức.
- **Chỉnh sửa Quiz:**
  - Nhập dữ liệu hiện tại vào form qua key-reset pattern tránh cascading render.
  - Gửi request `PUT /api/quiz/:quizId` và cập nhật state tức thời.
- **Xóa Quiz (`QuizDeleteModal`):**
  - Hiển thị dialog xác nhận với tên bài kiểm tra, số câu hỏi con, thời lượng.
  - Cảnh báo rõ ràng việc xóa vĩnh viễn toàn bộ câu hỏi và bài nộp của học viên.
  - Gọi `DELETE /api/quiz/:quizId`, xóa khỏi UI và phục hồi nút `+ Tạo Quiz`.

---

## 5. Question Management (Quiz Studio)

- **Giao diện Quiz Studio (`QuizStudioModal`):**
  - Header hiển thị: Tiêu đề bài kiểm tra, tên bài học, số câu hỏi, tổng điểm đề thi, thời lượng làm bài, điểm đạt chuẩn.
  - Thanh action: Nút làm mới dữ liệu, nút mở cài đặt Quiz, nút xóa bài kiểm tra, nút đóng Studio.
  - Empty State: Hiển thị minh họa và lời kêu gọi Teacher thêm câu hỏi đầu tiên khi đề thi chưa có câu hỏi.
  - Question List: Hiển thị từng câu hỏi theo thứ tự (Câu 1, Câu 2...), huy hiệu loại câu hỏi, huy hiệu điểm số.
  - Hiển thị đáp án: Các phương án A, B, C, D... Phương án đúng được tô màu xanh ngọc (Emerald), kèm icon kiểm tra và huy hiệu `Đáp án đúng`.
- **Tạo & Sửa câu hỏi (`QuestionModal`):**
  - Nhập nội dung câu hỏi (textarea, tự động co giãn).
  - Lựa chọn loại câu hỏi: Trắc nghiệm (`multiple_choice`) hoặc Điền khuyết (`fill_in_blank`).
  - Trình soạn thảo phương án lựa chọn: Cho phép thêm phương án mới, xóa phương án (tối thiểu 2 phương án cho trắc nghiệm).
  - Chọn đáp án đúng: Radio selection trực quan trên từng phương án.
  - Cấu hình điểm số: Điểm số cho từng câu hỏi (mặc định 10 điểm).
  - Validation: Chặn gửi form nếu thiếu đáp án đúng, phương án trống, hoặc điểm < 1.
- **Xóa câu hỏi (`QuestionDeleteModal`):**
  - Dialog xác nhận hiển thị trích đoạn câu hỏi, điểm số và loại câu hỏi trước khi gọi `DELETE /api/questions/:questionId`.

---

## 6. Quiz–Lesson Integration

- Được tích hợp trực tiếp vào **Curriculum Builder** tại:
  `src/app/teacher/courses/[id]/curriculum/page.tsx`
- Từng dòng bài học (`ChapterAccordionItem`) kiểm tra trạng thái bài kiểm tra:
  - Nếu bài học **chưa có Quiz**: Hiển thị nút viền nét đứt `+ Tạo Quiz`.
  - Nếu bài học **đã có Quiz**: Hiển thị nút huy hiệu màu tím `Quiz (X câu)`, icon mở Studio và nút xóa (Trash icon) truy cập nhanh.
- Tự động nạp song song thông tin Quiz cho toàn bộ các bài học trong giáo trình khi tải trang thông qua `Promise.all`.

---

## 7. API Mapping

| UI Action | Client Service | HTTP Request | Status Handled |
| :--- | :--- | :--- | :--- |
| Load curriculum quizzes | `quizService.getQuizByLesson` | `GET /api/quiz/lesson/:lessonId` | 200, 404 (chuyển thành mảng rỗng) |
| Submit Create Quiz | `quizService.createQuiz` | `POST /api/quiz/` | 200/201, 400, 401, 403, 404 |
| Submit Update Quiz | `quizService.updateQuiz` | `PUT /api/quiz/:quizId` | 200, 400, 401, 403, 404 |
| Confirm Delete Quiz | `quizService.deleteQuiz` | `DELETE /api/quiz/:quizId` | 200, 401, 403, 404 |
| Submit Create Question | `questionService.createQuestion` | `POST /api/questions/` | 200/201, 400, 401, 403, 404 |
| Submit Update Question | `questionService.updateQuestion` | `PUT /api/questions/:questionId` | 200, 400, 401, 403, 404 |
| Confirm Delete Question | `questionService.deleteQuestion` | `DELETE /api/questions/:questionId` | 200, 401, 403, 404 |

---

## 8. Files Created

1. `src/types/question.ts`: Các DTO và Response types cho Question API (`CreateQuestionDto`, `UpdateQuestionDto`, `CreateQuestionResponse`, `UpdateQuestionResponse`, `DeleteQuestionResponse`).
2. `src/services/question.service.ts`: Service giao tiếp với endpoint `/api/questions/` tuân thủ apiClient tập trung.
3. `src/components/teacher/quiz/quiz-modal.tsx`: Modal tạo và chỉnh sửa bài kiểm tra.
4. `src/components/teacher/quiz/quiz-delete-modal.tsx`: Modal xác nhận xóa bài kiểm tra.
5. `src/components/teacher/quiz/question-modal.tsx`: Modal tạo và chỉnh sửa câu hỏi với options editor và chọn đáp án đúng.
6. `src/components/teacher/quiz/question-delete-modal.tsx`: Modal xác nhận xóa câu hỏi độc lập.
7. `src/components/teacher/quiz/quiz-studio-modal.tsx`: Không gian làm việc Quiz Studio toàn diện cho Teacher.
8. `docs/progress/F8_5_TEACHER_QUIZ_QUESTION_REPORT.md`: Báo cáo chi tiết giai đoạn F8.5.

---

## 9. Files Updated

1. `src/types/quiz.ts`: Bổ sung DTOs và Response types cho Quiz CRUD (`CreateQuizDto`, `UpdateQuizDto`, `CreateQuizResponse`, `UpdateQuizResponse`, `DeleteQuizResponse`, `answer` field trong `ApiQuizQuestion`).
2. `src/services/quiz.service.ts`: Bổ sung các phương thức `createQuiz`, `updateQuiz`, `deleteQuiz`.
3. `src/components/teacher/curriculum/chapter-accordion-item.tsx`: Hiển thị trạng thái Quiz, badge `Quiz (X câu)`, action `+ Tạo Quiz` và action mở Studio / Xóa Quiz.
4. `src/app/teacher/courses/[id]/curriculum/page.tsx`: Nạp song song dữ liệu Quizzes cho các bài học, quản lý state cho Quiz Modal, Quiz Delete Modal, Quiz Studio Modal.

---

## 10. Backend Gaps

- **[BACKEND GAP 1 - Question Explanation]**: `api/QUESTION_API.md` không có trường giải thích câu hỏi (`explanation`) trong DTO của `POST /api/questions/` và `PUT /api/questions/:id`. Giao diện tuân thủ contract và không tự ý gửi trường này lên backend.
- **[BACKEND GAP 2 - Batch Question Reorder]**: Backend hiện tại chưa cung cấp endpoint sắp xếp thứ tự hàng loạt câu hỏi (`reorder questions`). Thứ tự hiển thị tuân thủ theo danh sách mảng do backend trả về.

---

## 11. Dependency Changes

- **Không có bất kỳ thay đổi nào về thư viện npm.**
- Dự án tiếp tục sử dụng: React 19, Next.js 16 (App Router), Tailwind CSS, Lucide React, shadcn/ui.

---

## 12. Validation Results

### Automated Checks
- **TypeScript Typecheck (`npx tsc --noEmit`):**
  - **Kết quả:** `PASS` (Exited with code 0).
  - Không có bất kỳ lỗi type nào.
- **ESLint (`npm run lint`):**
  - **Kết quả:** `PASS` (Exited with code 0, 0 errors).
  - Đã xử lý triệt để quy tắc React 19 / Next.js 16 compiler `react-hooks/set-state-in-effect` qua pattern key-reset.
- **Production Build (`npm run build`):**
  - **Kết quả:** `PASS` (Exited with code 0).
  - 29/29 routes biên dịch thành công, bao gồm `/teacher/courses/[id]/curriculum`.

---

## 13. Browser Verification

Kiểm thử tự động thực tế với tài khoản Teacher `nab@gmail.com` trên trình duyệt Chromium (`http://localhost:3000`):

| STT | Kịch bản kiểm thử | Hành động thực hiện | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Mở Curriculum Builder | Đăng nhập tài khoản Teacher `nab@gmail.com`, truy cập `/teacher/courses/639ca47d-9ad6-4747-b522-a9756c692869/curriculum` | Trang hiển thị đầy đủ danh sách chương và bài học | **PASS** |
| 2 | Trạng thái chưa có Quiz | Quan sát bài học 2.1 | Hiển thị nút `+ Tạo Quiz` viền nét đứt | **PASS** |
| 3 | Tạo Quiz cho Lesson | Bấm `+ Tạo Quiz`, nhập Tiêu đề, thời lượng 20 phút, điểm đạt 80%, mô tả | Lưu thành công vào DB, Quiz Studio tự động mở ra | **PASS** |
| 4 | Mở Quiz Studio & Empty State | Quan sát Quiz Studio vừa tạo | Header hiển thị 0 câu hỏi, 20 phút, 80%; hiển thị empty state "Chưa có câu hỏi nào" | **PASS** |
| 5 | Tạo Question 1 (Trắc nghiệm) | Bấm "Thêm câu hỏi", nhập câu hỏi về useState, 4 options, chọn đáp án đúng A, 10 điểm | Lưu thành công qua `POST /api/questions/`. Question 1 hiển thị với đáp án đúng tô màu xanh kèm checkmark | **PASS** |
| 6 | Tạo Question 2 | Bấm "Thêm câu hỏi", nhập câu hỏi về Server Components, options Đúng/Sai, chọn Đúng, 10 điểm | Đề thi cập nhật 2 câu hỏi, tổng 20 điểm | **PASS** |
| 7 | Chỉnh sửa Question | Bấm Edit icon trên Question 1, đổi điểm từ 10 thành 15 | Điểm Question 1 cập nhật thành 15 điểm, tổng điểm đề thi thành 25 điểm | **PASS** |
| 8 | Xóa Question | Bấm Trash icon trên Question 2, hiển thị dialog xác nhận, bấm "Xác nhận xóa" | Question 2 được xóa khỏi DB, danh sách trở về 1 câu hỏi (15 điểm) | **PASS** |
| 9 | Chỉnh sửa Quiz Settings | Bấm "Cài đặt Quiz", đổi thời lượng từ 20 thành 25 phút | Cập nhật thành công qua `PUT /api/quiz/:id`, header hiển thị 25 phút | **PASS** |
| 10 | Đóng Studio & kiểm tra Curriculum | Bấm "Đóng Studio" trở về trang Curriculum | Bài học 2.1 hiển thị badge `Quiz (1 câu)` | **PASS** |
| 11 | Re-open Quiz Studio | Bấm vào badge `Quiz (1 câu)` | Quiz Studio mở lại tức thì, dữ liệu câu hỏi và cài đặt được bảo toàn | **PASS** |
| 12 | Xóa Quiz | Bấm icon Trash bên cạnh badge `Quiz (1 câu)` trên dòng bài học, hiển thị dialog xác nhận với đầy đủ cảnh báo, bấm "Xác nhận xóa" | Quiz bị xóa vĩnh viễn khỏi DB, bài học 2.1 phục hồi về nút `+ Tạo Quiz` | **PASS** |
| 13 | Responsive & Theme | Kiểm tra giao diện modal và studio ở nhiều kích thước | Co giãn mượt mà, hỗ trợ chuẩn cả Light và Dark mode | **PASS** |

### Artifacts minh chứng:
- Screenshot trang Curriculum: `curriculum_page_1792158263042.png`
- Screenshot form tạo Quiz: `quiz_modal_filled_1792158337729.png`
- Screenshot Quiz Studio Empty State: `quiz_studio_empty_1792158360444.png`
- Screenshot form tạo Question: `question_modal_filled_1792158619899.png`
- Screenshot Curriculum với Quiz badge: `curriculum_quiz_added_1792158691911.png`
- Screenshot Quiz Studio danh sách câu hỏi: `quiz_studio_question_1_1792158732227.png`
- Screenshot modal xác nhận xóa Quiz: `quiz_delete_modal_1792159010580.png`
- Screenshot phục hồi nút Tạo Quiz: `curriculum_page_quiz_deleted_1792159031254.png`
- Video quay toàn bộ quy trình:
  - `quiz_studio_demo_1792158196230.webp`
  - `quiz_edit_delete_demo_1792158718134.webp`
  - `quiz_delete_final_1792158964125.webp`

---

## 14. Execution Trace

### Workflow Used
- `.agents/workflows/feature-development.md` — **USED**
  - Giai đoạn Discovery -> Planning -> Implementation -> Validation -> Review được tuân thủ nghiêm ngặt từng bước.

### Skills Used
- `page-implementation` — **USED**
  - Bổ sung chức năng và modal states vào App Router route `/teacher/courses/[id]/curriculum`.
- `api-integration` — **USED**
  - Tích hợp chuẩn xác `quiz.service.ts` và `question.service.ts` dựa trên contract `api/QUIZ_API.md` và `api/QUESTION_API.md`.
- `stitch-ui` — **USED**
  - Xây dựng giao diện Quiz Studio và các dialog xác nhận theo phong cách Modern Academic Violet của TMdemy.
- `frontend-review` — **USED**
  - Kiểm tra và giải quyết toàn bộ cảnh báo React 19 compiler (`set-state-in-effect`), xác thực build và lint.

---

## 15. Workflow Gates

- **Context Gate:** `PASS` (Đã nghiên cứu kỹ lưỡng API contract, source code hiện hữu và các ràng buộc nghiệp vụ).
- **Scope Gate:** `PASS` (Chỉ phát triển Quiz & Question CRUD cho Teacher, không lấn sân sang Student Quiz Taking hay sửa đổi backend).
- **API/Backend Boundary Gate:** `PASS` (Không sửa backend repository, chỉ sử dụng REST API contract thông qua `apiClient`).
- **Dependency Gate:** `PASS` (Không cài thêm package bên ngoài nào).
- **Validation Gate:** `PASS` (tsc 0 lỗi, lint 0 lỗi, build 0 lỗi, browser testing 100% PASS).

---

## 16. Known Limitations

- Giao diện Question Studio hiện tại hỗ trợ 2 dạng câu hỏi chính mà Backend hỗ trợ trong schema: Trắc nghiệm (`multiple_choice`) và Điền khuyết (`fill_in_blank`). Các dạng câu hỏi tự luận (Essay) hay Coding questions chưa có schema trong backend nên chưa đưa vào frontend.
- Khi xóa Quiz, toàn bộ các câu hỏi con được backend tự động xóa theo cơ chế cascade (frontend đã hiển thị thông báo cảnh báo rõ ràng cho giảng viên).
- **Backend Anti-Cheat Observation**: Endpoint `GET /api/quiz/lesson/:lessonId` được thiết kế theo quy tắc Anti-Cheat (bảo mật ẩn trường `answer` đối với người học). Frontend đã bổ sung cơ chế lưu trữ đồng bộ đáp án cho Teacher Studio (`localStorage` + in-memory answer map) và hiển thị fallback an toàn `(Đã lưu trên máy chủ • Bảo mật chống gian lận)` nếu câu hỏi nạp từ phiên khác.

---

## 17. Patch Fix: Fill-in-the-Blank Answer Display

- **Vấn đề ghi nhận:** Khi tạo câu hỏi Điền từ khuyết (`fill_in_blank`), sau khi lưu xuất hiện dòng: `Đáp án đúng bắt buộc: (Chưa cấu hình)`.
- **Nguyên nhân gốc rễ (Root Cause):**
  1. `POST /api/questions/` và `PUT /api/questions/:id` lưu câu hỏi và `answer` hoàn toàn thành công vào PostgreSQL.
  2. Tuy nhiên, hàm `handleQuestionSaved` trong `QuizStudioContent` ngay sau đó đã gọi `refreshQuiz()`. Hàm này gọi `GET /api/quiz/lesson/:lessonId` (vốn là endpoint học viên có cơ chế Anti-Cheat loại bỏ thuộc tính `answer`).
  3. Mảng câu hỏi trả về từ `getQuizByLesson` đã ghi đè lên `currentQuiz` với `answer = undefined`, khiến UI hiển thị fallback `(Chưa cấu hình)`.
- **Giải pháp xử lý:**
  1. Cập nhật `QuizStudioContent` quản lý `knownAnswers` lưu trữ và đồng bộ hóa đáp án do giảng viên nhập qua `localStorage` (`tmdemy_answers_${quizId}`).
  2. Hàm `refreshQuiz` tự động hợp nhất (merge) các đáp án đã biết vào mảng câu hỏi mới nhất từ server.
  3. Form `QuestionModal` làm sạch giá trị khởi tạo khi chuyển đổi giữa Trắc nghiệm và Điền khuyết, gửi đúng `options: []` theo schema contract.
  4. Hiển thị UI trực quan: hiển thị chính xác đáp án đã nhập (ví dụ: `Đáp án đúng bắt buộc: Ha Noi`), và nếu câu hỏi từ phiên cũ chưa có cache thì hiển thị `(Đã lưu trên máy chủ • Bảo mật chống gian lận)`.
- **Kết quả kiểm thử:**
  - `npx tsc --noEmit`: PASS (0 lỗi).
  - `npm run lint`: PASS (0 lỗi).
  - `npm run build`: PASS (0 lỗi).
  - Browser verification: Tạo câu hỏi điền khuyết với đáp án "Ha Noi", kết quả hiển thị chuẩn xác `Đáp án đúng bắt buộc: Ha Noi`.

### 17.2 Cải tiến trải nghiệm: Tự động đồng bộ đáp án Trắc nghiệm sang Điền từ khuyết

- **Yêu cầu người dùng:** Khi chuyển từ tab Trắc nghiệm sang tab Điền từ khuyết, đáp án đã được tích chọn đúng bên tab Trắc nghiệm sẽ tự động được điền sang ô nhập đáp án của tab Điền từ khuyết.
- **Giải pháp triển khai:**
  1. Trong `QuestionModal` (`src/components/teacher/quiz/question-modal.tsx`), khi chuyển tab `setType('fill_in_blank')`, giữ nguyên giá trị `selectedAnswer` đã tích chọn ở Trắc nghiệm để tự động fill vào ô `question-fillblank-input`.
  2. Bổ sung nhãn trực quan: `(Được điền từ đáp án trắc nghiệm)`.
  3. Bổ sung hàng phím chọn nhanh **Option Picker Chips** (`[A: ...] [B: ...] [C: ...] [D: ...]`) ngay bên dưới ô nhập: Giảng viên có thể nhấp chuột vào bất kỳ phương án nào để điền ngay lập tức vào ô đáp án mà không cần gõ lại bằng tay. Chip đang được chọn sẽ hiển thị viền xanh lá (emerald) kèm biểu tượng checkmark xác nhận.
  4. Đảm bảo payload API khi submit gửi `options: []` theo đúng quy chuẩn `api/QUESTION_API.md`.
- **Xác thực thực tế qua Browser:**
  - Tạo câu hỏi "Thu do cua nuoc Phap la gi?" với 4 lựa chọn A: Paris, B: London, C: Berlin, D: Madrid; chọn phương án A.
  - Chuyển sang tab Điền từ khuyết: ô đáp án hiển thị sẵn "Paris", hiển thị đầy đủ 4 chips A, B, C, D.
  - Thử click chip B ("London") -> ô đáp án chuyển thành "London".
  - Thử click lại chip A ("Paris") -> ô đáp án quay về "Paris".
  - Lưu câu hỏi thành công, Quiz Studio hiển thị đúng: `Đáp án đúng bắt buộc: Paris`.

---

## 18. Next Recommended Phase

- Dừng lại tại đây theo quy định để người dùng nghiệm thu Phase **F8.5**.
- Phase tiếp theo khuyến nghị theo roadmap: **F8.6 — Teacher Course Pricing, Coupon & Promotion Management** (Quản lý giá khóa học, mã giảm giá và chiến dịch khuyến mãi cho giảng viên).
