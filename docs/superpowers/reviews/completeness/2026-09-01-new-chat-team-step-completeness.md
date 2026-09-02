# Feature Completeness Review — New chat team step + Your people

**Date:** 2026-09-01  
**Module / ask:** Drop New chat pills. Shops → optional Your team → Open chat / group name (one footer CTA; no Skip). Align ⋯ **Your people** list with that team row language (no second entry).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. One ＋ sheet. One existing-chat roster path (⋯ Your people). No Private/Team chat labels.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Need at least one other business. Team is optional. Owners add staff at start or later. Open chat / Next with nobody selected means no staff on create. |
| UX Designer | Pills force a two-tap round-trip. Sequential shops then Your team. Header Back = previous step; Close = dismiss; one footer CTA (no Skip). Your people: same rows, live Add / ×, search; no why-line. |
| Solution Architect | No API change. Create still sends `memberUserIds`. Your people still `POST /threads/:id/members` and `…/remove`. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Sheet Back/Close squares; accent-border rows; attach Select all only on the draft team step.  
2. **Duplicates another feature?** No — Your people stays the only open-chat roster.  
3. **Should reuse an existing workflow?** Yes — same team list language; Find on Ekum stays on the shop step.  
4. **Naming matches the app?** New chat · Your team (start step) · Your people (⋯) · Open chat · Create. No Private / Team on chats.

**Philosophy conflict?** No — company ↔ company; staff are our-side only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Sequential steps; empty team + Open chat / Next; Your people Add / take off |
| Business rules | OK | Owners-only team pick; min one other shop; clone SAME_CHAT unchanged |
| Workflows | OK | No staff / non-owner skips team step; 1 shop vs 2+ |
| Edge cases | OK | Empty team + Next / Open chat; Back keeps picks |
| Permissions | OK | chats cap; team list + Your people owners only |
| User states | OK | No connections; no staff |
| Notifications | N/A | Same first-reach rules |
| Error handling | OK | Start errors in-sheet; people errors toast |
| Scalability | OK | Same team list |
| Mobile interactions | OK | Fixed sheet height; sticky footer; BM-07 |
| Accessibility | OK | Back / Close / Search your team named |
| Platform consistency | OK | No second thread header control |

---

## Gaps

### G-001 — Phone address book

| Field | Content |
|-------|---------|
| Gap | Device contacts. |
| Why it matters | Privacy / web limits. |
| Impact if ignored | Invite still OS share. |
| Recommendation | **Defer** (same as 2026-09-01-new-chat-sheet). |
| Priority | Future improvement |

---

## Approved scope for this slice

- New chat: `shops` → `team` (if owner + staff) → `name` / Open chat. One footer on team (Open chat / Next). Header Back. No pills. Skip retired.
- Your people: drop why-line; search; accent Add / selected + ×. Immediate mutate. Title stays Your people.

## Explicitly deferred / rejected

- Second entry on the thread header  
- Renaming Your people → Your team  
- Team after the group name  
- Phone-book sync  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
