# Mobile and PWA test matrix

Playwright covers layout and the production bundle. It does **not** prove a real phone.

`webkit-mobile` uses Playwright’s **iPhone 13 device descriptor on the WebKit engine** (touch, mobile viewport, mobile UA). That is not iOS Safari, not a Home Screen install, and not an App Store sign-off. `chromium-mobile` (Pixel 7) is not a physical Android device.

Keyboard checks **shrink the viewport**. They do not open a real IME, `visualViewport` insets, or the iOS accessory bar.

## What Playwright automates

| Check | Where |
|-------|--------|
| Seeded journeys (login, chat, orders, explore, collections, uploads) | `@functional` on Chromium + Vite dev (`pnpm test:e2e:functional`) |
| Smoke on Chromium and WebKit, mobile viewport + touch | `pnpm test:e2e:smoke` |
| Narrow overflow, dock/sheet clearance, list error, failed photo upload, sheet error | `apps/e2e/tests/mobile.layout.spec.ts` (`@smoke @regression @mobile`) |
| Viewport-shrink “keyboard” approximation | same file — labeled as an approximation |
| Production bundle + service worker | `pnpm test:e2e:smoke:preview` (`vite preview`, SW on) |
| Nginx gateway, `/api/v1/web-build`, `/version.json`, API `/version` | `pnpm test:e2e:smoke:docker` after `pnpm docker:up` and `pnpm docker:seed` |
| Failure diagnostics | screenshot + video on failure, trace on first retry, `console-errors.txt` and `failed-network.txt` attached from smoke/mobile specs |

CI: `e2e-smoke-preview` runs on every pull request and on `main` and **blocks** the workflow. `e2e-smoke-docker` runs on push to `main` and on manual dispatch and **blocks** those runs. The full `@functional` suite stays local (Chromium only).

Vite **dev** does not register the service worker. PWA specs skip unless `EKUM_EXPECT_SW=1` (set by the preview and Docker configs).

## What needs a real device

- iOS Safari vs Home Screen (`display-mode: standalone`), including the one-shot reload and that login typing is not interrupted
- Real soft keyboard, scroll-into-view, and `visualViewport` with the composer or a sheet open
- Notch / safe-area / home indicator
- Camera and microphone permission sheets (Continuous Camera, voice)
- Push notification tap → path
- Android Chrome install prompt
- Mid-range phone performance, flaky networks, and background tab restore

## Pre-release device checklist (~10 minutes)

Do this on **one iPhone (Safari and Home Screen)** and **one Android Chrome** after the Docker (or server) build is up. Do not treat a green WebKit job as a substitute.

1. Log in with OTP. On iPhone Home Screen, confirm the keyboard still accepts the code (no surprise reload).
2. Open a chat, send a text, send a photo. Composer and send stay visible above the keyboard.
3. Open a design → Order → enter pieces → Place Order. The primary button is not hidden under the keyboard or the home indicator.
4. Orders list: scroll the last row clear of the bottom nav. Open a sheet (filter or confirm) and dismiss it.
5. Upload or publish a collection photo; if it fails, the error is on screen and you can try again.
6. After a new deploy, confirm **New version · Load** (or the Home Screen reload path) and that Settings → About Ekum matches `VERSION` and the build id from `GET /api/v1/version` and `GET /api/v1/web-build`.

## Commands

```bash
pnpm test:e2e:smoke                 # Vite dev, Chromium + WebKit smoke
pnpm test:e2e:functional            # Vite dev, Chromium journeys
pnpm test:e2e:smoke:preview         # production build + SW (API must be reachable)
pnpm docker:up && pnpm docker:seed
pnpm test:e2e:smoke:docker          # Compose :8080
```
