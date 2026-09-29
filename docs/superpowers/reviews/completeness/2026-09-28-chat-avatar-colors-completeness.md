# Feature Completeness Review — Chat avatar colors

**Date:** 2026-09-28  
**Module / ask:** Chats list circles use multiple colors when there is no photo, like WhatsApp.  
**Anchors:** `docs/features/chat.md`, `docs/features/00-concepts.md`, ui-quality-bar kit reuse  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | No-photo shop/group circles must not all be the same teal. Color is a glance cue, not a status. |
| UX Designer | Same kit `Avatar` as the rest of the app — hashed from the name, white initials. Photos unchanged. |
| Solution Architect | Stable hash of `name`. Palette of mid tones with white text. No extra API. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Avatar` (Chats, Explore, Network).  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Avatar everywhere — not a Chats-only circle.  
4. **Naming matches the app?** No new copy.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Color ≠ Connected / unread |
| Workflows | N/A | |
| Edge cases | OK | Empty name; photo still wins |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | N/A | Size unchanged |
| Accessibility | OK | `alt` / initials stay |
| Platform consistency | OK | Kit, not a one-off |

## Approved scope for this slice

- Kit Avatar (and group hero with no photo) uses a name-stable palette.
- Unit: same name → same tone; two names can differ; photo still renders image.

## Explicitly deferred / rejected

- Color meaning (status / role).
- Per-company color stored on the server.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units; visual check on Chats)
