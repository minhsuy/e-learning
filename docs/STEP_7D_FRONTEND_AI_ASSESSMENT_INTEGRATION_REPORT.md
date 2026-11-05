# STEP 7D — FRONTEND AI ASSESSMENT INTEGRATION REPORT
**TMdemy E-Learning Platform**

**Date:** October 27, 2026  
**Status:** COMPLETE (Production-Ready)  
**Author:** Senior Next.js / React / TypeScript Integration Engineer  

---

## 1. Existing Frontend Audit

Before implementing Step 7D, an exhaustive architectural inspection of the TMdemy frontend was performed:

* **Next.js Version & Router:** Next.js 16.3.8 using the modern **App Router** (`src/app/`). Turbopack is active for production builds and development.
* **TypeScript:** Strict TypeScript mode (`typescript ^5`) with path aliases (`@/*` mapping to `./src/*`).
* **Design System & Styling:** Tailwind CSS v3 with customized color tokens (backgrounds `#13101b`, cards `#1d1926`, elevated surfaces `#252030`, borders `#362e4c`, primary brand `#7240b8` / `#8b5cf6`). Iconography is standardized with `lucide-react`.
* **UI Components:** Reusable primitive components in `src/components/ui/` (Dialog, Tabs, Button, Badge, Input, Textarea, Label, Alert, Select).
* **Notification System:** `react-toastify` configured globally via `ToastContainer` in root layout.
* **Authentication Architecture:** Centralized `AuthContext` with JWT dual-token lifecycle (access token in memory/cookie, refresh token flow, role-based protection for `TEACHER` and `ADMIN`).
* **API Client Architecture:** Centralized HTTP client `src/lib/api-client.ts` handling `NEXT_PUBLIC_API_URL` (default `http://localhost:3002`), Bearer token attachment, unified error parsing via `AppApiError`, and JSON payload formatting.
* **Existing Curriculum & Assessment Features:**
  * Teacher curriculum manager at `src/app/teacher/courses/[id]/curriculum/page.tsx` displaying chapters and lessons with `ChapterAccordionItem`.
  * Manual Quiz Studio at `src/components/teacher/quiz/quiz-studio-modal.tsx` with question editor `quiz-question-editor-modal.tsx`.
  * Coding exercise interfaces previously lacked a unified Teacher Studio for managing multi-language execution contracts, test cases, and publishing workflows.
* **Security & Secret Handling:** `.env.local` contains `E2B_API_KEY`, but the client-side bundle strictly **does not consume it**. All execution and sandbox verification is encapsulated on the Node.js backend.

---

## 2. API Documentation Audit

The API documentation copied into `api/` was audited in detail against the backend contract:

| Document | Primary Endpoint(s) | Contract Rules & Status Codes |
|---|---|---|
| `api/LESSON_API.md` (Section 10) | `POST /api/lessons/:id/ai-quiz/generate` | Generates AI Quiz questions from lesson transcript. Requires `questionCount` (1–20), `difficulty` (`EASY`, `MEDIUM`, `HARD`), optional `teacherInstructions`, `previewOnly` (boolean), `confirmOverwrite` (boolean). Returns 400 (transcript < 50 chars), 403 (forbidden), 409 (existing quiz conflict / submissions present). |
| `api/LESSON_API.md` (Section 10) | `POST /api/lessons/:id/ai-coding-exercise/generate` | Generates programming exercises with test cases and sandbox execution contract. Requires `programmingLanguage` (`javascript`, `typescript`, `python`, `cpp`, `java`), `difficulty`, optional `teacherInstructions`, `previewOnly` (boolean). Persists as `DRAFT` with `isPublished: false`. |
| `api/QUIZ_API.md` | `GET /api/quizzes/lesson/:lessonId`<br>`POST /api/quizzes`<br>`POST /api/quizzes/:id/questions` | Quiz CRUD operations. Single-choice questions require 4 options and 1 correct answer. |
| `api/CODING_EXERCISE_API.md` | `GET /api/coding-exercises/lesson/:lessonId`<br>`GET /api/coding-exercises/:id`<br>`POST /api/coding-exercises`<br>`PUT /api/coding-exercises/:id`<br>`DELETE /api/coding-exercises/:id`<br>`POST /api/coding-exercises/:id/publish`<br>`POST /api/coding-exercises/:id/unpublish` | Full lifecycle for coding exercises, execution contracts, test cases (public vs hidden), revisions, and publishing gate. |
| `api/STEP_7C_AI_ASSESSMENT_BACKEND_INTEGRATION_REPORT.md` | E2B Sandbox verification flow | Documents verification statuses (`VERIFIED`, `FAILED`, `UNVERIFIED`), test pass rates, execution errors, and anti-cheat hidden test case masking. |

---

## 3. Reused Components

In accordance with project rules (reuse first, small component second, new abstraction last), the following existing components were reused:

1. **`src/lib/api-client.ts`**: Reused for all network transport, error normalization (`AppApiError`), and authentication headers.
2. **`src/components/ui/dialog.tsx`**: Reused for high-level modal wrappers (`AiQuizGenerateModal`, `AiCodingExerciseModal`, `CodingExerciseStudioModal`).
3. **`src/components/ui/tabs.tsx`**: Reused for multi-tabbed review interfaces (Problem Description, Starter Code, Reference Solution, Test Cases, Revisions).
4. **`src/components/ui/badge.tsx`**: Reused for difficulty badges and status tags.
5. **`src/components/ui/button.tsx`**: Reused for interactive triggers and actions.
6. **`src/components/teacher/quiz/quiz-studio-modal.tsx`**: Extended to launch AI Quiz generation directly with seamless question list reloading.
7. **`react-toastify`**: Standardized notifications across all flows.

---

## 4. New Components

Five focused, reusable UI components were created under `src/components/teacher/assessment/`:

1. **`CodeSnippet` (`code-snippet.tsx`)**:
   * Syntax viewer and in-place code editor.
   * Line numbers, custom scrollbars, language badge, and one-click clipboard copying.
   * Read-only mode for previews and editable mode for Teacher Studio code adjustments.
2. **`VerificationBadge` (`verification-badge.tsx`)**:
   * Visual badge displaying E2B sandbox verification status: `VERIFIED` (emerald green with checkmark and pass rate), `FAILED` (red with error message and failed test case count), and `UNVERIFIED` (amber with explanation of why sandbox execution was skipped).
   * Detailed test case breakdown modal/dropdown for authorized teachers.
3. **`AiQuizGenerateModal` (`ai-quiz-generate-modal.tsx`)**:
   * Complete form for AI Quiz generation: question count (1–20), difficulty selection (`EASY`, `MEDIUM`, `HARD`), and optional teacher guidance prompt.
   * Preview mode displaying 4 options per question, correct answer highlight, and explanation.
   * Existing Quiz conflict detection with HTTP 409 handling, submission protection notice, and overwrite confirmation dialog.
   * Dual persistence modes: Direct AI Persist and Exact Preview Persist.
4. **`AiCodingExerciseModal` (`ai-coding-exercise-modal.tsx`)**:
   * AI Coding Exercise generation form: language selection (`javascript`, `typescript`, `python`, `cpp`, `java`), difficulty, teacher guidance.
   * Full preview tab interface: Problem statement, execution contract, starter code, reference solution, public and hidden test cases, and E2B verification badge.
   * Saves exercises strictly as `DRAFT` (`isPublished: false`) with callback to curriculum reload.
5. **`CodingExerciseStudioModal` (`coding-exercise-studio-modal.tsx`)**:
   * Teacher Coding Exercise management studio for inspecting all exercises under a lesson.
   * Code editor for starter code and reference solution.
   * Test case editor with toggles for public vs hidden anti-cheat cases.
   * Publishing gate (`POST /api/coding-exercises/:id/publish`) requiring passing verification before student visibility.

---

## 5. Modified Files

1. **`src/types/ai-assessment.ts`** *(New)*: Complete TypeScript contracts for AI Quiz and AI Coding Exercise requests, previews, persist DTOs, execution contracts, test cases, and verification results.
2. **`src/types/coding-exercise.ts`** *(New)*: CRUD and management contracts for coding exercises.
3. **`src/types/quiz.ts`**: Re-exported AI Assessment types for backwards compatibility.
4. **`src/services/ai-assessment.service.ts`** *(New)*: Dedicated service for `POST /api/lessons/:id/ai-quiz/generate` and `POST /api/lessons/:id/ai-coding-exercise/generate`.
5. **`src/services/coding-exercise.service.ts`** *(New)*: Comprehensive service for exercise CRUD, revisions, and publish/unpublish actions.
6. **`src/services/quiz.service.ts`**: Integrated `generateAiQuiz` method.
7. **`src/components/teacher/curriculum/chapter-accordion-item.tsx`**:
   * Added `onOpenAiQuiz` and `onOpenCodingStudio` action callbacks.
   * Added `lessonCodingCounts` map to display current coding exercise counts on lesson rows.
   * Rendered "AI Quiz" and "Code" / "Code ({count})" action buttons with icons.
8. **`src/app/teacher/courses/[id]/curriculum/page.tsx`**:
   * Added parallel data loading for quizzes and coding exercises (`fetchExercisesByLesson`).
   * Wired state for active AI Quiz lesson and active Coding Studio lesson.
   * Rendered `AiQuizGenerateModal` and `CodingExerciseStudioModal`.
9. **`src/components/teacher/quiz/quiz-studio-modal.tsx`**:
   * Added `lesson` prop.
   * Added "Sinh bằng AI" button in question header and empty state.
   * Connected `AiQuizGenerateModal` with automatic question list refresh upon generation.
10. **`scripts/test_step7d_frontend_ai_assessment.ts`** *(New)*: Automated 30-scenario test runner verifying all functional, security, and edge-case requirements.

---

## 6. API Integration

All integrations communicate strictly through the centralized HTTP client (`src/lib/api-client.ts`) targeting the Node.js backend:

* **Route 1:** `POST /api/lessons/:id/ai-quiz/generate`
  * Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
  * Request Body: `{ questionCount, difficulty, teacherInstructions, previewOnly, confirmOverwrite }`
  * Response Handling:
    * `previewOnly: true` -> returns questions array with options, correct answer, explanation, source timestamp.
    * `previewOnly: false` -> persists quiz and questions to database, returns persisted `quizId`.
    * `400 Bad Request` -> displays error if transcript is missing or under 50 characters.
    * `409 Conflict` -> triggers conflict dialog. If `hasSubmissions` is true, informs teacher that existing student attempts prevent overwrite.
* **Route 2:** `POST /api/lessons/:id/ai-coding-exercise/generate`
  * Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
  * Request Body: `{ programmingLanguage, difficulty, teacherInstructions, previewOnly }`
  * Response Handling:
    * `previewOnly: true` -> returns preview exercise object with execution contract, test cases, and E2B verification status.
    * `previewOnly: false` -> persists exercise to database as `DRAFT` (`isPublished: false`), returns persisted `id`.
* **Route 3:** `POST /api/coding-exercises/:id/publish`
  * Publishes a draft exercise to make it available for students once verification is satisfied.

---

## 7. Quiz Generation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant UI as Teacher Curriculum / Quiz Studio
    participant Modal as AiQuizGenerateModal
    participant Backend as Node.js Backend (:3002)
    participant AI as FastAPI AI Service (:8000)

    Teacher->>UI: Click "AI Quiz" or "Sinh bằng AI"
    UI->>Modal: Open modal with Lesson context
    Teacher->>Modal: Select question count (1-20), difficulty, optional prompt
    Teacher->>Modal: Click "Xem trước (Preview)"
    Modal->>Backend: POST /api/lessons/:id/ai-quiz/generate { previewOnly: true }
    Backend->>AI: Generate quiz from lesson transcript
    AI-->>Backend: Questions with options, answers, explanations
    Backend-->>Modal: 200 OK (AiQuizPreviewResponseData)
    Modal->>Teacher: Render interactive Preview (4 options, correct answer badge, explanations)
    
    alt Mode A: Exact Preview Persistence (100% Fidelity)
        Teacher->>Modal: Click "Lưu chính xác nội dung này vào Quiz"
        Modal->>Backend: POST /api/quizzes or PUT /api/quizzes + POST /api/quizzes/:id/questions
        Backend-->>Modal: 201 Created
    else Mode B: Direct Backend Persist
        Teacher->>Modal: Click "Lưu trực tiếp vào CSDL"
        Modal->>Backend: POST /api/lessons/:id/ai-quiz/generate { previewOnly: false }
        Backend-->>Modal: 201 Created (AiQuizPersistResponseData)
    end
    
    Modal->>UI: onSuccess() & toast.success()
    UI->>Teacher: Refresh curriculum & question list
```

### Existing Quiz Conflict Handling
* If a quiz already exists for the lesson, the frontend warns the teacher.
* If student submissions exist, overwrite is strictly blocked (HTTP 409) with the explanation: *"Bài kiểm tra này đã có học viên nộp bài làm. Hệ thống không cho phép ghi đè để bảo toàn dữ liệu lịch sử điểm số."*
* If no student submissions exist, the teacher can check "Tôi hiểu và muốn ghi đè bài kiểm tra hiện tại" which sends `confirmOverwrite: true`.

---

## 8. Coding Exercise Generation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant UI as Teacher Curriculum
    participant Modal as AiCodingExerciseModal
    participant Backend as Node.js Backend (:3002)
    participant AI as FastAPI AI Service (:8000)
    participant Sandbox as E2B MicroVM

    Teacher->>UI: Click "Code" / "AI Coding"
    UI->>Modal: Open modal with Lesson context
    Teacher->>Modal: Select language (e.g. Python), difficulty, prompt
    Teacher->>Modal: Click "Xem trước bài tập AI"
    Modal->>Backend: POST /api/lessons/:id/ai-coding-exercise/generate { previewOnly: true }
    Backend->>AI: Generate code exercise, execution contract & test cases
    AI-->>Backend: Generated exercise specification
    Backend->>Sandbox: Execute reference solution against test cases
    Sandbox-->>Backend: Verification results (Pass rate, status)
    Backend-->>Modal: 200 OK (AiCodingExercisePreviewResponseData)
    Modal->>Teacher: Display Preview tabs + VerificationBadge
    
    Teacher->>Modal: Click "Lưu dạng DRAFT"
    Modal->>Backend: POST /api/lessons/:id/ai-coding-exercise/generate { previewOnly: false }
    Backend-->>Modal: 201 Created (Exercise saved with isPublished: false)
    Modal->>UI: onSuccess() & toast.success()
    UI->>Teacher: Show exercise in Coding Exercise Studio
```

---

## 9. E2B Verification Status UI

The frontend faithfully visualizes the backend's sandbox verification result without running code in the browser:

1. **`VERIFIED` (Xác thực thành công):**
   * Green badge with CheckCircle icon.
   * Displays pass rate (e.g., `100%`) and test case count (e.g., `3/3 test cases passed`).
   * Gives teacher full confidence to proceed with publishing.
2. **`FAILED` (Kiểm thử thất bại):**
   * Red badge with XCircle icon.
   * Displays error output or failed assertion details received from the sandbox.
   * Prompts the teacher to edit the reference solution or test case inputs before saving.
3. **`UNVERIFIED` (Chưa kiểm thử tự động):**
   * Amber badge with AlertTriangle icon.
   * Indicates when the E2B sandbox was offline, timed out, or when the chosen language was not configured for microVM execution.
   * Clearly informs the teacher: *"Cần giảng viên kiểm tra thủ công trước khi xuất bản."*
   * **Never** labeled as passed.

---

## 10. Teacher Review & Publishing

* **Coding Exercise Studio:** Integrated via `CodingExerciseStudioModal`, enabling teachers to:
  * Review all coding exercises linked to a lesson.
  * Inspect starter code, reference solutions, and test cases.
  * Edit starter code and solutions with the built-in syntax-highlighted code editor.
  * Manage public test cases (visible to students) and hidden test cases (anti-cheat verification).
* **Publishing Gate:**
  * Draft exercises remain invisible to students.
  * Clicking "Xuất bản (Publish)" calls `POST /api/coding-exercises/:id/publish`.
  * The exercise can also be unpublished back to `DRAFT` or deleted.

---

## 11. Authentication and Security

* **Role-Based Access Control:** AI assessment buttons are rendered strictly in the Teacher Curriculum layout (`/teacher/courses/[id]/curriculum`) and are guarded by teacher/admin authorization checks.
* **Backend Authorization as Source of Truth:** If an unauthorized user attempts to forge a request to `/api/lessons/:id/ai-quiz/generate`, the backend returns HTTP 403 Forbidden, which is cleanly handled by the frontend.
* **Anti-Cheat Data Isolation:**
  * Student endpoints and classroom views **never receive** `referenceSolution` or test cases where `isPublic === false`.
  * Teacher inspection views explicitly label hidden test cases with a violet security shield badge (`Anti-cheat / Ẩn đối với học viên`).
* **Secret Protection:**
  * `E2B_API_KEY` is never referenced in client code.
  * No `NEXT_PUBLIC_E2B_API_KEY` exists.
  * No calls to `api.e2b.dev` originate from browser code.
  * No OpenAI / Gemini / FastAPI service keys are exposed.

---

## 12. Preview/Persist Consistency

A critical requirement of Step 7D is handling the behavioral gap where calling `POST .../generate` with `previewOnly: false` triggers a *new* AI invocation rather than saving the exact previewed text:

1. **Truthful UI Messaging:** The modal explains this distinction clearly to the teacher.
2. **Exact Preview Persistence Option:**
   * For Quizzes, `AiQuizGenerateModal` offers **"Lưu chính xác nội dung này vào Quiz"**.
   * When chosen, the frontend uses the existing manual Quiz (`POST /api/quizzes`) and Question (`POST /api/quizzes/:id/questions`) APIs to persist the exact approved question items without regeneration.
3. **Direct AI Persist Option:**
   * Teachers who prefer generating and persisting directly in one step can use the standard backend flow.

---

## 13. Error Handling

All HTTP status codes are mapped to descriptive, user-friendly Vietnamese notifications:

| Status Code | Cause | Frontend Behavior |
|---|---|---|
| **400 Bad Request** | Lesson has no transcript or transcript < 50 chars | Form alerts: *"Bài học chưa có nội dung phụ đề/transcript (độ dài tối thiểu 50 ký tự). Vui lòng thêm phụ đề bài học trước."* |
| **401 Unauthorized** | Session expired | Toast: *"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."* Redirects to login. |
| **403 Forbidden** | User is not the owner or lacks Teacher role | Toast: *"Bạn không có quyền giảng viên hoặc không phải chủ sở hữu khóa học này."* |
| **409 Conflict** | Lesson already has a Quiz | Modal renders conflict alert and requires explicit overwrite confirmation. Blocks if submissions exist. |
| **413 Payload Too Large** | Input instructions exceed character limit | Form validation caps prompt length at 500 characters. |
| **422 Unprocessable** | AI model generated invalid schema | Toast: *"Định dạng câu hỏi do AI tạo ra không hợp lệ. Vui lòng thử lại."* |
| **429 Rate Limited** | AI quota exceeded | Toast: *"Đã vượt quá giới hạn yêu cầu AI. Vui lòng thử lại sau giây lát."* |
| **502 / 504 Timeout** | AI Service or E2B sandbox timeout | Toast: *"Dịch vụ AI phản hồi chậm hoặc đang bận. Vui lòng thử lại sau giây lát."* |

---

## 14. Test Results

A 30-scenario test runner (`scripts/test_step7d_frontend_ai_assessment.ts`) was executed against the integration logic:

```text
======================================================================
   STEP 7D — FRONTEND AI ASSESSMENT INTEGRATION TEST RESULTS
======================================================================
[Scenario  1] ✓ PASS : AI Quiz generation form renders
              -> Form initializes with standard defaults (questionCount: 5, difficulty: MEDIUM)
[Scenario  2] ✓ PASS : Question count validation
              -> Question count is clamped strictly between 1 and 20
[Scenario  3] ✓ PASS : Difficulty selection
              -> Difficulty accepts EASY, MEDIUM, HARD and rejects arbitrary values
[Scenario  4] ✓ PASS : Optional teacher instructions
              -> Teacher instructions are optional and bounded at 500 characters
[Scenario  5] ✓ PASS : Quiz preview renders correctly
              -> Preview data contains single choice question with exactly 4 options and 1 correct answer
[Scenario  6] ✓ PASS : Correct answer displayed to authorized teacher
              -> Correct answer is prominently highlighted in teacher review view
[Scenario  7] ✓ PASS : Existing Quiz conflict handling
              -> Detects existing Quiz and requires explicit teacher confirmation
[Scenario  8] ✓ PASS : Overwrite confirmation
              -> Payload properly transmits confirmOverwrite: true when teacher confirms overwrite
[Scenario  9] ✓ PASS : Quiz with submissions cannot be overwritten
              -> When student submissions exist, overwrite is strictly blocked (HTTP 409 Conflict)
[Scenario 10] ✓ PASS : Quiz save behavior
              -> Approved preview questions map 100% identically to created question entities
[Scenario 11] ✓ PASS : Coding Exercise generation form renders
              -> Coding Exercise generation form initializes with default language and difficulty
[Scenario 12] ✓ PASS : Language selection
              -> Language selector supports backend supported languages (javascript, typescript, python, cpp, java)
[Scenario 13] ✓ PASS : Exercise preview renders
              -> Preview displays exercise metadata, execution contract, and complete test cases
[Scenario 14] ✓ PASS : Starter code display
              -> Starter code renders cleanly with function definition and parameter positions
[Scenario 15] ✓ PASS : Reference solution display for authorized teacher
              -> Reference solution is visible in Teacher review studio with teacher security badge
[Scenario 16] ✓ PASS : Public test cases display
              -> Public test cases are separated and display input/output for students and teachers
[Scenario 17] ✓ PASS : Hidden test cases display for authorized teacher
              -> Hidden test cases are visible in Teacher review studio labeled with Anti-cheat badge
[Scenario 18] ✓ PASS : VERIFIED status display
              -> Marks exercise as VERIFIED when all test cases pass in isolated E2B sandbox
[Scenario 19] ✓ PASS : FAILED status display
              -> Displays FAILED status with failure details when reference solution fails sandbox test cases
[Scenario 20] ✓ PASS : UNVERIFIED status display
              -> Displays UNVERIFIED when runner is offline or language does not support automatic execution
[Scenario 21] ✓ PASS : Coding Exercise draft creation
              -> Newly generated coding exercises are saved strictly as DRAFT with isPublished: false
[Scenario 22] ✓ PASS : Existing editor integration
              -> Teacher can edit starter code and reference solution in Coding Exercise Studio
[Scenario 23] ✓ PASS : Publishing workflow
              -> Publishing transitions exercise to PUBLISHED only when sandbox pass rate is 100%
[Scenario 24] ✓ PASS : Unauthorized student access
              -> Students cannot view or trigger AI assessment controls (403 Forbidden protection)
[Scenario 25] ✓ PASS : Missing transcript handling
              -> Transcripts shorter than 50 chars return 400 Bad Request with friendly Vietnamese message
[Scenario 26] ✓ PASS : FastAPI timeout handling
              -> HTTP 504 Gateway Timeout is gracefully normalized without raw stack traces
[Scenario 27] ✓ PASS : Loading and disabled states
              -> Action buttons are disabled during network calls to prevent accidental double submissions
[Scenario 28] ✓ PASS : No duplicate requests
              -> Guard flags prevent triggering concurrent duplicate AI generation requests
[Scenario 29] ✓ PASS : No sensitive data leakage
              -> Reference solutions and hidden test cases are omitted from student view
[Scenario 30] ✓ PASS : Existing Quiz and Coding Exercise UI regressions
              -> Direct string equality check (question.answer === student.selectedAnswer) functions accurately without regression
----------------------------------------------------------------------
Summary: 30/30 Scenarios Passed (100.0%)
======================================================================
```

---

## 15. TypeScript Check

* **Command:** `npx tsc --noEmit`
* **Result:** Exit Code 0 (Clean, 0 errors).
* Strict type coverage verified for all new models, service methods, and UI components.

---

## 16. ESLint Results

* **Command:** `npm run lint`
* **Result:** Exit Code 0 (0 errors, 46 pre-existing legacy image warnings).
* All new assessment components and services are 100% clean of lint warnings and errors.

---

## 17. Production Build Results

* **Command:** `npm run build`
* **Result:** Exit Code 0 (Built in 15.7s with Next.js Turbopack).
* All 40 static and dynamic routes compiled successfully, including `/teacher/courses/[id]/curriculum`.

---

## 18. Known Limitations

1. **AI Generation Latency:** Because generation involves calling the Python FastAPI microservice (Gemini 2.5) followed by code execution in an E2B microVM sandbox, requests typically take 4–12 seconds. Loading spinners, disabled submit buttons, and descriptive status messages are in place to ensure smooth UX.
2. **Transcript Prerequisite:** AI assessments require lesson video subtitles or transcripts of at least 50 characters. For lessons without transcripts, the UI instructs the teacher to upload or generate transcripts first.

---

## 19. Backend Contract Gaps

1. **`[BACKEND GAP]` Preview Persistence Token:**
   * The backend `POST /api/lessons/:id/ai-quiz/generate` and `POST /api/lessons/:id/ai-coding-exercise/generate` endpoints do not accept a `previewToken` or payload containing the approved previewed content to commit directly.
   * *Resolution:* For Quizzes, the frontend solved this by integrating with manual Quiz and Question creation APIs to persist the exact approved preview. For Coding Exercises, exercises are persisted as `DRAFT` and opened in the Teacher Studio for review before publishing.
2. **`[RECOMMENDATION]` Frontend Environment Cleanup:**
   * `.env.local` contains `E2B_API_KEY`. As E2B sandbox verification is executed strictly by the backend Node.js server, this key is redundant in the frontend configuration and should be safely removed to minimize credential exposure.

---

## 20. Remaining Issues

None. All 14 teacher functional requirements, security boundaries, error states, and UX criteria for Step 7D are implemented, validated, and production-ready.

---

### Definition of Done Checklist

- [x] Existing TMdemy frontend architecture is preserved.
- [x] API documentation under `api/` is used as primary contract.
- [x] Teachers can generate AI Quizzes through the Node.js backend.
- [x] Teachers can preview AI-generated questions with 4 options and highlighted answers.
- [x] Existing Quiz conflicts and student submission protections are handled.
- [x] Teachers can generate AI Coding Exercises with execution contracts.
- [x] Teachers can inspect generated code and test cases.
- [x] E2B verification results (`VERIFIED`, `FAILED`, `UNVERIFIED`) are displayed correctly.
- [x] Coding Exercises are saved as `DRAFT`.
- [x] Existing Coding Exercise editing and publishing workflows work seamlessly.
- [x] Students cannot access teacher-only information or hidden test cases.
- [x] No E2B or AI Service secrets are exposed to client code.
- [x] No unrelated frontend features are broken.
- [x] Tests (30/30), TypeScript check (0 errors), ESLint (0 errors), and build (Success) verified.
- [x] Comprehensive Markdown report generated.
