# Feature Completeness Review — Explore shop header chrome

**Date:** 2026-09-29  
**Module / ask:** CSV sr 8 T4 · sr 9/10 T1 + sr 16 T4 · sr 9/10 T3 — one shop identity on feed, search, pack, shop.  
**Anchors:** `docs/features/explore.md`, `docs/features/company.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Header is who the shop is (name + GST tick + city · what they sell). Not Connected / GST chip / ranking why-line. See new packs stays the ask. Date is on the post, not beside the name. |
| UX Designer | Same identity on CompanyRow, feed posts, pack row, shop hero. Tick is CheckIcon by the name (`aria-label` GST verified). No new chip. Subtitle: `Surat · Fabric, Dress material`. |
| Solution Architect | Ranking still uses API `relevance` (may still say Connected). Display ignores it. Add optional `sellCategories` on `PublicCompanySummary` so feed/pack have cats without a new endpoint. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — See new packs already on feed; human category labels already exist.  
2. **Duplicates another feature?** No — replaces Connected / GST tag.  
3. **Should reuse an existing workflow?** Yes — `ExploreFeedFollowAction`, `categoryDisplayLabel`.  
4. **Naming matches the app?** See new packs; no Follow word on the control.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Display-only + summary field |
| Business rules | OK | Follow hide: own / pending / already seeing / connected (unchanged) |
| Workflows | OK | Same tap targets |
| Edge cases | OK | City only if no cats; no tick if not GST |
| Permissions | N/A | |
| User states | OK | Owner pack/design: city · cats, not “Your collection” |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sticky bar |
| Accessibility | OK | Tick labelled GST verified |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Ranking still uses Connected

| Field | Content |
|-------|---------|
| Gap | Feed sort still reads API relevance strings that include Connected. |
| Why it matters | Display change must not flatten rank. |
| Impact if ignored | Worse discovery. |
| Recommendation | Keep `explorePostTier` / API relevance. Do not show those strings. |
| Priority | Deferred in writing (keep ranking) |

---

## Approved scope for this slice

- Drop **Connected** / GST / Matches from the visible shop subtitle. Show `city · cat, cat`.  
- GST = tick beside the name (search, feed, pack row, shop header). Remove green GST verified chip on those surfaces.  
- Feed: See new packs in the header when not already seeing / pending / connected / own. Date under the post (with pack/design title).  
- `PublicCompanySummary.sellCategories` for feed/pack identity.

## Explicitly deferred / rejected

- You / More GST chip.  
- Rename ranking copy on the API.  
- Instagram shop, six-box grid, Save/Repost row.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
