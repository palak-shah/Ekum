# Feature Completeness Review — Dispatch over-ship

**Date:** 2026-10-04  
**Module / ask:** Sellers may dispatch **more** than ordered/remaining on a line; result shows **highlighted extra** (not a silent clamp to 1).  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Textile trade sometimes sends extra sets. Today Confirm silently ships remaining only — trader thinks 2 went out, ticket shows 1. Allow over-qty on dispatch; make the overage loud on the order. |
| UX Designer | Dispatch sheet: qty may exceed pending; accent the qty when extra + quiet **Extra N**. Detail line: when shipped &gt; agreed qty, **dispatched N · extra M** with **extra M** accent (pending is 0). Keep Can’t supply / Settle under-ship as today. |
| Solution Architect | Drop client `Math.min(…, remaining)` and API `QTY_TOO_HIGH` on dispatch remaining. Persist shipment qty as submitted. `remainingQuantity = max(0, quantity − shipped)`. Line/order complete when shipped ≥ quantity (existing). No new DB column — derive over = shipped − quantity on the client (and optionally expose later). |

---

## Platform consistency (required)

1. **Existing patterns?** Same dispatch sheet + `ShipProgressHint` pair language; accent like pending rows.  
2. **Duplicates another feature?** No — opposite of Settle (under-ship).  
3. **Should reuse existing workflow?** Yes — Dispatch sheet + items card.  
4. **Naming matches the app?** **extra N** (pieces), not “over” / “excess” / “surplus”.

**Philosophy conflict?** No — plain trader control; no hidden clamp.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Extra qty on Confirm; detail shows extra |
| Business rules | OK | Shipped may exceed line `quantity`; remaining floors at 0; full ship still → `dispatched` |
| Workflows | OK | Split dispatch / Settle under-ship unchanged |
| Edge cases | OK | Second LR after remaining 0 stays off sheet (Later: extra after complete) |
| Permissions | OK | Seller-only dispatch unchanged |
| User states | OK | Buyer sees same extra cue on the ticket |
| Notifications | N/A | Existing dispatch trail/chat |
| Error handling | OK | Still reject qty &lt; 1 / invalid lines |
| Scalability | OK | |
| Mobile interactions | OK | Sheet sticky CTA; no new chrome height |
| First glance (BM-11) | OK | Extra accent only when extra; quiet otherwise |
| Accessibility | OK | Text cue, not colour alone |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Extra after ticket already complete

| Field | Content |
|-------|---------|
| Gap | Once remaining is 0, line leaves the dispatch sheet — cannot add another LR only for extras. |
| Why it matters | Rare “forgot one more set after full dispatch”. |
| Impact if ignored | Must amend/settle patterns or new order for true post-complete extras. |
| Recommendation | Defer — this slice covers over on an open pending line (incl. typing 2 when pending 1). |
| Priority | Future improvement |

---

## Approved scope for this slice

- API `POST …/dispatch`: allow line qty &gt; remaining (positive qty still required).
- Web: stop silent clamp; payload uses typed floor qty (cap only at schema max).
- Dispatch sheet: when typed &gt; remaining, accent qty + **Extra N**.
- Order items (and mill-desk rows using the same hint): if `shippedQuantity > quantity`, show **dispatched N · extra M** with **extra** accent; else keep **dispatched N · pending M**.
- Docs + unit tests; smoke/functional path if an existing journey asserts clamp.

## Explicitly deferred / rejected

- Dispatching again after remaining 0 / ticket `dispatched` (G-001).
- Rewriting line `quantity` up to shipped (that is Settle’s under-ship job, inverted — not this slice).
- Changing ticket header copy beyond existing complete states.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
