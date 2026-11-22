# STEP 08.1 — existing commerce API corrections

Verified locally 2026-11-18. These are existing routes; no new endpoint or schema migration.
SePay checkout, instructions, status, API Key webhook, atomic settlement and reconciliation contracts remain unchanged.

## Order response additions

Existing Order responses retain their envelope, `id`/`_id`, status casing, numeric
`amount`, `discount`, `total`, nullable orphan course and compact relations.
Read-only additions on management/my lists and mutation results:

| Field | JSON representation |
|---|---|
| paymentMethod | `sepay_bank_transfer`, `manual_bank_transfer`, `free`, or null |
| paymentCode | string or null |
| paidAt | ISO timestamp or null |
| expiresAt | ISO timestamp or null |

Legacy null methods remain null, including historical free Orders. Do not infer a
method from amount or code. New manual completion records paidAt at approval time;
historical completed rows with null paidAt are not backfilled. This is an approval
timestamp for manual Orders, not independently verified bank settlement time.
No bank secrets, provider payloads, API keys or webhook bodies are added.

## GET /api/orders

JWT plus existing Teacher/Admin middleware. Service rechecks persisted ACTIVE
actor and matching role; Teacher scope is `course.authorId = actor.id` within both
list and count predicates. ADMIN may list all allowed Orders, including orphans.
USER receives 403. Every owned course is included, without an initial 100-course lookup.

| Query | Validation / default |
|---|---|
| page | integer 1–1,000,000; default 1 |
| limit | integer 1–100; default 10 |
| status | pending/completed/rejected; case insensitive |
| search | trimmed string, max 200; case-insensitive contains on code, course title, student username/email |
| paymentMethod | sepay_bank_transfer/manual_bank_transfer/free/legacy_unknown; last means SQL null |
| courseId | UUID; still constrained to Teacher ownership |
| createdFrom, createdTo | optional full ISO datetime with timezone; inclusive createdAt boundaries |
| paidFrom, paidTo | optional full ISO datetime with timezone; inclusive paidAt boundaries, null excluded |
| sortBy | createdAt/updatedAt/total/paidAt; default createdAt |
| sortOrder | asc/desc; default desc |

Reversed date ranges and invalid enum/UUID/sort/pagination produce HTTP400.
Dates describe instants; there is no implicit reporting timezone or revenue aggregation.
Stable ordering adds id in the same direction. Nullable paidAt follows PostgreSQL
null sorting. List and count use the same predicate inside a serializable snapshot.
Response remains HTTP200 `{ success, message, data: { orders, pagination: { page,
limit, total, totalPages } } }`; empty lists retain totalPages=1.
GET /api/orders/my remains scoped to the authenticated buyer, with existing
page/limit/status and the same pagination bounds. It does not become a management API.

## PUT /api/orders/:id

Existing JWT Teacher/Admin route. Persisted ACTIVE manager and actual course
ownership are enforced inside the transaction. Body remains `{ status,
rejectedReason? }`; existing `reason` alias remains accepted. Status is case insensitive.
No new restore/refund operation exists.

| Method / persisted state | Requested state | Result |
|---|---|---|
| manual or legacy null / PENDING | COMPLETED | 200; atomic approval and fulfillment, paidAt set |
| manual or legacy null / PENDING | REJECTED | 200; retained rejected row; no fulfillment/counter reversal |
| manual or legacy null / any state | same state | 200; no repeated effects |
| manual or legacy null / COMPLETED | PENDING or REJECTED | 409; no reopening/reversal |
| manual or legacy null / REJECTED | PENDING or COMPLETED | 409 |
| SePay / any state | any state, including same state | 400; payment processing/reconciliation required |
| FREE / terminal | same state | 200; no effects |
| FREE / any state | changed state | 409 |

Missing Order404; wrong owner/inactive or mismatched persisted role403;
invalid UUID/body400. Orphan completion400; unavailable course or another completed
purchase409. Conditional write also excludes SUCCESS payment transactions, returning409.
Successful response retains `{ success, message, data: Order }`. Service business
errors retain `{ success:false, message, statusCode }`; middleware validation keeps
the existing validation envelope. Do not depend on one unified error envelope.

Completion reuses existing durable payment fulfillment in a serializable transaction:
coupon once, enrollment once, sold once, group membership and durable notification.
Post-commit realtime emission is best effort; inbox remains authoritative. Retrying
an already completed approval does not restore CANCELED access or resend notifications.
Free automatic POST /api/orders and POST /api/payments/checkout flows are preserved.

## DELETE /api/enrollments/course/:id/:userId

Existing JWT Teacher/Admin route; id=course UUID, userId=student UUID.
Persisted ACTIVE ADMIN or owning TEACHER is required. USER/foreign Teacher403;
missing course/enrollment404; invalid IDs400. Author/administrator privileged access
cannot be revoked through student entitlement removal and returns409.

HTTP200 `{ success:true, message }` on first or repeated revocation. Enrollment is
retained with `status: CANCELED`; progress, completedAt and original identity remain.
Management/my enrollment lists continue returning this historical row with its status.
Orders, SUCCESS transactions, webhook events, coupons, sold, progress and certificates
are retained. No refund, financial reversal or automatic restoration occurs.
Course group membership is removed transactionally; connected personal-room sockets
leave those group rooms after commit. New joins recheck membership after joining.

CANCELED does not authorize protected TEXT/video, progress completion/uncompletion,
new quiz submissions or new certificates. Existing public/demo content and public
quiz question catalog behavior are unchanged; they do not confer paid entitlement.
Previously issued media URLs/downloaded content cannot be recalled; fresh protected
requests are denied. Existing certificates/history remain available as historical evidence.
A completed purchase remains a purchase; checkout/repeated approval cannot restore it.
Restoration requires a future explicit support workflow, outside STEP08.1.

## Teacher course status filter

Existing six statistics routes and response DTOs remain unchanged. The course-list
status query continues accepting approved/pending/rejected case insensitively.
The SQL parameter now uses the mapped lowercase database enum label; invalid input400.
No revenue, commission, payout or timeline semantics are changed in this phase.
