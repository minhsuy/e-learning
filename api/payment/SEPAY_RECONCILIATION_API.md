# Payment reconciliation and diagnostics — STEP 05

IMPLEMENTED AND TESTED LOCALLY. External API v2 transport/matching is MOCK-VERIFIED
ONLY; the current environment has no dedicated token and is NOT_CONFIGURED. No live
SePay delivery/reconciliation or production-readiness claim is made.

## Authentication and routes

| Method | URL | Authorization |
| --- | --- | --- |
| GET | /api/payments/admin/reconciliation | Existing Bearer JWT + persisted ACTIVE/ADMIN |
| GET | /api/payments/admin/diagnostics | Existing Bearer JWT + persisted ACTIVE/ADMIN |

Students/teachers receive 403; a JWT ADMIN claim alone cannot grant access. Anonymous
or invalid JWT is 401. Neither GET performs a retry, backfill, expiry write, settlement
or financial repair. Existing checkout/webhook/student-status contracts are unchanged.

## Reconciliation query and response

Optional query fields: from/to ISO timestamps (default last 30 days through now),
limit integer 1–200 (default 100 per internal cohort), external=true/false (default
false). Reject unknown fields, invalid dates, reversed windows or windows over 31 days.
Times are normalized to whole seconds, inclusive. Internal reads use one consistent
transaction. A cohort exceeding its budget sets internal.complete=false; narrow the
window or increase the permitted budget before interpreting absence.

Illustrative empty internal report:

```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-11-16T12:00:00.000Z",
    "window": {"from":"2026-11-01T00:00:00.000Z","to":"2026-11-16T12:00:00.000Z"},
    "internal": {
      "complete": true, "limit": 100,
      "scanned": {"orders":0,"transactions":0,"unresolvedEvents":0},
      "excluded": {"legacyPaid":0,"free":0}
    },
    "external": {"status":"NOT_CONFIGURED","complete":false,"nextCursor":null,"transactions":0},
    "durableProviderUuidMappingSupported": false,
    "automaticRepair": false,
    "findings": []
  }
}
```

Findings contain kind/outcome and relevant optional orderId, transactionId, eventId,
couponId, providerUuid and matchConfidence. No account numbers, customer profile,
arbitrary notes, raw payloads, bank contents or credentials are returned. Excluded
legacy/manual/free counts apply to the requested window, not all historical records.

| Internal kind | Meaning |
| --- | --- |
| COMPLETED_WITHOUT_PAYMENT | Paid SePay completion lacks successful ledger evidence |
| SUCCESS_ORDER_NOT_COMPLETED | SUCCESS does not correspond to a completed SePay order |
| COMPLETED_WITHOUT_ENROLLMENT | Expected non-canceled enrollment/course link is absent |
| DUPLICATE_INCOMING | Distinct qualifying receipts target one order; not repeated delivery |
| MANUAL_REVIEW / UNMATCHED_INCOMING | Review outcome or unassociated receipt |
| LATE_TRANSFER | Stored bank time is after expiry |
| EXPIRED_UNPAID | Expired PENDING with no successful settlement; NOT evidence that no funds arrived |
| STALLED_INBOX / RETRY_EXHAUSTED | Overdue unresolved work / terminal unscheduled failure |
| INVALID_COUPON_CAPACITY | Linked usage is negative or above current limit |
| PROVIDER_CORRELATION | Optional external comparison |

## External status and identity

NOT_CONFIGURED means missing/invalid enablement or separate token: no call is made.
NOT_REQUESTED means configured but external=false. AVAILABLE means the requested
provider scan completed. UNAVAILABLE means incomplete/failed scan; complete=false,
nextCursor=null and sanitized reason (PROVIDER_TIMEOUT, RATE_LIMITED, PROVIDER_REJECTED,
PROVIDER_UNAVAILABLE, INVALID_PROVIDER_RESPONSE or INCOMPLETE_PROVIDER_SCAN). HTTP 200
may still return the valid internal report with external UNAVAILABLE.

SePay v2 UUIDs are never cast to webhook BIGINTs. The current schema lacks durable
cross-version UUID/environment mapping, so EXACT_UNIQUE_IDENTITY is unsupported.
MATCHED denotes only HIGH_CONFIDENCE_CANDIDATE agreement on account, reference, bank,
direction, exact amount, timestamp and compatible code/VA fields. A code/amount match
alone, multiple candidates or a truncated internal scan is AMBIGUOUS_MATCH. No result
triggers automatic fulfillment or changes a completed historical row.

Outcomes also include MISSING_INTERNAL_RECORD, MISSING_PROVIDER_CONFIRMATION,
DUPLICATE_PAYMENT, AMOUNT_MISMATCH and REQUIRES_MANUAL_REVIEW. Missing-provider evidence
requires complete internal/provider scans and an internal bank time within the window;
it means unconfirmed in this run, not proof that funds are absent. Distinct provider
UUIDs sharing a candidate are reviewed as potential duplicate receipts.

## Optional client configuration

SEPAY_RECONCILIATION_ENABLED=false by default. Explicitly enable only with a separate
authorized SEPAY_RECONCILIATION_API_TOKEN. Never reuse/copy SEPAY_API_KEY automatically.
SEPAY_RECONCILIATION_ENVIRONMENT is sandbox (default) or production; only fixed HTTPS
origins are allowed and redirects are refused. Checkout, webhook, worker and internal
audit require no v2 token.

The client uses validated responses, a 1 MiB body limit, timeout across fetch/body
(SEPAY_RECONCILIATION_TIMEOUT_MS default 5000), up to three attempts/page, pacing of at
least 400 ms and numeric Retry-After waits up to five seconds. Longer/invalid waits
stop safely for a later operator run. Default page budget is ten, configured through
SEPAY_RECONCILIATION_MAX_PAGES; requests ask for up to 100 rows/page.

The internal client accepts a separate optional UUID sinceId, keeps it fixed across
all ascending pages, and returns a next cursor only after a full, consistent traversal.
Duplicate/empty/inconsistent/out-of-order/over-budget pages fail without advancing.
Provider query dates use Vietnam wall-clock strings and response timestamps request
explicit ISO offsets. There is no incremental scheduler, cursor persistence or
auto-backfill. Backdated/concurrent provider changes may require an overlapping rescan.
The admin HTTP route deliberately takes fixed windows rather than a webhook cursor.

References: [transaction contract](https://developer.sepay.vn/en/sepay-api/v2/giao-dich/danh-sach),
[auth/rate limits](https://developer.sepay.vn/en/sepay-api/v2/xac-thuc),
[environments](https://developer.sepay.vn/en/sepay-api/v2/gioi-thieu).

## Diagnostics

Return generatedAt; inbox counts received/processing/processed/failed/totalReceived/
pending/retryExhausted; manualReviewTransactions; unmatchedIncomingTransactions;
oldestPendingAgeMs; processingLatency; ingestionLatency. totalReceived counts durable
unique inbox rows, while current received is a separate status count. pending includes
received/processing and retry-scheduled failures, excluding terminal FAILED.

Processing latency is persisted final-claim start to completion, excluding missing or
negative samples. Ingestion latency is explicitly current-process-authenticated-ingestion:
it resets on restart and includes authenticated duplicate deliveries. Its average is
null before samples, not fabricated historical data. Logs include only fixed component,
event/outcome and numeric duration, without high-cardinality financial labels/secrets.

## Errors, recovery and frontend

Existing JWT/Express Validator envelopes remain. Service errors use
{"success":false,"error":"..."}: 400 invalid query/window, 401 invalid identity, 403
role denial, sanitized 500/503 infrastructure failure. Provider problems are reported
as external status, never as financial success. No public financial-repair endpoint
is implemented. Reviewed terminal recovery remains the internal role-checked helper;
see STEP_05_RUN_GUIDE.md. Students/Next.js should use checkout/status, not these admin
APIs or provider credentials. STEP 06 frontend integration is not implemented.
