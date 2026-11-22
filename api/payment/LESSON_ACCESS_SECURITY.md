# STEP 07.3 — Paid lesson access security contract

This is a security correction to existing routes, required for payment acceptance.
No new URL, method or payment settlement behavior is introduced.

## GET /api/lessons/chapter/:chapterId

Bearer JWT is optional. Anonymous and unpaid callers retain HTTP 200 syllabus metadata
(id/_id, title, slug, chapter/course/author identifiers, order, duration, type, isDemo,
video status and timestamps). For **non-demo lessons**, they receive no content,
videoUrl, transcript/summary, provider video identifier or generated playback URL.
`playback` is null. Catalog/outline navigation remains available.

An authenticated, persisted ACTIVE ADMIN or the ACTIVE teacher author may receive study
content. An ACTIVE student needs ACTIVE or COMPLETED Enrollment in an approved,
non-destroyed course, preserving completed-course access used by the learning UI/video path.
Canceled/inactive/unpaid users and stale/forged ADMIN claims do not unlock private text.
Demo lessons preserve public study access. Invalid/expired supplied JWT follows existing
optional-auth middleware's 401 behavior. Protected responses use `Cache-Control: no-store`.

Example anonymous syllabus entry (synthetic IDs):

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "_id": "11111111-1111-4111-8111-111111111111",
  "title": "A paid lesson", "slug": "paid-lesson", "type": "TEXT",
  "isDemo": false, "order": 1, "duration": 0, "playback": null
}
```

The envelope remains `{success:true,message,data:[...]}`. Actual entries also contain
the existing chapter/course/author identity aliases and timestamps. Private fields
are omitted, never fabricated or replaced with study content from localStorage.

The frontend's existing `lessonService.getLessonsByChapter` now uses its shared client
with the current token and no-store. Absence of a token still gives a public outline.
Previously `skipAuth:true` prevented authorized students from presenting entitlement.

## Related paid-content reads

GET `/api/lessons/:id` keeps existing 401 anonymous / 403 unpaid behavior for non-demo
content. Current persisted actor/role/enrollment now controls study access rather than
trusting a JWT role claim alone. GET `/:id/ai-content` applies the same persisted human
role checks; existing authenticated AI-service behavior and reconciliation remain.
No update/create/settlement route or AI lifecycle is redesigned.

This closes an acceptance-blocking leak: the chapter list previously selected full
study fields and generated playback even without authentication, bypassing the guarded
lesson-detail route. Existing public/study Application Models and functional repositories
are reused; no physical schema or migration changed.

Payment routes additionally use no-store before JWT/validation. CORS now parses and
matches exact localhost/loopback or valid 192.168 LAN hosts, rejecting lookalike domains.
Production frontend origins still require separate environment-specific setup.

Tests cover anonymous/unpaid/forged-role redaction, active entitlement, canceled access,
public demo preservation, and actual browser access after isolated local settlement.
Provider/Test Mode verification is a separate acceptance level.
