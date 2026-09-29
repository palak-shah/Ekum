# Feature Completeness Review — Drop Connection Pause

**Date:** 2026-09-29  
**Module / ask:** Remove **Pause** from Connections. Keep **Block**. Chat noise stays **Mute**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pause was a third “turn them down” next to Block, Mute, and follow Stop. Traders will not use it. Block = they are gone. Mute = still trade, quiet chat. |
| UX Designer | Active card: **Block** only. No Pause. If a row is already paused (old data), **Resume** stays so they are not stuck. |
| Solution Architect | `canPause` always false. `POST .../pause` refused. `paused` status + Resume stay. Visibility for paused leftovers unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Silent Block; Mute on chat; follow Stop.  
2. **Duplicates another feature?** Pause duplicated Block + Mute.  
3. **Should reuse an existing workflow?** Block / Mute / Stop.  
4. **Naming matches the app?** Block / Unblock / Resume (legacy only).

**Philosophy conflict?** No — dropping Pause matches fewer taps.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Block unchanged |
| Business rules | OK | Approve still cannot clear a block |
| Workflows | OK | |
| Edge cases | OK | Legacy paused → Resume |
| Permissions | OK | Same actor rules |
| User states | OK | |
| Notifications | N/A | Still silent |
| Error handling | OK | Pause API refused |
| Scalability | N/A | |
| Mobile interactions | OK | One action |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Connections UI: no Pause. Block on active. Resume only if already paused. Unblock if blocked by me.
- API: `canPause` false; pause action rejected. Resume still works.
- Docs + e2e (no Pause button) + API spec.

## Explicitly deferred / rejected

- Migrating paused rows to active or blocked.
- Removing `paused` from the database enum.
- A new Mute button on Connections.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
