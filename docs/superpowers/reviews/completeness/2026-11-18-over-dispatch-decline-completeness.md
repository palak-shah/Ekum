# Feature Completeness Review — Over-dispatch Decline (buyer + trader mill hop)

**Date:** 2026-11-18  
**Module / ask:** Client bug #44 — over-ship stays allowed; receiving party gets **Decline** (buyer on 1:1, trader on mill hop).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-01-buying-order-detail-completeness`, `2026-11-02-one-to-one-agreement-decline-completeness`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Over-dispatch is intentional (typed qty may exceed remaining). Orange “+N extra” alone is not enough — buyer / trader must be able to refuse the ticket. No Accept-extra. Seller Settle stays seller-only write-down. |
| UX Designer | Same dock **Decline** language as seller-logged refuse (kit secondary on 1:1). Mill hop: Decline on the dock when over-shipped (not only Cancel in ⋯). One job: refuse the over-dispatched ticket. |
| Solution Architect | Extend `orderActionDock` buy verbs + buyer `cancel` API for `part_shipped` / `dispatched` **only when** any line is over-shipped. Decline UI already calls `cancel`. Outcome = `cancelled` (same as declineLogged today). |

---

## Platform consistency (required)

1. **Existing patterns?** Dock Decline → `cancel` mutation; kit secondary on 1:1.  
2. **Duplicates another feature?** No — Accept-extra was rejected; this is refuse, not Settle.  
3. **Should reuse an existing workflow?** Yes — declineLogged / Cancel-equivalent → `POST cancel`.  
4. **Naming matches the app?** **Decline** (not Reject / Refuse extra).  
5. **Units?** N/A — no ₹ / qty string change in this slice.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Decline after over-ship for buyer + trader mill hop |
| Business rules | OK | Over-ship allowed; refuse = cancel ticket |
| Workflows | OK | Dock only; confirm sheet if cancel already uses note — keep same path as declineLogged (immediate cancel) |
| Edge cases | Gap → closed below | Part-ship + leftover + extra; I-handle parent vs mill hop; exact full ship (no Decline) |
| Permissions | OK | Buyer of ticket only (trader is buyer on mill hop) |
| User states | OK | `part_shipped` / `dispatched` + over |
| Notifications | OK | Existing cancel chat card + trail |
| Error handling | OK | API rejects cancel after ship when **not** over |
| Scalability | N/A | |
| Mobile interactions | OK | Dock clearance unchanged (BM-07) |
| First glance (BM-11) | OK | Decline appears when +extra is visible |
| Units | N/A | |
| Accessibility | OK | Button named Decline |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Cancel API blocked after confirm/dispatch

| Field | Content |
|-------|---------|
| Gap | `cancel` only allows `requested` \| `confirmed`. Over-ship → `part_shipped` / `dispatched` → Decline UI would 409. |
| Why it matters | Dock without API is a dead button. |
| Recommendation | Allow buyer cancel from `part_shipped` \| `dispatched` **iff** any non-declined line has shipped &gt; ordered. |
| Priority | Required before implementation |

### G-002 — Mill hop Decline visibility

| Field | Content |
|-------|---------|
| Gap | `declineLogged` forced off on mill hops; Cancel only in ⋯ pre-ship. |
| Why it matters | Trader has no refuse verb after mill over-dispatch. |
| Recommendation | When over-shipped, set dock Decline for mill hop (`declineLogged` or equivalent). |
| Priority | Required before implementation |

### G-003 — Exact full ship must not unlock Decline

| Field | Content |
|-------|---------|
| Gap | Unlocking cancel for all dispatched tickets would let buyers cancel completed normal ships. |
| Recommendation | Gate on over-ship only (`shipped &gt; ordered` on any line). |
| Priority | Required before implementation |

### G-004 — I-handle parent vs mill hop

| Field | Content |
|-------|---------|
| Gap | Buyer on Manage parent sees aggregated ship; mill over may appear on parent lines after pass-through. |
| Recommendation | Buyer Decline on parent when parent lines show over; trader Decline on mill hop when hop lines show over. No new parent→mill reverse. |
| Priority | Required before implementation |

---

## Edge matrix (who · surface · when)

| Who | Surface | When | Verb | Outcome |
|-----|---------|------|------|---------|
| Buyer | 1:1 Buying (seller-logged or buyer-placed) | Any line over-shipped; status `part_shipped` or `dispatched` | Decline | `cancelled` |
| Trader | Mill hop (buyer of mill) | Hop line(s) over-shipped; same statuses | Decline | `cancelled` |
| Buyer | 1:1 | Exact ship / under / no ship | No new Decline from this slice | — |
| Seller | Selling | Over-ship | No Decline (seller may Settle leftover separately) | — |

**Hold / revoke:** N/A for this refuse verb. Declined lines ignored when computing over.

**Refusal eligibility (strict):**
- Actor = `buyerCompanyId` of that hop only (trader on mill hop = buyer of mill).
- Status = `part_shipped` | `dispatched` only (not confirmed, settled, delivered, cancelled).
- At least one non-declined line with shipped &gt; ordered.
- Direct facilitator never gets over-ship Decline.
- Exact / under ship never unlocks cancel after dispatch.

---

## Approved scope for this slice

- `hasOverShipped` (or equivalent) into `orderActionDock` buy branch.  
- Decline on buyer 1:1 and trader mill hop when over-shipped.  
- Extend `OrderService.cancel` for buyer when over-shipped on `part_shipped` / `dispatched`.  
- Docs: `docs/features/orders.md` one-line lock.  
- Units + API specs + `@functional` slice for buyer + trader Decline after over-dispatch.

## Explicitly deferred / rejected

- Accept extra / buyer settle.  
- Seller confirm sheet before over-ship (rejected by product lock).  
- Refuse-extra-only (keep ordered, drop surplus) — refuse whole ticket.  
- Packing-slip / Received / Complaint (#39 / #41).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
