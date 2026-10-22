# Comprehensive functional gap audit

**Date:** 2026-10-22  
**Lenses:** Product architect · textile B2B · QA architect · skeptical first-time trader  
**Disposition:** Audit only — no production behaviour changed  
**Anchors:** `docs/features/*`, `docs/superpowers/reviews/feature-gap-matrix.md`, completeness reviews, Prisma, Nest API, web PWA, Playwright `@functional` / `@release` / `@smoke`

> Green tests are not completeness. This document traces required workflows against code and existing tests, then names what could not be verified on a real phone or under concurrency.

---

## Method

1. Read shared concepts and area feature docs (auth through admin).  
2. Read the living [feature-gap matrix](./feature-gap-matrix.md), GarmentHub MVP matrix, Phase 1 critique (2026-09-09), and recent completeness reviews (through 2026-10-22).  
3. Trace buyer / supplier / dual-network trader paths across UI, API, Prisma, jobs, and tests.  
4. Challenge failure paths (empty input, permissions, partial qty, double submit, refresh) in code.  
5. **Ran** existing units that lock the highest-severity claims (all passed — they encode *current* behaviour, including leftovers).  
6. **Did not** add new tests or change app code. Recommended tests sit in §5.

**Ran (2026-10-22, all pass):**

| Suite | Result |
|-------|--------|
| `otp.service.spec.ts` (4) | Pass — verify/consume only; no SMS |
| `config.schema.spec.ts` (7) | Pass — production forbids `OTP_EXPOSE_DEV_CODE` |
| `visibility.service.spec.ts` (6) | Pass — `canViewCatalog` = active Connection |
| `return-window.handler.spec.ts` (5) | Pass — only `Delivered` closes |
| `sample.service.spec.ts` (6) | Pass — API lifecycle, no UI |
| `payment.service.spec.ts` (5) | Pass — `PAYMENT_DISABLED` |
| `sku.spec.ts` (4) | Pass — sequential `findFirst`, no unique index |
| `i-handle-desk.spec.ts` (5) | Pass — helpers only, not mill→parent settle |
| `orders.fulfillment.journey.spec.ts` settle submit + second LR | Pass (this SHA) |

**Not walked in a browser this audit:** staff-cap 403 chrome, Network Block leftover chat, GST edit save, sample Others row, 2-hop I-handle, real iPhone / Android PWA. Those are marked **needs device** or **strongly suspected** where the code is clear but the screen was not opened.

---

## 1. Executive summary

Ekum’s **supported live spine** is still the 2026-09-09 critique: curated collection → Place → (I handle) Send mill → quote / confirm → **Dispatch** → **Dispatched · complete** (or **Settle → Settled · complete**). That spine has unit + functional coverage, including new `@release` settle-submit and second-LR journeys.

It is **not ready to release to real phones as production** until OTP can be delivered without `OTP_EXPOSE_DEV_CODE`. Live-server design explicitly deferred SMS. `NODE_ENV=production` forbids exposing the code. `otp.service.ts` never sends. A trader on a new phone cannot log in.

Beneath that, the product is **thick chrome, thin recovery**. Catalog, Explore, chat, How many, dispatch, and I-handle 1-hop are built and mostly tested at unit level. The dangerous gaps are leftover parallel products (samples API without a surface, returns API after UI removal), **trust-ladder leftovers** (`canViewCatalog` still means Connection), **staff chrome that 403s**, **SKU races**, and **I-handle mill Settle → parent** with no service/e2e test.

Matrix hygiene is a real risk: several **Works** rows describe chrome that later slices replaced (ticket **Ordered · Shipped · Balance**, not **dispatched N · pending M**). A **Missing** pack-size row is false — `piecesPerPack` shipped. Treat the matrix as a changelog, not a release certificate.

**Functional readiness:** Demo / seed / `OTP_EXPOSE_DEV_CODE=true` — usable for the supported spine. Production `EKUM_DEPLOYMENT=production` with OTP off-screen — **not ready**.

---

## 2. Prioritized gap register

### Release blocker

#### FG-001 — Production OTP cannot reach a real phone

| | |
|---|---|
| Feature / workflow | Auth · login |
| Role | Any person on a new device |
| Expected | Phone + OTP (`docs/features/auth.md`). Production must not return the code (`config.schema.ts` L66–68; `docs/docker.md`). |
| Actual | `OtpService.issue` hashes a code, optionally logs/returns it when `OTP_EXPOSE_DEV_CODE`, then **TODO send via SMS + rate limiting** (`apps/api/src/auth/otp.service.ts` L44–48). No Twilio/MSG91/other sender exists in `apps/api`. Live-server spec lists SMS as **out of scope**. |
| Repro | Set `NODE_ENV=production`, `OTP_EXPOSE_DEV_CODE=false`, request OTP for a real number. Response has no `devCode`. No SMS. Login cannot complete. |
| Evidence | Code + `config.schema.spec.ts` (forbids expose in production) + `otp.service.spec.ts` (verify only). |
| Class | Missing functionality |
| Severity | **Release blocker** |
| Confidence | **Confirmed** |
| Correction | Product decision: SMS (or WhatsApp) provider + rate limit, **or** explicitly keep demo OTP and do not call the flavour `production`. |
| Regression | API: issue does not return `devCode` when flag false; provider mock called; throttle. Device: iPhone Home Screen types the code. |

---

### High

#### FG-002 — Samples: API lifecycle, no trader surface

| | |
|---|---|
| Feature / workflow | Orders · samples |
| Role | Supplier / buyer |
| Expected | `orders.md`: samples on **Others**; planned **order-builder toggle** (same lifecycle as Inquiry). Glanceable rows. Matrix: Partial / Future. |
| Actual | Full `Sample` model + `POST /samples` dispatch / receive / decline / convert. Web **never POSTs**. `OrdersPage` GETs the list. Sample `TradeRow` is a **`<div>`**, not a link (`OrdersPage.tsx` L629–634). Needs-you still says **Send sample** / **Mark received** (`tradeNeedsYouLabel.ts`). `/samples` redirects. No builder toggle. |
| Repro | Seed or API-create a sample. Open Orders → Others. Row does not open. No way to convert or mark received in UI. |
| Evidence | `sample.controller.ts`, `OrdersPage.tsx`, `sample.service.spec.ts` (API only). Chrome e2e covers redirect, not create. |
| Class | Missing functionality (leftover entity) |
| Severity | High |
| Confidence | Confirmed |
| Correction | Ship the Inquiry-style toggle **or** hide GET/list/Needs-you until then. Do not leave untappable Needs-you rows. |
| Regression | Functional: create sample from builder → Others row → dispatch → convert. |

#### FG-003 — GST field promises a verified badge it never grants

| | |
|---|---|
| Feature / workflow | Company profile · trust |
| Role | Owner editing Profile |
| Expected | `company.md`: `not_verified` · `gst_verified`. Profile hint: *Optional — adds a verified badge.* |
| Actual | `company.service.ts` L42–46: GST **does not auto-verify**. Create stays `not_verified`. `gst_verified` is seed-only (`prisma/seed.ts`). No GSTIN API, no admin verify. Shop GST tick is a stored enum. |
| Repro | As a new company, enter a GSTIN, Update. Badge stays Unverified. |
| Evidence | `ProfilePage.tsx` L389; `company.service.ts` L42–46. |
| Class | Incorrect business logic / copy |
| Severity | High (false trust signal to the person filling the form) |
| Confidence | Confirmed (copy + service). Save path not re-clicked this audit. |
| Correction | Change hint to “GST number (not verified automatically)” **or** add a real verify path. Do not show a verified tick from typing. |
| Regression | Unit: create/patch with GST leaves `not_verified`. |

#### FG-004 — Staff without Chats still get a Chats tab that 403s

| | |
|---|---|
| Feature / workflow | Team caps |
| Role | Staff, `chats: false` |
| Expected | Design: no list / send / start chat. |
| Actual | `ConversationController` requires `chats` even on GET. Bottom nav **always** includes Chats (`AppShell.tsx` `NAV`). `canTeamCap` defaults **true while company is loading** (`teamCaps.ts` L18). Orders writes are capped; GET list is not. Team e2e only covers **uploads** FAB (`team.cap.spec.ts`). |
| Repro | Login as Amit (no uploads). Confirm ＋ toast. Login as staff with chats off (if seeded) → tap Chats → API 403. |
| Evidence | `conversation.controller.ts`; `AppShell.tsx` L64–68; `teamCaps.ts`; `team.cap.spec.ts`. |
| Class | Permission issue |
| Severity | High |
| Confidence | Confirmed in code. Staff-chats-off persona **needs a product decision** if seed has no such user. |
| Correction | Hide Chats (and ＋ New chat) when cap is off; fail closed while profile loads. Mirror for Orders write chrome (Quote / Dispatch still visible then 403). |
| Regression | Functional staff chats-off and orders-off. |

#### FG-005 — Company SKU uniqueness is a race

| | |
|---|---|
| Feature / workflow | Catalog · create design / batch |
| Role | Seller, two devices or concurrent batch |
| Expected | Company SKU unique; blank name → that SKU (`catalog.md`). |
| Actual | `Product.sku String?` with **no** `@@unique([companyId, sku])` (`schema.prisma` L285). `resolveProductSku` is `findFirst` then insert. Concurrent creates can collide. |
| Repro | Two parallel POSTs with the same sku (or two blank-name creates that mint the same candidate). |
| Evidence | `sku.ts`, `sku.spec.ts` (sequential only). |
| Class | State inconsistency |
| Severity | High |
| Confidence | Confirmed (no unique). Collision unproven in a live race. |
| Correction | Unique index + retry mint. |
| Regression | API concurrent create; unique constraint test. |

#### FG-006 — Concurrent dispatch has no lock

| | |
|---|---|
| Feature / workflow | Orders · Dispatch more |
| Role | Seller, double tap or two tabs |
| Expected | Remaining qty becomes one LR (or extra only when typed). Double submit must not silently duplicate remaining. |
| Actual | `dispatch()` loads remaining, creates `OrderShipment` with **no transaction / row lock / idempotency key**. Over-ship is **allowed**. UI disables on `isPending` only. Two in-flight POSTs of “all remaining” both succeed as extra. |
| Repro | Confirmed order, two parallel `POST /orders/:id/dispatch` with remaining qty. |
| Evidence | `order.service.ts` ~L1812–1902; `OrderDetailPage.tsx` dispatch button `disabled={isPending}`. No concurrent spec. |
| Class | Recovery / race |
| Severity | High |
| Confidence | **Strongly suspected** (no lock confirmed; race not executed this audit) |
| Correction | Serialize dispatch per order (transaction + remaining snapshot) or Idempotency-Key. Extra qty only when the body asks for extra. |
| Regression | Parallel dispatch test. |

#### FG-007 — I-handle mill Settle → parent is untested (qty mismatch risk)

| | |
|---|---|
| Feature / workflow | Trader desk · settle |
| Role | Trader (I handle) + mill |
| Expected | `orders.md` L131: mill Settle rewrites matching parent lines; parent Settled when all released subsets complete; trader does not Settle the Manage parent. |
| Actual | Code exists (`passMillSettleToParent` / `syncManageParentFromMillSettle`, `order.service.ts` L4212–4436). Rewrite uses **mill line `quantity`**, not shipped totals. Parent shipments from mill dispatch are **not trimmed**. Final &lt; shipped can leave parent **extra** then settle. Parent living-card update is try/catch after Settled write. `i-handle-desk.spec.ts` only tests `allReleasedSubsetsComplete`. e2e desk journey does not settle. |
| Repro | Two-mill I-handle: Send, mill partial dispatch, mill Settle with Final &lt; shipped. Open parent ticket. |
| Evidence | `order.service.ts` L4314–4327, L4433; `i-handle-desk.spec.ts`; `orders.i-handle-desk.journey.spec.ts`. |
| Class | Incorrect business logic (suspected) + missing tests |
| Severity | High |
| Confidence | Implementation confirmed; extra-after-settle **strongly suspected** |
| Correction | Parent qty := mill shipped (or documented Final). Trim or annotate parent shipments. Service + e2e mill Settle. |
| Regression | API mill Settle → parent lines/status/card. e2e two-mill one-open stays part_shipped. |

#### FG-008 — Trader Home never asks for curate / share / mill Send

| | |
|---|---|
| Feature / workflow | Home · dual-network |
| Role | Trader |
| Expected | Matrix: *Trader attention UX (buy / curate / share / follow-up) · Missing*. Home is the attention surface (`home.md`). |
| Actual | Home needs: follow asks, pending chats, collection-view grants, **order** verbs. No curate, share, follow-up, sample, or mill-Send rows. `returns: []` hardcoded. |
| Evidence | `HomePage.tsx`, `homeAttention.ts`, `home.journey.spec.ts` (seller confirm only). |
| Class | Missing functionality (already labelled Missing) |
| Severity | High for dual-network daily use; **or** Reject vs generic Home |
| Confidence | Confirmed |
| Correction | Product decision: add trader jobs **or** formally Reject and keep Home as order/follow/chat. |
| Regression | Home mill-Send / unsent curated pack (if shipped). |

#### FG-009 — `canViewCatalog` still means Connection

| | |
|---|---|
| Feature / workflow | Trust ladder · Followers audience |
| Role | Allowed follower, not Connected |
| Expected | Follow ≠ Connection. Followers-audience catalog is **allowed follow**. Connection is trade. |
| Actual | Discover paths use Follow (`audience-visibility.ts`). `VisibilityService.canViewCatalog` (`visibility.service.ts` L16–22) is still active Connection. Callers still use it for shop contact, Explore `connected`, product-via-pack, broadcast, chat references. Units **assert** catalog = Connection. |
| Evidence | `visibility.service.ts`, `visibility.service.spec.ts` L19–32. |
| Class | Incorrect business logic / leftover helper |
| Severity | High (trust ladder) |
| Confidence | Confirmed helper; impact on each caller **needs** a Followers-without-Connection journey |
| Correction | Rename or split: `canViewFollowersCatalog` vs `isConnected`. Stop using Connection as a catalog door. |
| Regression | Follower (not connected) sees Followers shop; not-followed connected party does not get Followers-only packs. |

#### FG-010 — Network Block vs shop ⋯ Block vs leftover chat

| | |
|---|---|
| Feature / workflow | Network · Block |
| Role | Either company |
| Expected | Silent block. Other party does not see the row. Shop 404. Only blocker Unblocks. Shop ⋯ Block also declines the chat (`company.md`). |
| Actual | `isBlocked` is **bidirectional** — blocker also 404s the shop. Connections list still **links** `/company/:id`. Network Block does not decline the thread. Pause API still mounted. |
| Class | Permission / leftover UI |
| Severity | High |
| Confidence | Confirmed in code; thread leftover **not** re-clicked this audit |
| Correction | Blocker keeps own shop link or a “Blocked” row without 404. Network Block = shop Block (decline chat). Remove Pause. |
| Regression | Block from Network hides chat for both; blocker can Unblock; other party 404s shop. |

---

### Medium

#### FG-011 — Returns removed from UI; API + jobs still live

`orders.md` L85–87: Removed. Completeness `2026-09-30-remove-returns` deferred API leftover. `ReturnController` still creates/approves. Dispatch/settle still enqueue `return_window.expire`. Chat still knows `return_card`. **Same file** L11 still says samples and returns live on Orders.

**Class:** Leftover API. **Severity:** Medium (back door). **Confidence:** Confirmed.  
**Correction:** Reject POST `/returns` like payment, **or** restore Raise return. Fix L11.  
**Tests:** UI absence exists; `return.service.spec.ts` still green for create.

#### FG-012 — `return_window.expire` is a no-op on the close path that ships

Handler returns unless `status === Delivered` (`return-window.handler.ts` L33–35). Happy path now writes `dispatched` / `settled` and `closedAt` immediately. Units only cover Delivered.

**Class:** Dead job. **Severity:** Medium. **Confidence:** Confirmed (unit “not delivered” is a no-op).  
**Correction:** Delete job **or** retarget dispatched/settled leftover windows.

#### FG-013 — Photo order cannot be amended; generic Edit rule does not say so

`buyerCanAmend` returns false for `OrderKind.Photo` (`order.service.ts` L3037). Message: cancel and place a new one. `orders.md` L25 says buyer Edit until seller quotes — no photo exception. Matrix Partial.

**Class:** Missing functionality / unclear requirement. **Severity:** Medium. **Confidence:** Confirmed.  
**Correction:** Document the exception **or** allow amend while Requested.

#### FG-014 — Billing firms CRUD never touches a ticket

Settings Billing Add works (`settings.billing-firms.journey.spec.ts`). No `billingFirmId` on Order / packing slip. Payment is Deferred.

**Class:** Missing consumer. **Severity:** Medium. **Confidence:** Confirmed.  
**Correction:** Wire Default firm onto packing PDF / ticket **or** don’t present as trade Billing.

#### FG-015 — Notification mark-all ignores `recipientUserId`

List/count scope to this user. `markAllRead` / delete-all filter **company only** (`notification.service.ts`). Staff A can close staff B’s private rows.

**Class:** Permission issue. **Severity:** Medium. **Confidence:** Confirmed.  
**Correction:** Same recipient filter as list.

#### FG-016 — Collection `endsAt` has no sweep if the one-shot job is missed

`scheduleExpire` enqueues one job. No daily sweep of published + past `endsAt`. Read guards hide from buyers; seller can still see Published if `JOBS_ENABLED=false`.

**Class:** Partial. **Severity:** Medium. **Confidence:** Confirmed.  
**Correction:** Sweep on job-runner tick; e2e live window.

#### FG-017 — Prisma `Follow.status` defaults to `allowed`

Service writes `pending`. Schema `@default("allowed")`. Omit-status creates an instant follower.

**Class:** Leftover default. **Severity:** Medium. **Confidence:** Confirmed.  
**Correction:** Default `pending`.

#### FG-018 — Ticket chrome vs matrix “dispatched N · pending M”

Ticket is **Ordered · Shipped · Balance** (seen on running fulfill screenshot this SHA; e2e `order-line-fact-balance`). Matrix L159–160 and unused `ShipProgressHint` still say dispatched/pending.

**Class:** Doc / dead helper drift. **Severity:** Medium (will re-ship old language). **Confidence:** Confirmed.  
**Correction:** Update matrix; delete or stop testing unused helpers as if they were the ticket.

#### FG-019 — `settings.md` still walks “Orders → filter Return”

Line 5 and seed step 2. Product has no Return type.

**Class:** Doc drift. **Severity:** Medium (seed walkthrough). **Confidence:** Confirmed.

#### FG-020 — Admin Master Categories: GET list only

Tag Management ships. Category CRUD / units UI / xlsx importer deferred (`admin-tag.controller.ts` GET only). Matrix already Partial.

**Class:** Partial (deferred in writing). **Severity:** Medium (ops). **Confidence:** Confirmed.

#### FG-021 — Catalog upload failure drops the draft; no Retry

`DesignBatchPage` drops failed mint and rethrows. Completeness G-003 untested. Chat photo retry is better covered.

**Class:** Recovery failure. **Severity:** Medium. **Confidence:** Confirmed in code.  
**Correction:** Keep the tile + Retry (same as chat composer).

#### FG-022 — Curated pack “broadcast” compose is hidden; delivery is chat Share

Matrix: Partial · Untested. `broadcast.md`: ＋ Broadcast hidden. Share uses DMs, not `POST /broadcasts`. `/broadcast/new` still routed.

**Class:** Partial / leftover route. **Severity:** Medium. **Confidence:** Confirmed.

#### FG-023 / FG-024 — Payment and Mark delivered leftover APIs

Payment UX off; routes throw `PAYMENT_DISABLED`; team still has a Payments cap. `POST /orders/:id/deliver` still live; UI has no button.

**Class:** Leftover API. **Severity:** Low–medium. **Confidence:** Confirmed.

#### FG-025 — Publish API still accepts `everyone` / `connections`

UI chips are Followers / Selected. Zod still allows legacy enums; services persist `dto.audience`. Read path remaps. Serializer fallback `audience ?? 'connections'`.

**Class:** Leftover write path. **Severity:** Medium. **Confidence:** Confirmed.  
**Correction:** Reject on write; keep read remap.

#### FG-026 — Full offline Workbox + chunk-404 recovery is Later

PWA update pill and HS login typing are designed. Completeness 2026-10-19: offline + chunk-404 Later. Real Safari / Android PWA is the device checklist, not Playwright.

**Class:** Partial (labelled). **Severity:** Medium for production install. **Confidence:** Confirmed (docs + no device pass this SHA).

---

### Low / matrix hygiene

#### FG-027 — Pack size row still **Missing** while `piecesPerPack` ships

Matrix L303. Completeness 2026-09-23 was model-only. Billing/How many shipped 2026-10-12. **The Missing row is wrong.**

#### FG-028 — Federated search: Works + Untested + Future on one row

In-app `SearchService.universal` exists. Not cross-instance federation. No `@explore` typed-search e2e.

#### FG-029 — Dual network “Untested” is stale for 1-hop

`orders.from-pack-multi.journey.spec.ts` and `curate.multi-supplier.journey.spec.ts` exercise Meena buy+curate+sell and Ravi mill+place. Long chain (2+ hops) remains Later.

#### FG-030 — Collection add-and-go **Redesign** row is historical

Who lives on the editor page; sibling redesign row is Works.

#### FG-031 — Name-from-filename still in `collections.md`; create uses SKU names

Dead `nameFromFilename` helper.

---

## 3. Workflow coverage / requirement traceability

Legend: **Y** implemented · **P** partial · **N** missing · **L** later/deferred · **T** automated test of the *business outcome* · **U** unit of helpers only · **D** device / not this audit

| Requirement | Workflow | UI | API | Data | Test | Mobile |
|-------------|----------|----|-----|------|------|--------|
| Phone OTP login | Auth | Y | P (no SMS) | Y | U verify | D |
| Stay signed in | Auth | Y | Y | Y | U | D HS |
| Create company | Onboarding | Y | Y | Y | Functional auth | D |
| GST verified badge | Profile | P (copy) | N auto | Enum | U assumes verified | — |
| Follow ask / allow | Shop | Y | Y | Follow | Functional | D |
| Connection via Message Approve | Chats Requests | Y | Y | Connection | Functional | D |
| Block silent 404 | Network / shop | P | Y | Connection | U list mask | D |
| Publish Followers / Selected | Publish sheet | Y | P write leftover | Y | U remap | D |
| Collection draft/publish | Create collection | Y | Y | Y | `@release` | D |
| Pack Rate per honesty | Apply to all | Y | Y | piecesPerPack | Unit `collectionSameForAll` | — |
| Explore feed | Browse | Y | Y | Y | Smoke + functional | D |
| In-app search | Explore search | Y | Y | Y | U; e2e missing | D |
| Place order How many | Selection / shop | Y | Y | Y | Functional + `@release` | D |
| Quote / confirm / decline totals | Ticket | Y | Y | Y | `@release` chrome | D |
| Photo order create | Chat ＋ / Orders ＋ | Y | Y | Y | Functional create | D |
| Photo order amend | Ticket Edit | N | Reject | — | None | — |
| Partial dispatch + 2nd LR | Dispatch | Y | Y | Shipments | `@release` | D |
| Settle submit + chat Settled | Settle | Y | Y | Status | `@release` bilateral | D |
| I-handle Send / desk | Trader | Y | Y | Subsets | Functional Send | D |
| I-handle mill Settle → parent | Trader | Y dock | Y untested | P qty | Helpers only | D |
| Samples create/convert | Others | N | Y | Sample | API only | — |
| Returns | Orders | Removed | Y leftover | Return | API units | — |
| Payment | Ticket | Removed | Reject | PaymentRequest | Disabled units | — |
| Staff uploads cap | ＋ | Y | Y | Membership | Functional FAB | — |
| Staff chats/orders caps | Nav / dock | P | P | Membership | Missing | — |
| Notifications tap/deep link | Bell | Y | Y | Notification | U + functional | D push |
| PWA New version · Load | Install | Y | web-build | SW | U + smoke preview | D |
| Device Android+iPhone sign-off | Release | Process | — | SHA json | Gate units | **Not this SHA** |
| Trader Home jobs | Home | N | N | — | Missing | — |
| Multi-hop anonymity | Chain | L | L | 1-hop scrub | 1-hop units | — |
| Offline | PWA | L | — | SW | Missing | D |

---

## 4. Unresolved product decisions

Do **not** invent expected behaviour for these. Completeness must choose Proceed / Redesign / Reject before build.

1. **How does a real phone receive OTP in production?** SMS, WhatsApp, or demo-only forever (then do not set `EKUM_DEPLOYMENT=production` with expose off).  
2. **Samples:** Inquiry-style toggle, or delete/hide the Sample product until then.  
3. **Returns:** Keep API as Later, or `RETURNS_DISABLED` like payment.  
4. **GST:** Typing a number is not verification — change copy vs integrate GSTIN.  
5. **Billing firms:** Ticket/PDF consumer vs address book only.  
6. **Trader Home:** Dedicated buy/curate/share/follow-up jobs vs Reject (generic Home).  
7. **Staff chats-off:** Hide tab vs allow read-only list.  
8. **Photo amend:** Document “cancel and replace” vs allow Edit while Requested.  
9. **Concurrent extra dispatch:** Allowed textile over-ship vs must be explicit in the body.  
10. **Followers vs Connection catalog helper:** One definition of “can see this shop’s packs”.  
11. **Multi-hop chain-safe anonymity:** Stay Later, or design hop-2 before any production chain data.  
12. **Broadcast compose route:** Delete vs restore ＋ Broadcast.

---

## 5. Missing automated and real-device tests

**Automated (business outcome, not chrome):**

- OTP issue does not leak `devCode` when flag is false; provider invoked (once it exists).  
- Staff `chats: false` / `orders: false` chrome + API.  
- Follower-not-connected vs connected-not-follower catalog.  
- Network Block hides chat; blocker Unblock.  
- Concurrent dispatch / settle.  
- Unique SKU under parallelism.  
- Mill Settle → parent lines, status, living card (1 mill and 2 mills).  
- Sample create → Others → convert (only if product ships).  
- Notification mark-all does not close another user’s private rows.  
- Collection `endsAt` hides album when job runs (and when job is missed, if sweep ships).  
- Explore typed search e2e (`@explore`).  
- Catalog upload 500 → Retry.  
- Photo amend rejected with the documented copy.

**Real device (cannot be Playwright Pixel 7 / WebKit):**

- Android Chrome + installed PWA, iPhone Safari + Home Screen — see `docs/superpowers/qa/RELEASE.md`. **This SHA has no device sign-off file.**  
- Soft keyboard vs OTP / composer / Settle Final.  
- Camera / HEIC / Home Screen one-shot reload.  
- Push tap → path.  
- Offline / flaky network / resume.

Existing `@smoke` on WebKit is **not** an iPhone. Matrix already says so.

---

## 6. Recommended fix sequence (small batches)

**Batch A — cannot log in for real (blocker)**  
FG-001 OTP delivery. Completeness first (provider + rate limit + production flag). No other feature work until a stranger can open the PWA and get a code.

**Batch B — stop lying / leaking trust**  
FG-003 GST copy; FG-009 catalog helper rename; FG-010 Block vs chat; FG-017 Follow default; FG-025 reject legacy audience on write.

**Batch C — leftover products**  
FG-002 samples (ship or hide); FG-011/012 returns API + dead job; FG-023/024 payment/deliver leftover; FG-019/018/027–031 docs + matrix hygiene.

**Batch D — staff + integrity**  
FG-004 nav caps fail-closed; FG-005 SKU unique; FG-015 mark-all scope; FG-006 dispatch serialize.

**Batch E — I-handle money path**  
FG-007 mill Settle → parent tests + qty rule. Do not add hop-2 until this is green.

**Batch F — dual-network daily use (needs decision 6)**  
FG-008 Home jobs **or** Reject. FG-014 billing consumer **or** quiet the domain.

**Batch G — recovery / ops**  
FG-016 expire sweep; FG-020 category CRUD (ops); FG-021 upload retry; FG-026 device sign-off for the SHA you actually ship.

Each batch: Completeness → lock `docs/features` → tests that assert the **trader outcome** → trader-eye on phone width.

---

## 7. Files and tests per confirmed gap

| ID | Inspect / change | Tests today | Tests to add |
|----|------------------|-------------|--------------|
| FG-001 | `otp.service.ts`, `config.schema.ts`, `docs/features/auth.md`, docker env | `otp.service.spec.ts`, `config.schema.spec.ts` | Provider mock; no `devCode` in production |
| FG-002 | `OrdersPage.tsx`, `tradeNeedsYouLabel.ts`, `sample.controller.ts`, `orders.md` | `sample.service.spec.ts`; chrome redirect | Create/convert journey **or** hide-list unit |
| FG-003 | `ProfilePage.tsx`, `company.service.ts` | — | Patch GST stays `not_verified` |
| FG-004 | `AppShell.tsx`, `teamCaps.ts`, `conversation.controller.ts`, `OrderDetailPage.tsx` | `team.cap.spec.ts` (uploads only) | chats-off / orders-off e2e |
| FG-005 | `schema.prisma` Product, `sku.ts` | `sku.spec.ts` | Unique + concurrent |
| FG-006 | `order.service.ts` `dispatch` | Fulfillment second LR (happy) | Parallel POST |
| FG-007 | `order.service.ts` `syncManageParentFromMillSettle` | `i-handle-desk.spec.ts` helpers; desk e2e Send | Service + e2e settle |
| FG-008 | `homeAttention.ts`, `HomePage.tsx`, matrix row 312 | `home.journey.spec.ts` | Only if jobs ship |
| FG-009 | `visibility.service.ts` + callers | `visibility.service.spec.ts` (encodes the bug) | Followers-without-Connection |
| FG-010 | `ConnectionsPage.tsx`, `connection.service.ts`, shop Block | Connection list units | Block hides chat |
| FG-011 | `return.controller.ts`, `orders.md` L11 vs L85 | `return.service.spec.ts` | Reject create if disabled |
| FG-012 | `return-window.handler.ts`, enqueue in `order.service.ts` | Handler spec (Delivered) | No-op on `dispatched` asserted as product **or** retarget |
| FG-013 | `buyerCanAmend`, `orders.md` L25 | Photo create e2e | Amend rejected copy |
| FG-014 | `settings.service.ts`, packing slip, Order model | Billing firms journey | Ticket uses Default **or** drop domain |
| FG-015 | `notification.service.ts` markAllRead | List/count user scope | Mark-all isolation |
| FG-016 | `collection-expire.handler.ts`, job-runner | Handler unit | Sweep + e2e |
| FG-017 | `schema.prisma` Follow | follow.service pending | Default pending |
| FG-018 | `feature-gap-matrix.md` L159–160, `shipProgressLabel.tsx` | Old helper specs | Stop asserting dead helpers |
| FG-019 | `docs/features/settings.md` | — | — |
| FG-025 | catalog Zod + `product.service` / `collection.service` publish | audience-visibility remap | POST reject everyone |

---

## 8. What this audit could not verify

- Real SMS, real GSTIN, real camera, real IME, Home Screen install, push tap.  
- Concurrent dispatch/settle under load (no harness run).  
- I-handle mill Settle on a live two-mill desk (code-read only).  
- Staff chats-off seed user in the running app.  
- 2-hop (Meena as trader to a further buyer) anonymity.  
- Whether production `.env.docker` on the Linux box currently sets `NODE_ENV=production` (repo example stays development + expose true).  
- Every completeness **Works** chrome row vs the running pixel — many are unit-locked; BM-11 trader-eye on those screens was not repeated here.

**Completion rule:** this audit is complete as a **requirements vs code vs test** pass. It is **not** a device sign-off and **not** a claim that passing units mean the app is functionally finished.

---

## 9. Relation to the existing matrix

The [feature-gap matrix](./feature-gap-matrix.md) remains the running changelog of completeness slices. This audit **does not replace it**. Stale rows (pack size Missing, search Untested+Future, dual-network Untested, ticket pending copy) are called out here and lightly corrected there, with notes pointing at this file. New high-severity items (OTP, samples surface, GST copy, SKU unique, mill settle tests) are **added** as rows, not overwritten onto unrelated Works chrome.
