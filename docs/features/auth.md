# Auth

## Purpose

Phone OTP login establishes a session for a person. After verify, the app either continues onboarding (no company yet) or enters the main shell for their company.

## Who uses it

Every user before accessing the app.

## User flows

1. Open app → `/login`.
2. Enter phone number → request OTP.
3. Enter OTP → verify → tokens stored; `GET /auth/me` loads session.
4. If `needsOnboarding` → `/onboarding`; else → Home.
5. Logout from **You** (`/more`) clears the session.

## Business rules

- Auth is **phone + OTP** (dev builds use a fixed Dev OTP from API config).
- Session is bearer-token based; web refreshes on 401 via single-flight refresh.
- After company creation, refresh session so the token picks up the new company context.
- Business rules (visibility, catalog) always run in **company** context, not bare user.

## Edge cases / empty states

- Invalid / expired OTP → clear error; stay on login.
- Network failure → retry without inventing a session.

## Seed walkthrough

1. Login as Ravi: `+919800000001` (Surat Silk House).
2. Login as Meena: `+919800000002` (Jaipur Emporium).
3. Use dual-host testing (`localhost` vs `127.0.0.1`) via `apps/web/public/dual-test.html` if comparing both sides.

## Where it lives

- Web: `apps/web/src/features/auth/LoginPage.tsx`, `apps/web/src/lib/auth.tsx`
- API: `apps/api/src/auth/`
- Contracts: `packages/domain-types/src/auth.ts`
