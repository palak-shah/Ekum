# Design: API error visibility + Photo Order invalid URL

**Date:** 2026-09-10  
**Status:** Approved  
**Context:** Photo Order on beta returned opaque toast *“The request could not be processed.”* Network Response showed `VALIDATION_ERROR` / `fieldErrors.items: ["Invalid url"]`.

## Goals

1. Traders always see a short, actionable sentence (never Zod jargon or opaque masks).
2. Developers see **why** and **where** (method, path, status, code, details) without digging Network → Response.
3. Photo Order create succeeds when media upload completed (absolute image URLs).

## Non-goals

- Sentry / third-party error tracking (later).
- In-toast “Details” panel for phone (defer).
- Changing ErrorEnvelope shape beyond what already exists (`code`, `message`, `details`, `path`, `timestamp`).

---

## Part A — Photo Order `Invalid url` (fix first)

### Problem

`createOrderSchema` requires `items[].images` entries to be absolute URLs (`z.string().url()`). Upload tickets set `blobUrl` from `PUBLIC_MEDIA_BASE_URL` (local driver) or Azure public URL. If the minted string is relative (e.g. `/media/…`) or otherwise not a valid absolute URL, Send is enabled (non-empty string) but `POST /orders` fails with `Invalid url`.

### Approach

1. **Hardening (API):** When constructing local media public URLs, reject or normalize so `blobUrl` / stored `media.url` is always an absolute `http(s)://` URL. Prefer fail-fast at upload-ticket mint if `PUBLIC_MEDIA_BASE_URL` is relative/empty (clear boot or request error for ops), rather than silent relative paths.
2. **Ops (beta):** Ensure `.env.docker` / server env has  
   `PUBLIC_MEDIA_BASE_URL=https://beta.ekum.app/media`  
   (or Azure absolute blob URLs when Azure is configured). Redeploy/restart API after change.
3. **Copy:** Schema / pipe already prefer custom sentences; map image URL failures to trader copy such as: *“Photo isn’t ready yet. Remove it and add it again.”* Developers still see `Invalid url` (or field flatten) in structured client logs / response `details`.

### Verification

- Mint upload ticket on beta → `blobUrl` starts with `https://`.
- Photo Order: add photo → Send → order created (or chat navigation).
- Unit: local driver / config refuses relative base; createOrder schema message for bad image URL.

---

## Part B — Developer error visibility (structured client log)

### Problem

Browser default console only shows `Failed to load resource: 400`. Envelope `code` / `details` / `path` are already returned but unused for diagnostics. 401 refresh noise buries real failures.

### Approach

In `apps/web/src/lib/apiClient.ts`, after parsing an error envelope (and for network failures):

Log **one** structured `console.error` (or `console.warn` for filtered cases):

```ts
{
  source: 'ekum.api',
  method,
  path,           // request path (e.g. /orders)
  statusCode,
  code,           // e.g. VALIDATION_ERROR
  message,        // user-facing message shown in UI
  details,        // Zod flatten / server details
  envelopePath,   // ErrorEnvelope.path when present
}
```

**Noise control**

- Do **not** log expected auth-refresh 401s that are about to retry successfully.
- Optionally skip logging pure network abort/cancel if we introduce AbortSignal later (out of scope unless already present).

**UI**

- Unchanged for traders: toast / inline still uses friendly `message` only.
- **Debug option:** `VITE_EKUM_DEBUG=true` (or `localStorage.ekum.debug=true`) shows an on-screen dump of the structured API error (method, path, status, code, details). `false` keeps diagnostics in the console only.
- No toast Details button for production traders.

**Server**

- Keep existing filter: no stacks to clients.
- Optional light improvement: log 4xx `VALIDATION_ERROR` at `debug`/`warn` with `path` + `details` for server ops (nice-to-have; not required for Part B).

### Verification

- Force a validation failure → Console shows structured object including `details.fieldErrors`.
- Trader toast remains friendly.
- Unit test: parse/log helper builds expected payload (mock `console.error`).

---

## Part C — Already in progress (friendly validation messages)

Keep prior work:

- API `ZodValidationPipe` → trader default + prefer custom schema sentences.
- Client remaps legacy *“The request could not be processed.”*
- Photo/standard line custom messages in `domain-types`.

Deploy API + web with Parts A–C together on beta.

---

## Rollout

1. Land code (A hardening + B logging + C messages).
2. Confirm/fix beta `PUBLIC_MEDIA_BASE_URL`.
3. Rebuild/restart API (and web if client logging ships).
4. Smoke: Photo Order send + intentional bad payload → check Console structure.

## Open questions

None blocking — deferred: toast Details, Sentry.
