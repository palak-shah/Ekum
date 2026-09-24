# Feature Completeness Review — Invite to group from ＋

**Date:** 2026-09-23  
**Module / ask:** Move Share group off the group page. When adding with ＋, show share / invite last; tap opens the phone’s share apps.  
**Anchors:** `docs/features/chat.md`, `2026-09-23-group-info-completeness.md`  
**Disposition:** Proceed (small redesign)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Hero Share is a second path next to ＋. Growing the group is one job: add a connected shop **or** send a link. |
| UX Designer | Do **not** wait until after Add succeeds. Quiet **Share invite** under the ＋ list (not a second full-width CTA). Tap opens OS share apps. Hero stays photo / name / line. Prefetch the join link so share stays in the tap. |
| Solution Architect | Same `POST /threads/:id/invite-link` + `shareOrCopyInvite`. No new API. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet + last action; OS share like connect invite.  
2. **Duplicates another feature?** Removes hero Share.  
3. **Should reuse?** Existing invite token.  
4. **Naming?** Quiet **Share invite** (Add stays the only CTA).

**Philosophy conflict?** No if invite is not hidden behind a completed Add.

---

## Approved scope for this slice

- Remove **Share group** from the group hero.  
- ＋ **Add businesses** sheet: quiet **Share invite** under the list. Prefetch the join link so the tap can open OS share apps. Copy only when the browser has no share picker.  
- Add footer is the only full-width CTA. Invite works with zero picks.

## Explicitly deferred / rejected

- A second screen after Add  
- Inviting people who are not Connected without the existing join rules  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
