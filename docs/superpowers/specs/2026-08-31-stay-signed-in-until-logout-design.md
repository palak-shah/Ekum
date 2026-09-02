# Stay signed in until Logout — design

**Date:** 2026-08-31  
**Status:** Approved  
**Approach:** B — sliding “until Logout” session  
**Anchors:** [auth.md](../../features/auth.md), `apps/api/src/auth/token.service.ts`, `apps/web/src/lib/auth.tsx`, `apps/web/src/lib/tokenRefresh.ts`

## Problem

Traders expect WhatsApp-like persistence: open Ekum tomorrow (or after an API blip) and still be in. Today the product says “stay signed in for 30 days,” but users still land on OTP after refresh rejection (expired / revoked / wiped DB), mid-use races, or local reseed.

## Product promise

**OTP only when the person taps Logout (or clears site data / installs fresh).** Everyday use, overnight idle, and transient API failures must never force OTP.

## Mental model

1. Phone + OTP = unlock this device once.  
2. App stays signed in like WhatsApp.  
3. **You → Logout** = leave this device.  
4. Wiping the database / clearing browser storage = new phone (one OTP expected).

## Locked decisions

| Topic | Decision |
|-------|----------|
| Access JWT | Keep short (default **15m**). Silent refresh on 401. |
| Refresh lifetime | **Until Logout**, with a far safety ceiling (default **10y**) so rows always have `expiresAt`. |
| Sliding | On every successful refresh rotation, set `expiresAt = now + JWT_REFRESH_TTL` (sliding). Active users never hit a cliff. |
| Rotation | Keep rotate-on-use + ~60s multi-tab grace (already shipped). Do not stop rotation. |
| Clear local tokens | Only on **Logout**, or server definitive reject of **this** refresh (`INVALID_TOKEN` / `UNAUTHORIZED` after refresh attempt). Never on network / 5xx / `SESSION_REFRESH_PENDING`. |
| Degraded | API unreachable → keep tokens; show Reconnecting / Try again (already shipped). |
| Seed / DB wipe | Prefer seed that **does not truncate** `RefreshToken` for existing users. Full reset still requires OTP once (acceptable). |
| Remote device list / force-logout all | Out of scope this slice. |
| Biometrics / passkeys | Out of scope. |

## User flows

### Happy path

1. OTP verify → tokens in `localStorage`.  
2. Browse for weeks; access refreshes quietly.  
3. Each refresh extends refresh expiry.  
4. **Logout** → `POST /auth/logout` revokes refresh → clear local → login.

### Mid-use API blip

1. Request 401 → refresh attempt.  
2. Network fail → keep tokens; action shows retry / degraded shell.  
3. Never navigate to `/login`.

### Definitive end

1. Refresh returns `INVALID_TOKEN` (revoked, unknown, past ceiling).  
2. Clear tokens → OTP.  
3. Same after explicit Logout.

## API / config

- Default `JWT_REFRESH_TTL`: **`10y`** (was `30d`). Document as “device session ceiling; sliding on refresh.”  
- `TokenService.rotate`: after issuing new refresh row, `expiresAt` uses full TTL from **now** (already true for new row; ensure old revoked row is not the clock).  
- Optional hardening: if client presents a refresh that was rotated within grace, keep returning grace tokens (already).  
- Seed: when upserting seed users, **do not** `deleteMany` refresh tokens unless a full DB reset. Document in seed / demo checklist.

## Web

- Keep `performTokenRefresh` / `isDefinitiveAuthFailure` behaviour; audit any path that calls `setTokens(null)` outside Logout + definitive refresh failure.  
- Copy: login / You need not say “30 days”; plain “Stay signed in on this device until you log out.”

## Docs

- Update [auth.md](../../features/auth.md): stay signed in until Logout; 10y ceiling + sliding; OTP only after Logout / wipe / definitive revoke.  
- Completeness review before implementation (quality gate).  
- Gap matrix: Auth stay-signed-in row.

## Explicit non-goals

- Infinite refresh with null `expiresAt` (schema keeps `DateTime`).  
- Cookie-only sessions (bearer remains for Flutter).  
- Skipping OTP after full DB reset.  
- Admin “sign out everywhere” UI.

## Success criteria

- Idle overnight with API up → still authenticated without OTP.  
- Kill API briefly → Reconnecting, then back in without OTP.  
- Multi-tab open → no mutual logout from refresh rotation.  
- Logout → must OTP again.  
- Units cover: sliding expiry extend; client does not clear on network refresh fail; Logout clears.

## Open risks

- Full `prisma migrate reset` / wipe still logs everyone out (by design).  
- Stolen refresh remains usable until Logout or ceiling — mitigate later with device list if needed.
