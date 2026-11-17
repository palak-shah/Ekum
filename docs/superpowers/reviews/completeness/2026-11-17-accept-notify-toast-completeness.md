# Feature Completeness Review — Accept notify + toast

**Date:** 2026-11-17  
**Module / ask:** Sheet #14 — when shop Accepts Follow (or Connect Approve), approver gets a toast; requester gets an in-app/push notify.  
**Anchors:** `docs/features/access-and-connections.md`, `docs/features/chat.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary |
|------|---------|
| Product Manager | Requester must learn Accept happened without refreshing. Reject stays silent. |
| UX Designer | Approver toast: **Accepted** (Follow) / **Connected** (message Approve). |
| Solution Architect | Emit `FollowAllowed`; mirror `access.approved` listener. Connect notify already exists. |

## Platform consistency

1. Existing patterns? Yes — AccessApproved notify + Block toasts.  
2. Duplicates? No.  
3. Reuse? DomainEvents + NotificationListeners.  
4. Naming? Follow / Connections (not They see mine).  
5. Units? N/A.

**Philosophy conflict?** No.

## Approved scope

- Follow Accept (look/pack) + pack-upgrade Accept → notify follower.
- Approver success toasts on Follow decide + Thread Approve.
- Reject silent.

## Explicitly deferred

- Changing Connect Approve notify copy beyond existing “approved your request”.

## Sign-off

Required gaps closed: Yes · Ready: Yes  
