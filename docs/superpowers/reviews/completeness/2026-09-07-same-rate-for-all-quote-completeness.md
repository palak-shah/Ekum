# Feature Completeness Review — Same rate for all on quote

**Date:** 2026-09-07  
**Module / ask:** Wholesale: one rate for all designs on Send quote (trader→buyer, mill→trader, seller→buyer). Trader mill Send qty+rate stay one line; same-rate chip there too.  
**Anchors:** `docs/features/orders.md`, HowManyEach Same for all  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Wholesale often one rate across a lot — fewer taps. |
| UX Designer | Reuse Same for all / Each design chips from HowManyEach. Qty+rate on one row. |
| Solution Architect | Client-only; no API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Chip + FilterRail like HowManyEach.  
2. **Duplicates?** No.  
3. **Reuse?** Yes.  
4. **Naming?** Same rate for all / Each design.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Shared rate fills all supplyable lines |
| Business rules | OK | Can’t supply lines skip shared apply |
| Workflows | OK | Quote sheet + mill held card |
| Edge cases | OK | Single design — no chips |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet scroll |
| Accessibility | OK | Labels |
| Platform consistency | OK | |

---

## Approved scope

- Send quote: Same rate for all / Each design; qty+rate one line per design.
- Mill desk (before Send): Same rate for all; keep Design | Qty | Rate one line.
- Units + orders.md note.

## Sign-off

Proceed.
