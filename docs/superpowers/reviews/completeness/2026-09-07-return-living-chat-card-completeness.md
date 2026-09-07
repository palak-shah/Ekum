# Feature Completeness Review — Return living chat card

**Date:** 2026-09-07  
**Module / ask:** Raise / decide return updates living order card in chat  
**Anchors:** `docs/features/orders.md`, `docs/superpowers/specs/2026-09-07-return-living-chat-card-design.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Seller must see return ask in the same thread as the order — notification alone is not enough. |
| UX Designer | Compact pulse matching Settled/Dispatched; plain titles Return / Return approved / … |
| Solution Architect | Reuse `postOrderCard` / living upsert; new OrderChatEvent values; ReturnService calls OrderService. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — living order card pulses.  
2. **Duplicates?** No.  
3. **Reuse?** Same upsert + announce path as settle.  
4. **Naming?** No Seller/Buyer on card body; business names via actor.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Raise + decide pulses |
| Business rules | OK | Same parties as return |
| Workflows | OK | Chat → open order |
| Edge cases | OK | Preserve quote voice metadata |
| Permissions | OK | Unchanged |
| User states | OK | |
| Notifications | OK | Keep existing return notifs |
| Error handling | OK | Chat post after successful return write |
| Scalability | OK | |
| Mobile interactions | OK | Compact pulse |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Resolve / escalate pulses

| Field | Content |
|-------|---------|
| Gap | Resolve and escalate do not update chat in this slice |
| Recommendation | Future improvement |
| Priority | Future improvement |

---

## Approved scope for this slice

- Living card on raise + approve / partial / decline  
- Domain events + compact copy  
- Docs + API unit coverage  

## Explicitly deferred / rejected

- Resolve / escalate chat  
- Separate return card type  
- Voice on pulse  

## Sign-off

| Role | Result |
|------|--------|
| Completeness | **Proceed** |
