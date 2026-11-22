# SePay payment HTTP API

STEP 07.3 security: every payment route sends `Cache-Control: no-store` before
authentication/validation. URL/payload/status schemas are unchanged. Paid lesson
content access was corrected to honor persisted entitlement; see
[paid-content security contract](LESSON_ACCESS_SECURITY.md). CORS rejects lookalike
localhost/LAN domains instead of substring matching.

STEP 07.2 adds authenticated read-only
`GET /api/payments/orders/:orderId/instructions` for page-reload recovery.
See [complete instructions contract](SEPAY_PAYMENT_INSTRUCTIONS_API.md) for schemas,
owner/admin authorization, null-payment terminal states, no-store and error handling.
The five original contracts remain unchanged; the route table also lists the added
instructions read. Their original verification text below is historical.

Updated: 2026-11-16 (STEP 05). All five routes below are **IMPLEMENTED AND TESTED LOCALLY**
through the application's Express factory and local PostgreSQL. They are
**NOT EXTERNALLY VERIFIED** with an actual SePay delivery. No deployment or frontend
implementation is included. Prior proposed singular /api/payment routes are not aliases.

## Routes

| Method | Exact URL | Authentication |
| --- | --- | --- |
| POST | /api/payments/sepay/webhook | SePay inbound API Key; no student JWT |
| POST | /api/payments/checkout | Existing Bearer access JWT |
| GET | /api/payments/orders/:orderId/status | Bearer JWT; order owner or persisted active ADMIN |
| GET | /api/payments/orders/:orderId/instructions | Bearer JWT; order owner or persisted active ADMIN; read-only QR recovery |
| GET | /api/payments/admin/reconciliation | Bearer JWT; persisted active ADMIN only |
| GET | /api/payments/admin/diagnostics | Bearer JWT; persisted active ADMIN only |

### POST /api/payments/sepay/webhook

Use Content-Type: application/json and exactly one header:

```http
Authorization: Apikey <configured-inbound-webhook-key>
```

This uses SEPAY_API_KEY from the server environment. The placeholder above is not a
credential. Do not send the key to Next.js/browser code. The webhook key may differ
from a SePay REST/BankHub API key. HMAC utilities remain available but the active
route does not require X-SePay-Signature or SEPAY_WEBHOOK_SECRET.

Example synthetic payload:

```json
{
  "id": "880000000001001",
  "gateway": "TESTBANK",
  "transactionDate": "2026-11-16 12:00:00",
  "accountNumber": "EXAMPLEACCOUNT",
  "subAccount": "",
  "code": "DH12345678",
  "content": "DH12345678",
  "transferType": "in",
  "transferAmount": 199000,
  "accumulated": 199000,
  "referenceCode": "SYNTHETIC-ONLY",
  "description": "Local fixture"
}
```

Safe positive JSON-number IDs are supported, as in the provider's documented payload.
For IDs above Number.MAX_SAFE_INTEGER, use a quoted decimal string up to signed BIGINT
maximum 9223372036854775807. Unsafe numeric IDs are rejected with 400; the server does
not guess digits already lost by JSON.parse. No missing financial fields are invented.
Amounts must satisfy the existing STEP 03 whole-VND/SQL precision bounds.

The route authenticates before consuming/parsing the body, limits uncompressed JSON
to 64 KiB and rejects compressed/non-JSON bodies. Malformed and duplicate Authorization
headers are rejected. Invalid JSON/IDs/required fields return 400. Success is exactly:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

```json
{"success":true}
```

This acknowledges **durable inbox persistence**, not payment success. The processor
settles independently after ingestion. A duplicate acknowledges the previously trusted
inbox row without overwriting payload or resetting processing/financial terminal state.
Persistence failure or the ten-second ingestion deadline returns 503 without claiming
success. A SQL commit may finish after a timeout; unique IDs and worker recovery make
subsequent delivery safe. There is no 202/empty-body acknowledgement.

Format and acknowledgment references: [SePay authentication](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc)
and [SePay integration](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook).
Use HTTPS when the endpoint is exposed to SePay.

### POST /api/payments/checkout

```http
Authorization: Bearer <student-access-token>
Content-Type: application/json
```

```json
{"courseId":"11111111-1111-4111-8111-111111111111","couponCode":"OPTIONAL"}
```

Only courseId and optional couponCode are accepted. Client amount, total, payment
method, recipient and userId fields are rejected. Identity comes from JWT; availability,
ownership, enrollment, coupon eligibility, price and payment instructions come from
the existing STEP 03 service. New order returns 201; safe reuse returns 200.

Illustrative paid response:

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "22222222-2222-4222-8222-222222222222",
      "_id": "22222222-2222-4222-8222-222222222222",
      "code": "DH-1234567",
      "amount": 199000,
      "discount": 0,
      "total": 199000,
      "userId": "33333333-3333-4333-8333-333333333333",
      "courseId": "11111111-1111-4111-8111-111111111111",
      "couponId": null,
      "status": "pending",
      "paymentMethod": "sepay_bank_transfer",
      "paymentCode": "DH12345678",
      "paidAt": null,
      "expiresAt": "2026-11-16T12:30:00.000Z",
      "rejectedReason": null,
      "rejectedAt": null,
      "createdAt": "2026-11-16T12:00:00.000Z",
      "updatedAt": "2026-11-16T12:00:00.000Z"
    },
    "payment": {
      "paymentCode": "DH12345678",
      "amount": "199000",
      "bankAccount": {
        "bankName": "EXAMPLE_BANK_BIN",
        "accountNumber": "EXAMPLEACCOUNT",
        "accountName": "EXAMPLE MERCHANT"
      },
      "transferContent": "DH12345678",
      "qrUrl": "https://img.vietqr.io/image/EXAMPLE_BANK_BIN-EXAMPLEACCOUNT-compact2.svg?amount=199000&addInfo=DH12345678&accountName=EXAMPLE+MERCHANT",
      "expiresAt": "2026-11-16T12:30:00.000Z"
    },
    "reused": false
  }
}
```

Order amounts are JSON numbers; instruction amount is an integer string. Application
enums are lowercase. Zero totals complete immediately with payment=null, method=free
and no transfer code/expiry. Existing POST /api/orders remains the manual/free API
with its original default contract. Historical manual orders are not converted.

### GET /api/payments/orders/:orderId/status

Returns only public persisted state after UUID validation and owner/admin authorization.
The database role is checked; a JWT role claim alone cannot grant cross-account access.
An unrelated student/teacher receives 403, anonymous/invalid JWT receives 401.

```json
{
  "success": true,
  "data": {
    "orderId": "22222222-2222-4222-8222-222222222222",
    "status": "completed",
    "paymentMethod": "sepay_bank_transfer",
    "paymentCode": "DH12345678",
    "paidAt": "2026-11-16T12:05:00.000Z",
    "expiresAt": "2026-11-16T12:30:00.000Z",
    "paymentState": "completed",
    "courseAccessGranted": true
  }
}
```

status is existing Order status: pending/completed/rejected. paymentState is a separate
user-visible state: pending, completed, rejected, expired or manual_review. Completed
and rejected order states take precedence; otherwise a recorded review outcome takes
precedence over expiry. No raw inbox status/payload, bank audit data or secrets are
returned. courseAccessGranted requires a committed ACTIVE enrollment and an existing,
approved, non-destroyed course. Revoking enrollment changes access even if an old
order is completed. GET performs no writes or payment processing.

## Errors

Payment-route service/parser errors use the existing error-envelope convention:

```json
{"success":false,"error":"Unauthorized"}
```

| HTTP | Meaning |
| --- | --- |
| 400 | Invalid JSON/ID/payload, client pricing override or business validation failure |
| 401 | Missing/invalid webhook credential, JWT or active user identity |
| 403 | Order ownership/admin authorization failed |
| 404 | Missing order/course |
| 405 | Webhook method other than POST; Allow: POST |
| 409 | Already enrolled, incompatible pending order or conflicting purchase state |
| 413 | Body exceeds 64 KiB webhook / 16 KiB checkout limit |
| 415 | Wrong content type or compressed body |
| 503 | Missing webhook server key, persistence timeout/failure or checkout configuration/database failure |
| 500 | Unexpected error, with a generic sanitized message |

Express Validator failures retain {"errors":{...}} and JWT failures retain the existing
JWT middleware messages. No credentials, raw parser payload, SQL or stack is returned.

## Worker and financial semantics

Startup and periodic bounded sweeps consume RECEIVED, due retryable FAILED and stale
PROCESSING rows. Default interval 1000 ms, batch 20, concurrency 2, attempts 8. Multiple
instances share PostgreSQL claims and STEP 03 attempt fencing/idempotency. Shutdown
stops new work and waits for in-flight operations. Discovery failures retry next poll;
processing failures use persisted backoff, with terminal FAILED.nextRetryAt=null when
the attempt budget is exhausted. Privileged, explicitly reviewed admin recovery is
documented in STEP_04_RUN_GUIDE.md; no public financial-repair endpoint exists.
Read-only audit/diagnostic routes are documented in [the STEP 05 contract](SEPAY_RECONCILIATION_API.md).

Financial status remains separate: SUCCESS only after atomic completion/enrollment/
sold/coupon writes; underpayment/overpayment/unknown code/expiry/already-completed
orders go to PENDING_MANUAL_REVIEW. Outgoing or untrusted-account transfers are IGNORED.
Business outcomes finish the inbox once, without endless retries. No partial-transfer
aggregation or automatic refunds are added. The optional v2 read-only history adapter
is NOT_CONFIGURED without its separate credential and has not been live-verified.

## Frontend contract (integration deferred)

Next.js may POST checkout with the existing JWT, display backend payment instructions
and poll the status endpoint about every 2–3 seconds while pending. Stop and display
the appropriate UI on completed/rejected/expired/manual_review; refresh on focus and
bound polling duration/network retries. Example integration shape only:

```typescript
const checkout = await fetch(`${baseUrl}/api/payments/checkout`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ courseId, couponCode })
}).then((response) => response.json())
const status = await fetch(`${baseUrl}/api/payments/orders/${checkout.data.order.id}/status`, {
  headers: { Authorization: `Bearer ${accessToken}` }
}).then((response) => response.json())
```

Never provide a frontend webhook API Key or treat a scan/receipt screenshot as payment
proof. Status/access decisions come from committed backend state. No frontend code
was implemented or externally verified in STEP 04.

## Environment names

SEPAY_API_KEY; SEPAY_BANK_ACCOUNT; SEPAY_BANK_BIN; SEPAY_BANK_ACCOUNT_NAME;
SEPAY_PAYMENT_CODE_PREFIX; SEPAY_PAYMENT_EXPIRY_MINUTES; SEPAY_QR_TEMPLATE;
SEPAY_WEBHOOK_WORKER_ENABLED; SEPAY_WEBHOOK_POLL_INTERVAL_MS;
SEPAY_WEBHOOK_BATCH_SIZE; SEPAY_WEBHOOK_CONCURRENCY; SEPAY_WEBHOOK_MAX_ATTEMPTS.
SEPAY_WEBHOOK_SECRET is optional future HMAC configuration, not required by this route.
Existing PORT, DATABASE_URL and JWT_SECRECT_ACCESS_TOKEN remain in use.

## STEP 05 — Read-only audit and diagnostics

GET /api/payments/admin/reconciliation derives internal anomalies from a consistent,
bounded database snapshot. Optional external comparison uses a separate v2 Bearer
credential; SEPAY_API_KEY remains inbound-only. GET /api/payments/admin/diagnostics
returns aggregate counts/age, persisted final-attempt processing latency and explicitly
process-local authenticated-ingestion latency. Neither GET retries events or modifies
financial data. Both verify persisted ACTIVE/ADMIN independently of JWT role claims.

Expiry remains derived for PENDING SePay orders only. No EXPIRED enum, expiry rejection
writer or deletion is added. Late transactions remain recorded for review; a new
attempt preserves the old payment code/history. Manual/free behavior stays compatible.
Expiry is not proof that no bank transfer occurred.

Additional optional variables: SEPAY_RECONCILIATION_ENABLED=false,
SEPAY_RECONCILIATION_ENVIRONMENT=sandbox, SEPAY_RECONCILIATION_API_TOKEN (separate),
SEPAY_RECONCILIATION_TIMEOUT_MS=5000, SEPAY_RECONCILIATION_MAX_PAGES=10. Details, schemas
and manual-review semantics are in SEPAY_RECONCILIATION_API.md. Checkout UI and
instructions recovery are now implemented; see the
[STEP 07.3 acceptance report](../../docs/payment/STEP_07_3_FINAL_ACCEPTANCE_REPORT.md)
for current local verification and remaining provider-evidence limits.

Documentation inventory corrected on 2026-11-18 during STEP 08.0; no API contract changed.
