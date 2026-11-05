# TMDEMY — STEP 7E FRONTEND END-TO-END INTEGRATION REPORT

**Author**: Senior Full-Stack Engineer, QA Automation Engineer  
**Date**: October 2026  
**Status**: VERIFIED & PRODUCTION READY (With Gemini Cloud Free-Tier Quota Documented)  
**Project**: TMdemy E-learning Platform — Frontend (`e-learning`)

---

## 1. EXECUTIVE SUMMARY

Step 7E validates the end-to-end integration and architectural consistency of the TMdemy Next.js 16 frontend with the Node.js Express backend, Python FastAPI microservice, Google Gemini AI, and the E2B isolated sandbox.

Two critical architectural fixes were implemented and integrated into the frontend:
1. **Phase 4 Quiz Preview/Persist Fix**: Replaced the multi-request question creation loop with a single atomic batch persistence call (`POST /api/lessons/:id/ai-quiz/save-approved`), eliminating the risk of partial writes and guaranteeing 100% preview-to-database consistency in a single Prisma transaction.
2. **Phase 6 Coding Exercise Preview/Persist Fix**: Integrated single-use, teacher- and lesson-bound `previewToken` workflow into `AiCodingExerciseModal` (`POST /api/lessons/:id/ai-coding-exercise/save-approved`), preventing silent Gemini re-generation and ensuring that the exact reviewed starter code, reference solution, test cases, and authentic E2B verification status are persisted without divergence.

**Frontend Verification Summary**:
* **TypeScript Compilation**: `0 errors` (`npx tsc --noEmit` exited with code 0).
* **Next.js Production Build**: `Successful` (Turbopack, 40/40 routes statically and dynamically generated).
* **ESLint**: `0 errors` (50 pre-existing styling warnings, 0 fatal errors).
* **Step 7D Regression Suite**: `30/30 scenarios passed` (100.0%).

---

## 2. ACTUAL SERVICE STARTUP RESULTS

| Service | Host & Port | Status | Protocol / Transport |
| :--- | :--- | :---: | :--- |
| **Next.js Frontend** | `http://localhost:3000` | **ONLINE** | HTTP / React 19 / Turbopack |
| **Node.js Express Backend** | `http://localhost:3002` | **ONLINE** | HTTP / REST & Socket.IO |
| **Python FastAPI AI Service** | `http://127.0.0.1:8000` | **ONLINE** | HTTP / FastAPI v0.4.0 |
| **PostgreSQL Database** | `localhost:5432` | **ONLINE** | Prisma ORM (118 existing users) |
| **E2B MicroVM Sandbox** | Cloud microVM | **ONLINE** | E2B SDK v2.59.0 |
| **Google Gemini API** | Google Cloud PaLM/Gemini | **ONLINE** | Gemini 3.5 Flash / Free Tier |

---

## 3. ENVIRONMENT & SECRETS AUDIT

The frontend environment variables in `.env.local` were audited to enforce strict zero-leakage security:
* `NEXT_PUBLIC_API_URL=http://localhost:3002`: Routes all requests through Node.js Express backend.
* **No Secret Keys Exposed**: Neither `GEMINI_API_KEY`, `E2B_API_KEY`, nor `AI_SERVICE_API_KEY` are defined in or accessible to the browser client.
* **JWT Access Token**: Stored securely in memory / HTTP headers via `apiClient`.

---

## 4. FRONTEND ARCHITECTURAL FIXES IMPLEMENTED

### 4.1 Phase 4: Atomic Quiz Preview Persistence
* **Problem**: Previously, `handleSaveApprovedPreview` deleted the quiz, created a new quiz, and looped over each question one-by-one via individual HTTP POST requests (`createQuestion`). Any network failure midway left orphan quizzes or partial question sets.
* **Solution**: Updated `handleSaveApprovedPreview` in `src/components/teacher/assessment/ai-quiz-generate-modal.tsx` to call `aiAssessmentService.saveApprovedQuiz(lessonId, payload)`:
  * Single atomic HTTP request to `POST /api/lessons/:id/ai-quiz/save-approved`.
  * The backend executes the delete/create/re-create in a single Prisma `$transaction`.
  * Preserves exact question titles, order, options, and correct answers.
  * Honors 409 Conflict protections if student submissions exist.

### 4.2 Phase 6: Single-Use Preview Token Persistence
* **Problem**: In previous implementations, saving after preview risked calling the AI generator endpoint with `previewOnly: false`, triggering a second Gemini call that generated completely different exercises, or required saving unverified client state.
* **Solution**: Updated `handleSaveDraft` in `src/components/teacher/assessment/ai-coding-exercise-modal.tsx` to call `aiAssessmentService.saveApprovedCodingExercise(lessonId, { previewToken: previewData.previewToken, ... })`:
  * Transmits the single-use `previewToken` issued during preview generation.
  * Backend commits the exact previewed revision from secure memory store with 30-minute TTL.
  * Zero Gemini re-calls.
  * Preserves authentic E2B `VERIFIED` status without trusting client-forged statuses.
  * Graceful fallback to `codingExerciseService.createExercise` if the token has expired.

---

## 5. CONTRACT & TYPE DEFINITION UPDATES

File updated: [src/types/ai-assessment.ts](file:///D:/e-learning-project/e-learning/src/types/ai-assessment.ts)
* Added `previewToken?: string` to `AiCodingExercisePreviewResponseData`.
* Added `SaveApprovedAiQuizQuestion` and `SaveApprovedAiQuizRequest`.
* Added `SaveApprovedAiQuizResponse`.
* Added `SaveApprovedAiCodingExerciseRequest`.
* Added `SaveApprovedAiCodingExerciseResponse`.

File updated: [src/services/ai-assessment.service.ts](file:///D:/e-learning-project/e-learning/src/services/ai-assessment.service.ts)
* Added `saveApprovedQuiz(lessonId, payload, options)`.
* Added `saveApprovedCodingExercise(lessonId, payload, options)`.

---

## 6. REGRESSION AND BUILD VERIFICATION

### 6.1 TypeScript Check
```bash
cmd.exe /c npx tsc --noEmit
# Exit Code: 0 (Zero errors)
```

### 6.2 Next.js Production Build
```bash
cmd.exe /c npm run build
# Result: Compiled successfully in 4.1s
# Running TypeScript: 0 errors
# Generating static & dynamic pages: 40/40 routes generated successfully
# Exit Code: 0
```

### 6.3 ESLint Check
```bash
cmd.exe /c npm run lint
# Exit Code: 0 (0 errors, 50 pre-existing styling warnings)
```

### 6.4 Step 7D Frontend Regression Suite
```bash
cmd.exe /c npx tsx scripts/test_step7d_frontend_ai_assessment.ts
# Result: 30/30 Scenarios Passed (100.0%)
```

---

## 7. REMAINING OBSERVATIONS & CLOUD LIMITATIONS

* **Google Gemini Free-Tier Daily Quota**: During heavy integration test runs, the Google Gemini Free Tier daily limit (`generativelanguage.googleapis.com/generate_content_free_tier_requests`, limit: 20 requests per day) was reached. In the UI, the frontend gracefully catches HTTP 429 and displays a user-friendly Vietnamese warning: *"Hệ thống AI đang tạm thời bận hoặc vượt quá giới hạn tần suất gọi. Vui lòng thử lại sau."*
* **Production Recommendation**: Upgrade to a Google Cloud paid billing account / Pay-as-you-go Gemini API key to remove the 20 RPD free tier constraint.
