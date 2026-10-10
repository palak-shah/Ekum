# Feature Completeness Review — selection Message attach

**Date:** 2026-10-09  
**Module / ask:** Selection dock **Message** posts selected designs/albums as chat cards to the owning shop’s 1:1, then opens that thread (ask / query about the pile)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/chat.md`, `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Message after select is “ask this shop about these designs,” not cold open chat. Share stays forward-to-recipients. Order stays buy-for-me. Keep pile after Message so Order can follow. |
| UX Designer | Same dock label **Message**. Auto-send cards (Share language) — no composer draft. Multi-shop keeps Message disabled mid-slot so icons do not jump. |
| Solution Architect | Extract Share’s `postCardsToThread` helper; reuse from CatalogShareSheet + SelectionWorkspaceBar. Card rules unchanged: 1 → product_card; 2+ → design_album; albums → collection_card. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — catalog share card posting, `POST /threads/direct`, design_album collage.  
2. **Duplicates another feature?** No — Share picks recipients; Message always targets the owning shop.  
3. **Should reuse an existing workflow?** Yes — Share’s post payloads, not ThreadPage attach loop (that never builds design_album).  
4. **Naming matches the app?** Message (shop language); Designs album card unchanged.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Post cards → open chat |
| Business rules | OK | Single-shop only; same card rules as Share |
| Workflows | OK | Keep pile; Share still clears |
| Edge cases | OK | Empty pile N/A (dock hidden); post failure toast |
| Permissions | OK | Same as Share / thread send validation |
| User states | OK | Multi-shop disabled |
| Notifications | OK | Recipient sees cards like Share |
| Error handling | OK | Toast; stay on page |
| Scalability | OK | Cap already on design_album (≤50) |
| Mobile interactions | OK | Dock unchanged; BM-07 N/A for new chrome |
| First glance (BM-11) | OK | Thread lands with cards as the ask context |
| Accessibility | OK | Existing button disable while posting |
| Platform consistency | OK | |

---

## Gaps

None Required.

### G-001 — Album/shop header Message

| Field | Content |
|-------|---------|
| Gap | Header **Message {shop}** still opens empty thread (no selection context) |
| Why it matters | Different job from selection Message |
| Impact if ignored | None for this slice |
| Recommendation | Defer |
| Priority | Future improvement |

---

## Approved scope for this slice

- Extract `postCatalogCardsToThread` from CatalogShareSheet  
- SelectionWorkspaceBar Message: direct → post pile cards → navigate; **do not** clear selection  
- Docs + unit + functional regression  

## Explicitly deferred / rejected

- Composer draft / `location.state` attach prefill  
- Album/shop header Message attaching  
- Rename Message → Ask  
- Multi-shop Message  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
