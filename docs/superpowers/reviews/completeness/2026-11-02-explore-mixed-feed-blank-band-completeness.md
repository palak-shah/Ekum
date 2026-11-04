# Feature Completeness Review — Mixed feed blank band after More posts

**Date:** 2026-11-02  
**Module / ask:** After **More posts**, Explore Buying shows a last visible card (e.g. Pick catalog), then a tall white gap, then **You've reached the end** — later cards (Bill catalog and mill posts) never paint. Hole in already-approved virtual-scroll.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `2026-10-04-explore-feed-virtual-lazy-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Buying is one home payload: 12 then **More posts**, then a quiet end. End footer means that payload is shown — not “the market is empty.” Traders must still see every card already in memory. |
| UX Designer | One job: browse posts. A blank band between cards and **You've reached the end** looks like a broken feed (BM-11). End footer sits under the last card. |
| Solution Architect | **More posts** is one tap that reveals the rest (`showAllPosts`). Count jumps past 24 and `VirtualFeedList` virtualizes with unmeasured 640px estimates → phantom spacer. Mixed feed stays real layout (home merge is capped; CoverImage easy-load still defers src). Collections / Designs Only still virtualize after 24. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — same Opportunity cards, **More posts**, **You've reached the end**.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same home merge; no new feed API.  
4. **Naming matches the app?** Unchanged.  
5. **Units?** N/A — no ₹ or qty string change.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Mixed remainder in document flow; later cards paint |
| Business rules | OK | Ranking / own-pin unchanged |
| Workflows | OK | 12 → More posts → end |
| Edge cases | OK | ~25–40 mixed rows after More posts; Collections/Designs still virtual |
| Permissions | N/A | |
| User states | OK | End footer only when `morePostsCount === 0` |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Home payload already capped; easy-load unchanged |
| Mobile interactions | OK | No phantom list height (BM-07: last card fully above chrome + end footer) |
| First glance (BM-11) | OK | White void after Pick catalog was the miss |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | All mixed rows stay in the document |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Mixed Buying list never virtualizes (`virtualizeAfter` Infinity).  
- Collections / Designs Only keep `EXPLORE_FEED_VIRTUALIZE_AFTER` (24).  
- Units + trader-eye: Pick catalog → Bill catalog with no white void; end footer under the last card.

## Explicitly deferred / rejected

- Infinite `/explore/home` cursor paging  
- Own-pin reorder  
- Collections / Designs virtualizer rewrite  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (web units; trader-eye)  
