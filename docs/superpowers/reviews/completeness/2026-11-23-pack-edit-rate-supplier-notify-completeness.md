# Feature Completeness Review — Pack Edit rate + supplier rate-change notify

**Date:** 2026-11-23  
**Module / ask:** Explore Repost Edit = collection/catalog only (one pack ₹). Margin stays pack + designs. Dependent Edit clears on supplier rate change; notify via bell + chat system line with that supplier (link to repost pack). Margin never blanks.  
**Anchors:** `docs/features/explore.md`, `docs/features/collections.md`, `sell-as-units`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders set one selling quote on the pack at Repost; per-design Edit list fights “one job.” When mill changes the disclosed basis behind a dependent Edit, the old quote must empty and the trader must be told where to fix it — in the supplier thread and the bell. Margin ± must keep following live source without wipe or spam. |
| UX Designer | Edit on RepostSheet = one “Your rate ₹” + supplier cue. Margin block + album design override sheet stay. Quiet in-sheet banner when Edit already invalidated. Chat line + Collection bell deep-link the pack. |
| Solution Architect | Hard-clear pack `repostEditedRate`/`repostEditOwnBase` (+ leftover member Edit overrides) when Product.rate (or source pack rate) moves off stamped `editOwnBase`. Emit `repost.edit_rate_invalidated`; Notifications projects bell; ensure 1:1 + system message. Independent Edit (`editOwnBase` null) untouched. OrderItems never rewritten. |

---

## Platform consistency (required)

1. **Existing patterns?** Shared `RepostPricingFields` prototype; Collection notify + system MessageType like Pack→Look; `ensureTradeThread` for 1:1.
2. **Duplicates another feature?** No — hardens soft-invalidate into clear + notify; does not add a second rate UI.
3. **Should reuse an existing workflow?** Yes — publish pack Edit fields; member Margin via existing `RepostMemberPricingSheet`.
4. **Naming matches the app?** “Your rate”, supplier chat, Collection bell — plain trader language.
5. **Units?** Whose = pack (collection Rate per) for Explore Edit; Margin design override = that design. Which = Rate per. Surface = RepostSheet / album member sheet / buyer-facing resolve. Pack Explore = collection.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pack Edit; Margin both levels; clear+notify |
| Business rules | OK | Dependent Edit only; Margin never blank |
| Workflows | OK | Repost Save → Product.rate change → clear → bell+chat → open pack |
| Edge cases | OK | Independent Edit; no thread ensure; multi-pack same product |
| Permissions | OK | Unchanged Pack/ceiling |
| User states | OK | |
| Notifications | OK | Bell + chat with supplier |
| Error handling | OK | Best-effort notify after clear commits |
| Scalability | OK | Find by product membership + editOwnBase |
| Mobile interactions | OK | No new sticky chrome |
| First glance (BM-11) | OK | One Edit ₹; supplier cue quiet |
| Units (order / dispatch / Rate per) | OK | Pack Edit Rate per; no invented qty |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Album “Your rate for this design” Edit override

| Field | Content |
|-------|---------|
| Gap | Album `RepostMemberPricingSheet` can still set per-design Edit |
| Why it matters | Conflicts with “Edit at Repost = pack only” if left as a second path |
| Impact if ignored | Trader can still stamp design Edit from album |
| Recommendation | Defer this slice — Margin design-level stays; album Edit override Later |
| Priority | Future improvement |

### G-002 — Source pack rate vs Product.rate

| Field | Content |
|-------|---------|
| Gap | Some packs stamp `editOwnBase` from uniform Product rates; others from upstream collection disclosed band |
| Why it matters | Only Product.rate path would miss collection-rate-only basis |
| Impact if ignored | Rare miss until mill edits designs |
| Recommendation | Clear on Product.rate **and** when source Collection.rate changes for children keyed by that source |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness + docs lock (explore / collections).
- RepostSheet / `RepostPricingFields` prototype: Edit = single pack ₹; stop Edit member-pricing Save; Margin pack + design override unchanged.
- API: on supplier Product.rate / source Collection.rate change → clear dependent Edit packs/members; emit event → Collection bell + system line in curator↔supplier Direct (ensure thread); deep link collection.
- Quiet Edit-invalidated banner (existing copy).
- Units + trader-eye note.

## Explicitly deferred / rejected

- Album per-design Edit override removal (G-001)
- Catalog kind inherit / margin placeholder polish (other audit rows)
- Notify or clear on Margin/Same
- Rewriting historical OrderItems

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
