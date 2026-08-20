# Feature Completeness Review — Living order card + Accept quote gating

**Date:** 2026-08-11  
**Module / ask:** One living trade-thread message per order; Accept quote only after a real seller quote; Orders overflow menu portal  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/chat.md`  
**Disposition:** Proceed

## Inventory (restored WIP)

| Piece | Purpose |
|-------|---------|
| `OrderView.canAcceptQuote` / `hasSellerQuote` | Live flags for detail, Home attention, chat CTA |
| `upsertOrderThreadMessage` + quote/`quoted` preserve | One living card; Rate then later compact pulses update same row |
| `acceptQuote` rejects without seller quote | BM-05 — catalog line rates alone are not a quote |
| List/get enrich with quote flags | Attention + CTAs stay honest |
| `orderCardCopy` rich/compact + `dedupeOrderThreadMessages` | Compact lifecycle chips; hide legacy stacks |
| `OrderDetailPage` / `orderAttention` | Use server flags, not “any line has rate” |
| `OrdersPage` portal menu | Samples/Returns menu escapes clipped overflow (chrome) |

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Aligns with already-Proceed orders Completeness; this is the server/UI truth for living card + BM-05. |
| UX Designer | Rich ask/quote cards; compact later pulses; Accept only when quote exists. Portal menu avoids clipped More menu. |
| Solution Architect | Upsert by thread+reference; preserve `metadata.quoted` across type flips. Do not append a new card per status. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — chat is the pulse; order detail is the timeline.  
2. **Duplicates?** No second deal object.  
3. **Reuse?** Yes — trade thread + order_card/rate types.  
4. **Naming?** Accept quote / Inquiry # / Order #; You buy/sell.

**Philosophy conflict?** No. Reject marketplace cart without connection (prior).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Core path already `@functional @orders` |
| Business rules | OK | NO_QUOTE on accept without seller quote |
| Workflows | OK | request → quote → accept |
| Edge cases | Recommended | Legacy multi-card threads still dedupe in UI |
| Permissions | OK | Party checks unchanged |
| User states | OK | buying/selling via direction |
| Notifications | Recommended | Home attention uses `canAcceptQuote` |
| Error handling | OK | ConflictException NO_QUOTE |
| Scalability | OK | Batch quote lookup on list |
| Mobile interactions | OK | Portal menu clears overflow clip |
| Accessibility | Recommended | Menu Escape / outside click |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Doc drift: “new card per transition”

| Field | Content |
|-------|---------|
| Gap | `orders.md` Business rules still said each transition posts a **new** card |
| Why it matters | Contradicts living-card Purpose / User flows |
| Impact if ignored | Future implementers reintroduce card spam |
| Recommendation | Fix Action cards row to upsert / living update |
| Priority | Required before implementation |

### G-002 — `emitAndGet` omits live quote flags

| Field | Content |
|-------|---------|
| Gap | Some mutations returned serializer view without `canAcceptQuote`/`hasSellerQuote` |
| Why it matters | Stale flags if UI trusts mutation response without refetch |
| Impact if ignored | Rare CTA flicker |
| Recommendation | `emitAndGet` → `get()` after emit (done this slice) |
| Priority | Required before implementation — closed |

### G-003 — Dispatch → deliver / samples / returns

| Field | Content |
|-------|---------|
| Gap | Outside this WIP |
| Why it matters | Fulfillment completeness |
| Impact if ignored | Matrix stays Future |
| Recommendation | Separate Completeness later |
| Priority | Future improvement |

---

## Approved scope for this slice

- Living upsert + Accept quote gating + domain flags + web attention/detail/copy.  
- Orders More menu portal.  
- Fix `orders.md` Action cards contradiction.  
- Reuse existing `@functional @orders` + API unit specs; no new journey required unless verification fails.

## Explicitly deferred / rejected

- Dispatch→deliver journeys → Future.  
- Trade without connection → Reject.

## Sign-off

Required gaps closed or deferred in writing: Yes (G-001 closed in docs this slice)  
Ready for implementation / `@functional` journeys: Yes
