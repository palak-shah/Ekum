# Feature Completeness Review — Multi-buyer catalog Share (chats only)

**Date:** 2026-09-11  
**Module / ask:** Catalog Share sheet — select 1 or many companies (Find on Ekum, Clear, 48h link); post cards to chats; no buyer groups / Broadcast compose  
**Anchors:** `docs/features/explore.md`, `docs/features/broadcast.md`, `docs/features/catalog.md`, ConnectionPicker / FindOnEkumBlock  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need to send one pack/design to several buyers without Broadcast compose. Buyer groups stay on Publish/Network. |
| UX Designer | Reuse ConnectionPicker multi + Find on Ekum + Clear + primary Share CTA + quiet 48h link. Accent-border select rows. |
| Solution Architect | Per company: `POST /threads/direct` then card message(s). Never `/broadcasts`. Open chat only when N=1. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — ConnectionPicker, FindOnEkumBlock, Sheet CTA, InlineNotice, 48h share link.  
2. **Duplicates another feature?** No — Broadcast compose stays hidden; this is chat delivery only.  
3. **Should reuse an existing workflow?** Yes — embed ConnectionPicker; do not invent checkboxes.  
4. **Naming matches the app?** Share / Find on Ekum / Clear / Share a link · 48 hours.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | 1 / many companies → chat cards |
| Business rules | OK | No buyer groups on Share; link for single item |
| Workflows | OK | Selection / album / collection editor call sites unchanged |
| Edge cases | OK | Empty connections → Find on Ekum + Explore + link |
| Permissions | OK | API still gates card share |
| User states | OK | |
| Notifications | N/A | Existing chat delivery |
| Error handling | OK | In-sheet InlineNotice |
| Scalability | Later | Sequential posts OK for Phase 1 |
| Mobile interactions | OK | Sheet list + bottom CTA; BM-07 via Sheet |
| Accessibility | OK | Buttons / labels |
| Platform consistency | OK | |

---

## Gaps

None Required for this slice.

---

## Approved scope for this slice

- Rebuild `CatalogShareSheet`: multi-select companies, Find on Ekum, Clear, Share CTA, 48h link  
- Chat delivery only (`/threads/direct` + messages)  
- Docs: explore + broadcast Share wording  
- Unit specs

## Explicitly deferred / rejected

- Buyer group chips / `POST /broadcasts` from Share  
- Broadcast compose navigation  
- Batch broadcast API for multi-item Selection

## Sign-off

Proceed — implement approved scope only.
