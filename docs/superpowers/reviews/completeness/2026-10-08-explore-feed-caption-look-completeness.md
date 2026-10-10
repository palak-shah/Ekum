# Feature Completeness Review — Explore feed caption look

**Date:** 2026-10-08  
**Module / ask:** Visual-first Explore card caption densification (Claude prototype look). Selection dock / per-post Bookmark·Share·Repost / Repost Publish sheet deferred.  
**Anchors:** `docs/features/explore.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed (visual caption slice only)

> Broader Explore redesign (floater → dock, Repost, Instagram action row) stays **Later** — separate Completeness before build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Prototype look without open-social CTAs. Rate only when pack/design rates are honestly public. B2B: no Everyone, no View+Share under every card. |
| UX Designer | Title → meta → teal rate → tags → optional About. One composition under mosaic. About is quiet expand, not a second job. |
| Solution Architect | Extend `CollectionCard` / `ExploreProductCard`; compute pack band only when `rateVisibility=visible`. Omit empty lines. |

---

## Platform consistency (required)

1. **Existing patterns?** Reuses `AlbumGrid`, `ShopPostHeader`, kit accent/muted; no new CTA language.  
2. **Duplicates another feature?** No — densifies caption already partly on feed (tags).  
3. **Should reuse an existing workflow?** Rate formatting matches pack header band (`₹ · / unit`).  
4. **Naming matches the app?** “About this collection”; no cart/repost in this slice.

**Philosophy conflict?** No for this slice (look only; trust rules for rates preserved).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Caption densification |
| Business rules | OK | Rate omit on request / mixed / empty |
| Workflows | N/A | Open path unchanged |
| Edge cases | OK | Omit empty About / rate / tags |
| Permissions | OK | Pack band gated by pack rateVisibility |
| User states | OK | Own and visitor same caption shape |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Band from preview members (12) |
| Mobile interactions | OK | About stopPropagation |
| Accessibility | OK | aria-expanded on About |
| Fixed chrome / BM-07 | N/A | No new sticky bar |

---

## Required gaps

None for visual slice. **Later:** selection dock, per-post actions, Repost = Publish Who + show supplier.

---

## Disposition rationale

Proceed to ship caption look so traders can review Explore density before product chrome changes.
