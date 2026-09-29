# Feature Completeness Review — Follow-ask share checkbox + compact Allow

**Date:** 2026-09-28  
**Module / ask:** See-packs decide: add **They can share my collections** (off by default). Shrink **Allow** / **Decline** — not kit 40px full-width pills on an inbox row.  
**Anchors:** `docs/features/chat.md`, `docs/features/access-and-connections.md`, completeness 2026-09-28-chats-request-follow-checkboxes  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same ask as before. See = look (default on). Share = pack (default off). Allow applies the stronger checked grant. Decline deny. Followers **Change** still edits later. |
| UX Designer | Two checkboxes, then small Allow / Decline (h-8, hug content — not stretched kit Buttons). Request rows are list density, not page CTAs. |
| Solution Architect | Existing `POST /follows/decide`. see → look; share → pack (wins). Neither → Allow off. |

---

## Platform consistency (required)

1. **Existing patterns?** Same decide block on Chats Requests + Followers Asked. Pack language matches Followers **They can share**.  
2. **Duplicates another feature?** No — was deferred; now ship.  
3. **Should reuse an existing workflow?** Same API.  
4. **Naming matches the app?** **They can see my collections** · **They can share my collections** · **Allow** · **Decline**.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Share checkbox |
| Business rules | OK | Pack includes look on the server |
| Workflows | OK | Shared block |
| Edge cases | OK | Share only → pack; neither → Allow off |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | OK | Options list |
| Mobile interactions | OK | Compact CTAs; BM-07 N/A |
| Accessibility | OK | Two checkboxes |
| Platform consistency | OK | Inline, not page Button |

---

## Approved scope for this slice

- Second grant: **They can share my collections**, default off.
- Allow: share → `pack`; else see → `look`.
- Compact Allow / Decline (not full-width 40px kit Button).
- Units + existing follow-ask functional still Allow look.

## Explicitly deferred / rejected

- Native HTML checkbox.
- Changing Followers **Change** copy.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
