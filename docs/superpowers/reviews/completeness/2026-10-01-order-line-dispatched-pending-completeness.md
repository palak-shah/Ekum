# Feature Completeness Review — Order line dispatched / pending language

**Date:** 2026-10-01  
**Module / ask:** On the order items card, one consistent pair — **dispatched N · pending N** — not mixed line-status “Dispatched” vs “shipped” vs “pending only”. One card; no extra status cards.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need how many pieces went and how many wait. Same words on every design. Ticket status stays on the header. |
| UX Designer | One items card. Each supplyable line: **dispatched N · pending N** (both always). Drop the extra **Dispatched** status word on that row. Accent pending while open. Can’t supply unchanged. |
| Solution Architect | Same `shippedQuantity` / `remainingQuantity`. Copy-only on `ShipProgressHint` + drop `lineStatusLabel` on the items row. Settle columns already Dispatched \| Pending. |

---

## Platform consistency (required)

1. **Existing patterns?** Order items card; Settle **Dispatched \| Pending**.  
2. **Duplicates another feature?** No — tighter wording, not a second card.  
3. **Should reuse an existing workflow?** Yes — existing hint.  
4. **Naming matches the app?** **dispatched** / **pending** (pieces). Not “left” / “shipped”.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same pair on every fulfillment line |
| Business rules | OK | Pieces, not design count |
| Workflows | OK | Header still ticket status |
| Edge cases | OK | Zeros stay visible (`dispatched 0 · pending 2`); declined = Can’t supply |
| Permissions | N/A | |
| User states | OK | Open lines (not confirmed) hide the pair |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile interactions | OK | Same row; no new chrome |
| Accessibility | OK | Same text cue |
| Platform consistency | OK | Matches Settle language |

---

## Approved scope for this slice

- Items card + mill-desk rows: **dispatched N · pending N** always both when the line is in fulfillment.
- No line-status word on that cue. No second card.
- Units + existing fulfillment journey still check **pending** (and **dispatched** on the hint).

## Explicitly deferred / rejected

- Ticket-level second summary card (same trigger twice).
- Changing ticket header **Settled · complete** / **Dispatched · complete**.
- Dispatch sheet “N ordered · pending M” (that sheet’s job is remaining to send now).

## Sign-off

Yes · 2026-10-01
