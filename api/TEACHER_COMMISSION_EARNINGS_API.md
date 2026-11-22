# TMdemy — Teacher Commission, Earnings & Admin Financial Management API

> **Status:** **IMPLEMENTED & MOUNTED (STEP 09.4 — 2026-11-21)**  
> **Payout / Withdrawal Endpoints (STEP 10):** **NOT IMPLEMENTED / NOT MOUNTED**  
> **Commercial Sales Analytics (`/api/teacher/statistics/*`, `/api/admin/statistics/*`):** Untouched and continue representing canonical commercial sales (`Order.total`), separate from commission earnings.

---

## 1. Global Financial API Contracts & Security Guarantees

1. **Whole-VND Decimal String Serialization:** All authoritative monetary fields (`grossAmount`, `discountAmount`, `commissionBase`, `teacherAmount`, `platformAmount`, `pendingBalance`, `availableBalance`, `reservedBalance`, `paidOutBalance`, `lifetimeRecognized`, `pendingDelta`, `availableDelta`, `totalCommissionBase`, `totalTeacherEarnings`, `totalPlatformShare`, `totalOutstanding`, `totalAbsoluteDiscrepancyVnd`, `netSignedDiscrepancyVnd`) are serialized as **canonical whole-VND decimal strings** (`"280000"`, `"0"`, `"-280000"`). Basis points, holding period days, counts, and pagination remain safe JSON integers.
2. **Persisted DB Authorization & Strict Identity:**
   - Every `/api/teacher/earnings/*` route requires verified JWT (`Authorization: Bearer <token>`) AND persisted PostgreSQL verification (`role = TEACHER`, `status = ACTIVE`; returns `403 Forbidden` if `INACTIVE` or wrong role).
   - Every `/api/admin/commissions/*`, `/api/admin/earnings*`, and `/api/admin/teachers/:teacherId/earnings` route requires verified JWT AND persisted PostgreSQL verification (`role = ADMIN`, `status = ACTIVE`).
   - All query and body schemas use **Zod `.strict()`** — unknown parameters (including caller-supplied `teacherId` on `/api/teacher/earnings*`) return **`400 Bad Request`**.
   - Teacher visibility filters strictly by **`TeacherEarning.teacherId`** (immutable historical seller), never by mutable `Course.authorId`.
3. **Read-Only Consistent Snapshots & Cache Control:**
   - Every commission/earnings endpoint sets **`Cache-Control: no-store`** (including error responses).
   - Multi-aggregate `GET` endpoints execute inside a single PostgreSQL **`RepeatableRead` + `SET TRANSACTION READ ONLY`** transaction so `periodSummary`, `currentBalances`, and `counts` reflect one exact `balanceAsOf` instant with **zero writes** (never triggers lazy holding-period release).
4. **Sanitization:** Never exposes buyer bank account numbers, `PaymentTransaction.rawPayload`, `referenceCode`, or internal stack traces.
5. **Express Route Precedence:** Static paths (`/overview`, `/statistics`, `/transactions`, `/reconciliation`) are mounted before parameterized `/:id` on both routers.

---

## 2. Teacher Earnings Endpoints (`/api/teacher`)

### 2.1 `GET /api/teacher/earnings/overview`
- **Auth:** Active `TEACHER` | **Query:** None (`.strict()` — unknown params return `400`) | **Header:** `Cache-Control: no-store`
- **200 OK Response:**
  ```json
  {
    "success": true,
    "message": "Fetched teacher earnings overview successfully",
    "data": {
      "currency": "VND",
      "balanceAsOf": "2026-11-21T13:00:00.000Z",
      "activePolicy": {
        "version": 1,
        "name": "Standard 70/30 Policy",
        "teacherRateBps": 7000,
        "platformRateBps": 3000,
        "holdingPeriodDays": 7
      },
      "currentBalances": {
        "lifetimeRecognized": "680000",
        "pendingBalance": "280000",
        "availableBalance": "400000",
        "reservedBalance": "0",
        "paidOutBalance": "0"
      },
      "counts": {
        "totalEarnings": 2,
        "pendingEarnings": 1,
        "availableEarnings": 1
      }
    }
  }
  ```

### 2.2 `GET /api/teacher/earnings/statistics`
- **Auth:** Active `TEACHER` | **Query (`.strict()`):**
  - `period`: `7days | 30days | 12months | custom` (default `30days`)
  - `startDate`, `endDate`: `YYYY-MM-DD` or ISO-8601 (strict calendar validation, max 5 years = 1826 days; required for `custom`)
  - `timezone`: `Asia/Ho_Chi_Minh | UTC` (default `Asia/Ho_Chi_Minh`)
  - `courseId`: optional RFC-4122 UUID (filters by `originalCourseId`)
- **200 OK Response:** `{ currency, balanceAsOf, reporting: { dateBasis: "recognizedAt", timezone, startDate, endDate, granularity }, periodSummary: { totalCommissionBase, totalTeacherEarnings, totalPlatformShare, earningCount }, currentBalances, timeline: [{ date, teacherEarnings, platformShare, earningCount }], byCourse: [{ courseId, courseTitle, teacherEarnings, earningCount }] }` (zero-filled in `timezone`).

### 2.3 `GET /api/teacher/earnings/transactions`
- **Auth:** Active `TEACHER` | **Query (`.strict()`):** `page` (`1..100000`, default `1`), `limit` (`1..100`, default `20`), `entryType` (`earning_recognized | earning_released`), `from`, `to`, `timezone` (`Asia/Ho_Chi_Minh | UTC`).
- **200 OK Response:** `{ transactions: [{ id, entryType, earningId, currency, pendingDelta, availableDelta, reservedDelta, paidOutDelta, reason, createdAt }], pagination }` sorted deterministically `createdAt DESC, id DESC`.

### 2.4 `GET /api/teacher/earnings`
- **Auth:** Active `TEACHER` | **Query (`.strict()`):** `page` (default `1`), `limit` (`1..100`, default `10`), `status` (`pending | available`), `courseId` (UUID), `from`, `to`, `timezone`, `sortBy` (`recognizedAt | availableAt | teacherAmount`, default `recognizedAt`), `order` (`asc | desc`, default `desc`; deterministic tie-breaker `id DESC`).
- **200 OK Response:** `{ earnings: [{ id, orderId, orderCode, courseId, originalCourseId, courseTitle, paymentMethod, completionSource, currency, grossAmount, discountAmount, commissionBase, teacherRateBps, platformRateBps, holdingPeriodDays, teacherAmount, platformAmount, status, recognizedAt, availableAt, releasedAt }], pagination }`.

### 2.5 `GET /api/teacher/earnings/:id`
- **Auth:** Active `TEACHER` (`earning.teacherId === actor.id`, else `403 Forbidden`; `404` if missing; `400` if invalid UUID).
- **200 OK Response:** `{ earning, policy: { id, version, name, teacherRateBps, platformRateBps, holdingPeriodDays }, ledgerEntries }`.

---

## 3. Admin Commission & Earnings Endpoints (`/api/admin`)

### 3.1 `GET /api/admin/commissions/policies`
- **Auth:** Active `ADMIN` | **200 OK Response:** `{ activePolicy, policies }` (immutable version history, newest first).

### 3.2 `POST /api/admin/commissions/policies` *(Create-and-Activate Only)*
- **Auth:** Active `ADMIN`
- **Body (`.strict()`):** `{ name, teacherRateBps, platformRateBps, holdingPeriodDays, expectedCurrentVersion?, notes? }`
  - `teacherRateBps`, `platformRateBps`: integers `0..10000` summing to `10000`.
  - `holdingPeriodDays`: integer `0..30`.
  - `expectedCurrentVersion`: optional integer `>= 0`; returns **`409 Conflict`** (`POLICY_VERSION_CONFLICT`) on stale concurrent edit.
- **201 Created Response:** `{ policy, supersededPolicyId, activatedAt }`. Never modifies historical earnings.

### 3.3 `GET /api/admin/commissions/activation`
- **Auth:** Active `ADMIN` | **200 OK Response:** `{ currentState, history }`.

### 3.4 `POST /api/admin/commissions/activation`
- **Auth:** Active `ADMIN` | **Body (`.strict()`):** `{ enabled: boolean, reason: string }`
- **Preflight:** Setting `enabled: true` requires an existing `ACTIVE` `CommissionPolicy` covering `effectiveAt` and `0` incompatible pending SePay orders inside the same `SERIALIZABLE` transaction (returns **`409 Conflict`** if violated).
- **200 OK Response:** `{ window, enabled, effectiveFrom }`.

### 3.5 `GET /api/admin/earnings/statistics`
- **Auth:** Active `ADMIN` | **Query (`.strict()`):** `period` (`7days | 30days | 12months | custom | all`, default `all`), `startDate`, `endDate`, `timezone`, `courseId`, `teacherId`.
- **200 OK Response:** `{ currency, balanceAsOf, reporting, periodSummary, outstandingLiabilities: { pendingBalance, availableBalance, reservedBalance, totalOutstanding }, settledDisbursements: { paidOutBalance }, timeline }`.

### 3.6 `GET /api/admin/earnings/reconciliation` *(Strictly Read-Only)*
- **Auth:** Active `ADMIN` | **Query (`.strict()`):** `from`, `to` (max span `31` days), `limit` (`1..200`, default `200`).
- **200 OK Response:** `{ generatedAt, automaticRepair: false, status, currency, window, scan, summary: { discrepancyCount, totalAbsoluteDiscrepancyVnd, netSignedDiscrepancyVnd, affectedTeachers, affectedEarnings, affectedOrders, insufficientEvidenceCount, intentionallyExcludedCount, classificationCounts, totals }, findings }`.

### 3.7 `GET /api/admin/earnings`
- **Auth:** Active `ADMIN` | **Query (`.strict()`):** `page`, `limit`, `status`, `teacherId`, `courseId`, `from`, `to`, `timezone`, `sortBy`, `order`.
- **200 OK Response:** `{ earnings, pagination }` (includes sanitized `teacher` summary).

### 3.8 `GET /api/admin/earnings/:id`
- **Auth:** Active `ADMIN` | **Params:** `id` (UUID).
- **200 OK Response:** `{ earning, paymentEvidence: { paymentTransactionId, status, transferAmount, processedAt }, policy, ledgerEntries }`.

### 3.9 `GET /api/admin/teachers/:teacherId/earnings`
- **Auth:** Active `ADMIN` | **Params:** `teacherId` (UUID; supports `INACTIVE` teachers; `404` if user missing).
- **Query (`.strict()`):** same filters as `/api/teacher/earnings`.
- **200 OK Response:** `{ teacher, currency, balanceAsOf, currentBalances, counts, earnings, pagination }`.

---

## 4. Error Response Format

| HTTP Status | Trigger | `errorCode` Examples |
|---:|---|---|
| `400` | Invalid UUID, unknown `.strict()` param (e.g. `teacherId` on teacher routes), invalid calendar date, invalid BPS/holding days, reconciliation span > 31d | `VALIDATION_ERROR`, `INVALID_DATE_RANGE`, `INVALID_STATISTICS_DATE_RANGE`, `DATE_RANGE_TOO_LARGE` |
| `401` | Missing, expired, or invalid JWT | *(auth middleware)* |
| `403` | Wrong role, `INACTIVE` `TEACHER`/`ADMIN`, or cross-teacher earning access | `TEACHER_ACCESS_FORBIDDEN`, `ADMIN_ACCESS_FORBIDDEN`, `EARNING_ACCESS_FORBIDDEN` |
| `404` | Earning or Teacher not found | `EARNING_NOT_FOUND`, `TEACHER_NOT_FOUND` |
| `409` | Stale `expectedCurrentVersion`, enabling activation without active policy or with incompatible pending SePay orders | `POLICY_VERSION_CONFLICT`, `COMMISSION_POLICY_MISSING`, `INCOMPATIBLE_PENDING_ORDERS_EXIST` |
| `500` | Ledger/earning integrity mismatch or unexpected error (never leaks stack traces) | `WALLET_EARNING_CONSERVATION_MISMATCH`, `NEGATIVE_WALLET_BALANCE` |

---

## 5. Deferred STEP 10 Payout APIs — NOT IMPLEMENTED

`/api/teacher/payouts*` and `/api/admin/payouts*` are **NOT mounted** in STEP 09.4 and remain deferred to STEP 10.
