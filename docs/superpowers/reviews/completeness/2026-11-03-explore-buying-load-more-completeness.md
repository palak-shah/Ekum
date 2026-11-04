# Feature Completeness Review — Explore Buying Load more

**Date:** 2026-11-03  
**Module / ask:** Replace Buying auto scroll-load with explicit **Load more** after the first 12 posts. Stories rings stay independent of that window.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Redesign of `2026-11-02-explore-buying-scroll-load` UX only (sentinel → button). API `feedContinue` unchanged.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | First 12 keeps shelves reachable; trader taps **Load more** for older live packs. End only when feed cursor null. Stories ≠ first-12 membership. |
| UX Designer | One path: kit secondary full-width **Load more** (same as Explore directory). No competing auto-sentinel. Quiet **You've reached the end** when done. |
| Solution Architect | Keep `homeTailOpen` + `/explore/feed` cursor. Stories from `storiesForHome` (shelves + followed backfill). Do not gate rings on `visiblePosts`. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit `Button` secondary fullWidth Load more (directory), end footer, Stories rail.  
2. **Duplicates another feature?** Replaces scroll sentinel only.  
3. **Should reuse an existing workflow?** Reuse feed cursor continuation.  
4. **Naming matches the app?** **Load more** (not More posts).  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | First 12 → Load more → end when exhausted |
| Business rules | OK | Stories independent of first 12 |
| Workflows | OK | Buying All; story filter hides Load more, shows end |
| Edge cases | OK | Empty older page / no cursor → end |
| Permissions | N/A | |
| User states | OK | Loading… on button while fetching |
| Notifications | N/A | |
| Error handling | OK | Existing query errors / toast patterns |
| Scalability | OK | Page-sized fetch on tap |
| Mobile interactions | OK | Button above bottom nav; list padding clears (BM-07) |
| First glance (BM-11) | OK | One job: posts; Load more quiet secondary |
| Units | N/A | |
| Accessibility | OK | Disabled while loading; testid on button |
| Platform consistency | OK | Match directory Load more |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Client: remove scroll sentinel; kit **Load more**; keep end footer; Stories from `data.stories` only.  
- Docs: explore.md Ranking + Stories; gap matrix.  
- Helper + unit: `exploreFeedLoadMoreVisible`.  
- Trader-eye: 12 + button; taps grow; AL ring without requiring AL in first 12.

## Explicitly deferred / rejected

- Auto infinite scroll on Buying.  
- Gating Stories rings on first-12 card membership.  
- New Stories API.
