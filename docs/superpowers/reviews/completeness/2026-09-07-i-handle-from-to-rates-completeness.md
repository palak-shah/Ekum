# Feature Completeness Review — I-handle From/To rates

**Date:** 2026-09-07  
**Module / ask:** Trader desk: very visible mill rate got vs rate sent to buyer  
**Anchors:** `docs/features/orders.md`, `docs/superpowers/specs/2026-09-07-trader-i-handle-desk-design.md`  
**Disposition:** Proceed

> Extends approved I-handle desk. Trader-only; no mill/buyer chrome change.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Ravi must see cost (Ahmedabad) vs what Meena got — margin is the job |
| UX Designer | Plain From {shop} / To {buyer}; on card + Send quote sheet |
| Solution Architect | Expose mill line rates on `millDesks`; buyer rates stay on parent items |

## Platform consistency

1. Existing patterns? Yes — mill cards, Send quote sheet, kit rates  
2. Duplicates? No  
3. Reuse? Mill desk + quote sheet  
4. Naming? From {shop} / To {buyer name} — no Seller/Buyer jargon  

**Philosophy conflict?** No

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pair on card + sheet |
| Business rules | OK | Trader-only; mill quote held until Send quote |
| Workflows | OK | After mill quotes → compose → after send |
| Edge cases | OK | Not sent yet; mill declined line |
| Permissions | OK | Only manage seller sees millDesks |
| Notifications | N/A | |
| Error handling | N/A | Display only |
| Scalability | OK | Per mill card |
| Mobile | OK | Two text lines under design |
| Accessibility | OK | Text rates |
| Platform consistency | OK | |

## Gaps

### G-001 — Mill rates not on desk payload

| Field | Content |
|-------|---------|
| Gap | `millDesks` only flags `millQuoted`; parent `item.rate` is Meena’s after pass |
| Why it matters | Trader cannot compare |
| Recommendation | Add per-line mill rate/qty on `millDesks.lines` |
| Priority | Required |

## Approved scope

- Mill card: From {shop} · rate · qty; To {buyer} · rate or Not sent yet  
- Send quote: show mill From beside fields; prefill from mill rates  
- Docs + units  

## Explicitly deferred

- Margin % / profit math  
- Buyer or mill seeing the pair  

## Sign-off

Required gaps closed in implement: Yes  
Ready: Yes  
