# Feature Completeness Review — Forward free; view on open

**Date:** 2026-09-03  
**Module / ask:** Forward a card is always allowed. View/audience checked when they open the pack or design; ask the **catalog owner**. Curate/relist stays locked. Bookmark ≠ Curate. Owner-only quiet line on albums that include others.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/chat.md`, `docs/features/saved.md`  
**Disposition:** Redesign

> Completeness keeps Ekum **coherent**. 2026-08-13 locked **Forward**. That fights “pass the card as-is.” The lock moves to **Curate / relist**. View stays a trust-ladder check **on open**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | WhatsApp-like forward must not be homework. Exclusive packs still cannot become someone else’s published album. Save is a private list. |
| UX Designer | Hide Forward-for-lock is wrong. Share all selected cards. Curate still skips locked. Publish copy is pack/relist, not Forward. My designs: quiet source line only — no Curated chip. |
| Solution Architect | Drop `allowForward` on chat/share-link forward. Keep ceiling on curate (`RELIST_NOT_ALLOWED`). DB column `allowForward` stays. Ask `targetCompanyId` = catalog owner. |

---

## Platform consistency (required)

1. **Existing patterns?** Collection viewer already asks `data.company`. Kit Share / Bookmark / Curate on select bar.  
2. **Duplicates another feature?** No — Forward ≠ Bookmark ≠ Curate.  
3. **Should reuse an existing workflow?** Yes — `/access-requests` to the owner on open.  
4. **Naming matches the app?** Bookmark · Curate · Forward/Share. No Seller/Trader badges. Relist copy, not “Buyers can forward.”

**Philosophy conflict?** Yes with 2026-08-13 no-forward → **Redesign**. No conflict with trust ladder (view still gated).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Forward free; curate locked; view on open |
| Business rules | OK | Three verbs; mixed album line |
| Workflows | OK | Share vs Curate on Explore/album |
| Edge cases | OK | Owner still curates own locked designs |
| Permissions | OK | Ask owner, not last forwarder |
| User states | OK | Pending access unchanged |
| Notifications | N/A | Existing access-request pings |
| Error handling | OK | Relist toast; forward no lock toast |
| Scalability | OK | No extra hop |
| Mobile interactions | OK | Same docks |
| Accessibility | OK | Named Request access |
| Platform consistency | OK | After copy + line |

---

## Gaps

### G-001 — Forward used as the exclusive lock

| Field | Content |
|-------|---------|
| Gap | Chat + Share hide/reject on `allowForward`. |
| Why it matters | Traders cannot pass a card. |
| Impact if ignored | Point 3 unused. |
| Recommendation | Ungate Forward; keep curate ceiling. Closed in this slice. |
| Priority | Required before implementation |

### G-002 — Seller+trader cannot see mixed albums

| Field | Content |
|-------|---------|
| Gap | My designs tiles look the same for own vs from-others. |
| Why it matters | Ravi will edit the wrong pack. |
| Impact if ignored | Confusion. |
| Recommendation | Owner-only quiet line. Closed in this slice. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Forward / chat share / 48h share-link: no `allowForward` gate.
- Curate add + publish: still `allowForward` (product: allowRelist).
- Bookmark stays free.
- Publish / buyer-group copy: buyers can put this in their pack.
- Open pack/design: ask catalog owner.
- My designs + editor: source line (from others / mixed).

## Explicitly deferred / rejected

- Curate free  
- DB rename `allowForward` → `allowRelist`  
- Curated chip / second My designs tab  
- I-handle one-order / TradeLane UI / Agent  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + existing journeys; no new e2e required if Forward-lock e2e does not exist)

---

## Addendum — 2026-09-03 (Share INVALID_REFERENCE)

Under-implementation: chat Share still required sender `canDiscover`, which conflated Forward with View and showed a red pill toast over the open sheet.

**Closed:** `validateReference` allows live published product/collection cards when the sender is not blocked (owner / prior chat / live). No sender audience check. Share sheet failures use kit `InlineNotice`. View-on-open and Curate ceiling unchanged.

## Addendum — 2026-09-03 (Locked pack must not reveal photos)

Chat share unlocked the album shell for Ask, but cover/mosaic/chat thumbs still leaked designs — making the audience lock pointless.

**Closed:** When products are gated, `collectionDetail` clears cover/preview/`imageCount`; CollectionViewer only renders cover when `products` is present.

**Revised (same day):** Chat cards keep small preview thumbs with `imagesLocked` — blur in UI, no PhotoViewer. Full clear gallery stays gated on open.
