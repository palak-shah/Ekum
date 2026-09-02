# Feature Completeness Review — empty-network Explore CTAs

**Date:** 2026-08-26  
**Module / ask:** New users with no chats/connections feel trapped on Share and Chats — link to Explore business discovery.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Navigation-only slice. Trust ladder unchanged — discovery stays on Explore; Share still posts to chats or 48h link.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Share assumes a network; cold users need a clear “find someone on Ekum” path without inventing phone lookup in Chats. |
| UX Designer | Replace dead-end “No chats yet” with plain copy + **Find in Explore** CTA; Chats empty + Start chat picker match. |
| Solution Architect | No API changes; `/explore?show=businesses&search=1` reuses existing directory + search. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Button` + `Link`; EmptyState secondary action; ConnectionPicker empty messaging.  
2. **Duplicates?** No new discovery surface — deep link to Explore.  
3. **Reuse?** Same Explore URL everywhere; 48h link unchanged for single-item share.  
4. **Naming?** **Find in Explore** / **Find businesses** — plain trader language.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | CTAs navigate to Explore businesses + search |
| Business rules | OK | No trust bypass |
| Workflows | OK | Share empty → Explore → profile → Message |
| Edge cases | OK | Multi-select share still no multi-link; copy unchanged |
| Permissions | N/A | |
| User states | OK | Zero chats / zero connections |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile interactions | OK | Full-width buttons in sheet |
| Accessibility | OK | Links are real `Link`/`href` |
| Platform consistency | OK | |

---

## Approved scope for this slice

- `CatalogShareSheet` empty chat list → message + Explore CTA; 48h link remains for single item.
- `ChatsPage` empty All Chats → secondary **Find businesses** → Explore.
- `ConnectionPicker` embedded empty → **Find in Explore** link.
- Docs + unit tests.

## Explicitly deferred

- Platform company search inside Share sheet or Chats ＋.
- Phone lookup in chat start.
- Auto-start-thread on pick.

## Sign-off

Proceed — navigation gap only; matches docs and trust ladder.
