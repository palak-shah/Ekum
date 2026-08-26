# Ekum — demo review checklist

Use this for a **~20 minute** product review with seed personas. Mobile viewport (or narrow browser) is best — Ekum is a mobile-first PWA.

**One-liner for reviewers:** Ekum is WhatsApp-shaped B2B textile trade: discover on Explore, decide in chat, execute in Orders — one company account, server-enforced visibility, no trader badges cluttering the UI.

---

## Before the session (~30 min)

### Prerequisites

- Node.js ≥ 20, pnpm 11, PostgreSQL running locally
- Repo: `c:\Projects\cursor\ekum` (or your clone path)

### One-time / fresh machine

```bash
pnpm install
cp .env.example apps/api/.env
# Edit apps/api/.env — confirm DATABASE_URL and OTP_EXPOSE_DEV_CODE=true
pnpm --filter @ekum/api prisma:generate
pnpm --filter @ekum/api prisma:migrate deploy
pnpm --filter @ekum/api db:seed
```

### Start services (day of)

```bash
# Terminal 1
pnpm --filter @ekum/api dev    # http://localhost:3000/api/v1/health

# Terminal 2
pnpm --filter @ekum/web dev    # http://localhost:5173

# Or both: pnpm dev
```

### Sanity checks

- [ ] http://localhost:5173 → login screen loads
- [ ] http://localhost:3000/api/v1/health → OK
- [ ] OTP appears on screen after “Send code” (dev only)

### Optional confidence (before reviewers arrive)

```bash
pnpm --filter @ekum/api test
pnpm --filter @ekum/web test
```

### Two-persona setup

| Person | Phone | Business | Browser |
|--------|-------|----------|---------|
| **Ravi** | `+919800000001` | Surat Silk House (Surat) | Normal window |
| **Meena** | `+919800000002` | Jaipur Emporium (Jaipur) | Incognito / second browser |
| **Kavita** | `+919800000003` | Ahmedabad Loom Co | Optional third window |
| **Amit** | `+919800000004` | Staff on Ravi’s team | Optional — caps demo |

Login: enter phone → use **Dev OTP** shown on the login screen (`OTP_EXPOSE_DEV_CODE=true`).

Alternative: open `http://localhost:5173/dual-test.html` for side-by-side hosts.

### Reset if data looks wrong

```bash
pnpm --filter @ekum/api db:seed
```

Log out on both browsers (**You → Log out**), then log in again.

---

## Demo script (~20 min)

### A. First impression — Ravi (seller) · ~3 min

- [ ] **Home** — “Needs you” action rows (orders, rates, access) — not a notification inbox
- [ ] **Bell** — notifications: open item, **Mark all read**, **×** delete one, **Clear read**, **Clear all**
- [ ] Bottom nav: Home · Chats · **＋** · Explore · Orders
- [ ] Say: *one company account; buying and selling are jobs, not role badges*

### B. Explore — trade sides · ~5 min

**Ravi → Explore → Selling**

- [ ] **Buyers for you** — cards with intent / shop preview (not empty foam slabs)
- [ ] Filter rail: All · Buying · Selling

**Ravi → Explore → All** (or **Buying**)

- [ ] **Stories** — followed / connected publishers who posted
- [ ] **Post feed** — single scroll, ranked:
  1. People you follow
  2. Connected + your categories
  3. Category match (not connected)
- [ ] Open a post → go back → same post sinks (seen); new/unseen stay on top
- [ ] If many posts: **More posts (N)** then **Businesses for you** (not buried under hundreds)
- [ ] Filter square → **Businesses** = full supplier directory

**Meena → Explore → Buying**

- [ ] Same feed ranking from buyer lens
- [ ] **Received** — packs sent directly to her (by day → business)

### C. Trade journey — Meena buys, Ravi sells · ~7 min

**Meena**

- [ ] Explore → album or design → long-press → select
- [ ] **Ask rates** — copy says rate request, not “order placed”; lands in **Chats**
- [ ] Or: shortlist → order flow from bottom dock

**Ravi**

- [ ] **Chats** — quote card; only **newest** quote has primary **Accept** CTA
- [ ] **Orders** — request → quote → accept → dispatch (as far as seed allows)
- [ ] **Home** — needs grouped by company (e.g. “to dispatch · Jaipur Emporium”)

### D. Publish & curate (optional) · ~4 min

**Kavita or Ravi**

- [ ] **＋** → Add designs / New collection / **Curate pack**
- [ ] Publish with audience (Everyone / connections / selected)

**Meena**

- [ ] Open curated pack from Explore or `/collections/{id}` when audience allows

### E. Team caps (optional) · ~2 min

**Amit** (`+919800000004`)

- [ ] Limited chrome — no “Add designs” etc.
- [ ] **Ravi → You → Team** — invite / members (owner view)

---

## Recent polish to mention

| Area | What changed |
|------|----------------|
| Explore feed | Continuous ranked feed; no “See all 6” on posts |
| Seen posts | Opened posts sink until they have new activity |
| Feed cap | ~12 posts then “More posts”; Businesses shelf reachable |
| Buyers for you | Shop mosaic / category chips |
| Notifications | Delete each, clear read, clear all |
| Ask rates | Clear copy + chat navigation |
| Browse select | Clearing shortlist exits select mode |

---

## Skip or caveat (set expectations)

| Topic | Note |
|-------|------|
| Push notifications | Needs VAPID keys; in-app bell works without them |
| Share links / referrals | Partial or deferred — don’t lead unless seeded |
| Feed at huge scale | Seen + home cap in place; full pagination later |
| Automated CI E2E | May be manual trigger; local tests listed above |

---

## If something breaks

| Symptom | Fix |
|---------|-----|
| No OTP on screen | `OTP_EXPOSE_DEV_CODE=true` in `apps/api/.env`; restart API |
| Empty Explore / wrong data | `pnpm --filter @ekum/api db:seed`; re-login |
| 401 / blank shell | Log out from **You**, log in again |
| Stale UI | Hard refresh or incognito |

---

## 10-minute cut (single persona)

If time is tight, use **Ravi only**:

1. Home needs + bell (1 min)
2. Explore All → open post → back → seen behavior (2 min)
3. Explore Selling → Buyers for you (1 min)
4. Chats → order/quote card (2 min)
5. Orders list (1 min)
6. **＋** publish or collection peek (2 min)
7. Wrap: *Meena side is same app, buyer job on Explore Buying + Received*

---

## References

- Seed personas: [docs/features/README.md](./features/README.md)
- Area walkthroughs: [docs/features/](./features/)
- Auth / OTP: [docs/features/auth.md](./features/auth.md)
- Explore rules: [docs/features/explore.md](./features/explore.md)
- Notifications: [docs/features/notifications.md](./features/notifications.md)

---

## Reviewer sign-off (optional)

| Area | OK | Notes |
|------|----|-------|
| Home / needs | ☐ | |
| Explore feed & ranking | ☐ | |
| Chats & quotes | ☐ | |
| Orders lifecycle | ☐ | |
| Notifications inbox | ☐ | |
| Mobile / chrome (no clipped content) | ☐ | |
| Plain language / trader UX | ☐ | |

**Reviewer:** _______________ **Date:** _______________
