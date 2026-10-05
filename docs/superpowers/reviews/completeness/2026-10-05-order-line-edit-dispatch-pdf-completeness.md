# Feature Completeness Review — Order line edit + PDF open-then-send

**Date:** 2026-10-05  
**Module / ask:** Per-line seller fulfill edit on Order Detail (expand card, Can’t supply, pending qty, Dispatch this design); Dispatch sheet shows Can’t supply grayed + restore; chat/Timeline for Can’t supply and every dispatch change; PDF open/preview then Send.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Client cannot find Can’t supply on Dispatch or fix it after confirm; edit is buried in one multi sheet. Per-line expand + grayed Can’t supply on sheet + chat pulses close the trust gap. |
| UX Designer | Expand inline on fulfilling seller ticket only; Confirm/quote sheets unchanged; PDF must show slip before share. Live remaining when shipped qty changes; override for Extra/under. |
| Solution Architect | New post-confirm `lines/supply` API (quote/decide are `requested`-only). Reuse POST dispatch + PATCH shipment (already chat-pulse). PDF preview Sheet then share. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — order line thumbs, ShipProgressHint, quote Can’t supply mute + cue, kit Sheet/Button/TextInput, living order card.  
2. **Duplicates another feature?** No — expands fulfill surface; does not rebuild Confirm.  
3. **Should reuse an existing workflow?** Yes — same dispatch/edit shipment endpoints; chat card upsert.  
4. **Naming matches the app?** Can’t supply · Dispatch · Dispatch more · Extra · Send (PDF).

**Philosophy conflict?** No — still chat-centric complaints; fulfill edit stays seller-side; one job on the card.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Expand card, sheet Can’t supply, PDF preview |
| Business rules | OK | Settled read-only; restore/decline remaining; over-ship Extra |
| Workflows | OK | Line Dispatch vs bottom multi |
| Edge cases | OK | Latest LR for shipped edit; live remaining sync |
| Permissions | OK | Seller fulfilling ticket + mill own lot |
| User states | OK | confirmed / part_shipped / dispatched edit; settled lock |
| Notifications | OK | Living chat + Timeline (not push) |
| Error handling | OK | In-card / sheet InlineNotice; toast on dock |
| Scalability | OK | |
| Mobile interactions | OK | BM-07 dock clearance unchanged |
| First glance (BM-11) | OK | Closed card stays scan; expand is the edit job |
| Accessibility | OK | Toggle + qty labeled |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Post-confirm Can’t supply API missing

| Field | Content |
|-------|---------|
| Gap | Quote/decide only work while `requested` |
| Why it matters | Cannot restore/decline after confirm without new endpoint |
| Impact if ignored | UI would lie |
| Recommendation | Add `POST /orders/:id/lines/supply` with chat + trail |
| Priority | Required before implementation |

### G-002 — Buyer line complaint

| Field | Content |
|-------|---------|
| Gap | Not in this slice |
| Why it matters | Mixes fulfill with chat complaint |
| Impact if ignored | — |
| Recommendation | Defer — order ⋯ Complaint |
| Priority | Future improvement |

---

## Approved scope for this slice

- Expandable seller fulfill line cards (confirmed / part_shipped; mill own lot).  
- Can’t supply toggle; pending / Ship now box; per-line Dispatch; edit shipped (latest LR) with live remaining sync + Extra/under override.  
- Dispatch sheet lists Can’t supply grayed; restore/decline there; not in LR tally until restored.  
- Chat + Timeline for Can’t supply flips and every dispatch / dispatch edit (POST already pulses; ensure no silent path).  
- PDF: preview first, then Send.  
- Docs + gap matrix + tests + trader-eye.

## Explicitly deferred / rejected

- Confirm / Send quote sheet redesign  
- Trader Manage mill-card expand-edit  
- Buyer line complaint  
- Packing slip content redesign  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
