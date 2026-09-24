# Feature Completeness Review — Starred home on Chats ⋯

**Date:** 2026-09-24  
**Module / ask:** Drop **You → Starred**. Cross-chat starred list lives on **Chats → ⋯ → Starred**, next to Archived. Thread search **Starred** stays this-chat-only.  
**Anchors:** `docs/features/chat.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two homes for the same list is clutter. Thread filter ≠ all-chats list. One occasional home. |
| UX Designer | Same pattern as **⋯ → Archived**. You keeps Saved (catalog), not chat stars. |
| Solution Architect | Same page + `/messages/starred`. Route `/chats/starred` (before `:id`). Old `/starred` redirects. |

---

## Platform consistency (required)

1. **Existing patterns?** Chats header ⋯ floating menu; PageHeader list.  
2. **Duplicates?** Removes You duplicate. Thread Starred remains in-chat.  
3. **Should reuse?** Existing StarredMessagesPage.  
4. **Naming?** Starred.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Menu + list + tap → thread `?message=` |
| Business rules | OK | Unchanged API |
| Workflows | OK | Star in thread → ⋯ Starred |
| Edge cases | OK | Empty copy |
| Permissions | N/A | |
| User states | OK | `/starred` redirect |
| Notifications | N/A | |
| Error handling | OK | Existing error state |
| Scalability | N/A | |
| Mobile interactions | OK | Same menu as Archived |
| Accessibility | OK | menuitem Starred |
| Platform consistency | OK | Not a You row |

---

## Approved scope for this slice

- **⋯ → Starred** → `/chats/starred`. Remove You row. Redirect `/starred`. Back to Chats. Thread filter unchanged.

## Explicitly deferred / rejected

- Starred as a third All Chats / Requests tab

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
