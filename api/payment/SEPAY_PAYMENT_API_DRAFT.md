# SePay payment API — draft status

Updated: 2026-11-16. STEP 04 supersedes the earlier HMAC-only/singular-route proposal.
The owner selected API Key authentication using existing SEPAY_API_KEY.

## Implemented and tested locally

| Method | URL | Authentication |
| --- | --- | --- |
| POST | /api/payments/sepay/webhook | Authorization: Apikey <configured inbound key> |
| POST | /api/payments/checkout | Existing access JWT |
| GET | /api/payments/orders/:orderId/status | Access JWT, owner or active database ADMIN |
| GET | /api/payments/admin/reconciliation | Access JWT + persisted active ADMIN; read-only |
| GET | /api/payments/admin/diagnostics | Access JWT + persisted active ADMIN; read-only |

These routes are IMPLEMENTED AND TESTED through local Express/PostgreSQL, but NOT
EXTERNALLY VERIFIED with a real SePay delivery. See [the current API contract](SEPAY_PAYMENT_API.md)
for request/response examples, limits, errors and worker semantics. The existing
POST /api/orders manual/free contract remains unchanged.

Webhook acknowledgment is exactly 200 {"success":true} after durable inbox commit.
It is not financial success. API Key ingress establishes the same runtime-checked
capability as the retained optional HMAC utility. Processing uses the STEP 03 atomic
settlement through a bounded durable runner with startup recovery and finite retries.
No browser receives the webhook credential. No real payment/deployment occurred.

## Proposed future endpoints — NOT IMPLEMENTED

The old singular /api/payment/sepay-webhook, /api/payment/transactions and
/api/payment/reconcile paths are not operational aliases. Proposed
GET /api/orders/:id/payment and /api/orders/:id/status are also not implemented;
the plural /api/payments status route above is the implemented contract.
The STEP 05 read-only audit is documented in SEPAY_RECONCILIATION_API.md. External
v2 is NOT_CONFIGURED without a separate credential and is not live-verified.
Mutating reconciliation/repair and transaction-history management remain PROPOSED — NOT IMPLEMENTED.
Any future route must retain appropriate admin/ownership checks and existing envelopes.
STEP 06 frontend integration remains unstarted and requires explicit approval.

[STEP 04 architecture](../../docs/payment/STEP_04_WEBHOOK_ARCHITECTURE.md)

