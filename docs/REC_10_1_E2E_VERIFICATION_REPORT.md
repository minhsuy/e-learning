# TMdemy Recommendation System — REC-10.1 End-to-End Verification & Audit Report

**Document ID:** `REC-10.1-QA-001`  
**Date:** November 4, 2026  
**Role:** Senior Full-Stack QA Engineer  
**Target Systems:**
- **Next.js Frontend (`e-learning` / `e-learning_client`)** — Next.js 16.3.8 App Router, React 19.2.8, TypeScript 5
- **Node.js Backend (`e-learning_server`)** — Express 5, Prisma 6.4.1, PostgreSQL (`localhost:5432/tmdemy`), Port `3002`
- **Python FastAPI Recommendation Service (`recommendation-service`)** — BM25 Okapi + Multilingual E5 Small + Reciprocal Rank Fusion (RRF), Port `8000`

---

## 1. Architecture Audit Findings

| Audit Checkpoint | Status | Verification Evidence |
| :--- | :---: | :--- |
| **`SimilarCoursesSection` Integration** | **PASSED** | Integrated in `e-learning/src/app/courses/[slug]/page.tsx` (lines 1647–1654) below the 12-column course detail grid. Passes `courseId`, `currentCourseSlug={slug}`, and `limit={6}`. |
| **`PersonalizedRecommendationsSection` Integration** | **PASSED** | Integrated in `e-learning/src/app/page.tsx` (line 390) as Section 3 of the learner home/dashboard (`<PersonalizedRecommendationsSection limit={8} columns={2} />`). |
| **API Client & Request Parameters** | **PASSED** | `e-learning/src/services/recommendation.service.ts` routes all requests exclusively through `apiClient` (`src/lib/api/client.ts`) to `GET /api/recommendations/courses/:courseId/similar`, `GET /api/recommendations/personalized`, and `GET /api/recommendations/health`. Supports `top_k`, `retrieval_depth`, `enable_diversity`, `max_courses_per_category`, `filter_completed`, `filter_enrolled`, `preferred_level`, `preferred_category_names`, and `preferred_topics`. |
| **Response DTO Mapping** | **PASSED** | `useSimilarCourses` and `usePersonalizedRecommendations` (`src/hooks/use-recommendations.ts`) validate `response.success && response.data`, preserve ranking order (`1..K`), defensively filter `course.id !== courseId` for item-to-item mode, and transform `item.course` (`ApiCourseItem`) into UI `Course` objects via `mapApiCourseToCourse` (`src/types/course.ts`). |
| **JWT Authentication & Refresh** | **PASSED** | `apiClient` (`src/lib/api/client.ts`, lines 140–145 & 199–240) injects `Authorization: Bearer <access_token>` and automatically intercepts HTTP `401` (`jwt expired`), refreshes the access token via `POST /api/users/access_token`, and replays the original request with `skipRefresh: true`. |
| **Loading, Empty & Error States** | **PASSED** | Both components render `CourseCardSkeleton` during loading, non-blocking retry banners (`Thử lại` -> `refetch()`) on HTTP/network errors, `null` when `SimilarCoursesSection` is empty, and an exploratory empty-state card when `PersonalizedRecommendationsSection` returns `[]`. |
| **Cold-Start Handling** | **PASSED** | Unauthenticated visitors see a login/explore CTA banner in `PersonalizedRecommendationsSection` with zero protected requests fired. Newly registered learners with zero interactions receive `strategy_used: "catalog_cold_start"` (`fallback_used: true`, `fusion_method: "cold_start_round_robin"`) with 8 diverse beginner-friendly courses across 8 categories. |
| **No Direct Frontend Calls to Python FastAPI** | **PASSED** | Codebase-wide scan of `e-learning/src/**` and `.env*` confirmed zero references to port `8000` or `/api/v1/recommendations/hybrid/*`. All browser requests target `NEXT_PUBLIC_API_URL` (`http://localhost:3002/api/recommendations/*`). |
| **No Exposed Recommendation API Keys** | **PASSED** | Codebase-wide scan of `e-learning/src/**` and `e-learning/.env*` confirmed zero occurrences of `X-API-Key`, `RECOMMENDATION_API_KEY`, or `tmdemy-recommendation`. Shared secret authentication remains strictly server-to-server between Node.js and Python FastAPI. |

---

## 2. End-to-End Test Matrix & Results

All backend/API E2E scenarios were executed against live running instances of PostgreSQL (`:5432`), Python FastAPI Recommendation Service (`127.0.0.1:8000`), and Node.js Express Backend (`localhost:3002`) via `e-learning_server/scripts/verify_rec10_1_live.ts` and `e-learning_server/scripts/test_rec09_recommendation_suite.ts`.

| Test ID | Scenario | Status | Live Verification Evidence |
| :--- | :--- | :---: | :--- |
| **HEALTH-01** | `GET /api/recommendations/health` readiness probe | **PASSED** | `HTTP 200 OK` — `{"status":"ready","service":"TMdemy Recommendation Integration Layer","ready":true,"catalog_course_count":608}` |
| **E2E-01** | Similar Courses returns real recommendations | **PASSED** | `GET /api/recommendations/courses/:courseId/similar?top_k=6&enable_diversity=true` -> `HTTP 200`, `mode="item_to_item"`, `strategy_used="hybrid_rrf_item_to_item"`, `count=6`, rank #1 `"TailwindCSS Masterclass"` (`score=1.0`). |
| **E2E-02** | Personalized returns real recommendations for authenticated learners | **PASSED** | `GET /api/recommendations/personalized?top_k=8&enable_diversity=true&filter_completed=true&filter_enrolled=true` for `khang_leaderboard_no1@example.com` (31 enrollments) -> `HTTP 200`, `mode="personalized"`, `strategy_used="rich_personalized"`, `count=8`, rank #1 `"Xây Dựng Ứng Dụng Trực Quan Hóa Dữ Liệu Thời Gian Thực Trên Next.js"` (`score=0.9068`). |
| **E2E-03** | Recommended course IDs exist in PostgreSQL | **PASSED** | All `14/14` unique recommended course UUIDs across Similar and Personalized responses verified in PostgreSQL `Course` table with `status = 'APPROVED'` and `isDestroyed = false`. |
| **E2E-04** | Changing course ID refreshes Similar recommendations | **PASSED** | Switching from Web course (`Lập trình web`) to AI course (`Trí tuệ nhân tạo (AI)`) updated rank #1 from `"TailwindCSS Masterclass"` to `"MLOps Toàn Tập: Xây Dựng Quy Trình Vận Hành Học Máy Chuyên Nghiệp"`, excluded the respective source course UUIDs, and produced distinct recommendation sets. |
| **E2E-05** | Changing preferred category updates Personalized requests | **PASSED** | Passing `preferred_category_names` for `Lập trình web`, `Trí tuệ nhân tạo (AI)`, and `Thiết kế UI/UX & Sản phẩm số` produced distinct personalized rankings tailored to each category (e.g., UI/UX rank #1 `"Kiến Trúc Thông Tin (Information Architecture) & Thiết Kế Luồng Người Dùng (User Flow)"`). |
| **E2E-06** | Completed and enrolled courses are filtered correctly | **PASSED** | Active learner's `31` enrolled/completed course UUIDs were 100% excluded (`filtered_courses_count = 31`, `overlapInRecommendations = 0`). |
| **E2E-07** | Cold-start users receive fallback recommendations | **PASSED** | Authenticated learner with 0 enrollments/ratings/favorites received `HTTP 200`, `strategy_used="catalog_cold_start"`, `fallback_used=true`, `fusion_method="cold_start_round_robin"`, `models_used=["catalog_metadata"]`, `count=8` across `8` distinct categories. |
| **E2E-08** | HTTP 401 and 503 are handled gracefully | **PASSED** | Missing token -> `HTTP 401` (`Access Token is missing!`); expired JWT -> `HTTP 401` (`jwt expired`) -> `POST /api/users/access_token` -> `HTTP 200` new access token -> replay `GET /api/recommendations/personalized` -> `HTTP 200`. Unreachable Python service translates to `HTTP 503` (`statusCode: 503`, `success: false`) without crashing. |
| **E2E-09** | Logout clears personalized state | **PASSED** | `POST /api/users/logout` revokes `user.refreshToken` in PostgreSQL (`HTTP 200`, subsequent refresh attempt rejected with `HTTP 401`). In `usePersonalizedRecommendations` and `PersonalizedRecommendationsSection`, `!isAuthenticated` clears `courses`, `recommendations`, `strategyUsed`, and `selectedCategoryValue` without firing protected requests. |
| **E2E-10** | Existing pages continue working if Recommendation Service is unavailable | **PASSED** | While Recommendation Service returns `503`, `GET /api/courses?page=1&limit=6` (`HTTP 200`) and `GET /api/courses/machine-learning-fundamentals` (`HTTP 200`) continue serving catalog and course detail pages normally. |
| **UI-BROWSER** | Headless browser DOM click-through | **NOT TESTED** | No Playwright/Cypress browser harness is installed in this workspace; verified via live HTTP/API integration tests, React hook/component source audit, and Next.js production build. |

---

## 3. Recommendation Score & Formula Verification

Inspected directly from the Python implementation (`recommendation-service/src/recommendation/hybrid/config.py`, `fusion.py`, `reranker.py`, `service.py`, and `personalization/scorer.py`):

### 3.1 Mathematical Formulation in Python Engine

1. **Reciprocal Rank Fusion (`ReciprocalRankFusion.fuse` in `fusion.py`):**
   $$\text{RRF}(c) = \sum_{m \in \{\text{bm25}, \text{e5}\}} \frac{w_m}{k + \text{rank}_m(c)}, \quad k = 60, \; w_{\text{bm25}} = 1.0, \; w_{\text{e5}} = 1.0$$
   Rounded to 6 decimal places (`round(data["rrf_score"], 6)`).

2. **Min-Max Hybrid Score Normalization (`PersonalizedHybridReranker.normalize_rrf_scores` in `reranker.py`):**
   $$\text{normalized\_hybrid\_score}(c) = \text{round}\left(\frac{\text{RRF}(c) - \min(\text{RRF})}{\max(\text{RRF}) - \min(\text{RRF})}, 4\right) \in [0, 1]$$
   (Returns `1.0` if $\max(\text{RRF}) - \min(\text{RRF}) \le 10^{-8}$).

3. **Multi-Criteria Personalization Score (`PersonalizedScorer` in `personalization/scorer.py` & `config.py`):**
   $$p(c) = 0.60 \cdot s_{\text{semantic}}(c) + 0.25 \cdot s_{\text{category}}(c) + 0.15 \cdot s_{\text{difficulty}}(c)$$

4. **Final Score Blending (`PersonalizedHybridReranker.rerank_and_filter` in `reranker.py`):**
   - **Item-to-Item (`profile = None`):**
     $$\text{final\_score}(c) = \text{normalized\_hybrid\_score}(c), \quad \text{personalization\_score} = \text{null}$$
   - **Personalized (`profile != None`):**
     $$\text{final\_score}(c) = \text{round}\left(0.50 \cdot \text{normalized\_hybrid\_score}(c) + 0.50 \cdot p(c), 4\right)$$
   - **Strict Cold Start (`strategy_used = "catalog_cold_start"`):**
     $$\text{rrf\_score} = 0.0, \quad \text{normalized\_hybrid\_score} = 0.50, \quad \text{personalization\_score} = \text{final\_score} = 0.60 - 0.01 \times \text{rank}$$

### 3.2 Live Score Breakdown Verification (`SCORE-01`)

- **Item-to-Item Similar Rank #1 (`TailwindCSS Masterclass`):**
  - `bm25_rank = 10`, `e5_rank = 1`
  - $\text{RRF} = \frac{1}{60 + 10} + \frac{1}{60 + 1} = \frac{1}{70} + \frac{1}{61} = 0.0306791569 \rightarrow \text{round}(6) = 0.030679$
  - Live `rrf_score = 0.030679` (exact match, $|\Delta| = 0.00$)
  - Live `normalized_hybrid_score = 1`, `personalization_score = null`, `final_score = 1`
- **Personalized Rank #1 (`Xây Dựng Ứng Dụng Trực Quan Hóa Dữ Liệu Thời Gian Thực Trên Next.js`):**
  - `bm25_rank = 3`, `e5_rank = 4`, `rrf_score = 0.031498` ($\frac{1}{63} + \frac{1}{64} = 0.0314980158 \rightarrow 0.031498$)
  - `normalized_hybrid_score = 1.0`, `personalization_score = 0.8136`
  - $\text{final\_score} = 0.50 \times 1.0 + 0.50 \times 0.8136 = 0.9068$
  - Live `final_score = 0.9068` (exact match, $|\Delta| = 0.00$)

---

## 4. Automated Test & Build Execution Summary

| Suite / Command | Working Directory | Status | Result Details |
| :--- | :--- | :---: | :--- |
| `.\.venv\Scripts\python.exe -m pytest tests -q` | `recommendation-service` | **PASSED** | `245 passed in 63.24s` (Exit code `0`) |
| `npx.cmd tsx scripts/test_rec09_recommendation_suite.ts` | `e-learning_server` | **PASSED** | `21/21 tests passed` including Test #21 live REC-08 smoke test (Exit code `0`) |
| `npx.cmd tsx scripts/verify_rec10_1_live.ts` | `e-learning_server` | **PASSED** | `12/12 live E2E & score verification checks passed` (Exit code `0`) |
| `npx.cmd tsc --noEmit` | `e-learning` | **PASSED** | `0 errors` across all TypeScript files (Exit code `0`) |
| `npx.cmd eslint src/types/recommendation.ts src/services/recommendation.service.ts src/hooks/use-recommendations.ts src/components/course/similar-courses-section.tsx src/components/home/personalized-recommendations-section.tsx` | `e-learning` | **PASSED** | `0 errors, 0 warnings` on all recommendation files (`npm.cmd run lint` project-wide: `0 errors`, 46 pre-existing warnings) |
| `npm.cmd run build` | `e-learning` | **PASSED** | Next.js 16.3.8 (Turbopack) production build succeeded across all routes (`/` and `/courses/[slug]`) |

---

## 5. Issues Discovered & Resolutions

### Issue 1 (Frontend — Fixed): Category Filter Label vs. Canonical Catalog Name Mismatch in `PersonalizedRecommendationsSection`
- **Discovery:** In `e-learning/src/components/home/personalized-recommendations-section.tsx`, `CATEGORY_FILTERS` previously passed display strings `'Trí tuệ nhân tạo'` and `'Thiết kế UI/UX'` directly as `preferred_category_names`. However, the canonical category names in PostgreSQL (`Category.name`) and `recommendation-service/data/processed/courses_processed.json` are `'Trí tuệ nhân tạo (AI)'` and `'Thiết kế UI/UX & Sản phẩm số'`. Because Python's `LearnerProfileBuilder._build_category_index()` and `PersonalizedScorer.compute_category_score()` perform exact normalized string matching (`cat_name.strip().lower()`), selecting those two chips failed to match the category index and assigned a non-matching category score (`0.10` instead of `1.00`).
- **Resolution (Frontend):** Updated `CATEGORY_FILTERS` in `e-learning/src/components/home/personalized-recommendations-section.tsx` to map display labels to their exact canonical backend category values (`'Trí tuệ nhân tạo (AI)'` and `'Thiết kế UI/UX & Sản phẩm số'`), and ensured `preferredCategory` resets to `undefined` when unauthenticated.

### Issue 2 (Frontend Types & Docs — Fixed): `RecommendationScoreBreakdown` Optionality & Hook Metadata Exposure
- **Discovery:** In `e-learning/src/types/recommendation.ts`, `rrf_score` and `normalized_hybrid_score` were typed as optional (`number | undefined`), whereas both the Python FastAPI model (`HybridScoreBreakdown`) and Node.js Zod schema (`HybridScoreBreakdownSchema`) guarantee `rrf_score: number` and `normalized_hybrid_score: number` on every item. Additionally, `useSimilarCourses` and `usePersonalizedRecommendations` only exposed `strategyUsed` while discarding `models_used`, `fusion_method`, `fallback_used`, `fallback_reason`, `total_candidates_retrieved`, and `filtered_courses_count`.
- **Resolution (Frontend):** Aligned `RecommendationScoreBreakdown` in `e-learning/src/types/recommendation.ts` with the backend schema, exposed the complete recommendation metadata in `e-learning/src/hooks/use-recommendations.ts` (and stabilized array dependencies `preferred_category_names` / `preferred_topics` into serialized strings), and updated `e-learning/api/rec10_recommendation_frontend_api.md`.

### Issue 3 (Python Service Configuration — Documented; Approval Required Before Modifying `recommendation-service`)
- **Discovery:** `recommendation-service/src/api/config.py` reads `os.getenv("RECOMMENDATION_API_KEY", "tmdemy-rec-dev-secret-key-38491")` without calling `dotenv.load_dotenv()`. Meanwhile, both `recommendation-service/.env` and `e-learning_server/.env` set `RECOMMENDATION_API_KEY=tmdemy-recommendation`. If `uvicorn src.api.main:app` is started without `--env-file .env` or environment variable injection, FastAPI falls back to `tmdemy-rec-dev-secret-key-38491`, causing Node.js requests to receive `401 Unauthorized` (translated by Node.js into `503 AUTHENTICATION_FAILURE`).
- **Action Taken:** Per task constraints (*"If a problem requires changes outside the frontend, document it and request approval before modifying another service"*), `recommendation-service/src/api/config.py` was **not** modified. During live E2E verification, `RECOMMENDATION_API_KEY=tmdemy-recommendation` was injected into the `uvicorn` process environment.
- **Recommended Fix (Awaiting Approval):** Add `from dotenv import load_dotenv; load_dotenv()` at the top of `recommendation-service/src/api/config.py` or pass `--env-file .env` in the `recommendation-service` startup script.

---

## 6. Files Modified

| File Path | Summary of Changes |
| :--- | :--- |
| `e-learning/src/types/recommendation.ts` | Made `rrf_score: number` and `normalized_hybrid_score: number` required in `RecommendationScoreBreakdown` to match the backend Zod/Pydantic contract. |
| `e-learning/src/hooks/use-recommendations.ts` | Exposed `modelsUsed`, `fusionMethod`, `fallbackUsed`, `fallbackReason`, `totalCandidatesRetrieved`, and `filteredCoursesCount` from both hooks; serialized array query params for stable `useEffect` dependencies. |
| `e-learning/src/components/home/personalized-recommendations-section.tsx` | Mapped category filter chips to canonical PostgreSQL/catalog category names (`Trí tuệ nhân tạo (AI)`, `Thiết kế UI/UX & Sản phẩm số`) and cleared category filter override when unauthenticated. |
| `e-learning/api/rec10_recommendation_frontend_api.md` | Updated Personalized `score_breakdown` example to include all 8 breakdown fields returned by the backend. |
| `e-learning_server/scripts/verify_rec10_1_live.ts` | Added repeatable 12-check live E2E and score verification script. |
| `docs/REC_10_1_E2E_VERIFICATION_REPORT.md` | Created formal REC-10.1 E2E verification & audit report. |

---

## 7. Security Findings

1. **Zero Secret Leakage to Browser:** `RECOMMENDATION_API_KEY` (`tmdemy-recommendation`) is stored solely in server-side `.env` files and never exposed in `NEXT_PUBLIC_*` variables or client bundles.
2. **Backend Gateway Enforcement:** `GET /api/recommendations/personalized` enforces `verifyAccessToken` middleware and extracts `userId` strictly from the verified JWT payload (`req.user`), preventing horizontal privilege escalation (IDOR) across learner profiles.
3. **Sanitized Error Translation:** Internal Python 401/500/timeout errors are translated by `RecommendationMicroserviceClient` (`e-learning_server/src/services/recommendationClient.service.ts`) into sanitized 502/503/504 responses without leaking `X-API-Key` headers, stack traces, or internal URLs.
4. **Refresh Token Hash Verification:** `POST /api/users/access_token` validates both the JWT signature and the SHA-256 hash stored in PostgreSQL `User.refreshToken`, and `POST /api/users/logout` immediately nullifies `User.refreshToken` in PostgreSQL.

---

## 8. Remaining Limitations & Final Readiness Assessment

- **Remaining Limitations:**
  1. `recommendation-service` must be started with `--env-file .env` (or `load_dotenv()` added to `recommendation-service/src/api/config.py` upon approval) so `RECOMMENDATION_API_KEY` matches `e-learning_server/.env`.
  2. `e-learning_server` has pre-existing TypeScript strictness errors in unrelated controllers (`admin.controller.ts`, `category.controller.ts`, `chapter.controller.ts`, `comment.controller.ts`, `course.controller.ts`, `teacher.controller.ts`), while all recommendation modules compile and pass 100% of unit and live integration tests.
- **Final Readiness Assessment:** **READY FOR PRODUCTION** (12/12 live E2E & mathematical score checks **PASSED**, 21/21 REC-09 integration tests **PASSED**, 245/245 REC-08 Python tests **PASSED**, frontend `tsc`, `eslint`, and `next build` **PASSED**).

