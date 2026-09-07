# Feature Completeness Review — Add designs batch UX

**Date:** 2026-09-02  
**Module / ask:** Batch add: SKU under thumbs (not filename), plural **Add designs**, hide shared card for one design, per-design details always open  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders identify designs by Reference / SKU, not camera filenames. One photo is one design; the header and empty CTA must say that. Shared defaults only matter when there are two or more. |
| UX Designer | Match kit Sheet + Button + Field. Drop chips. Done saves this design; **Use same as all designs** resets to shared. One-design page uses **This design**, not “same for all”. |
| Solution Architect | Client generates session-unique `EK-` + 8 hex (same as server), send as `sku` + `name`. No new API. Collection photo-as-design filenames stay out of scope. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — PageHeader, dashed add CTA, ListSquareButton camera, kit Sheet/Field/Button, DiscardChangesSheet on leave.  
2. **Duplicates another feature?** No — refinement of `/catalog/products/new`.  
3. **Should reuse an existing workflow?** Yes — same save/publish path; SKU is Edit design **Reference / SKU**.  
4. **Naming matches the app?** **Add designs** / design(s) — not “photos of one design”. SKU, not SKUID jargon on the screen.

**Philosophy conflict?** No.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Copy, SKU default, 1 vs 2+ card, sheet details |
| Business rules | OK | SKU unique in session + server `SKU_TAKEN`; name = SKU for API |
| Workflows | OK | Empty → add → details → save/publish unchanged |
| Edge cases | OK | Cap 120; leave discard; one vs many |
| Permissions | N/A | Existing selling / upload caps |
| User states | OK | Empty vs 1 vs 2+ |
| Notifications | N/A | |
| Error handling | OK | Upload/save errors as today |
| Scalability | OK | Existing batch/concurrency |
| Mobile interactions | OK | No new sticky bar (BM-07 N/A); sheet footer kit |
| Accessibility | OK | SKU labels; Add designs aria on camera |
| Platform consistency | OK | No chips; ghost reset button |

---

## Gaps

None required. Filename auto-name on **collection** create is deferred.

---

## Approved scope for this slice

- Header: **Add designs**; empty CTA: **One photo per design** + why-line (not more shots of the same one); add-more camera: **Add designs**
- Grid heading: **N design(s)** (no “Photos ·”)
- Thumb + sheet field: session-unique SKU (`EK-XXXXXXXX`), sent as `sku` and `name`
- One design: page card **This design**; hide **Same for all designs**
- Two or more: **Same for all designs** card
- Update sheet: details always open; **Done**; **Use same as all designs** when 2+; remove chips

## Explicitly deferred / rejected

- Collection editor filename → design name
- Changing Edit design Name vs SKU as separate trader-facing fields
- Reserving SKUs on the server before save

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
