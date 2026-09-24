# Feature Completeness Review — Explore pack-covered design tiles

**Date:** 2026-09-25  
**Module / ask:** Explore feed shows a design card and its collection after photos are added; multi-photo mosaic is choppy; Selecting blocks flipping photos  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack publish already must not flood solo design tiles. If a design later gets `postedToMarketAt` (e.g. photos on a design that was also published), the buyer still sees **one** job: the live pack. Solo Publish remains when the design is not on a visible live pack. Home and Saved stay untouched. |
| UX Designer | Design card is one photo (scroll stays smooth). Mosaic tap still selects while Selecting; **name** opens the design so extra photos live in PhotoViewer — same as existing open-while-selecting. |
| Solution Architect | After merge, hide product rows whose id is a member of any collection row already in that feed result. Feed already loads the full match set then pages in memory, so omit is not page-local. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — pack is the album on Explore; design card matches collection name-opens / mosaic-toggles.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Selection + PhotoViewer on design detail.  
4. **Naming matches the app?** Design · N photos; no seller/buyer labels.

**Philosophy conflict?** No

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Omit covered designs; first photo; name opens |
| Business rules | OK | Pack-first when both would show |
| Workflows | OK | Selecting unchanged |
| Edge cases | OK | Invisible / expired pack → solo tile can stay |
| Permissions | OK | Uses same feed visibility as collections |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | Later | Member query is one findMany on collection ids in the merged set |
| Mobile interactions | OK | No new sticky chrome (BM-07 N/A) |
| Accessibility | OK | Name link still opens; select on mosaic |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Hide solo Explore design tiles when that product is a member of a live pack already in the same `feed()` result.
- Design feed cards (opportunity + ProductPost): first photo only; subtitle `Design · N photos` when N > 1.
- Mosaic still toggles select; name still opens the design.

## Explicitly deferred / rejected

- Home shelves and Saved card chrome.
- Designs Only chip still lists posted designs even if they sit in a pack (different job).
- Cross-feed hide when the pack is not in this query (e.g. Designs Only).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
