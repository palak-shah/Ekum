# Feature Completeness Review — Order line thumb → photo viewer

**Date:** 2026-09-20  
**Module / ask:** Tap a design thumb on an order (and quote/dispatch/settle sheets) stays on the order and opens the shared photo viewer with snapshot design info — not Explore.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Job on the order is quote / ship / settle. Enlarge the snapshot photo; do not start a second Place from Explore. Live catalog remains a different job (Explore / Saved / feed). |
| UX Designer | Same gesture as photo-only lines: tap thumb → PhotoViewer. Caption = design name; second line = qty × rate and SKU when present. Close returns to the same order/sheet. No new chrome. |
| Solution Architect | Reuse kit `PhotoViewer` + existing `orderItemGalleryUrls`. Captions aligned per URL. Drop `/explore/products/:id` from `OrderLinePhoto`. Snapshot images still work if the live design is archived. |

---

## Platform consistency (required)

1. **Existing patterns?** Shared PhotoViewer (chat, Explore design, Saved). Order already used it for photo-only lines.  
2. **Duplicates another feature?** No — Explore design page stays for browse/order.  
3. **Should reuse an existing workflow?** Yes — PhotoViewer, not a new sheet.  
4. **Naming matches the app?** Design name, pieces × rate, SKU — no Seller/Buyer.

**Philosophy conflict?** No. Leaving the order on thumb tap *did* conflict with one-job-per-screen; this slice fixes it.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tap thumb with photos → viewer at that line; swipe across order photos |
| Business rules | OK | Snapshot name/qty/rate/SKU — not live Explore rates |
| Workflows | OK | Sheets keep using the same viewer on the order page |
| Edge cases | OK | No photo → letter initial, not tappable; photo-only same as catalog lines |
| Permissions | N/A | Viewer uses order payload already loaded |
| User states | OK | Close stays on `/orders/:id` |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Caption per URL; 100+ lines still one gallery |
| Mobile interactions | OK | Existing pinch/swipe/close; caption above safe-area (BM-07 N/A — overlay) |
| Accessibility | OK | Aria “View photo for {name}”; Escape closes |
| Platform consistency | OK | Kit PhotoViewer; optional Explore link deferred |

---

## Gaps

### G-001 — Quiet “Open design” from viewer

| Field | Content |
|-------|---------|
| Gap | No path from viewer to live Explore listing |
| Why it matters | Rare: more current photos / shop |
| Impact if ignored | Trader uses Explore search if they need the live card |
| Recommendation | Do not add on this slice — tap must not dump into Place |
| Priority | Future improvement |

---

## Approved scope for this slice

- Catalog-linked and photo-only thumbs: same tap → PhotoViewer on the order.
- Caption: design name; detail: `{qty} × {rate}` and SKU when set.
- Docs + unit tests; functional: tap thumb does not navigate to `/explore/products`.

## Explicitly deferred / rejected

- Header “Open design” / Place from the viewer (G-001).
- Per-line gallery instead of whole-order swipe set (keep current swipe).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
Reviewers (roles): Product + UX + Architecture (agent)  
Date: 2026-09-20  
