# Feature Completeness Review — Curate skip + Ask (no trap)

**Date:** 2026-10-04  
**Module / ask:** Curate / Your selection must not trap on a red “not visible” dump. Show which designs are blocked and why; Ask on those that need permission; Save / add the rest.  
**Anchors:** `docs/features/saved.md`, completeness 2026-09-24-curate-pack-errors  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Ceiling is still true; the job is save the rest, Ask the locked — not scold. |
| UX Designer | Muted why-lines. Per-row Ask + Ask for all N. Save M. No danger dump of API English. |
| Solution Architect | Sheet runs `curate-check`; PUT only `allowedProductIds`. Relist Ask reuse. View-Ask only when we have a pack id. |

## Platform consistency (required)

1. **Existing patterns?** Selection Ask + Curate sheet + InlineNotice muted.  
2. **Duplicates?** No — this is the missing skip that 2026-09-24 already approved.  
3. **Should reuse?** `POST /collections/curate-check`, `POST /relist-requests`.  
4. **Naming?** **Ask to put in my pack** · **Ask to see this pack** · **Can't see this now**.

**Philosophy conflict?** No.

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | List blocked; save allowed; Ask row + bunch |
| Business rules | OK | Ceiling unchanged |
| Workflows | OK | Sheet stays useful |
| Edge cases | OK | Zero allowed → no Save; stay; Ask if lock |
| Permissions | OK | Same gates |
| User states | OK | Waiting for Allow |
| Notifications | N/A | Chat Allow already exists |
| Error handling | OK | PUT fail → re-check, skip, no trap |
| Scalability | OK | One check POST |
| Mobile / chrome | OK | Sheet list scrolls |
| First glance (BM-11) | OK | Quiet why, Save still loud for rest |
| Accessibility | OK | |
| Platform consistency | OK | |

## Approved scope

- Curate sheet: check, blocked list + why + Ask, Save M.
- Your selection: muted lock copy (not danger red).
- Name clash stays **Add to it**, muted notice.

## Explicitly deferred

- Auto-rename packs.
- Asking view-access without a pack id.
