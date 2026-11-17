# Feature Completeness Review — Business Profile visual alignment (3B.3)

**Date:** 2026-11-15  
**Module / ask:** Align Home Business Profile layout to the Ethonique prototype (centered overlapping avatar, outlined four actions, Catalogue heading) without changing Ekum tokens, Showcase/API, or other-shop action chrome.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/home.md`  
**Disposition:** Proceed

> Visual/composition only. No new capabilities, APIs, or trust-ladder changes.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One job remains: show own shop face. Prototype layout (cover → centred avatar → identity → actions → Showcase → Catalogue) matches locked Home flows. Deviations (shell header, no pack overlays, no yellow nudge, no Edit collections) stay intentional. |
| UX Designer | Centred overlap + outlined equal actions + Catalogue heading close the left-aligned gap vs docs. Reuse `shopActionClass` density (not kit 48px). Shop Follow/Message unchanged. Empty catalogue still omitted. |
| Solution Architect | Touch `BusinessProfileHeroMedia` + Home identity/actions/catalogue chrome only. Media PATCH, Showcase, Public/Private, share payload untouched. Shared hero keeps shop visually compatible. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — cover shell, Avatar, Tag chips, compact pills, Collections/Designs tabs, ShopPhotoGrid.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same Edit/Share/Network/Saved destinations; My Collections via `/more`.  
4. **Naming matches the app?** Catalogue heading + existing Collections/Designs tabs; no Seller/Buyer.  
5. **Units?** N/A — no rate/qty strings.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Layout only |
| Business rules | OK | Unchanged |
| Workflows | OK | Destinations preserved |
| Edge cases | OK | Quiet Add cover; private stub centred; omit empty catalogue |
| Permissions | N/A | |
| User states | OK | Home vs shop actions stay distinct |
| Notifications | N/A | |
| Error handling | OK | Existing upload toasts |
| Scalability | N/A | |
| Mobile interactions | OK | `pb-24` clearance (BM-07); check 360/390 |
| First glance (BM-11) | OK | Trader-eye screenshots required |
| Units | N/A | |
| Accessibility | OK | Camera vs gallery; aria on actions |
| Platform consistency | OK | |

---

## Gaps

None Required for this slice.

---

## Approved scope for this slice

- Centred avatar overlapping cover; centred identity under avatar (Home + full shop hero).
- Quiet empty Add cover; private stub centred.
- Home Edit · Share · Network · Saved as equal outlined icon-above-label pills.
- Catalogue heading above existing tabs; omit when empty.
- Unit + visual evidence; update `company.md`.

## Explicitly deferred / rejected

- Prototype in-page Edit/⋯ header; pack “OPEN TO ALL” cover overlay; yellow nudge; “Edit collections >”.
- Redesigning shop Follow/Message row.
- Showcase API/limits, Public/Private UI, `company_card`, 3C iterations.

## Disposition rationale

Docs already require centred avatar; code was still left-aligned. Aligning composition to the prototype without inventing chrome or a new design system is coherent and Proceed.
