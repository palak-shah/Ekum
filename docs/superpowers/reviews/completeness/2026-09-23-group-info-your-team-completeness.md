# Feature Completeness Review — Your team on the group page

**Date:** 2026-09-23  
**Module / ask:** On the group Businesses tab, show **your team** below the shop list.  
**Anchors:** `docs/features/chat.md`, `docs/features/00-concepts.md`, `2026-09-23-group-info-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | A group is still **shops**. Traders also need to see **who from our shop** is on this chat — not the other shops’ staff. That is already on the thread (`people`). Putting it under the shop list answers “who is here” without a Members tab. |
| UX Designer | Same row language as businesses (48 avatar + name). Section title **Your team** (start-chat language). Search stays shops-only; hide the team block while typing. Owners **Change** opens the existing Team on chat sheet — no inline add/remove, no second ＋. |
| Solution Architect | `ThreadDetail.people` is already our company only. No API change. Reuse `ThreadPeopleSheet`. |

---

## Platform consistency (required)

1. **Existing patterns?** Company rows; Team on chat sheet; **Your team** naming from new-chat.  
2. **Duplicates another feature?** Settings **Team on chat** stays the manage entry; this is the **see** list. Same sheet.  
3. **Should reuse?** `people`, `TeamPersonRow` sheet, `canManagePeople`.  
4. **Naming?** **Your team**. Owner on the owner row. No Members / Admin.

**Philosophy conflict?** No if we never list other shops’ people.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | List our people under shops |
| Business rules | OK | Our side only; owners last (same as sheet) |
| Workflows | OK | Change → existing sheet |
| Edge cases | OK | Hidden while searching shops; hide if no people |
| Permissions | OK | Everyone sees; only owners Change |
| User states | OK | After add/remove, query cache already updates |
| Notifications | N/A | |
| Error handling | OK | Sheet errors unchanged |
| Scalability | OK | Typical shop team is small |
| Mobile interactions | OK | Extra block above existing BM-07 padding |
| Accessibility | OK | Section heading; Change labeled |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Other shops’ staff under businesses

| Field | Content |
|-------|---------|
| Gap | WhatsApp shows every person |
| Why it matters | Ekum never sends their roster |
| Impact if ignored | Philosophy break |
| Recommendation | **Your team** = our `people` only |
| Priority | Reject / Redesign |

---

## Approved scope for this slice

- Businesses tab: after the shop list, **Your team** (staff, then owners).  
- Rows match shop rows (avatar + name; **Owner** as the quiet line).  
- Hide while the shop search has text.  
- Owners: **Add** opens Team on chat; **×** takes staff off. Settings row stays. (Manage slice: `2026-09-23-group-info-team-manage-completeness.md`.)

## Explicitly deferred / rejected

- Other shops’ people  
- Inline toggle / ＋ for team on this tab  
- Renaming the Businesses tab to Members  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
