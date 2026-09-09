# Feature Completeness Review — D12 multi-mill ticket flip

**Date:** 2026-09-09  
**Module / ask:** Live **This order is with → mill** when 2+ mills: one Direct per mill (design owner); trader Shared + Take over. UI already lists mill names quietly under **Mills**.  
**Anchors:** `docs/features/orders.md`, journey matrix D12, unified main+lots (Place stays Manage; this is flip escape only)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Decision locked with product 2026-09-09.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Flip = leave middleman for this order. 1 mill → that mill; 2+ → each mill their designs. Trader still sees Shared tickets and can Take over. Place remains one main + lots. |
| UX Designer | Option **Mills** + muted name list (shipped). After flip, open first Direct (same as 1-mill today); both appear in Orders as Shared. No picker. |
| Solution Architect | Cancel Manage parent + hops; create N Direct orders (facilitator = trader) from each hop’s lines; upsert TradeLane `ticket=mill` per mill×buyer. Reuse existing 1-mill path as loop. Return first Direct for navigate; optional `orders[]` for clarity. |

---

## Platform consistency (required)

1. **Existing patterns?** Shared + Take over on Direct — yes.  
2. **Duplicates another feature?** No — same Direct escape as 1 mill, extended.  
3. **Should reuse an existing workflow?** Yes — `create` Direct + facilitator.  
4. **Naming matches the app?** Mills + shop names; Shared; Take over.

**Philosophy check?** No conflict — everyday Place stays I-handle desk; flip is rare escape.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | N Directs from hop lines |
| Business rules | OK | Requested + no quote only (existing) |
| Workflows | OK | Flip → Shared list; Take over → Me |
| Edge cases | OK | 1 mill unchanged; 0 ups → NO_MILL |
| Permissions | OK | Seller on Manage parent only |
| User states | OK | |
| Notifications | Later | Existing Direct create notices |
| Error handling | OK | Existing SELLER_PROGRESS |
| Scalability | N/A | Small N mills |
| Mobile interactions | N/A | No new sticky chrome |
| Accessibility | OK | Existing flip card |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Return shape for N Directs

| Field | Content |
|-------|---------|
| Gap | API returns one `OrderView`; N creates need discoverability |
| Recommendation | Return first Direct (navigate); create all. Trader list shows all Shared. Optional toast Later. |
| Priority | Required closed by returning first + creating all |

---

## Approved scope for this slice

- API `flipTicket` 2+ mills → cancel main+hops → Direct per mill + lanes  
- Units for 2-mill and 1-mill regression  
- Matrix D12 → Pass (build)  
- Soft toast / e2e: Recommended if time

## Explicitly deferred / rejected

- Your paths Place-time ticket=mill (separate from live flip)  
- Picker UI  
- Transparent Manage stamp (superseded)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
