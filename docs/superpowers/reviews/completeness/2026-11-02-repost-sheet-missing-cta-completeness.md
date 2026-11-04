# Feature Completeness Review — Repost sheet missing CTA

**Date:** 2026-11-02  
**Module / ask:** Explore per-post Repost: Auto B1-style packs open Who / Name with no **Repost** button. Hole in already-approved eligibility chrome.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/saved.md`, `docs/features/explore.md`, `2026-11-02-repost-eligibility-chrome-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same Curate ceiling. Zero eligible already hides Repost and shows why. Empty / failed pack preview never reached that chrome — traders saw a publish form they cannot submit. Close the hole; do not add Ask or a second path. |
| UX Designer | One job: publish under my name. Loading, locked, unavailable, or load error are terminal — no Who / Name without a footer. Kit Sheet still pins Repost when the form is shown (BM-07). |
| Solution Architect | Reuse `GET /explore/collections/:id` + `POST /collections/curate-check`. Skip dangling `collectionProduct` joins so hops cannot 500. Count only Published members for feed `repostEligibleCount`. No new endpoint. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit Sheet footer, `InlineNotice`, skip unavailable copy, `unavailableDesignsSummary` / `curateSkipSummary`.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same preview + curate-check.  
4. **Naming matches the app?** **Repost** / **Add to it**; “These designs can’t go in a collection yet.” No Seller/Buyer jargon.  
5. **Units?** N/A — no ₹ or qty string change.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Preview empty/error → terminal; members + allowed → Repost |
| Business rules | OK | Same ceiling; no Ask on Explore |
| Workflows | OK | Per-post sheet only |
| Edge cases | OK | Dangling hop member; `products: []`; GET fail; locked `products: null` |
| Permissions | OK | No Share / relist change |
| User states | OK | Loading / locked / unavailable / error / happy |
| Notifications | N/A | |
| Error handling | OK | In-sheet `InlineNotice` |
| Scalability | OK | Same two calls |
| Mobile interactions | OK | Footer present whenever Who is shown (BM-07) |
| First glance (BM-11) | OK | Dead form was the miss; one job or a quiet why |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Alert on error / unavailable |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- `collectionDetail` skips join rows with a missing product; visitor list stays Published-only.  
- Feed eligibility counts Published members only.  
- Per-post Repost: hide Who / Name until pack preview settles; empty, locked, or error → existing unavailable / locked / notice copy; no Repost footer. Members + ≥1 allowed unchanged.  
- Units + trader-eye on Auto B1 and a pack that already had Repost.

## Explicitly deferred / rejected

- `POST /collections/curate-check` by collectionId  
- Cart Repost chrome  
- Ask on Explore Repost  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (web + API units; no new e2e permission rewrite)  
