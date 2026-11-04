# Feature Completeness Review — Mixed I-handle trader-owned linked Selling hop

**Date:** 2026-11-02  
**Module / ask:** When a buyer places one mixed order (mill-supplied + trader-owned), spawn a linked Selling 1:1 hop for trader-owned lines. Buyer keeps one Manage parent. Mills stay Send-held hops. Trader operates leftover SKUs on the Selling hop, not on the I-handle parent. Reuse `downstreamOrderId` / `sourceItemId` — no parallel hierarchy.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-02-trader-ihandle-completeness`, Slice B leftover You (G-002 / G-003), plan Mixed You Selling hop  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One buyer-facing ticket. Mill lots stay on the parent desk until Send. Trader-owned lines become a normal Pending Selling ticket so Confirm / Dispatch / Settle match everyday Selling 1:1. No second buyer order. |
| UX Designer | Parent desk job stays **Send mill lots**. Leftover You is no longer editable on the parent — quiet **You · #hop** link only. You hop uses existing Selling 1:1 chrome (no Send, no mill picker). Do not restyle Direct / 1:1 / mill-only. |
| Solution Architect | Layout B: hop buyer = end buyer, seller = trader, bilateral, silent-release `upstreamReleasedAt`. Reuse pass-through. Buyer GET 404 + suppress hop living cards. Exclude You hop from mill desks. No schema. |

---

## Platform consistency (required)

1. **Existing patterns?** Parent mill cards + Selling 1:1 hop page. Same `Order` / `sourceItemId` mapping as mill hops.  
2. **Duplicates another feature?** No — not a Related-orders box, not a second Manage parent.  
3. **Should reuse an existing workflow?** Yes — mill hop create + pass-through + Selling 1:1 chrome.  
4. **Naming matches the app?** You / mill shop names; no Seller/Buyer on chat card body.  
5. **Units?** No ₹ / qty string change. Pass-through keeps parent **order** unit.

**Philosophy conflict?** No if You hop stays off the buyer list/GET and mill hops stay off trader Selling. Operating leftover You on the parent (Slice B) is **superseded** for new Places.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Spawn You hop when mill hops + leftover trader SKUs; mill-only / Direct / 1:1 unchanged |
| Business rules | OK | Buyer never sees You hop; parent Dispatch never for hop-mapped lines; Settle off on parent while mill desks |
| Workflows | OK | Place → You Confirm/Dispatch + mill Send path → parent roll-up → settle when all released hops complete |
| Edge cases | OK | No You hop when mill-only or no leftover; in-flight Slice B tickets not backfilled |
| Permissions | OK | Buyer 404 on fulfilment hop; mill never opens parent |
| User states | OK | Parent after Send: mill wait cue; You hop: ordinary Selling dock |
| Notifications | OK | No buyer `orderCreated` / living card for You hop; pass-through pulses parent |
| Error handling | OK | Parent dispatch of mapped lines → NOT_ALLOWED |
| Scalability | OK | One extra Order per mixed parent |
| Mobile interactions | OK | You hop uses Selling 1:1 dock clearance (BM-07) |
| First glance (BM-11) | OK | Parent = mill Send; You hop = Confirm — two tickets, one job each |
| Units | N/A | No rate/qty string change |
| Accessibility | OK | You `#` link after create |
| Platform consistency | OK | Reuse hop model + 1:1 chrome |

---

## Gaps

### G-001 — Buyer must not open the You hop

| Field | Content |
|-------|---------|
| Gap | You hop parties include the end buyer. List hide alone is not enough for deep links / GET. |
| Why it matters | Second buyer-facing ticket breaks “one I-handle parent”. |
| Impact if ignored | Buyer sees two Selling/Buying tickets for one Place. |
| Recommendation | 404 when actor is hop buyer of a fulfilment hop (`buyer`/`seller` match parent, `downstreamOrderId` set). Suppress hop living cards on the buyer↔trader thread. |
| Priority | Required before implementation |

### G-002 — You hop must not appear as a mill card

| Field | Content |
|-------|---------|
| Gap | `buildMillDesks` loads every `downstreamOrderId` hop. |
| Why it matters | Trader would see a Send/Decline card for their own shop. |
| Impact if ignored | Wrong desk language; Send on You lines. |
| Recommendation | Exclude hops where `sellerCompanyId === parent.sellerCompanyId`. Quiet **You · #hop** link instead. |
| Priority | Required before implementation |

### G-003 — Parent leftover operate is retired for new mixed Places

| Field | Content |
|-------|---------|
| Gap | Slice B leftover You Confirm/Dispatch on the parent. |
| Why it matters | Conflicts with “operate on the linked Selling order”. |
| Impact if ignored | Two fulfilment paths for the same lines. |
| Recommendation | New mixed Places: leftover mapped onto You hop; parent leftover read-only + no Dispatch. In-flight tickets without a You hop keep Slice B until they complete (no backfill). |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Spawn silent-released bilateral You hop from leftover parent lines in `createFromPack` + `spawnHandleUpstreams` when mill hops exist.  
- Buyer 404 + suppress hop-side living cards / `orderCreated`.  
- Exclude You hop from mill desks / linkedMills / quote-pass mill scan.  
- Parent: leftover You read-only + optional hop link; no leftover Dispatch.  
- Reuse `passMill*` / `allReleasedSubsetsComplete` / amend.  
- Lock `orders.md` + gap matrix.  
- Tests: mixed mapping/list/GET; mill-only; Selling 1:1; Direct regressions; trader-eye parent vs You hop.

## Explicitly deferred / rejected

- Prisma schema / migration / backfill of open mixed tickets — **Rejected**.  
- Parallel order hierarchy — **Rejected**.  
- Listing mill hops on Selling — **Rejected**.  
- Direct / Selling 1:1 / Buying 1:1 restyle — **Rejected**.  
- G-005 mill editShipment / G-006 settle extra / G-008 amend rematch — **Deferred** (mill gaps).  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
