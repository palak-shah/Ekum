# Feature Completeness Review — chat thread ⋯ parity with long-press

**Date:** 2026-11-14  
**Module / ask:** Inside a thread, ⋯ should expose the same chat hygiene options as All Chats long-press (Pin · Mute · Mark as unread · Archive · Clear · Delete / Exit group · Block). **Team on chat** stays thread ⋯ only (not long-press). **Block** absolute last on 1:1. Groups keep **Exit group** label.  
**Anchors:** `docs/features/chat.md`, `docs/features/00-concepts.md`, Completeness `2026-09-22-chats-inbox-row-menu`, `2026-09-29-inbox-menu-block-last`, `2026-09-29-direct-title-is-shop`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders should not hunt the inbox to Archive / Clear / Delete / Block while already in the chat. Prior IA kept Clear/Delete on the row only — that forced an extra back-tap. Parity is the shorter path. Team stays on thread ⋯ (owners) — not diluted onto every long-press. |
| UX Designer | Same MoreActionsSheet chrome. Everyday first (Pin · Mute · Team/group photo), hygiene mid (unread · Archive · Clear), rare last (Leave / Exit / Delete / Remove), **Block** absolute last on 1:1. WhatsApp verbs where the job matches; Ekum keeps Team / Group photo / Remove group. No ⋯ Media. |
| Solution Architect | Reuse `POST /threads/inbox-actions`, pin/alert patches, leave, Network block. After Archive / Delete / Block / Exit / Mark unread → navigate to inbox (thread open would re-mark read). Clear stays on the empty thread. No new APIs. |

---

## Platform consistency (required)

1. **Existing patterns?** MoreActionsSheet; ConfirmActionSheet; inbox-actions; Team on chat sheet.  
2. **Duplicates another feature?** Complements long-press; does not replace it. Group Settings still has Mute · Pin · Team · Leave · Remove (label drift on Leave vs Exit group deferred).  
3. **Should reuse an existing workflow?** Yes — same endpoints as All Chats row menu.  
4. **Naming matches the app?** Pin chat · Mute · Mark as unread · Archive · Clear chat · Delete chat · **Exit group** · Block · Team on chat.  
5. **Units?** N/A.

**Philosophy conflict?** No — fewer taps, WhatsApp judgment for shared jobs, Ekum-only Team stays thread ⋯.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hygiene on thread ⋯; Team thread-only |
| Business rules | OK | Our-shop Clear/Delete; Block = Network; Exit = leave |
| Workflows | OK | Confirms for Clear / Delete / Exit / Leave / Remove |
| Edge cases | OK | Mark unread → leave thread; last 1:1 owner no Leave |
| Permissions | OK | Team / Group photo owners; Block needs counterpart |
| User states | OK | Unpin / Unmute labels |
| Notifications | N/A | Mute unchanged |
| Error handling | OK | Toast / InlineNotice patterns |
| Scalability | OK | One thread |
| Mobile interactions | OK | Sheet above composer; BM-07 confirm sheets |
| First glance (BM-11) | OK | Destructive last; Team mid for owners |
| Units | N/A | |
| Accessibility | OK | menuitem sheet; aria on ⋯ |
| Platform consistency | OK | |

---

## Gaps

None Required.

### Deferred

| Field | Content |
|-------|---------|
| Gap | Group Settings still says **Leave** vs thread/list **Exit group** |
| Why | Settings rewrite out of scope; Exit locked on list + thread ⋯ this slice |
| Priority | Future improvement |

| Field | Content |
|-------|---------|
| Gap | Unarchive label on thread ⋯ when opened from Archived |
| Why | `ThreadDetail` does not expose `inboxHiddenAt`; open chats from All are Archive |
| Priority | Future improvement |

---

## Approved scope for this slice

- Thread ⋯ order: Pin · Mute · Group photo (group owners) · Team on chat (owners) · Mark as unread (when read) · Archive · Clear chat · **1:1:** Leave (if `canLeave`) · Delete chat · **Block** last · **Group:** Exit group · Remove group (owners)  
- Same APIs as long-press / leave / block  
- Confirm Clear / Delete / Exit / Leave / Remove  
- Post-action navigate for Archive / Delete / Block / Exit / unread  
- Docs + unit order lock + `@chat` functional check  
- **Not** Team on long-press; **not** ⋯ Media; **not** Lock / Favourites / lists  

## Explicitly deferred / rejected

- Team on long-press  
- Media in ⋯  
- WhatsApp Lock / Favourites / lists  
- Group Settings Leave → Exit group rename  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
