# Feature Completeness Review — Trio shows mill subset only

**Date:** 2026-09-08  
**Module / ask:** Reveal On group: living card = mill subset (not Manage main). One trio per mill × buyer.  
**Anchors:** `docs/features/orders.md`, tradelane + i-handle desk specs  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Main ticket stays buyer↔trader; group is for mill lot after Send. 2 mills ⇒ 2 groups. |
| UX Designer | Subset card + “Part of #main”; avoid same main # in two mill chats. |
| Solution Architect | Stop routing Manage parent `order_card`/`rate` to trio; mill hops already route when released + reveal. |

---

## Platform consistency (required)

1. **Existing patterns?** Living order cards; TradeLane one group per mill×buyer.  
2. **Duplicates?** No.  
3. **Reuse?** `resolveOrderCardThread` mill branch only.  
4. **Naming?** Subset `#` · part of main `#`.

**Philosophy conflict?** No — default remains I handle + no group; trio opt-in.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Parent posts stay 1:1; subset → trio |
| Business rules | OK | Multi-mill = multi-group |
| Workflows | OK | Send-hold unchanged |
| Edge cases | OK | 2+ reveal On: parent Open chat = buyer↔trader 1:1; mill card opens its trio (BM-08) |
| Permissions | N/A | |
| Notifications | N/A | |
| Mobile / BM-07 | N/A | |
| Platform consistency | OK | |

---

## Approved scope

- Remove Manage-parent routing into trio in `resolveOrderCardThread`.
- Docs: trio card = subset; multi-supplier = one group per mill.
- Keep existing “Part of {main}” on mill cards.

## Explicitly deferred

- Title format `{shop} lot · #subset` polish beyond Part of line.

## Sign-off

Ready for implementation: Yes

**Follow-up shipped:** Parent Open chat no longer picks first trio (`manageParentOpenChatThreadId` + mill **Open group chat**).
