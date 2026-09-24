# Feature Completeness Review — Your selection: Curate check is not “can't see”

**Date:** 2026-09-24  
**Module / ask:** Curate-check `Can't see this now` painted on Selection rows the trader can still open, Share, or Order  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> List fade is discovery only. Curate-check stays a Curate filter.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Looking at a design ≠ putting it in your pack. Gray “can't see” on Share piles is a lie. |
| UX Designer | List: Archived / Not published / No longer available, or **Can't put in a pack** + Ask. Curate sheet keeps skip + gray. |
| Solution Architect | Drop `curateBlockedReasons` from row chrome. Keep the query for Curate Save filter. |

---

## Platform consistency (required)

1. **Existing patterns?** Selection fade + pack-lock Ask.  
2. **Duplicates?** No.  
3. **Reuse?** `resolveDesignAvailability`, `packLockReason`.  
4. **Naming?** **Can't put in a pack** for seller lock — not **Can't see this now** on the list.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Share/Order unchanged |
| Business rules | OK | Curate still skips blocked ids |
| Workflows | OK | |
| Edge cases | OK | Trading on + viewable mill designs |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Approved scope

- Selection list does not fade/reason from `curate-check`.  
- Docs: list vs Curate sheet.

## Explicitly deferred / rejected

- Mixed 48h two links.  
- Changing curate-check API.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit; existing selection journeys)  
