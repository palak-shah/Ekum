# Feature Completeness Review — Search match highlight

**Date:** 2026-10-19  
**Module / ask:** When a trader types in Find, mark the matching letters in the result text.  
**Anchors:** `docs/features/chat.md`, `docs/features/orders.md`, `docs/features/explore.md`, `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders scan a long list for the letters they just typed. The match should be visible in the name or preview, not only by the row surviving the filter. |
| UX Designer | In-thread search already uses a light warning mark. Reuse it. Do not invent a second color or a bold-only style. Truncation stays on the line so a long name is still one caption. |
| Solution Architect | One helper. Pass the typed needle into the row. Empty Find and filter chips do not highlight. Photos and status pills stay plain. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — `highlightSearchText` in thread search.  
2. **Duplicates another feature?** No. Extends the same mark to list Find.  
3. **Should reuse an existing workflow?** Yes. Same case-insensitive substring wrap.  
4. **Naming matches the app?** No new labels.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Mark typed query in visible result text. |
| Business rules | N/A | |
| Workflows | OK | Find already filters; this only paints the match. |
| Edge cases | OK | Empty query, no match in that string, multiple hits. |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Client split of already-rendered strings. |
| Mobile interactions | OK | Inline mark inside existing truncate. |
| First glance (BM-11) | OK | Mark is quiet; the name stays the caption. |
| Accessibility | OK | Mark is visual; full string remains in the line. |
| Platform consistency | OK | Same mark as in-thread search. |

---

## Gaps

None required. Photo grids (chat find photos) have no caption to mark.

## Approved scope for this slice

- Shared `highlightSearchText`.
- Chats inbox, chat find lists, Orders rows, Explore search result captions, You library names, collection Find design names.
- Unit test. Feature docs + gap matrix.

## Explicitly deferred / rejected

- Highlighting inside photos, status pills, or filter chips with no typed text.
- A new highlight color.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
