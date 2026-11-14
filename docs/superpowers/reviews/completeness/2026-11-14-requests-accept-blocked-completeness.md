# Feature Completeness Review — Requests Accept + Blocked list

**Date:** 2026-11-14  
**Module / ask:** Follow-ask → **Accept / Reject** + optional **Allow Repost**; Accept follow also opens a pending message request; Block clears both Follow directions and leaves chat in All; Unblock = Connection only + both-sides toast; Chats ⋯ **Blocked**.  
**Anchors:** `docs/features/chat.md`, `docs/features/access-and-connections.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Accept implies see; optional Allow Repost → pack. Dual request (message then follow): Accept follow opens pending Direct. Block is a hard cut — delete both Follows; Unblock does not restore look/pack. Chat stays in All until Archive/Delete. |
| UX Designer | Why-line **Wants to see your collections**; one checkbox **Allow Repost**; **Accept** / **Reject**. Message requests stay **Approve** / **Ignore** (different job on same list). Unblock toast covers both sides. ⋯ Blocked like Archived. |
| Solution Architect | Clear Follows in `ConnectionService` block only. `FollowService.decide` accepts pending Direct after Connection. Unblock Active only. |

---

## Platform consistency (required)

1. **Existing patterns?** Same FollowAskDecideRow / Connections unblock / Archived occasional list.  
2. **Duplicates another feature?** Blocked under Chats ⋯ + Network Connections — dual entry OK; same Unblock + toast.  
3. **Should reuse an existing workflow?** Thread accept path; Connections list for blocked shops.  
4. **Naming matches the app?** Accept/Reject vs Approve/Ignore intentional. Allow Repost short.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Ask UI; follow→thread; Block clears Follows |
| Business rules | OK | Unblock no look/pack restore; Reject DL upgrade keeps Look |
| Workflows | OK | Message then follow; Block → Archive/Delete for chat hide |
| Edge cases | OK | No pending thread → no-op; Ignore archived ≠ pending |
| Permissions | OK | Blocker-only Blocked list |
| User states | OK | |
| Notifications | OK | Block stays silent |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Compact CTAs; Allow Repost one line |
| First glance (BM-11) | OK | Accept loud; Allow Repost quiet |
| Units | N/A | |
| Accessibility | OK | Checkbox labelled Allow Repost |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Follow ask: why-line, drop See, **Allow Repost** off by default, **Accept** / **Reject**; Accept → look or pack.  
- DL Request repost: Accept/Reject; Reject keeps Look.  
- They see mine allowed: keep See + Repost + Stop.  
- `decide` look/pack → accept pending Direct with follower.  
- Block: delete both Follows + DL revoke; no thread decline.  
- Unblock: Connection Active + toast both sides.  
- Chats ⋯ Blocked → `/chats/blocked`.

## Explicitly deferred / rejected

- Renaming Approve/Ignore on message requests.  
- Restoring look/pack on Unblock.  
- Auto-Archive chat on Block.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
