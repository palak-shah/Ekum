# Feature Completeness Review — TradeLane path & Your paths desk

**Date:** 2026-09-02  
**Module / ask:** Default first pair order = I handle, no group. Four lane outcomes as **two switches** (ticket × reveal), not four radios. Tweak on **More**, **order page**, and **Your paths**. No Agent. Docs only this slice.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/settings.md`, [2026-09-02-tradelane-design.md](../../specs/2026-09-02-tradelane-design.md), [2026-09-02-trader-path-client-review.md](../2026-09-02-trader-path-client-review.md)  
**Disposition:** Redesign

> Completeness keeps Ekum **coherent**. The 2026-08-21 model (Profile **Direct** default; I handle = always hide the other end; path override on every share/publish) fights a quiet first order and the client’s three *looks*. We redesign the **path/desk** only. We do not implement until this review’s Required gaps are closed in feature docs (done below).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | First Kavita × Meena hop must work like today: Place / Send, ticket with Ravi, two private chats. Changing “order with mill” or “they can see each other” is rare and happens when it hurts. Remember the pair. Client merged two Reveal *rows* visually; we still store ticket when the group is on. |
| UX Designer | Never draw four radios or two identical Reveal table rows. Two wholesaler sentences. Same controls on More, order page, Your paths. Everyday sheet stays Place / Send only. Your paths = search + list (supplier · buyer · order with · see each other), not a settings matrix on Profile. |
| Solution Architect | Persist `TradeLane { trader, seller, buyer, ticket: me\|mill, reveal }`. New pair = `me` + `reveal=false` even if Profile still says Direct. Reveal on = one trio group reused; ticket does not fork a second group. Profile Direct becomes fallback only after build. Send-hold on mill tickets can stay for `ticket=me` until a later order-ops review. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit Sheet **More**, order detail, You list + search (`ListSearchRow`). Two switches, not a new radio matrix.  
2. **Duplicates another feature?** No — Profile “When buyers order…” is fallback for *unlaned* pairs after ship; lane wins. Not a second Agent desk.  
3. **Should reuse an existing workflow?** Yes — same two lines everywhere; group create/reuse like other company chats (business names, owners add staff).  
4. **Naming matches the app?** **Me** / **{shop}**. **See each other** Off/On. **Your paths**. No Seller/Buyer/Trader chips. No “TradeLane” in UI.

**Philosophy conflict?** Yes with **shipped Dual trade docs** (Direct default; hide-only I handle; path on every share) → **Redesign**, then lock features. No conflict with “one job per screen” or busy-trader quiet chrome.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Four outcomes; first order default; persist pair; next order follows |
| Business rules | OK | ticket × reveal independent; group iff reveal; list visibility when Direct |
| Workflows | OK | First order → More/order/Your paths → save → next order |
| Edge cases | Gap | Live order change vs next-only; Take over vs ticket flip; multi-hop later |
| Permissions | OK | Needs **I trade on Ekum**; buy-only / sell-only: no Your paths |
| User states | OK | Empty Your paths until first middle-hop pair |
| Notifications | Later | Group create / ticket flip alerts not specified — keep existing order/chat notices until build |
| Error handling | Later | Save fail on More / order / desk — kit InlineNotice / danger toast |
| Scalability | OK | One row per trader×seller×buyer |
| Mobile interactions | OK | More sheet + order sticky CTAs must clear last content (BM-07) when built |
| Accessibility | Later | Name the two switches; search on Your paths |
| Platform consistency | OK | After Redesign lock in orders/settings |

---

## Gaps

### G-001 — Shipped Dual trade contradicts this model

| Field | Content |
|-------|---------|
| Gap | `orders.md` / Profile default Direct; I handle = hide-only + Send-hold; override on every forward/publish. |
| Why it matters | First order would still be Direct if we followed old docs. Everyday share would stay noisy. |
| Impact if ignored | Silent drift; client one-pager unused. |
| Recommendation | **Redesign** — rewrite Dual trade + Profile; point at TradeLane spec. (Closed in this review’s feature-doc update.) |
| Priority | Required before implementation |

### G-002 — Live order vs next order

| Field | Content |
|-------|---------|
| Gap | Spec says More / order page apply to **this** order **and** update the lane; Your paths updates the lane (future). Mid-lifecycle ticket/reveal (quoted, dispatched) not spelled out. |
| Why it matters | Traders will flip after they “feel it” — often after place. |
| Impact if ignored | Half-migrated chats / two groups. |
| Recommendation | At build: flipping **reveal** on a live order creates/reuses the trio and moves order cards; flipping **ticket** while still `requested` + no seller quote is allowed (like Take over). After quote: ticket change is Later / confirm in order-ops. |
| Priority | Required before implementation |

### G-003 — Send-hold vs group

| Field | Content |
|-------|---------|
| Gap | Today I handle mill tickets wait for **Send**. Group + ticket Me still needs a mill ticket. |
| Why it matters | Reveal-on / I handle must not leak Kavita’s list before Ravi intends. |
| Impact if ignored | Seller sees the order in the group before Send. |
| Recommendation | Keep Send-hold for `ticket=me` until Send. Group members see order cards only after the mill ticket is sent **or** document an exception at build. Do not invent Agent rules. |
| Priority | Required before implementation |

### G-004 — Collections Publish “When they order”

| Field | Content |
|-------|---------|
| Gap | Publish sheet still offers Direct vs I handle per pack. |
| Why it matters | Everyday path must stay quiet. |
| Impact if ignored | Two places to set path; first-order default fights Profile/pack stamp. |
| Recommendation | After build: pack/Profile is **fallback** only when no lane exists; first created lane is still `me`/`false`. Remove or bury pack-level path on the main Publish sheet (More-equivalent later). |
| Priority | Recommended enhancement |

### G-005 — Notifications / a11y / errors

| Field | Content |
|-------|---------|
| Gap | No new notification types; switch labels; save errors. |
| Why it matters | Desk and More must not fail silently. |
| Impact if ignored | Trader thinks the pair saved. |
| Recommendation | Reuse existing chat/order toasts; named controls. |
| Priority | Future improvement |

---

## Approved scope for this slice

Documentation only:

- Client one-pager: three *looks* + ticket-in-group via two switches.
- TradeLane spec (default, More, order page, Your paths).
- Feature lock: `orders.md` Dual trade, `settings.md` Your paths + Profile fallback, concepts + gap matrix.

No API, web, or `@functional` journeys in this slice.

## Explicitly deferred / rejected

- Agent capability and Agent rules  
- Four radios or two identical Reveal rows  
- Path controls on the everyday Place / Send sheet  
- Changing first-order default to Profile Direct  
- Hard-blocking Connection/chat when hide (reveal off)  
- Forward / view / `allowRelist`  
- Collection-as-order qty  

## Sign-off

Required gaps closed or deferred in writing: Yes (G-001 closed in feature docs; G-002 / G-003 written for build)  
Ready for implementation / `@functional` journeys: **No** — docs Redesign only; implement after G-002 / G-003 are decided in the build plan  
