# Auth

## Purpose

Phone OTP login establishes a session for a person. After verify, the app either continues onboarding (no company yet) or enters the main shell for their company.

## Who uses it

Every user before accessing the app.

## User flows

1. Open app → `/login` (or land on `/r/:token` / `?invite=` and get sent to login).
2. Enter phone number → request OTP.
3. Enter OTP → verify → tokens stored; `GET /auth/me` loads session.
4. If `needsOnboarding` → `/onboarding`; else → invite return path (`/r/…`) when present, otherwise Home.
5. Logout from **You** (`/more`) clears the session.

## Business rules

- Auth is **phone + OTP** (dev builds use a fixed Dev OTP from API config).
- Session is bearer-token based; web refreshes on 401 via single-flight refresh.
- **Stay signed in on this device until you log out.** Access JWT is short (default **15 minutes**); refresh rotates quietly with a **10 year** ceiling that **slides** on each successful refresh. OTP is only needed after **You → Logout**, clearing site data, a full DB wipe / migrate reset, or a definitive refresh reject (`INVALID_TOKEN`).
- Local tokens are cleared only on Logout, definitive refresh failure, or definitive `/auth/me` auth failure — never on network blips or `SESSION_REFRESH_PENDING`.
- Multi-tab safe: cross-tab refresh lock on web; API reuses a recently rotated refresh for ~60s so parallel tabs do not log each other out.
- Transient API/network failures must **not** clear the session or send the user to OTP — the app retries in the background (`degraded` bootstrap state).
- After company creation, refresh session so the token picks up the new company context.
- Seed upserts users/companies and does **not** truncate `RefreshToken` rows; a full database reset still requires OTP once (like a new phone).
- Business rules (visibility, catalog) always run in **company** context, not bare user.

## Edge cases / empty states

- Invalid / expired OTP → clear error; stay on login.
- Network failure on bootstrap → show “Reconnecting to Ekum…” (not OTP); retry every few seconds while tokens remain.
- Network failure on refresh → keep tokens; show retry on the failing action.
- Invalid / revoked refresh → clear session; OTP required.
- Full `db` wipe / migrate reset → OTP once (refresh rows gone).

## Seed walkthrough

1. Login as Ravi: `+919800000001` (Surat Silk House).
2. Login as Meena: `+919800000002` (Jaipur Emporium).
3. Use dual-host testing (`localhost` vs `127.0.0.1`) via `apps/web/public/dual-test.html` if comparing both sides.

## Automated verification

- API units: `parseDurationMs` (`10y`), config default refresh TTL, `TokenService.rotate` sliding expiry + grace
- Web units: `tokenRefresh` keeps tokens on transient failure; clears only on `INVALID_TOKEN`
- Completeness: `docs/superpowers/reviews/completeness/2026-08-31-stay-signed-in-completeness.md`
- Design: `docs/superpowers/specs/2026-08-31-stay-signed-in-until-logout-design.md`

## Where it lives

- Web: `apps/web/src/features/auth/LoginPage.tsx`, `apps/web/src/lib/auth.tsx`, `apps/web/src/lib/tokenRefresh.ts`, `apps/web/src/lib/inviteReturn.ts`
- API: `apps/api/src/auth/`
- Contracts: `packages/domain-types/src/auth.ts`
