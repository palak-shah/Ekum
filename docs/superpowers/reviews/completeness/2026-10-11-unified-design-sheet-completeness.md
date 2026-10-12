# Feature Completeness Review — Unified design sheet

**Date:** 2026-10-11  
**Module / ask:** One DesignSheet for collection / shop Designs / You Designs / Explore / Saved. Footer = Add to cart · Message · Share · Order. Bookmark + owner actions in ⋯. Chat unchanged (PhotoViewer swipe).  
**Anchors:** `docs/features/collections.md`, `docs/features/explore.md`, `docs/features/company.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Design open was split: album sheet (Bookmark · Select) vs Explore page (Bookmark + visitor dock). Traders need one trade surface on open. Multi-pick stays long-press / list Select; sheet is for *this* design. Chat multi-share stays swipe — scan job, not sheet. |
| UX Designer | Screenshot dock language matches SelectionWorkspaceBar. Bookmark quiet in ⋯. Own: Edit · Remove from this collection (album only) · Delete last. Optional From / collection line. Sheet hugs content; footer clears safe area (BM-07). |
| Solution Architect | Extract `ProductPhotosSheet` → shared `DesignSheet`. Stage one shortlist entry for cart/Message/Share/Order helpers. Thin `/explore/products/:id` host. Do not touch chat / design-set-from-chat. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Sheet + MoreActionsSheet; DockIconButton row + Order like SelectionWorkspaceBar; own Message muted via `selectionOwnShopVerbs`.  
2. **Duplicates?** Replaces divergent album sheet + Explore product page chrome — not a second trade path.  
3. **Reuse?** Selection cart/Message/Share/Order helpers; DesignSheetPhotoCarousel; pack detail blocks.  
4. **Naming?** Bookmark this design / Design bookmarked; Remove from this collection; Delete design; Add to cart · Message · Share · Order.

**Philosophy conflict?** No — one job per open (decide on this design); chat swipe left alone.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Single sheet; trade footer; ⋯ menu |
| Business rules | OK | Own Message disabled; Remove only with collection context |
| Workflows | OK | Tap opens sheet; Selecting photo toggles, name opens sheet |
| Edge cases | OK | Solo omits collection line; deep link thin host |
| Permissions | OK | Owner-only Edit/Remove/Delete |
| User states | OK | Visitor vs own |
| Notifications | N/A | |
| Error handling | OK | Toast on cart/share failures via existing helpers |
| Scalability | N/A | |
| Mobile interactions | OK | Footer above safe area; sheet hug (BM-07) |
| First glance (BM-11) | OK | Photos + trade dock loud; Bookmark not a full-width CTA |
| Accessibility | OK | ⋯ aria-label More; menu roles via MoreActionsSheet |
| Platform consistency | OK | |

---

## Gaps

None Required. Deferred below.

---

## Approved scope for this slice

- Shared `DesignSheet` with trade footer + ⋯ (Bookmark · Edit · Remove · Delete).
- Wire: collection album, shop Designs, You Designs, Explore feed + `/explore/products/:id` host, Saved.
- Docs + units + trader-eye.
- Chat / design-set-from-chat: **no change**.

## Explicitly deferred / rejected

- Chat PhotoViewer → DesignSheet (rejected for this slice).
- Removing list Select chrome (long-press remains; list Select stays for bulk).
- Cross-design paging inside the sheet.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
