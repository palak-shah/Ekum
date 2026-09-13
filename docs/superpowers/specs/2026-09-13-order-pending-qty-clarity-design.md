# Design — Order pending qty clarity

**Date:** 2026-09-13  
**Status:** Approved (Completeness Proceed)  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-13-order-pending-qty-clarity-completeness.md`

## Goal

After partial ship, traders instantly see **pending** (not “left”) in accent. Settle makes **Dispatched** vs **Pending** numbers obvious.

## Surfaces

| Surface | Treatment |
|---------|-----------|
| Order line status | `Confirmed · shipped N · pending M` — pending accent + semibold when M &gt; 0 |
| Dispatch sheet | Cue `pending N` (accent when N &gt; 0) |
| Settle sheet | Per line: Dispatched \| Pending columns (`text-base` tabular); pending accent when &gt; 0 |
| Settle intro | *Won’t ship the rest. Ticket closes as Settled; quantities become what already shipped.* |

## Component

`ShipProgressHint` — shared shipped/pending spans for detail + dispatch.
