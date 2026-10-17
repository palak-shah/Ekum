# Feature Completeness Review — bottom nav allowlist

**Date:** 2026-10-17  
**Module / ask:** Show Home · Chats · ＋ · Explore · Orders only on the four tab roots. Every other AppShell screen hides the bar from one allowlist.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/collections.md`, `docs/features/settings.md`, `docs/features/chat.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The bar is the main menu. Pushed screens (ticket, shop, You, settings, find) do not need a second way home. Explore Select still hides the bar while its dock is up. |
| UX Designer | One rule replaces per-screen opt-outs. Page docks still own the bottom. Shell padding drops with the bar (BM-07). |
| Solution Architect | `isMainMenuPath` in the shell. Delete `shouldHideAppNav` and the order-dock nav flag. `usePageOwnsBottomBand` still suppresses the traveling selection bar. |

---

## Platform consistency (required)

1. **Existing patterns?** Same glass bar; visibility is the only change.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Replaces the denylist with the tab-root allowlist.  
4. **Naming matches the app?** Home, Chats, Explore, Orders.

**Philosophy conflict?** No. Own shop, You idle, Explore album browse, and chat find / archived / starred previously kept the bar; those lines are updated so the bar is off and the page dock owns the bottom.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Allowlist `/` `/chats` `/explore` `/orders` |
| Business rules | OK | Explore selection dock still hides the bar on `/explore` |
| Workflows | OK | Back / PageHeader unchanged |
| Edge cases | OK | Redirects (`/samples`, `/catalog`, `/saved`) land on a tab or `/more` |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | Bell stays on Home |
| Error handling | N/A | |
| Scalability | OK | New routes hide the bar unless added to the set |
| Mobile interactions | OK | `pb-28` only while the bar is shown |
| First glance (BM-11) | OK | Phone: bar gone on a pushed screen; last row not under a phantom nav gap |
| Accessibility | OK | `hidden` + `pointer-events-none` on the nav |
| Platform consistency | OK | |

---

## Gaps

None required before this slice.

---

## Approved scope for this slice

- `isMainMenuPath` drives `hideAppNav`, plus Explore selection dock.
- Remove per-path hide branches, chat-thread OR, and order-dock nav flag.
- Unit allowlist, e2e expectations, and the four feature docs.

## Explicitly deferred / rejected

- Changing tab order, labels, or the ＋ sheet.
