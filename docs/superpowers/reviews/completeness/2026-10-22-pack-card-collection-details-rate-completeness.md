# Feature Completeness Review — Pack card shows collection details rate

**Date:** 2026-10-22  
**Module / ask:** Explore / album pack ₹ must show **collection details** rate when one is set, even if member designs kept a different rupee.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/explore.md`, `.cursor/rules/sell-as-units.mdc`  
**Disposition:** Proceed (Redesign vs 2026-10-22 honest-rates “pack ₹ only when members follow”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Collection details is the pack’s asking price. Designs may keep their own rupee (Apply to all still does not overwrite). The pack card is the pack — not a min–max of leftover design prices. |
| UX Designer | No new chrome. Explore teal rate and album facts use collection ₹ / Rate per when filled. Design tiles and How many stay that design’s rate. |
| Solution Architect | `collectionCardRateFields`: if collection `rate` is set, return it + `catalogRateUnit`. Else keep member min–max; mixed member units omit only when there is no pack rate. |

---

## Platform consistency (required)

1. **Existing patterns?** Explore pack caption + album facts band.  
2. **Duplicates another feature?** No — undoes the honest-rates pack-band exception.  
3. **Should reuse an existing workflow?** Same `collectionCardRateFields` used by Explore, shop, album.  
4. **Naming matches the app?** Collection details Rate / Rate per.  
5. **Units?** Pack card whose = **collection**. Which = Rate per (`catalogRateUnit`). Surface = Explore pack / album facts. How many / design tile = **design**.

**Philosophy conflict?** Yes vs 2026-10-22 “hide pack ₹ when members disagree.” **Redesign** that band: pack card = collection details. Does **not** fight sell-as-units (pack on Explore = collection). Does **not** overwrite design rates on Apply to all.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Collection rate set → show it |
| Business rules | OK | Empty collection rate still falls back to members |
| Workflows | OK | Edit collection details → Update → Explore/album |
| Edge cases | OK | Mixed member units still show pack ₹ when pack rate exists |
| Permissions | N/A | |
| User states | OK | On request still hides from non-owners |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new chrome |
| First glance (BM-11) | OK | Pack card ₹ matches collection details |
| Units (order / dispatch / Rate per) | OK | Named above |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Pack card hid collection details rate

| Field | Content |
|-------|---------|
| Gap | Explore/album used member min–max when designs kept their own rupee |
| Why it matters | Traders set the pack price on collection details; leftover design ₹1680 hid ₹91/mtr |
| Impact if ignored | Pack card lies about what they typed on the pack |
| Recommendation | Prefer collection `rate` + Rate per whenever set |
| Priority | Required before implementation |

---

## Approved scope for this slice

- `collectionCardRateFields`: collection rate wins when set (Rate per from `catalogRateUnit`).  
- No pack rate → member min–max; mixed member units omit.  
- How many / design tiles unchanged (design Rate per).  
- Apply to all still does not overwrite a filled design rate.  
- Docs + `collection-card-rate.spec.ts`.

## Explicitly deferred / rejected

- Overwriting every member rate when Apply is on (already rejected).  
- Inventing ticket ₹ from pack card without pack size.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
