# Feature Completeness Review — Pack-grant Share → Repost

**Date:** 2026-11-14  
**Module / ask:** Rename trader-facing pack-grant permission copy from **Share** to **Repost** so it does not collide with Share sheet / icon actions. Same `look` / `pack` behaviour; internal id `share` and `/follows/share-ask` stay.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/chat.md`, `docs/features/settings.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack grant means they may put collections in their catalog / auto-repost. Calling it Share fights Explore / album / You Share. Repost matches Direct Link auto-repost language. |
| UX Designer | They see mine short label **Repost**; Requests long label **They can repost my collections**; Direct Link **Request repost**. Share sheet CTAs unchanged. |
| Solution Architect | Copy-only. Keep `id: 'share'`, `accessKind: 'pack'`, `REQUEST_SHARE_LABEL` symbol name, API paths. |

---

## Platform consistency (required)

1. **Existing patterns?** Same See / Repost checkboxes and Direct Link mill gate; only words change.  
2. **Duplicates another feature?** No — separates pack grant from Share sheet.  
3. **Should reuse an existing workflow?** Same follow decide + share-ask flows.  
4. **Naming matches the app?** Repost aligns with Followers Repost / auto-repost; Share stays for send-link.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | No behaviour change |
| Business rules | OK | look / pack unchanged |
| Workflows | OK | They see mine, Requests, Direct Link mill |
| Edge cases | N/A | |
| Permissions | OK | Pack grant still pack |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | N/A | |
| First glance (BM-11) | OK | Repost next to See is clearer vs Share icon elsewhere |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Checkbox accessible names update with labels |
| Platform consistency | OK | |

---

## Gaps

None.

---

## Approved scope for this slice

- Trader strings: shortLabel **Repost**, long **They can repost my collections**, **They can repost**, **Request repost**, **Wants to repost all your collections**, revoke “can repost”.
- Docs lock + retarget unit/e2e string assertions.
- Leave ShareTrigger / DesignSheet / album Share / You Share alone.

## Explicitly deferred / rejected

- Renaming API `/follows/share-ask` or option id `share`.
- Renaming Share sheet / icon actions.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
