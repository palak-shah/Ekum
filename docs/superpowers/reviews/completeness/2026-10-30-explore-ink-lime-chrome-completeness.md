# Feature Completeness Review — Explore Ink & Lime chrome

**Date:** 2026-10-30  
**Module / ask:** Align Explore Stories rings, feed rate weight, and post gap with the look-and-feel prototype (Theme C). Do not copy prototype search, 40px squares, or 30px shop avatars.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`  
**Disposition:** Redesign, then Proceed on the mapping below

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior locks this slice **does not change:** kit `SearchInput` / 48px filter·cart squares / `SelectModeControls`; 36px shop avatar; photo inset `px-4`; Instagram action row; honest Rate per omit; collection note off the feed.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders open Explore and see orange story rings. That is leftover Instagram, not Ink & Lime. Same jobs: Stories, photo, name · ₹. |
| UX Designer | Rings = lime + charcoal conic (prototype `conic-gradient(lime, teal, lime)`; C teal = accent). Rate stays on the name row, emphasis ink. Posts need more air (`pb-5`), no divider. |
| Solution Architect | Extract story-ring class (tokens, not tangerine). Caption class only. No page-local search. Units: Rate per, pack vs design unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit search / squares / Select; Explore caption; Stories rail.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same taps.  
4. **Naming matches the app?** You / shop names. No Seller/Buyer.  
5. **Units?** Whose: pack card = collection, solo design = that design. Which: **Rate per**. Surface: Explore feed caption. No invented ₹.

**Philosophy conflict?** Yes — tangerine story rings fight Ink & Lime (lime = needs-you counts; charcoal = go). Disposition is **Redesign**: lock explore.md, then restyle rings + rate weight + gap.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same Stories / caption / open |
| Business rules | OK | Honest rate omit unchanged |
| Workflows | OK | Tap story still `?story=` |
| Edge cases | OK | Empty Stories rail still hides |
| Permissions | N/A | |
| User states | OK | Active story = solid accent ring |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Class constants |
| Mobile interactions | OK | No new sticky bar (BM-07 N/A) |
| First glance (BM-11) | OK | Rings read lime+charcoal, not orange; ₹ loud on the name row when honest |
| Units (order / dispatch / Rate per) | OK | Rate per only; pack vs design unchanged |
| Accessibility | OK | 56px story avatar kept |
| Platform consistency | OK | After explore.md lock |

---

## Gaps

### G-001 — Tangerine story rings

| Field | Content |
|-------|---------|
| Gap | `from-accent to-tangerine` on Stories |
| Why it matters | First-glance Explore looks like Instagram orange, not Ink & Lime |
| Impact if ignored | Clients screenshot the rings |
| Recommendation | Conic lime (`--ekum-badge`) + charcoal (`--ekum-accent`); no tangerine |
| Priority | Required before implementation |

### G-002 — Quiet rate

| Field | Content |
|-------|---------|
| Gap | Feed ₹ is `font-body`; prototype `.pr` is semibold link colour |
| Why it matters | Name shouts, money whispers |
| Impact if ignored | Rate per does not read as the rupee job |
| Recommendation | `font-emphasis text-accent` on the name row; omit when dishonest |
| Priority | Required before implementation |

### G-003 — Tight post stack

| Field | Content |
|-------|---------|
| Gap | `pb-2.5` vs prototype `gap: 22px` |
| Why it matters | Cards feel glued |
| Impact if ignored | Feed looks cramped vs the mock |
| Recommendation | `pb-5`; still no `border-b` |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Lock explore.md feed chrome (rings, rate emphasis, post gap; kit search stays).
- Restyle Stories rings + caption rate + article padding.
- Units + trader-eye on phone-width Explore.

## Explicitly deferred / rejected

- Prototype 40px foam search — **rejected** (kit `SearchInput`).
- 40px filter/cart squares — **rejected** (kit 48).
- 30px shop avatars — **rejected** (locked 36).
- One-off teal **Select** text — **rejected** (`SelectModeControls`).
- Full-bleed photo — **rejected** (inset `px-4`).
- Lime ₹ — **rejected** (lime is needs-you counts).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (existing `@explore`; chrome units this slice)
