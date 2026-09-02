# Feature Completeness Review — chat private escalate

**Date:** 2026-08-27  
**Module / ask:** Owner opens a **Private** (`owner_only`) 1:1 while already connected / already in the **Team** trade thread — pricing or a sensitive escalate, hidden from their staff. Rename list labels to **Team** / **Private**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Private is an owner side door on an existing relationship, not a second Message path for everyone.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already do business in the Team thread (staff, orders). They need a private line at that moment — not only a buried New-menu step. Staff must never start or see it. |
| UX Designer | Primary: quiet **Private** text in the Team thread header (not a third icon). Same job on connected profile as ghost **Private chat** under Message. New menu **Private chat** is fallback. Labels **Team** / **Private**. Hint once: *Hidden from your team.* |
| Solution Architect | Reuse `POST /threads/direct` + `findDirect` keyed on pair + visibility. No schema change. Profile Message stays default `shared`. |

---

## Platform consistency (required)

1. **Existing patterns?** Trust ladder unchanged (already connected). Kit: header text action + ghost `Button` under primary Message. Inbox labels stay muted `text-xs`.
2. **Duplicates another feature?** No — two threads already exist; this is the missing start path from the Team thread.
3. **Should reuse an existing workflow?** Yes — same start-direct API as New chat / profile Message.
4. **Naming matches the app?** **Team** / **Private**. No Seller/Buyer. No DM.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Find-or-create owner_only; navigate to that thread. |
| Business rules | OK | Owners only. Staff 404 on owner_only (existing). |
| Workflows | OK | Thread header → profile ghost → New-menu fallback. Drop Who can see this? |
| Edge cases | OK | Already has Private → reopen same thread. Groups / Private thread → no escalate control. |
| Permissions | OK | `useTeamCaps().isOwner`. Staff New menu stays company + group. |
| User states | OK | Unconnected Message stays Team (requests). Own company profile: no Private. |
| Notifications | N/A | Existing thread/message notify; no new event type. |
| Error handling | OK | Thread header: danger toast. Profile: existing action error. Sheet: InlineNotice. |
| Scalability | OK | One extra find-or-create. |
| Mobile interactions | OK | Text **Private** in header; no new sticky bar (BM-07 N/A). |
| Accessibility | OK | `aria-label` includes hidden-from-team. |
| Platform consistency | OK | Matches kit; no one-off checkbox. |

---

## Gaps

None Required.

### G-001 — Jump back to Team from Private

| Field | Content |
|-------|---------|
| Gap | Private thread has no **Team** shortcut. |
| Why it matters | Owner may want to return to the trade thread. |
| Impact if ignored | They use inbox or company name — two taps. |
| Recommendation | Inbox already shows both labeled rows. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Labels: **Team** / **Private** on direct threads (helper, inbox, header, share/forward, start titles).
- Owner: **Private** on Team 1:1 header; ghost **Private chat** on connected profile; New menu **Team chat** + **Private chat** + **New group**; skip visibility step.
- Staff: no Private entries; Message / Chat with a company → Team.
- Docs + units + `@functional @chat` owner escalate from seed Team thread.

## Explicitly deferred / rejected

- Merging Team and Private
- Inbox filters by visibility
- Staff seeing or starting Private
- Changing unconnected Message
- Team shortcut from Private header (G-001)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
