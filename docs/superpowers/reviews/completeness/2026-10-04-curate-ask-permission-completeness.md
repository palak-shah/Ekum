# Feature Completeness Review — Curate Ask respects supplier pack grant

**Date:** 2026-10-04  
**Module / ask:** Ask buttons on Curate / Your selection must not bypass supplier **They can see** vs **They can share**, or mix **Ask to see this pack** (view) with pack Ask.  
**Anchors:** `docs/features/access-and-connections.md`, `docs/features/00-concepts.md`, completeness 2026-10-04-curate-skip-ask  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack Ask is only for **buyers can add to collections** off (`allowForward` false / RELIST_NOT_ALLOWED). Look-only follow cannot curate and must not get pack Ask. View Ask stays on gated pack pages. |
| UX Designer | Muted why without a fake door. Trading off → no pack Ask. |
| Solution Architect | Same gates as shop Curate (`trading && !lookOnlyFollow`). |

## Platform consistency (required)

1. **Existing patterns?** Relist Ask Slice B; follow See vs Share.  
2. **Duplicates?** No.  
3. **Should reuse?** `FOLLOW_LOOK_ONLY` from curate-check; Trading.  
4. **Naming?** **Ask to put in my pack** only. Never **Ask to see** on Curate.

**Philosophy conflict?** No — this *stops* the conflict.

## Checklist scan

Permissions **OK** after gate. Other areas unchanged from skip+Ask.

## Approved scope

- Pack Ask iff Trading + not own + pack lock + not look-only follow.  
- Remove view-Ask from Curate sheet and Selection.  
- Still list blocked with why; save the rest.

## Explicitly deferred

- Upgrading look-only follow to Share (Network They see mine).
