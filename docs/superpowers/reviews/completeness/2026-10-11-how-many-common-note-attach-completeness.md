# Feature Completeness Review — How many common Note (+ Voice · Photo)

**Date:** 2026-10-11  
**Module / ask:** Place Order / How many each: keep per-design line notes; add sheet-level **Note** with **+** → Voice · Photo (≤9), same as update sheets; persist on create / batch / from-pack so Timeline shows the attach pack. Order Builder upgrades to the same NoteAttachField.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already leave a ticket note on quote/dispatch/amend. Place should not be the odd sheet that only has per-line notes. One common note covers the whole ask (transporter-style: same text/voice/photos on every ticket in a multi-shop batch). |
| UX Designer | Reuse `NoteAttachField` above Transporter in the sticky footer — quiet optional chrome, not a second loud box. Per-line Note stays one-line text. Busy gate disables Place while upload/recording. |
| Solution Architect | Extend `createOrderSchema` / batch / from-pack with `orderNoteVoiceFields` (incl. `noteImageUrls`). Persist voice on Order columns; images on Requested trail (+ chat meta). Batch/from-pack forward attach onto each `create()`. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Quote / Dispatch / Edit order NoteAttachField.  
2. **Duplicates another feature?** No — fills the place-path gap.  
3. **Should reuse an existing workflow?** Yes — same field + trail persistence helpers.  
4. **Naming matches the app?** Yes — **Note** (optional), Voice · Take photo · Gallery.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Common note + attach on How many + Order Builder |
| Business rules | OK | Cap 9 images; voice owned by placing company |
| Workflows | OK | Place / Ask / batch / from-pack / single create |
| Edge cases | OK | Empty note OK; multi-shop same common note |
| Permissions | OK | Existing trade assert on create |
| User states | OK | Reset attach when sheet opens |
| Notifications | N/A | Trail/chat already carry note |
| Error handling | OK | Upload failures stay in NoteAttachField toasts |
| Scalability | N/A | |
| Mobile interactions | OK | Footer stack; BM-07 clearance unchanged |
| First glance (BM-11) | OK | Optional Note quieter than Place; line notes unchanged |
| Accessibility | OK | Existing + menu labels |
| Platform consistency | OK | Matches update sheets |

---

## Gaps

None Required for this slice.

---

## Approved scope for this slice

- How many each: `NoteAttachField` above Transporter; `HowManyPlaceOpts` note/voice/images; Place disabled while attach busy.
- Order Builder: replace `NoteVoiceField` with `NoteAttachField` + `noteImageUrls` on create.
- Domain: create / batch / from-pack accept `orderNoteVoiceFields`.
- API: persist images on Requested trail; forward attach through batch/from-pack.
- Docs + unit/API specs.

## Explicitly deferred / rejected

- Order-for-buyer voice/images (`createForBuyerSchema` stays text `note` only).
- Per-line note becoming attach (stays one-line text).
- Quote schema `noteImageUrls` gap (unrelated update path).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit + API; extend `@orders` e2e only if cheap)  
