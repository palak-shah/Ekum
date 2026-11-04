# Feature Completeness Review — Explore Buying scroll-load older posts

**Date:** 2026-11-02  
**Module / ask:** Buying opens with 12 posts then stops (More posts / end of home merge). Older live packs (e.g. Ahmedabad Loom Co on the shop) never arrive on scroll. Redesign: first 12, then keep loading via `/explore/feed` cursor until exhausted.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `2026-10-04-explore-feed-virtual-lazy-completeness.md`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Shop = full live shelf. Buying = ranked discovery that **keeps going** as the trader scrolls — not a capped shelf. First 12 keeps Stories/shelves reachable. End footer only when there is no next page. |
| UX Designer | No second path: scroll sentinel loads older posts (not a competing **More posts** button). Quiet end when done. |
| Solution Architect | Home still paints Stories + first 12. Continuation uses `GET /explore/feed` cursor with keyset beyond the soft ranking window. Followed shops keep ≥1 first-window card + Stories ring. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — cursor pages, Opportunity cards, Stories rail, CoverImage easy-load.  
2. **Duplicates another feature?** Replaces capped **More posts** reveal.  
3. **Should reuse an existing workflow?** Reuse `/explore/feed` cursor; do not invent a second home page API.  
4. **Naming matches the app?** **You've reached the end** unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** No — redesign of feed paging only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | First 12 then scroll-load; end when cursor null |
| Business rules | OK | Live window + audience unchanged; soft rank on page 1 |
| Workflows | OK | Stories + mixed Buying |
| Edge cases | OK | Story chip; empty feed; home remainder then feed |
| Permissions | OK | Same visibility |
| User states | OK | Loading sentinel; exhausted end |
| Notifications | N/A | |
| Error handling | OK | Failed page keeps prior cards |
| Scalability | OK | Keyset take+1; no full-market load |
| Mobile interactions | OK | Sentinel above bottom nav (BM-07) |
| First glance (BM-11) | OK | First 12 unchanged |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required after this slice.

---

## Approved scope for this slice

- Docs: first 12 then scroll-load; end only when feed exhausted.  
- API: `/explore/feed` continues older live packs past soft window (keyset).  
- Client: drop dead-end More posts; sentinel fetch; dedupe.  
- First window: ≥1 pack + Stories ring per followed/connected shop with a live post.  
- Units + trader-eye.

## Explicitly deferred / rejected

- Dumping entire shop shelf onto page 1  
- Unfollowed strangers on Stories  
- Changing Publish / live-window / audience  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
