# Feature Completeness Review — Collection on-demand find

**Date:** 2026-09-24  
**Module / ask:** Collection should search tags, design name, and other pack info; search must not sit on the page all the time  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/company.md`  
**Disposition:** Redesign → Proceed

> A permanent Find field on You / shop fights “one tight chrome row.” Chat already reveals find from a header icon. Collection lists and the album must match more than the pack title.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Sellers hunt a design inside a pack (name, tag, note, SKU). Same words should surface the pack on You. Buyers on a shop/album need the same job without a second Explore search. |
| UX Designer | No always-visible search bar. **Search** icon (chat thread). Field appears only while finding; close clears. Album: icon on `PageHeader`. You: icon on the chip row (shell ⋯ stays Network/Settings). Shop: icon in the shop header. |
| Solution Architect | Client filter. Album uses `ProductView`. You list already loads members → `memberFind` on `CollectionView`. Shop cards get pack tags + `memberFind` from the existing 12-member preview include. |

---

## Platform consistency (required)

1. **Existing patterns?** Thread search toggle + kit `SearchInput`. Keep the list until they type.  
2. **Duplicates another feature?** No — not Explore `/search`.  
3. **Should reuse an existing workflow?** Yes — chat on-demand find.  
4. **Naming matches the app?** **Find designs** / **Find collections** / **Find in this pack**.

**Philosophy conflict?** Yes vs 2026-09-24 always-visible You/shop `SearchInput` → this review **Redesigns** that chrome.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Name, tags, notes, SKU, member shops; pack name/description |
| Business rules | OK | Same visibility as the list already shown |
| Workflows | OK | Icon → type → list shrinks; close restores |
| Edge cases | OK | No match: **No designs match** / **No collections match** |
| Permissions | OK | Gated album: no member list → no find |
| User states | OK | Album / You / shop |
| Notifications | N/A | |
| Error handling | N/A | Client filter |
| Scalability | OK | You members already loaded; shop first 12 members (existing cap) |
| Mobile interactions | OK | Field only when open; no extra stacked chrome when idle |
| Accessibility | OK | Icon labelled; field `aria-label` |
| Platform consistency | OK | After Redesign |

---

## Gaps

### G-001 — Shop find only sees first-page cards + 12 member names

| Field | Content |
|-------|---------|
| Gap | Shop pagination and members past the collage include are not searched. |
| Why it matters | Large shops. |
| Impact if ignored | Same as 2026-09-24 shop G-001. |
| Recommendation | Later. |
| Priority | Future improvement |

---

## Approved scope for this slice

- **Album (`/collections/:id`):** header Search icon; field **Find in this pack**; match design name, SKU, notes, tags, shop, unit, rate/MOQ.  
- **You / shop:** remove permanent Find field; same icon reveal. Collections match pack name, description, tags, member shops, and member find (name / SKU / notes / tags). Designs keep name, SKU, tags, pack names, notes.  
- Close search clears the query. Docs + journeys click the icon first.

## Explicitly deferred / rejected

- Server-side catalog search.  
- Shop pages beyond the first (G-001).  
- Find on New collection create (add-and-go stays photos-first).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
