# Feature Completeness Review — Chats Requests follow decide checkboxes

**Date:** 2026-09-28  
**Module / ask:** See-new-packs asks on Chats **Requests**: replace **They can see / They can share** with grant **checkboxes** (default: they can see my collections), plus **Allow** / **Decline**. More grants later.  
**Anchors:** `docs/features/chat.md`, `docs/features/access-and-connections.md`, `docs/features/00-concepts.md`, ui-quality-bar §4b  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The ask is to see packs. Default grant is see collections. Allow applies checked grants (today = look). Decline = deny (silent). **They can share** (pack) is a later checkbox — still changeable on Followers **Change**. |
| UX Designer | User asked checkboxes (exception to accent-row selection). Compact square checks + Allow / Decline like first-chat Approve / Ignore density. Options list so a second grant does not need a third CTA. |
| Solution Architect | Same `POST /follows/decide`. Map: see → `look`; future share → `pack`; none checked → Allow disabled. |

---

## Platform consistency (required)

1. **Existing patterns?** Requests first-chat **Approve · Ignore**. Followers Asked is the same decide job.  
2. **Duplicates another feature?** No — same ask, new chrome.  
3. **Should reuse an existing workflow?** Same decide API + one shared decide block on Chats Requests **and** Followers Asked.  
4. **Naming matches the app?** **They can see my collections** · **Allow** · **Decline** (not They can see / They can share as peer buttons).

**Philosophy conflict?** No. User confirmed checkboxes for this grant list.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Unchecked Allow disabled |
| Workflows | OK | Followers Asked same block |
| Edge cases | OK | Several asks; each row own checks |
| Permissions | OK | |
| User states | OK | First-chat rows unchanged |
| Notifications | N/A | Existing |
| Error handling | OK | Existing toast |
| Scalability | OK | Options array |
| Mobile interactions | OK | Compact row; no extra chrome |
| Accessibility | OK | `role=checkbox` + Allow/Decline |
| Platform consistency | OK | Shared block |

## Approved scope for this slice

- Grant option list: **They can see my collections** default on.
- **Allow** → `look`. **Decline** → `deny`.
- Shared UI on Chats Requests and Followers Asked.
- Unit: default on; Allow look; Decline deny; Allow off when unchecked.

## Explicitly deferred / rejected

- **They can share** checkbox (pack) — shipped 2026-09-28-follow-ask-share-checkbox.
- Native HTML checkbox only; we use a tappable square (checkbox role).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units; existing requests journey still Approve/Ignore for first chat)
