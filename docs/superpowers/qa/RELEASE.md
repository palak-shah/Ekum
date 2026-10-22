# Ekum release procedure (solo)

You are the only developer. There is no reviewer and no extra git branch. **Production is not GitHub Actions.** You ship with `git pull` + `pnpm docker:up` on the Linux box.

`EKUM_DEPLOYMENT=test` (local, beta, tunnel) is unchanged. When `.env.docker` has `EKUM_DEPLOYMENT=production`, `pnpm docker:up` **exits 1** unless this git SHA has evidence `PASS` or `EXCEPTION_APPROVED`.

Playwright Chromium / WebKit is **not** a phone. See [mobile-and-pwa-test-matrix.md](./mobile-and-pwa-test-matrix.md).

## Evidence

One file per commit, committed so the server `git pull`s it:

`docs/superpowers/qa/releases/<fullSha>.json` (shape: [releases/TEMPLATE.json](./releases/TEMPLATE.json))

| `decision` | Meaning |
|------------|---------|
| `BLOCKED` | A required automated check failed. Do not ship. |
| `AWAITING_DEVICE` | Automation passed; Android + iPhone not all recorded. Production `docker:up` refused. |
| `PASS` | Automation + all four device modes passed **for this SHA**. |
| `EXCEPTION_APPROVED` | Automation passed; you skipped device with a reason and follow-up. Never a red suite. |

**PASS** needs all automated keys `pass` and:

| platform | mode |
|----------|------|
| android | chrome |
| android | pwa |
| iphone | safari |
| iphone | pwa |

A device row is `pass` only if you ran it. Viewport emulation cannot set those rows.

There is **no** `EKUM_RELEASE_GATE=skip`.

## Every GitHub push

CI runs lint, typecheck, unit, build, and Playwright `@smoke` on `vite preview` (Chromium + WebKit, mobile viewports). The workflow fails if a required job fails.

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e:smoke:preview
```

## Staging / release candidate

```bash
pnpm release:check
```

Runs lint, typecheck, unit, build, preview smoke, Docker `:8080` smoke, and `@release` journeys. Writes the JSON as `AWAITING_DEVICE` or `BLOCKED`. Prints a short report.

Or on GitHub: **Actions → CI → Run workflow** with **release_candidate** checked (docker smoke + `@release`; not every push).

Mixed-rate honesty for Apply to all is the **unit** `collectionSameForAll.spec.ts`, not a full mixed-rate Playwright journey.

## Device sign-off (same SHA)

On **one Android (Chrome and installed PWA)** and **one iPhone (Safari and Home Screen PWA)** against the Docker (or server) build for this SHA:

1. Log in with OTP. Home Screen: keyboard still accepts the code.  
2. Chat: send text + photo; composer stays above the keyboard.  
3. Collection: create/edit/publish with a photo; failed upload is on screen and retryable.  
4. Order: confirm, decline a line (Total still bills the rest), partial dispatch, Dispatch more (second LR), Settle.  
5. Keyboard / safe-area / sticky footer: Place Order and sheet CTAs not under the home indicator.  
6. Last Orders row clears bottom nav. Back, refresh, leave the app and return — session holds.  
7. Settings → About Ekum matches `GET /api/v1/version` and `GET /api/v1/web-build` for **this** SHA. After a new deploy, **New version · Load** (or Home Screen reload) works.

```bash
pnpm release:signoff --platform android --mode chrome --result pass
pnpm release:signoff --platform android --mode pwa --result pass
pnpm release:signoff --platform iphone --mode safari --result pass
pnpm release:signoff --platform iphone --mode pwa --result pass
```

Optional: `--os "iOS 18"` `--tester you` `--notes "…"`. Decision becomes `PASS` only when all four are `pass`.

Commit `docs/superpowers/qa/releases/<sha>.json` before the server pull.

## Production

```bash
# laptop: evidence PASS (or exception) committed and pushed
git push

# server
git pull
# .env.docker has EKUM_DEPLOYMENT=production
pnpm docker:up          # refuses AWAITING_DEVICE / BLOCKED / missing file / SHA mismatch
pnpm release:post       # /health + /version SHA + docker smoke
```

If `release:post` fails, **do not auto-rollback**. Decide: fix forward or `git checkout` the previous SHA and `pnpm docker:up` again (that SHA needs its own evidence).

## Urgent

Automation must still be green. You may skip **device** only:

```bash
pnpm release:exception --reason "otp outage hotfix" --follow-up "device pass by 2026-10-23"
pnpm docker:up
```

`--recorded-by` defaults to `$USERNAME`. A failed automated check cannot be excepted.

## Local commands

```bash
pnpm test:e2e:release                # @release journeys (Chromium mobile)
pnpm test:e2e:smoke:docker           # Compose :8080 smoke
pnpm release:assert                  # same check docker-up runs in production
```
