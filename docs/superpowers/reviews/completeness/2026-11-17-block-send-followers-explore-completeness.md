# Feature Completeness Review — Block send gate + Follow/Explore wipe (#4–#8)

**Date:** 2026-11-17  
**Module / ask:** Client sheet #4–#8 — Block must stop delivery on existing Direct; Follows leave They see mine; Explore/stories hide; Block/Unblock toasts; reject toast-on-every-toggle.  
**Anchors:** `docs/features/access-and-connections.md`, `docs/features/chat.md`, `docs/features/00-concepts.md`, Completeness `2026-11-14-requests-accept-blocked-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Extends silent Block without auto-Archive (still rejected).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Silent Block: chat stays in All for the blocker; blocked sender must not land in their inbox. Unblock = Connection only, toast that collection access is cleared — not See/Share restore. No toast spam on See/Repost ticks. |
| UX Designer | Keep `'Blocked'` / Unblock cleared toasts. Toggle ticks are enough feedback for Follow access. |
| Solution Architect | Gate Direct `send` with `isBlocked`; fix `startDirect` restore so Archived self is not reactivated while blocked. Follow delete already in `applyBlockSideEffects`; invalidate web caches. Explore already Active-only + open `isBlocked`. |

---

## Platform consistency (required)

1. **Existing patterns?** Silent new-DM Archive recipient; Follow wipe on Block; Unblock toast.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** `VisibilityService.isBlocked`, `applyBlockSideEffects`.  
4. **Naming matches the app?** Cannot message / silent block — plain.  
5. **Units?** N/A.

**Philosophy conflict?** No — aligns with silent Block; does not auto-Archive chat.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Send gate + restore fix + invalidate |
| Business rules | OK | No auto-Archive; Unblock no look/pack |
| Workflows | OK | Block from chat / Connections / shop |
| Edge cases | OK | Existing Direct; startDirect restore while blocked |
| Permissions | OK | `isBlocked` |
| User states | OK | |
| Notifications | OK | No notify when blocked |
| Error handling | OK | Forbidden `CANNOT_MESSAGE` for clear UI |
| Scalability | N/A | |
| Mobile interactions | OK | Toasts only |
| First glance (BM-11) | OK | |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Existing Direct still delivers after Block

| Field | Content |
|-------|---------|
| Gap | `send` ignores Block when both participants remain Active. |
| Why it matters | Client #4 — blocked buyer reaches trader inbox. |
| Impact if ignored | Silent Block is a lie on open threads. |
| Recommendation | Direct send: if counterpart blocked sender → `CANNOT_MESSAGE`; no create / notify. |
| Priority | Required before implementation |

### G-002 — `startDirect` restores Archived while blocked

| Field | Content |
|-------|---------|
| Gap | Existing-thread restore runs before block check. |
| Why it matters | Blocked party can re-enter Active. |
| Recommendation | Do not restore Active when target has blocked actor. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Direct `sendMessage`: blocked-by-counterpart → reject (`CANNOT_MESSAGE`); no inbox bump.  
- `startDirect` existing: no Active restore while blocked.  
- Web: invalidate `follows` / connections / explore-related keys on Block; Connections Block toast `'Blocked'`.  
- Audit #7 restore See/Share = misunderstanding; #8 reject (no toggle toasts).  
- Docs one-liner on access/chat.

## Explicitly deferred / rejected

- Auto-Archive / Delete chat on Block (still rejected).  
- Restoring look/pack on Unblock.  
- Toast on every See/Repost permission change (#8).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
