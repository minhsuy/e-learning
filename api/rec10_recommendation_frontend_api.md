# TMdemy Recommendation System — REC-10 Frontend API Specification

**Document Version:** 1.0.0  
**Target Audience:** Frontend Engineers, Mobile Developers, QA Engineers  
**Target Application:** TMdemy Next.js Frontend Client (`e-learning_client`)  
**Backend Gateway:** TMdemy Node.js / Express Backend (`e-learning_server`)  
**Base URL:** `/api/recommendations`  
**Protocol:** HTTP/1.1, JSON  
**Related Documents:** `api/rec09_recommendation_api.md`, `docs/REC_10_FRONTEND_RECOMMENDATION_REPORT.md`

---

## 1. Overview & Architectural Boundaries

The **TMdemy Frontend Recommendation Integration (REC-10)** connects the Next.js App Router client to course recommendation capabilities orchestrated by the Node.js Backend layer (REC-09).

### Architectural Invariants:
1. **Zero Direct Microservice Communication:** The frontend NEVER connects to or communicates directly with the internal Python FastAPI microservice (port 8000). All recommendation traffic is routed through `/api/recommendations/*` on the Node.js backend.
2. **Centralized API Client:** All requests utilize `@/lib/api/client` (`apiClient`), ensuring automated token injection, token refresh handling, and standardized error normalization.
3. **Graceful Degeneration:** Recommendation failures (such as backend unavailability or HTTP 503) never crash host pages (e.g. Course Detail or Home/Dashboard).

---

## 2. Authentication & Authorization Matrix

| Endpoint | HTTP Method | Access Level | Header Required | Description |
| :--- | :---: | :---: | :--- | :--- |
| `/api/recommendations/courses/:courseId/similar` | `GET` | **Public** | None *(Optional `Authorization: Bearer <token>`)* | Item-to-Item similar courses based on curriculum content. |
| `/api/recommendations/personalized` | `GET` | **Private** | `Authorization: Bearer <access_token>` | Tailored recommendations for the authenticated learner. |
| `/api/recommendations/health` | `GET` | **Public** | None | System readiness probe for recommendation infrastructure. |

---

## 3. Endpoints Specification

### 3.1 Item-to-Item Similar Courses

Retrieves ranked courses pedagogically and semantically similar to a target course.

- **Method:** `GET`
- **Path:** `/api/recommendations/courses/:courseId/similar`
- **Auth:** Public
- **Frontend Service:** `recommendationService.getSimilarCourses(courseId, params, options)`
- **Frontend Hook:** `useSimilarCourses(courseId, options)`

#### Route Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `courseId` | UUID | Yes | Primary key UUID of target course (e.g. `00d7b29c-a915-5905-9592-b282bd2194dc`). |

#### Query Parameters
| Parameter | Type | Default | Constraints | Description |
| :--- | :---: | :---: | :---: | :--- |
| `top_k` | Integer | `6` | $1 \le \text{top\_k} \le 50$ | Number of recommended courses to return. |
| `retrieval_depth` | Integer | `50` | $10 \le \text{depth} \le 200$ | Candidate pool size retrieved per model channel. |
| `enable_diversity` | Boolean | `true` | `true` / `false` | Enforce category diversification. |
| `max_courses_per_category` | Integer | `3` | $1 \le \text{max} \le 10$ | Maximum recommendations from any single category. |

#### Response DTO (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "mode": "item_to_item",
    "strategy_used": "hybrid_rrf_item_to_item",
    "models_used": ["bm25", "e5_small"],
    "fusion_method": "rrf",
    "fallback_used": false,
    "fallback_reason": null,
    "total_candidates_retrieved": 68,
    "filtered_courses_count": 0,
    "recommendations": [
      {
        "course": {
          "id": "7b2b3df2-f8d4-5667-a7f9-0c30d8853ae7",
          "_id": "7b2b3df2-f8d4-5667-a7f9-0c30d8853ae7",
          "title": "Làm chủ Tailwind CSS 4: Từ nền tảng đến thiết kế giao diện tinh tế",
          "slug": "lam-chu-tailwind-css-4-tu-nen-tang-den-thiet-ke-giao-dien-tinh-te",
          "image": "https://res.cloudinary.com/tmdemy/image/upload/v1/courses/tailwind.jpg",
          "price": 199000,
          "oldPrice": 399000,
          "level": "BEGINNER",
          "type": "PAID",
          "view": 125,
          "sold": 38,
          "author": {
            "id": "13608f92-8acf-53e3-adcb-0d832e9cb1d4",
            "username": "teacher02",
            "avatar": ""
          },
          "category": {
            "id": "fc5d66a4-7468-5328-a6a9-16c3a9e49881",
            "name": "Lập trình web",
            "slug": "lap-trinh-web"
          }
        },
        "rank": 1,
        "score": 1.0,
        "explanation": "Xuất hiện hàng đầu cả về từ khóa (hạng #2) và ngữ nghĩa (hạng #3)",
        "score_breakdown": {
          "bm25_rank": 2,
          "e5_rank": 3,
          "bm25_score": 14.82,
          "e5_score": 0.895,
          "rrf_score": 0.0325,
          "normalized_hybrid_score": 1.0,
          "final_score": 1.0
        }
      }
    ]
  }
}
```

---

### 3.2 Personalized Recommendations for Authenticated Learner

Tailors course suggestions to the current learner based on enrollment history, progress percent, course ratings, and favorites.

- **Method:** `GET`
- **Path:** `/api/recommendations/personalized`
- **Auth:** Private (`Authorization: Bearer <access_token>`)
- **Frontend Service:** `recommendationService.getPersonalizedRecommendations(params, options)`
- **Frontend Hook:** `usePersonalizedRecommendations(options)`

#### Query Parameters
| Parameter | Type | Default | Constraints | Description |
| :--- | :---: | :---: | :---: | :--- |
| `top_k` | Integer | `8` | $1 \le \text{top\_k} \le 50$ | Number of recommended courses to return. |
| `retrieval_depth` | Integer | `50` | $10 \le \text{depth} \le 200$ | Candidate pool size retrieved per model channel. |
| `filter_completed` | Boolean | `true` | `true` / `false` | Exclude completed courses. |
| `filter_enrolled` | Boolean | `true` | `true` / `false` | Exclude courses the learner is currently taking. |
| `enable_diversity` | Boolean | `true` | `true` / `false` | Prevent single category dominance. |
| `max_courses_per_category` | Integer | `3` | $1 \le \text{max} \le 10$ | Max courses per category. |
| `preferred_level` | String | Auto | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` | Optional target difficulty filter override. |
| `preferred_category_names` | String | Auto | Comma-delimited category names | Optional category affinity filter/boost. |
| `preferred_topics` | String | Auto | Comma-delimited topics | Optional keyword affinity boost. |

#### Response DTO (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "mode": "personalized",
    "strategy_used": "rich_personalized",
    "models_used": ["bm25", "e5_small"],
    "fusion_method": "rrf",
    "fallback_used": false,
    "fallback_reason": null,
    "total_candidates_retrieved": 96,
    "filtered_courses_count": 3,
    "recommendations": [
      {
        "course": {
          "id": "e4589d12-6f2b-4fa8-b21a-4d7a718b52a1",
          "_id": "e4589d12-6f2b-4fa8-b21a-4d7a718b52a1",
          "title": "TypeScript và Clean Architecture trong ứng dụng thực tế",
          "slug": "typescript-va-clean-architecture-trong-ung-dung-thuc-te",
          "image": "https://res.cloudinary.com/tmdemy/image/upload/v1/courses/ts-clean.jpg",
          "price": 349000,
          "oldPrice": 699000,
          "level": "INTERMEDIATE",
          "type": "PAID",
          "author": {
            "id": "6dd1ccd9-420b-5c6d-8322-75223e67e549",
            "username": "teacher_cntt"
          },
          "category": {
            "name": "Lập trình web",
            "slug": "lap-trinh-web"
          }
        },
        "rank": 1,
        "score": 0.942,
        "explanation": "Phù hợp với tiến trình học tập các khóa học Frontend trước đó của bạn, đồng thời tiếp nối trình độ INTERMEDIATE.",
        "score_breakdown": {
          "bm25_rank": 1,
          "e5_rank": 3,
          "bm25_score": 18.4,
          "e5_score": 0.865,
          "rrf_score": 0.0323,
          "normalized_hybrid_score": 0.91,
          "personalization_score": 0.974,
          "final_score": 0.942
        }
      }
    ]
  }
}
```

---

### 3.3 Recommendation Service Health Probe

Provides operational status and catalog size of the recommendation service.

- **Method:** `GET`
- **Path:** `/api/recommendations/health`
- **Auth:** Public
- **Frontend Service:** `recommendationService.getHealth(options)`

#### Response DTO (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "ready",
    "service": "TMdemy Recommendation Integration Layer",
    "ready": true,
    "catalog_course_count": 608
  }
}
```

---

## 4. Error Responses & Handling Matrix

| HTTP Status | Error Type | Backend Error Payload | Frontend Handling Strategy |
| :---: | :--- | :--- | :--- |
| **400** | Bad Request | `{"success": false, "statusCode": 400, "message": "top_k must be an integer between 1 and 50"}` | Normalized by `apiClient` to `AppApiError`. UI logs warning and gracefully falls back to empty array. |
| **401** | Unauthorized | `{"success": false, "statusCode": 401, "message": "Access Token is missing!"}` | `usePersonalizedRecommendations` hook guards against firing when unauthenticated. If 401 occurs unexpectedly, `apiClient` triggers refresh token flow. |
| **404** | Course Not Found | `{"success": false, "statusCode": 404, "message": "Target course not found or is not currently available for recommendation."}` | `SimilarCoursesSection` treats as empty result and renders `null` without breaking the course detail page. |
| **503** | Service Unavailable | `{"success": false, "statusCode": 503, "message": "Recommendation service is currently not ready or unavailable."}` | Component displays non-blocking retry banner or silently degrades; host page functions normally. |

---

## 5. Frontend Usage Guide

### 5.1 Using the Service Layer

```typescript
import { recommendationService } from '@/services/recommendation.service';

// 1. Similar courses
const similarRes = await recommendationService.getSimilarCourses('00d7b29c-a915-5905-9592-b282bd2194dc', {
  limit: 6,
  enable_diversity: true
});

// 2. Personalized recommendations
const personalizedRes = await recommendationService.getPersonalizedRecommendations({
  limit: 8,
  preferred_category_names: 'Lập trình web'
});
```

### 5.2 Using the React Hooks

```typescript
import { useSimilarCourses, usePersonalizedRecommendations } from '@/hooks/use-recommendations';

// In Course Detail Page
function MyCourseDetail({ courseId }: { courseId: string }) {
  const { courses, isLoading, error, refetch } = useSimilarCourses(courseId, { limit: 6 });
  // courses is Course[] ready for CourseCard
}

// In Home / Dashboard
function MyDashboard() {
  const { courses, isLoading, error, isAuthenticated, refetch } = usePersonalizedRecommendations({ limit: 8 });
  // Automatically guarded against firing when unauthenticated
}
```

### 5.3 Using the UI Components

```tsx
// Course Detail Page (`src/app/courses/[slug]/page.tsx`)
import { SimilarCoursesSection } from '@/components/course/similar-courses-section';

<SimilarCoursesSection courseId={courseId} currentCourseSlug={slug} limit={6} />

// Home Page (`src/app/page.tsx`)
import { PersonalizedRecommendationsSection } from '@/components/home/personalized-recommendations-section';

<PersonalizedRecommendationsSection limit={8} columns={2} />
```

