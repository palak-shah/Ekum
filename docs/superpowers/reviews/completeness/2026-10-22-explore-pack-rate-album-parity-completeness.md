# Feature Completeness Review — Explore pack rate matches album

**Date:** 2026-10-22  
**Module / ask:** When collection details has no rupee, collection detail already shows a min–max from priced designs. Explore must show that same band (and collection details ₹ when set).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/collections.md`, `docs/superpowers/reviews/completeness/2026-10-10-album-rate-pack-then-designs-completeness.md`, `docs/superpowers/reviews/completeness/2026-10-22-pack-card-collection-details-rate-completeness.md`  
**Disposition:** Proceed (closes implementation gap vs album owner band)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Own Explore post is the same pack as the album. If they see ₹200–₹700 on collection detail, Explore must not look unpriced. On request still hides from other shops. |
| UX Designer | No new chrome. Same teal caption as today. Quiet when there is no honest band (mixed units, no priced designs, buyers + On request). |
| Solution Architect | Reuse `collectionCardRateFields`. Pass viewer so owner treats Show rates as visible (same as `collectionDetail`). Load **all** live members with Rate per (`catalogRateUnit` / `dispatchUnit`) — a preview `take` hid priced designs later in the album. |

---

## Platform consistency (required)

1. **Existing patterns?** Album facts + Explore teal rate.  
2. **Duplicates another feature?** No — same helper, same band.  
3. **Should reuse an existing workflow?** `collectionCardRateFields` + owner-visible gate already on album.  
4. **Naming matches the app?** Collection / designs / Show rates.  
5. **Units?** Pack Explore card = collection details when set, else priced **designs** min–max (Rate per). How many / design tiles stay design. Mixed member units omit only when there is no pack rate.

**Philosophy conflict?** No. Matches album 2026-10-10 (“owner always sees; buyers respect Show rates”).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Explore = album band |
| Business rules | OK | Owner Visible; others `rateVisibility` |
| Workflows | OK | No new screens |
| Edge cases | OK | Mixed units / no priced members still omit |
| Permissions | OK | On request still hides from non-owners |
| User states | OK | Own post vs buyer |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Same include + Rate per columns |
| Mobile interactions | OK | Caption only |
| First glance (BM-11) | OK | Own post must not look unpriced when album has a band |
| Units (order / dispatch / Rate per) | OK | Named above |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Explore hid the album design range

| Field | Content |
|-------|---------|
| Gap | Album forces owner Visible and loads every member. Explore used raw `on_request`, omitted Rate per columns, and `take: 12` so later priced designs never entered the min–max. |
| Why it matters | Own post looks unpriced; buyer Visible packs can omit a real min–max. |
| Impact if ignored | Traders think Explore lost the rate they already see on collection detail. |
| Recommendation | Same visibility helper as album; include Rate per on collection cards. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Explore / shop / search collection cards: owner sees the album band; others follow Show rates.  
- Collection card include loads `unit` + `dispatchUnit` + `catalogRateUnit`.  
- How many / design tiles unchanged.  
- Docs + serializer / rate-helper specs.

## Explicitly deferred / rejected

- Showing On request rates to other shops.  
- Inventing a pack ₹ when no collection rate and no priced designs.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
