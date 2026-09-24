# Feature Completeness Review — Owner add / take off Your team

**Date:** 2026-09-23  
**Module / ask:** On the group page, owners should add or take off people from this chat.  
**Anchors:** `docs/features/chat.md`, `2026-09-23-group-info-your-team-completeness.md`, `2026-09-01-chat-membership-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Seeing Your team without a way to change it is half the job. Only **our** staff. Owners already do this on ⋯ **Team on chat**. Put the same actions on the list they just saw. |
| UX Designer | **Add** opens the existing Team on chat sheet (who is not on the chat yet). Staff already on the list get **×** (same as TeamPersonRow). Owners have no ×. Not a second ＋ next to shop search. Not on the public shop profile. |
| Solution Architect | Reuse `POST /members` and `/members/remove`. `canManagePeople` = owner. |

---

## Platform consistency (required)

1. **Existing patterns?** Team on chat sheet; × take-off; Add/Selected rows.  
2. **Duplicates?** Settings and thread ⋯ still open the same sheet.  
3. **Should reuse?** `ThreadPeopleSheet`, `removeMember`.  
4. **Naming?** **Add** · take off. No Members / Admin / Kick.

**Philosophy conflict?** No if other shops’ people stay hidden and 1:1 still goes to the shop (⋯ Team on chat there).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Add sheet + × staff |
| Business rules | OK | Owners only; cannot × an owner |
| Workflows | OK | Same APIs as ⋯ |
| Edge cases | OK | Clone conflict sheet unchanged |
| Permissions | OK | `canManagePeople` |
| User states | OK | List updates from thread query |
| Notifications | N/A | Existing member pings |
| Error handling | OK | Danger toast |
| Scalability | N/A | |
| Mobile interactions | OK | × is 44px row, not a tiny target only |
| Accessibility | OK | aria-label take off by name |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Your team header **Add** (owners) → Team on chat.  
- Staff rows: **×** take off this chat.  
- Hide while searching shops.  
- 1:1: no shop-profile team block — ⋯ **Team on chat** stays.

## Explicitly deferred / rejected

- Other shops’ staff  
- Invite to the **company** (that stays You → Team)  
- Media / groups-in-common on the shop  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
