# Payment instructions recovery API — STEP 07.2

Implemented read-only contract. This adds one endpoint; checkout, status, webhook,
manual/free order and settlement contracts are unchanged.

## GET /api/payments/orders/:orderId/instructions

Bearer JWT required. `orderId` must be a UUID. No body/query parameters are required.
The actor must exist and be ACTIVE. Owner or persisted ACTIVE/ADMIN may read the
Order; an ADMIN JWT claim alone does not grant access. Authorization runs before
reading bank configuration or returning a summary. Responses use `Cache-Control: no-store`,
including route authentication/validation errors. The frontend also requests `cache: no-store`.

```http
GET /api/payments/orders/22222222-2222-4222-8222-222222222222/instructions
Authorization: Bearer <existing-student-access-jwt>
```

The credential above is a placeholder, not an additional API key.

### HTTP 200 — eligible pending SePay Order

```json
{
  "success": true,
  "data": {
    "status": {
      "orderId": "22222222-2222-4222-8222-222222222222",
      "status": "pending",
      "paymentMethod": "sepay_bank_transfer",
      "paymentCode": "DH12345678",
      "paidAt": null,
      "expiresAt": "2026-11-17T15:30:00.000Z",
      "paymentState": "pending",
      "courseAccessGranted": false
    },
    "order": {
      "id": "22222222-2222-4222-8222-222222222222",
      "code": "DH-1234567",
      "courseId": "11111111-1111-4111-8111-111111111111",
      "amount": 249000,
      "discount": 50000,
      "total": 199000,
      "course": { "title": "Example course", "slug": "example-course", "image": "" }
    },
    "payment": {
      "paymentCode": "DH12345678",
      "amount": "199000",
      "bankAccount": { "bankName": "970422", "accountNumber": "EXAMPLEACCOUNT", "accountName": "EXAMPLE MERCHANT" },
      "transferContent": "DH12345678",
      "qrUrl": "https://img.vietqr.io/image/970422-EXAMPLEACCOUNT-compact2.svg?amount=199000&addInfo=DH12345678&accountName=EXAMPLE+MERCHANT",
      "expiresAt": "2026-11-17T15:30:00.000Z"
    }
  }
}
```

All example identities/recipient values above are synthetic. Order amounts are JSON
numbers; payment amount is the exact integer VND string. `bankName` retains the existing
checkout convention (configured bank BIN), not an invented human-readable brand.
`courseId` and `course` may be null for historical orphan Orders. No student identity,
email, financial ledger, webhook payload, API Key or provider API token is returned.

Instructions require pending status, SePay method, a positive whole-VND total,
paymentCode, future expiry, available approved course and no recorded manual-review
outcome. The same validated backend configuration and VietQR builder as checkout are
used with **persisted** total/code/expiry. This GET never creates an Order/code, extends
a deadline, enrolls, retries a webhook or settles money.

### HTTP 200 — terminal or ineligible Order

The same `status` and `order` projections are returned with `payment: null`. Example:

```json
{
  "success": true,
  "data": {
    "status": {
      "orderId": "22222222-2222-4222-8222-222222222222",
      "status": "completed",
      "paymentMethod": "sepay_bank_transfer",
      "paymentCode": "DH12345678",
      "paidAt": "2026-11-17T15:05:00.000Z",
      "expiresAt": "2026-11-17T15:30:00.000Z",
      "paymentState": "completed",
      "courseAccessGranted": true
    },
    "order": {
      "id": "22222222-2222-4222-8222-222222222222",
      "code": "DH-1234567", "courseId": "11111111-1111-4111-8111-111111111111",
      "amount": 249000, "discount": 50000, "total": 199000,
      "course": { "title": "Example course", "slug": "example-course", "image": "" }
    },
    "payment": null
  }
}
```

- Completed/free: no stale bank instructions; entitlement remains independently checked.
- Expired: Order.status stays `pending`, paymentState is `expired`, payment is null.
- Rejected: paymentState is `rejected`, payment is null.
- Review: paymentState is `manual_review`, payment is null, even before expiry.
- Manual/legacy/unavailable-course/missing-code/nonpayable: payment is null; no bank
  config is needed or exposed. State retains the existing status API semantics.

### Errors

| HTTP | Meaning |
| --- | --- |
| 400 | Invalid Order UUID; existing validator envelope applies |
| 401 | Missing/invalid/expired JWT or inactive/missing database actor |
| 403 | Actor does not own Order and is not persisted ACTIVE/ADMIN |
| 404 | Order not found |
| 503 | Instructions configuration/database unavailable; safe payment error envelope |
| 500 | Unexpected failure, sanitized by existing payment error handler |

JWT expiry retains the shared refresh mechanism. Payment service errors use
`{"success":false,"error":"Forbidden"}` (403 example); JWT/validator errors keep their
existing envelopes. Errors contain no recipient data or raw internal exceptions.

## Frontend use

`getOrderPaymentInstructions(orderId, signal)` uses the existing centralized API client.
Load it on payment-page mount/F5; validate returned order/status IDs before use.
Render server summary and eligible instructions, never localStorage bank data.
Continue existing authenticated status polling. Fresh polling state takes precedence
over the recovery snapshot; hide QR/actions for terminal/error/access-denied states.
At countdown zero stop offering the old QR and revalidate with backend; a confirmed
completed/entitled response wins the expiry race. Do not POST checkout during reload.

No trustworthy runtime Test Mode flag exists in this contract; do not infer mode from
recipient appearance. The account is generated from current validated server config.
Original-recipient equality is tested with unchanged config; historical recipient
rotation cannot be reconstructed because the existing Order has no recipient snapshot.

See STEP_07_2_PAYMENT_INSTRUCTIONS_API_REPORT.md in the backend for actual tests and
limitations. No provider simulation or real bank transfer was part of this step.
