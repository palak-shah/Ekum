# Feature Completeness Review — Dispatch LR leg photos

**Date:** 2026-10-08  
**Module / ask:** Attach photo(s) to each LR + Bill leg on Dispatch; show thumbs when attached (sheet + shipment history).  
**Anchors:** `docs/features/orders.md` (Split dispatch, Shipments, Note + attach)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders photograph physical LR slips. Per-leg photos beat sheet Note photos. Optional; Confirm dispatch still works with text-only LR. |
| UX Designer | Quiet + under each LR·Bill row; **thumbs always visible when attached** (same h-14 language as NoteAttach). Cap 3 per leg. Reuse camera/gallery tray — no new chrome. |
| Solution Architect | `OrderShipmentLeg.imageUrls String[]`; DTO on `shipmentLegSchema`; resolve + create/edit persist; serializer returns urls. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — NoteAttach photo tray + thumbs.  
2. **Duplicates?** Sheet Note photos stay for dispatch note; leg photos are LR-scoped.  
3. **Reuse?** Upload via `uploadImage`; PhotoViewer on tap where history shows thumbs.  
4. **Naming?** LR photo / Add photo — no jargon.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Attach / remove / persist / show |
| Business rules | OK | Optional; max 3 per leg |
| Workflows | OK | New dispatch + edit prior |
| Edge cases | OK | Empty LR with photos allowed; resize/remove legs keeps images |
| Permissions | OK | Seller dispatch only |
| User states | OK | Both parties see shipment thumbs |
| Notifications | N/A | |
| Error handling | OK | Upload toast |
| Mobile | OK | Thumbs under row; BM-07 footer clearance unchanged |
| First glance (BM-11) | OK | Quiet +; thumbs prove attach |
| Accessibility | OK | aria-labels |
| Platform consistency | OK | |

---

## Gaps

### G-001 — No leg image storage

| Field | Content |
|-------|---------|
| Gap | Legs are LR/bill text only. |
| Recommendation | `imageUrls String[]` on `OrderShipmentLeg` + DTO. |
| Priority | Required |

### G-002 — Attached state must show image

| Field | Content |
|-------|---------|
| Gap | Must not be icon-only “attached” cue. |
| Recommendation | Thumb strip under leg when `imageUrls.length > 0`. |
| Priority | Required |

---

## Approved scope

- Per-leg optional photos (≤3), camera/gallery, remove × on thumb.  
- Persist on dispatch + edit shipment; return on OrderView shipments.  
- Show thumbs on dispatch sheet and shipment/prior LR display.  
- Docs + unit tests (draft seed, resolve legs, serializer).

## Explicitly deferred

- Packing PDF embedding LR photos.  
- Voice on leg.  
- Cap >3.

## Verification

- Unit: `shipment-legs`, `dispatchSheet` seed, serializer.  
- Trader-eye: attach → thumb visible before Confirm.
