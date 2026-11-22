# STEP 08.2 — Financial Analytics & Read-Only Order Detail API Reference

Verified locally against isolated PostgreSQL test databases (`tmdemy_step082_test_*` and `tmdemy_step072_test_*`).
All endpoints documented here are **strictly read-only**, return `Cache-Control: no-store`, and enforce **persisted `ACTIVE` user + role verification in PostgreSQL** (preventing inactive accounts or forged JWT role claims from accessing financial data).

---

## 1. Global Financial Reporting Semantics

- **Recognized Course Sales**: Derived exclusively from `orders` where `status = 'COMPLETED'`, using `SUM(Order.total)` for net sales (`netRevenue` / `totalRevenue`) and `SUM(Order.amount)` for gross pre-discount sales (`grossRevenue`).
- **Anti-Inflation Rule**: Revenue is NEVER aggregated by joining `payment_transactions` or `payment_webhook_events`. Duplicate webhooks, overpayment rows (`PENDING_MANUAL_REVIEW`), and multiple transactions on a single order do not multiply or inflate sales totals.
- **Free Enrollments / Zero-Total Orders**: Orders with `total = 0` contribute `0 VND` to monetary revenue and are explicitly broken out as `freeOrders` alongside `paidOrders` (`paidOrders + freeOrders = completedOrders`).
- **Payment Method Classification**:
  - `sepay_bank_transfer` (`EPaymentMethod.SEPAY_BANK_TRANSFER`)
  - `manual_bank_transfer` (`EPaymentMethod.MANUAL_BANK_TRANSFER`)
  - `free` (`EPaymentMethod.FREE`)
  - `legacy_unknown` (`payment_method IS NULL` — historical rows are never silently relabeled as SePay)
- **Date Recognition Basis (`timeBasis`)**:
  - `createdAt` *(default, backward-compatible)*: Aggregates by `Order.createdAt`.
  - `recognizedAt`: Aggregates by `COALESCE(Order.paidAt, Order.createdAt)` and surfaces `reporting.legacyEstimatedOrders` (completed orders with `paidAt IS NULL` falling back to `createdAt`).
  - `paidAt`: Strict verified payment date (`Order.paidAt IS NOT NULL`), surfacing excluded undated historical rows in `reporting.undatedLegacyOrders`.
- **Timezone Policy (`timezone`)**:
  - Defaults to `Asia/Ho_Chi_Minh` (`UTC+07:00`, no DST). Also supports `UTC`.
  - Date-only inputs (`YYYY-MM-DD`) convert to half-open UTC boundaries `[start, end)` in the target timezone (e.g., `2026-11-18` VN = `2026-11-17T17:00:00.000Z` to `2026-11-18T17:00:00.000Z`).
  - Exact ISO-8601 timestamp inputs preserve their exact UTC instant without adding `+1 day`.
  - Custom spans are strictly calendar-validated (rejects impossible dates like `2026-02-31`, reversed ranges, and spans > 5 years / 1826 days with HTTP `400`).
  - Raw SQL predicates interpret PostgreSQL `TIMESTAMP WITHOUT TIME ZONE` UTC columns via `(col AT TIME ZONE 'UTC')` so results are independent of host/PostgreSQL session timezone.
- **Historical Retention & Non-Commission Boundary**:
  - Historical completed orders for soft-deleted courses (`Course.isDestroyed = true`) and revoked enrollments (`Enrollment.status = CANCELED`) are retained in financial totals.
  - Teacher revenue represents **sales attribution** on their authored courses — NOT salary, withdrawable balance, commission, or payout.

---

## 2. Admin Analytics Endpoints (`ACTIVE` `ADMIN` Required)

### 2.1 `GET /api/admin/statistics/financial` *(Extended — Backward Compatible)*
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>` | Response: `Cache-Control: no-store`
- **Query Params**: `timeRange` (`7days|30days|1year|12months|custom|all`, default `all`), `startDate`, `endDate`, `timeBasis` (`createdAt|recognizedAt|paidAt`, default `createdAt`), `timezone` (`Asia/Ho_Chi_Minh|UTC`, default `Asia/Ho_Chi_Minh`), `paymentMethod` (`all|sepay_bank_transfer|manual_bank_transfer|free|legacy_unknown`, default `all`), `granularity` (`day|month`), `teacherId` (UUID), `courseId` (UUID).
- **Preserved Legacy Fields**: `grossRevenue`, `netRevenue`, `totalOrders`, `completedOrders`, `pendingOrders`, `rejectedOrders`, `averageOrderValue`, `revenueByMonth`.
- **Additive STEP 08.2 Fields**: `paidOrders`, `freeOrders`, `totalDiscount`, `reporting` (`timeBasis`, `timezone`, `startDate`, `endDate`, `granularity`, `legacyEstimatedOrders`, `undatedLegacyOrders`), `methodBreakdown[]`, `revenueTimeline[]` (zero-filled continuous series).

### 2.2 `GET /api/admin/statistics/sales` *(New Read-Only Breakdown)*
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>` | Response: `Cache-Control: no-store`
- **Query Params**: `groupBy` (`course|teacher`, default `course`), `timeRange`, `startDate`, `endDate`, `timeBasis`, `timezone`, `paymentMethod`, `page` (`>= 1`), `limit` (`1..100`), `sortBy` (`revenue|completedOrders|grossSales`, deterministic tie-breaker `"id" ASC NULLS LAST`), `order` (`asc|desc`).
- **Response**: `{ reporting, rows: [{ id, label, revenue, grossSales, discount, completedOrders, paidOrders, freeOrders, courseCount?, teacher? }], pagination: { page, limit, total, totalPages } }`.
- Safely groups orphan completed orders (`courseId IS NULL`) under `id: null, label: "(Đơn hàng không gắn khóa học)"` with accurate `pagination.total`.

### 2.3 `GET /api/admin/dashboard/summary` *(Extended — Backward Compatible)*
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>` | Response: `Cache-Control: no-store`
- **Additive Fields**:
  - `counts.manualPendingOrders`, `counts.sepayPendingOrders` (splits actionable manual orders from automated SePay pending orders).
  - `pendingTasks` (`order_fulfillment` now counts `manualPendingOrders`; conditionally appends `payment_review` when `reviewCount > 0`).
  - `paymentTasks: { reviewCount, retryExhaustedCount }` (backed by `PaymentTransaction.status = PENDING_MANUAL_REVIEW` and `PaymentWebhookEvent.status = FAILED`).

### 2.4 `GET /api/coupons/admin/statistics` & `GET /api/admin/coupons/statistics`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>` | Response: `Cache-Control: no-store`
- Verified `totalDiscountAmount` sums `Order.discount` on `COMPLETED` orders; `totalUsageCount` sums `Coupon.used`.

---

## 3. Teacher Analytics Endpoints (`ACTIVE` `TEACHER` Required)

All 6 endpoints enforce persisted `ACTIVE` `TEACHER` status, strict `Course.authorId === teacherId` isolation, and `Cache-Control: no-store`:

1. `GET /api/teacher/statistics/overview` — Retains historical completed sales from soft-deleted courses; adds `revenue.paidOrders` and `revenue.freeOrders`.
2. `GET /api/teacher/statistics/revenue` — Preserves default `period=30days`; adds `timeBasis` (`createdAt|paidAt|recognizedAt`), `timezone` (`Asia/Ho_Chi_Minh|UTC`), `summary.paidOrders`, `summary.freeOrders`, `methodBreakdown[]`, `reporting`, and zero-filled continuous `timeline[]`. Allows querying own soft-deleted course via `courseId`.
3. `GET /api/teacher/statistics/courses` — Scopes aggregation subqueries to `author_id = teacherId`, adds deterministic tie-breaker `, c.id ASC`, scales past 100 courses, adds `paidOrders` and `freeOrders` per course.
4. `GET /api/teacher/statistics/enrollments` — Aligns timeline timezone (`Asia/Ho_Chi_Minh`) and `c.is_destroyed = false` cohort with summary.
5. `GET /api/teacher/statistics/learning` — Preserves learning & quiz assessment metrics with persisted active teacher check.
6. `GET /api/teacher/statistics/course-performance/:courseId` — Performs early existence + ownership check (`404`/`403`) BEFORE running 9 parallel aggregations; adds `overview.revenue.paidOrders` and `overview.revenue.freeOrders`.

---

## 4. Read-Only Order Detail Endpoint

### `GET /api/orders/:id` *(New Read-Only Detail)*
- **Headers**: `Authorization: Bearer <TOKEN>` | Response: `Cache-Control: no-store`
- **Scoping (enforced via persisted DB role & `ACTIVE` status)**:
  - `ADMIN`: Any order; includes `transactions[].referenceCode`.
  - `TEACHER`: Only orders for courses where `order.course.authorId === actor.id` (`403` otherwise); `referenceCode` omitted.
  - `USER`: Only orders where `order.userId === actor.id` (`403` otherwise); `referenceCode` omitted.
- **Sanitization**: Never exposes `rawPayload`, `accountNumber`, `subAccount`, or webhook credentials.
- **Errors**: `400` invalid UUID, `401` unauthenticated, `403` inactive/forged role/cross-scope, `404` order not found.
