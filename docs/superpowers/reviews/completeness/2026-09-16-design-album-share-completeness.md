# Feature Completeness Review — grouped designs share (chat + 48h)

**Date:** 2026-09-16  
**Module / ask:** Multi-select designs → one WhatsApp-style collage in chat and one 48h link; labeled designs, not a Collection  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/explore.md`, design `2026-09-16-design-album-share-design.md`, prior deferral multi-item 48h (`2026-08-22-share-link-48h-completeness.md`)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Conflicts with product philosophy → **Reject** or **Redesign**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need one calm share for several designs on- and off-app; must not invent a fake pack in My Catalog. |
| UX Designer | Photo-message collage + “{N} designs”; tap → PhotoViewer. Looking like `collection_card` is a Reject. |
| Solution Architect | New message type + share-link kind sharing `productIds[]`; reuse PhotoAlbum/OG collage; no Collection write. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — photo message collage, CatalogShareSheet, 48h share-link + OG.  
2. **Duplicates another feature?** No — does not replace Curate pack; presentation-only.  
3. **Should reuse an existing workflow?** Reuse PhotoAlbum / PhotoViewer / share sheet / share-link TTL; **do not** reuse Curate → Collection.  
4. **Naming matches the app?** Always **designs** — never pack/album/collection for this path.

**Philosophy conflict?** No — Forward/Share stays free presentation; Curate remains the path to a real pack.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Chat `design_album` + link kind `designs`; parity |
| Business rules | OK | Per-design shareability same as `product_card` / single product link |
| Workflows | OK | Selection → Share sheet → chat and/or 48h |
| Edge cases | OK | Mixed albums+designs; 1 design unchanged; locked/unshareable designs |
| Permissions | OK | Same gates as existing catalog share |
| User states | OK | Guest landing + logged-in open set |
| Notifications | Later | Preview text “N designs” enough for v1 |
| Error handling | OK | Partial fail / invalid ids |
| Scalability | OK | Reasonable cap on productIds (e.g. shortlist size) |
| Mobile interactions | OK | Collage + viewer; BM-07 N/A for bubble |
| Accessibility | OK | Caption “{N} designs”; alt via viewer |
| Platform consistency | OK | Must not look like collection |

---

## Gaps

### G-001 — Cap on productIds

| Field | Content |
|-------|---------|
| Gap | Unbounded ids could stress resolver/OG |
| Recommendation | Cap at traveling shortlist / practical max (e.g. 50); reject over |
| Priority | Recommended enhancement — use existing selection limits if any; else 50 |

### G-002 — Open-on-Ekum deep link for the set

| Field | Content |
|-------|---------|
| Gap | No first-class “design set” route today |
| Recommendation | Landing keeps collage; after join stay on `/s/:token` while open or navigate to a thin multi-design surface — not a Collection viewer |
| Priority | Required before calling done — must not dump to first design only as the sole story |

---

## Approved scope for this slice

- Message type `design_album` + CatalogShareSheet one-message send for ≥2 designs  
- Share-link kind `designs` + landing/OG parity  
- Photo-message visual + “{N} designs” copy; no My Catalog write  
- Docs + unit/API + `@functional` parity tests  

## Explicitly deferred / rejected

- Auto-creating Collections for multi-share (**Reject**)  
- Reusing collection trade-card UI (**Reject**)  
- Changing multi-album → still N `collection_card`s  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
