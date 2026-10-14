# Feature Completeness Review — Trader party/mill chat + full-width line facts

**Date:** 2026-10-14  
**Module / ask:** Trader needs clear chat to **buyer** and **mill**. QTY · PRICE · BILL must use full mill-card width (no `PRI…`, no empty half-card).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two private hops on I-handle: buyer↔trader and trader↔mill. Parties icon must read as buyer chat; mill card gets mill 1:1 after Send. Group chat stays when Share a group On. |
| UX Designer | Quiet chat icon (same parties chrome). Sales party row gets buyer icon on trader desk. Mill header gets mill icon after release. Fact strip stretches full width; labels not truncated. |
| Solution Architect | Expose `millThreadId` on mill desks via `findDirectThreadId` when released. No ensure before Send. OrderLineStack `w-full` fixes intrinsic-width blank. |

---

## Platform consistency

1. **Existing patterns?** Yes — parties chat icon, mill Open group chat, OrderLineFacts strip.  
2. **Duplicates?** No.  
3. **Reuse?** Same ChatIcon chrome; mill thread lookup like parent `threadId`.  
4. **Naming?** Quiet icon, no Seller/Buyer on body.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Buyer + mill chat entry |
| Business rules | OK | Mill chat only after Send |
| Workflows | OK | Soft-hide unchanged |
| Edge cases | OK | Held / declined / no thread |
| Mobile / BM-07 | OK | Full-width facts |
| First glance BM-11 | OK | Price readable; chats findable |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Mill card no 1:1 chat when reveal Off

| Field | Content |
|-------|---------|
| Gap | Only Open group chat when revealThreadId. |
| Recommendation | `millThreadId` + quiet icon after release. |
| Priority | Required |

### G-002 — Parties chat sits by Purchase (trader you)

| Field | Content |
|-------|---------|
| Gap | Icon looks tied to Purchase party on trader desk. |
| Recommendation | Place on Sales party row. |
| Priority | Required |

### G-003 — Fact strip content-narrow

| Field | Content |
|-------|---------|
| Gap | Stack does not stretch; labels truncate. |
| Recommendation | `w-full` stack; drop label truncate. |
| Priority | Required |

---

## Approved scope

- Full-width fact strip; Price/Bill labels complete.  
- Trader: buyer chat on Sales party; mill 1:1 icon after Send; group button when reveal On.  
- `millThreadId` on mill desks.

## Explicitly deferred

- Ensure mill thread before first Send.  
- Per-mill chat icons on the parties card (mill stays on mill card).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
