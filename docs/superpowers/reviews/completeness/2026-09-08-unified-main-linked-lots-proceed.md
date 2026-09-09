# Feature Completeness Review — Unified main + linked lots (Proceed slice)

**Date:** 2026-09-08  
**Module / ask:** Ship first slice of unified Place: curated pack always main+lots; buyer sees mill cards when TradeLane ticket=mill (transparent); trader still Send quote.  
**Anchors:** `2026-09-08-unified-main-linked-lots-design.md`, journey matrix  
**Disposition:** **Proceed**

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Closes two Place outcomes for packs; Direct = visibility on same desk. |
| UX Designer | Buyer mill cards read-only; trader desk unchanged. |
| Solution Architect | Extend `buildMillDesks` to buyer when lane ticket mill; web always from-pack for single pack stamp. |

---

## Platform consistency

1. Reuse mill desk cards / soft-hide.  
2. No new order type.  
3. Reuse from-pack.  
4. Plain names.

**Philosophy conflict?** No — implements approved Redesign.

---

## Checklist

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Slice scope below |
| Business rules | OK | Quote still trader→buyer |
| Workflows | OK | |
| Edge cases | Later | Mixed Me/mill lanes on one pack; Selection without pack |
| Permissions | OK | Buyer no Send/Hold/Reveal |
| Mobile BM-07 | OK | Same cards |
| Platform consistency | OK | |

---

## Approved scope

- Curated Selection/album Place: always `from-pack` when one `sourceCollectionId` (ignore Direct stamp).  
- `buildMillDesks`: buyer on Manage parent gets desks for mills whose lane `ticket=mill`.  
- Soft-hide: do not hide names of mills buyer may see.  
- UI: buyer mill cards read-only (name, #, status, designs / rates glance).  
- Docs + units; functional e2e dual-mill optional Later this slice if time.

## Explicitly deferred

- Selection multi-supplier without pack → main+lots (G-005)  
- Batch retirement for all facilitator paths  
- Buyer actions on mill lots  
- Place confirm copy polish  

## Sign-off

Ready for implementation: **Yes**
