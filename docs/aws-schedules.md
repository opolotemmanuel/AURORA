# Scheduled jobs

Two jobs run on a timer. Neither is triggered by the application; both are HTTP
endpoints that an external scheduler calls.

This document is self-contained: everything needed to provision the schedules is
below, and nothing about how they ran previously matters to getting them right.

---

## The jobs

### 1. Retention purge

| | |
| --- | --- |
| **URL** | `https://<APP_URL>/api/cron/purge-retention` |
| **Method** | `GET` |
| **Suggested schedule** | `cron(0 3 * * ? *)` — 03:00 UTC daily |
| **Timeout** | 60s is comfortable; it is several `deleteMany` statements |
| **Idempotent** | Yes. Deletes by age, so running twice deletes nothing extra |

Enforces the published retention schedule from `lib/privacy/retention.ts`, which
is the same source the privacy policy quotes. It clears aged chat images,
expired sessions, spent verification codes, per-call AI spend rows, withdrawn
training records past their grace window, and audit entries past their window.

**This is the one place in the codebase that deletes from the audit table.** It
is worth knowing that before changing its schedule: running it far more often
does no harm, but the retention windows themselves are a compliance statement,
not a tuning knob.

Deliberately does not touch scans, results or profiles. Those are the patient's
own records and only they decide when those go.

Responds `200` with a JSON body reporting counts per category, which is worth
logging — a sudden change in `auditRows` is a signal.

### 2. Product catalogue sync

| | |
| --- | --- |
| **URL** | `https://<APP_URL>/api/cron/sync-products` |
| **Method** | `GET` |
| **Suggested schedule** | `cron(0 */6 * * ? *)` — every six hours |
| **Timeout** | 120s. It calls the WooCommerce API and writes per product |
| **Idempotent** | Yes. Matches on slug and updates in place |

Pulls the Aurora catalogue from WooCommerce. **Only ever touches global products
(`organizationId IS NULL`)** — a clinic's own products are never matched, even
when they share a slug with a store product.

Requires `BOOTSTRAP_ADMIN_EMAIL` to name an existing user; the sync records that
user as the creator of any product it adds. Responds `500` with a clear message
if that user is missing, which is worth alerting on — it means the sync has been
silently doing nothing.

---

## Authentication

Both endpoints require `CRON_SECRET`. Two header forms are accepted and both
carry the same value:

```http
Authorization: Bearer <CRON_SECRET>
```

```http
X-Cron-Secret: <CRON_SECRET>
```

Use whichever suits the scheduler. `Authorization: Bearer` is the more common
choice; `X-Cron-Secret` exists for schedulers that reserve `Authorization` for
their own request signing, so the secret still has somewhere to go.

The comparison is constant-time (`timingSafeEqual` over SHA-256 digests of both
sides, so unequal lengths cannot throw and leak). A wrong secret, a malformed
header and no header at all produce an identical `401 {"ok":false,"error":"Unauthorized"}`.

**If `CRON_SECRET` is unset or empty, both endpoints refuse everything.** That is
deliberate: reading "unset" as "open" would turn a missing environment variable
into a public endpoint that deletes audit rows. If a newly provisioned schedule
returns 401 for every invocation, check that the secret reached the container
before looking anywhere else.

---

## Provisioning with EventBridge Scheduler

Each job needs a schedule targeting an **API destination**. The shape:

1. **Connection** — an EventBridge connection holding the secret. If you use
   API-key auth, set the header name to `X-Cron-Secret` and the value to
   `CRON_SECRET`. EventBridge stores it in Secrets Manager for you.

   Alternatively use the `Authorization: Bearer` form and put the header in the
   destination's header list. Prefer the connection: it keeps the secret out of
   the schedule definition.

2. **API destination** — `HTTP GET` to the endpoint URL above, with an
   invocation rate limit (1/second is ample; these run hourly at most).

3. **Schedule** — the cron expression above, with the flexible time window
   disabled. Neither job benefits from jitter, and a fixed time makes "did it
   run?" answerable from the logs.

4. **Retry policy** — both jobs are idempotent, so retries are safe. A maximum
   age of 1 hour and 3 retries is reasonable. Send failures to a dead-letter
   queue; a silently failing retention purge is a compliance problem that
   otherwise surfaces months later.

5. **Permissions** — the schedule's execution role needs
   `events:InvokeApiDestination` on the destination, and
   `secretsmanager:GetSecretValue` on the connection secret if using a
   connection.

### Summary table

| Job | Schedule (UTC) | Method | Path | Header |
| --- | --- | --- | --- | --- |
| Retention purge | `cron(0 3 * * ? *)` | GET | `/api/cron/purge-retention` | `Authorization: Bearer <CRON_SECRET>` |
| Catalogue sync | `cron(0 */6 * * ? *)` | GET | `/api/cron/sync-products` | `Authorization: Bearer <CRON_SECRET>` |

---

## Keeping Vercel working

Nothing here changes the existing path. Vercel Cron sends
`Authorization: Bearer $CRON_SECRET`, which is still accepted exactly as before —
the change was to *how* the value is compared, not to what is accepted.

If both platforms are live at once, **both schedulers will fire.** Both jobs are
idempotent so nothing breaks, but the retention purge running twice a day
instead of once is worth being aware of rather than surprised by. Disable one
side's schedule when the other takes over.

---

## Verifying a schedule by hand

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://<APP_URL>/api/cron/purge-retention
```

Expect `200` and a JSON body of counts. `401` means the secret did not match or
is not configured. There is no third failure mode to distinguish — that is by
design.
