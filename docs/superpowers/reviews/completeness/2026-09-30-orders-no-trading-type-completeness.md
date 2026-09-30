# Feature Completeness Review — Orders: no Trading type

**Date:** 2026-09-30  
**Module / ask:** Remove Trading from Orders Select Type.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Type is Order / Sample / Return. I-handle tickets stay in the same list as orders (row still says Trading). |
| UX Designer | One less type. Sell / mill tickets are found as Order, not a fourth bucket. |
| Solution Architect | `kind=trading` may still exist for tests/legacy URL. Menu + Find type words drop Trading / linked. |

---

## Platform consistency

1. **Existing patterns?** Same type sheet, fewer rows.  
2. **Duplicates?** No.  
3. **Reuse?** Unified Orders feed.  
4. **Naming?** Trading stays a row cue, not a type.

**Philosophy conflict?** No.

## Approved scope

- Select Type: Order, Sample, Return only.
- Find does not treat trading / linked as a type.
- I-handle desk e2e uses the unified list, not a Trading type.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
