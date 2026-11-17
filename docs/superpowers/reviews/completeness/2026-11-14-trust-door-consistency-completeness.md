# Feature Completeness Review — Trust door consistency

**Date:** 2026-11-14  
**Module / ask:** One Block/Unblock meaning from chat and Network; Accept follow restores Ignored chats; Accept without Allow Repost = look; Reject denies look and pack (DL upgrade too).  
**Anchors:** `docs/features/chat.md`, `docs/features/access-and-connections.md`, Completeness `2026-11-14-requests-accept-blocked`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Block must not mean “hide chat” from shop and “leave chat” from inbox. Accept follow undoes Ignore so dual-request feels one yes. **Superseded by 4E:** Reject Ask to repost keeps Look (Repost denied only). |
| UX Designer | Shop ⋯ shows Unblock when `canUnblock`. Same toast as Chats Blocked / Connections. |
| Solution Architect | Shop Block drops thread decline. `acceptPendingDirectWith` Pending\|Archived. packAskPending: look keeps Look; deny → clear ask, Look stays (4E). |

---

## Platform consistency (required)

1. **Existing patterns?** Same block side effects API; MoreActionsSheet Unblock.  
2. **Duplicates?** Unblock on three surfaces — intentional, same API + toast.  
3. **Reuse?** `UNBLOCK_ACCESS_CLEARED_TOAST`, `applyBlockSideEffects`.  
4. **Naming?** Accept / Reject / Allow Repost; Block / Unblock.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Reject DL upgrade keeps Look (4E) |
| Workflows | OK | Ignore then Accept follow restores chat |
| Edge cases | OK | Already Active Direct = no-op |
| Permissions | OK | |
| User states | OK | |
| Notifications | OK | Block silent; share-off on Look revoke |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | |
| First glance (BM-11) | OK | |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Shop Block = chat Block (no decline; invalidate follows).  
- Shop ⋯ Unblock when blocked.  
- Accept follow activates Pending or Archived Direct.  
- packAskPending deny → keep Look, clear ask (4E); look accept → keep Look.  
- Docs + tests.

## Explicitly deferred / rejected

- Restoring look/pack on Unblock.  
- Unifying Approve/Ignore with Accept/Reject for message requests.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
