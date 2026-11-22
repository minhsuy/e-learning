# TMdemy AI Tutor — Lesson Transcript Indexing API Specification

**Document Version:** 1.0.0  
**Phase:** Step 04 — Node.js Lesson Transcript Indexing Pipeline  
**Target Services:** `e-learning_server/` (Node.js/Express)  
**Authentication:** JWT Bearer Token (`ADMIN` or `TEACHER`/`EXPERT`)  
**Base URL:** `/api/v1/ai-tutor` (also alias-mounted at `/api/ai-tutor`)  
**Status:** IMPLEMENTED & PRODUCTION READY  

---

## 1. Overview & Architecture

The Lesson Transcript Indexing Pipeline coordinates the transformation of video lesson refined transcripts into timestamp-aware semantic chunks and 384-dimensional vector embeddings stored in PostgreSQL via the `pgvector` extension.

```text
Teacher / Admin / Post-Transcription Hook
             │
             ▼
  POST /api/v1/ai-tutor/lessons/:lessonId/index
             │
             ├─► 1. Verify Authentication & Role (ADMIN | TEACHER)
             ├─► 2. Validate lessonId UUID format
             ├─► 3. Read Lesson.transcriptRefined from PostgreSQL
             ├─► 4. Calculate Canonical SHA-256 Hash
             ├─► 5. Check Idempotency (skip if hash + model match and chunk count intact)
             ├─► 6. Acquire Concurrency Claim in PostgreSQL (stale lock recovery > 5m)
             ├─► 7. Call Python AI Microservice (POST /api/v1/embeddings/index-transcript)
             ├─► 8. Optimistic Concurrency Check (verify transcript not modified during inference)
             ├─► 9. Atomic Persistence: Delete old chunks, Insert vector(384) chunks, update AiTutorIndexState to COMPLETED
             └─► 10. Return Typed Response
```

---

## 2. Security & Authorization

| Role | Access Level | Description |
|---|---|---|
| `ADMIN` | Full Access | Can index, re-index, or query status for any lesson across all courses. |
| `TEACHER` / `EXPERT` | Author / Course Teacher | Can trigger indexing and view status for lessons in courses they author. |
| `USER` (Student) | Denied (`403 Forbidden`) | Students cannot trigger or manage administrative indexing pipelines. |
| Unauthenticated | Denied (`401 Unauthorized`) | Missing or invalid JWT bearer token. |

---

## 3. API Endpoints

### 3.1 Trigger Lesson Transcript Indexing

Triggers the semantic chunking and vector embedding generation for a specific lesson transcript.

- **HTTP Method**: `POST`
- **Route**: `/api/v1/ai-tutor/lessons/:lessonId/index`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  Content-Type: application/json
  ```
- **Route Parameters**:
  - `lessonId` (string, required, UUID v4): The unique identifier of the lesson.
- **Request Body (Optional)**:
  ```json
  {
    "force": false,
    "maxTokensPerChunk": 150
  }
  ```
  - `force` (boolean, optional, default: `false`): If `true`, bypasses the idempotency check and forces recalculation of embeddings even if the transcript content hash has not changed.
  - `maxTokensPerChunk` (number, optional, range: `20`–`1000`, default: `150`): Maximum token target for each semantic transcript chunk.

#### Success Response: Initial Indexing (`200 OK`)
```json
{
  "success": true,
  "data": {
    "status": "INDEXED",
    "lessonId": "b421825e-4393-4140-b9e4-cf60e4f187a5",
    "contentHash": "6af78839f19170b41762253d458d467cb5a646e0964f6e2ab4f5cf7007dfbdd0",
    "embeddingModel": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "chunkCount": 8,
    "indexedAt": "2026-11-09T13:32:47.103Z",
    "message": "Successfully indexed lesson with 8 chunks."
  }
}
```

#### Success Response: Reindexed (`200 OK`)
Returned when an existing index is updated after transcript modification or when `force: true` is passed:
```json
{
  "success": true,
  "data": {
    "status": "REINDEXED",
    "lessonId": "b421825e-4393-4140-b9e4-cf60e4f187a5",
    "contentHash": "d8e39f...",
    "embeddingModel": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "chunkCount": 10,
    "indexedAt": "2026-11-09T13:35:12.890Z",
    "message": "Successfully re-indexed lesson with 10 chunks."
  }
}
```

#### Success Response: Idempotent Skip (`200 OK`)
Returned when the transcript content hash and embedding model match the existing completed index state and database chunk counts are verified:
```json
{
  "success": true,
  "data": {
    "status": "SKIPPED_IDEMPOTENT",
    "lessonId": "b421825e-4393-4140-b9e4-cf60e4f187a5",
    "contentHash": "6af78839f19170b41762253d458d467cb5a646e0964f6e2ab4f5cf7007dfbdd0",
    "embeddingModel": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "chunkCount": 8,
    "indexedAt": "2026-11-09T13:32:47.100Z",
    "message": "Transcript indexing is already completed and consistent."
  }
}
```

---

### 3.2 Get Lesson Index Status

Retrieves the current indexing lifecycle status, metadata, and chunk count for a lesson.

- **HTTP Method**: `GET`
- **Route**: `/api/v1/ai-tutor/lessons/:lessonId/index-status`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Route Parameters**:
  - `lessonId` (string, required, UUID v4): The unique identifier of the lesson.

#### Success Response: Completed Index (`200 OK`)
```json
{
  "success": true,
  "data": {
    "lessonId": "b421825e-4393-4140-b9e4-cf60e4f187a5",
    "status": "COMPLETED",
    "contentHash": "6af78839f19170b41762253d458d467cb5a646e0964f6e2ab4f5cf7007dfbdd0",
    "embeddingModel": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "chunkCount": 8,
    "indexedAt": "2026-11-09T13:32:47.103Z",
    "errorMessage": null,
    "updatedAt": "2026-11-09T13:32:47.103Z",
    "isIndexed": true
  }
}
```

#### Success Response: Unindexed Lesson (`200 OK`)
When a lesson exists and has a transcript but has not yet been processed by the indexing pipeline:
```json
{
  "success": true,
  "data": {
    "lessonId": "a11a58c0-8d59-4b1f-998f-015892c23a99",
    "status": "PENDING",
    "contentHash": "",
    "embeddingModel": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "chunkCount": 0,
    "indexedAt": null,
    "errorMessage": null,
    "updatedAt": "2026-11-09T10:15:00.000Z",
    "isIndexed": false
  }
}
```

---

## 4. Error Responses

| HTTP Status | Error Type / Message | Root Cause |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | `lessonId` is not a valid UUID RFC 4122 string. |
| `400 Bad Request` | `Bài học chưa có nội dung lời giảng đã chuẩn hóa (transcriptRefined).` | `Lesson.transcriptRefined` is null, empty, or whitespace. |
| `401 Unauthorized` | `Vui lòng đăng nhập để tiếp tục.` | Access token missing, malformed, or expired. |
| `403 Forbidden` | `Bạn không có quyền thực hiện hành động này.` | User role is `USER` (student). |
| `404 Not Found` | `Không tìm thấy bài học tương ứng.` | Lesson with given `lessonId` does not exist in PostgreSQL. |
| `409 Conflict` | `Bài học đang trong quá trình lập chỉ mục vector bởi một tiến trình khác.` | Active `PROCESSING` state in PostgreSQL (<5m old). |
| `409 Conflict` | `Nội dung lời giảng đã bị thay đổi trong quá trình suy luận embedding.` | Optimistic concurrency check failed; transcript mutated mid-inference. |
| `502 Bad Gateway` | `Phản hồi từ AI Microservice không hợp lệ hoặc dữ liệu vector bị lỗi.` | Vector dimensions != 384, contains NaN/Infinity, or chunk format invalid. |
| `503 Service Unavailable` | `Không thể kết nối đến AI Microservice để tạo embedding.` | AI microservice offline or connection refused. |
| `504 Gateway Timeout` | `Yêu cầu lập chỉ mục tới AI Microservice đã vượt quá thời gian chờ.` | Embedding calculation took longer than timeout (120s). |

---

## 5. Background Post-Transcription Hook

In addition to the explicit REST endpoints above, the indexing pipeline is automatically triggered as a fire-and-forget background job upon completion of Whisper speech-to-text and Gemini transcript refinement in `src/services/aiProcessing.service.ts`:

```typescript
// Auto-trigger transcript indexing pipeline for AI Tutor in background
indexLessonTranscriptService({ lessonId: job.lessonId })
  .then((result) => {
    logger.info(
      `[AI Tutor Indexing] Auto-indexed lesson ${job.lessonId}: ${result.status} (${result.chunkCount} chunks)`
    )
  })
  .catch((err) => {
    logger.error(
      `[AI Tutor Indexing] Background auto-indexing failed for lesson ${job.lessonId}: ${err.message}`
    )
  })
```

---

## 6. cURL & Integration Examples

### Trigger Indexing
```bash
curl -X POST "http://localhost:5000/api/v1/ai-tutor/lessons/b421825e-4393-4140-b9e4-cf60e4f187a5/index" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "force": false,
    "maxTokensPerChunk": 150
  }'
```

### Force Re-Indexing
```bash
curl -X POST "http://localhost:5000/api/v1/ai-tutor/lessons/b421825e-4393-4140-b9e4-cf60e4f187a5/index" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "force": true
  }'
```

### Check Status
```bash
curl -X GET "http://localhost:5000/api/v1/ai-tutor/lessons/b421825e-4393-4140-b9e4-cf60e4f187a5/index-status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

