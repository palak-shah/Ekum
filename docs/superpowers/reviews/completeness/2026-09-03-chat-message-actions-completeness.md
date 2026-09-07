# Feature Completeness Review — chat message actions

**Date:** 2026-09-03  
**Module / ask:** Reply / Forward / Copy / Star / Edit / Delete (for me + for everyone); forward text + order card; no Select all; order teaser strip for non-parties  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, TradeLane / soft-hide  
**Disposition:** Proceed

> Expands WhatsApp-like message chrome without weakening order party / reveal gates.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need Forward on text/orders; Star + Edit + Delete match phone habits. Order forward must not probe soft-hidden mills. |
| UX Designer | Chevron menu; Delete sheet (me / everyone); no Select all (spam). Star in-thread chip + You list. |
| Solution Architect | MessageHide / MessageStar / editedAt / deletedForEveryoneAt; edit 15m; delete-everyone 1h; order ref party gate in resolver. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — MessageChrome chevron, kit Sheet, You list rows, thread search chips.  
2. **Duplicates another feature?** No — Star ≠ Saved (catalog).  
3. **Should reuse an existing workflow?** Forward dock stays; drop Select all only.  
4. **Naming matches the app?** Delete for me / Delete for everyone; Starred; Edited.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Full menu + homes |
| Business rules | OK | Windows + party gate locked |
| Workflows | OK | |
| Edge cases | OK | Tombstone; hide; non-party order |
| Permissions | OK | Own edit/delete-everyone; company hide |
| User states | OK | |
| Notifications | N/A | No notif for star/hide |
| Error handling | OK | Toast / sheet |
| Scalability | OK | Indexed joins |
| Mobile interactions | OK | Sheet + BM-07 existing dock |
| Accessibility | OK | aria on menu |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Menu: Reply, Forward, Copy, Star, Edit (own text ≤15m), Delete for me, Delete for everyone (own ≤1h)
- Forward: text, photo, design, collection, order card (stripped teaser if non-party)
- Remove thread Select all / Clear float; tap select; cap Forward at 10
- Star: thread chip + You → Starred list
- Completeness docs + chat.md + tests

## Explicitly deferred / rejected

- Delete for everyone on others’ messages  
- Edit cards/photos/orders  
- Forward payment/system  
- Bare order-id forward as product path  

## Sign-off

Disposition **Proceed**.  
