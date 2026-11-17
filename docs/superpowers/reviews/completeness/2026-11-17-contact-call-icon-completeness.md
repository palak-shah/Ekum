# Feature Completeness Review — Contacts call icon

**Date:** 2026-11-17  
**Module / ask:** Call icon beside each Contacts phone; tap opens device dialer (`tel:`).  
**Anchors:** `docs/features/company.md`  
**Disposition:** Proceed

> Completeness keeps Ekum coherent. Same Connection/opt-in gate as today’s phones — no new visibility.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders expect dial from a shared contact number, not copy-paste. |
| UX Designer | Trailing call icon beside number (sibling to Map text link). Icon is the tap; number stays readable. |
| Solution Architect | `tel:` href with digits/+ only. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Map trailing external action on Business info.  
2. **Duplicates?** No.  
3. **Reuse?** Kit icon + Contacts card.  
4. **Naming?** Call / `aria-label="Call"`.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Edge matrix

| Edge | Assert |
|------|--------|
| Phone present | Call link `tel:+…` |
| Phone null | No call control |
| Spaces/dashes in display | Href strips to `+` and digits |
| Not Connected / no Contacts | Section hidden (unchanged) |

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Opt-in phones only |
| Workflows | OK | |
| Edge cases | OK | Matrix above |
| Permissions | OK | Existing gate |
| User states | OK | Own + Connected |
| Notifications | N/A | |
| Error handling | N/A | OS dialer |
| Scalability | N/A | |
| Mobile interactions | OK | 48px hit on icon |
| First glance (BM-11) | OK | Quiet trailing icon |
| Units | N/A | |
| Accessibility | OK | aria-label Call |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope

- `PhoneIcon` + Contacts trailing `tel:` control.
- Docs + unit.

## Explicitly deferred

- WhatsApp / SMS / copy number.
- Dial from name row.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
