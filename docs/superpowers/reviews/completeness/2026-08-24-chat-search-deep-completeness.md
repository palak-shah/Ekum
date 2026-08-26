# Feature Completeness Review — chat search scopes + inbox deep

**Date:** 2026-08-24  
**Module / ask:** In-thread search chips (All / Photos / Collections / Designs / Orders), case-insensitive search, inbox deep search with why-line  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Aligns with existing in-thread search jobs; inbox extends the same needle with a clear match reason.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need to find chats by order # / shared pack name, not only company name. Why-line prevents “mystery” rows. |
| UX Designer | Same list chrome; deep hits replace muted preview with `In chat · …`. Chips match FilterRail + Chip kit. |
| Solution Architect | Extend `GET /threads?q=` + message list `view` values; case-insensitive JSON via targeted queries; no new surface. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Chats list row, FilterRail chips, in-thread search band.  
2. **Duplicates another feature?** No — Notifications remain separate.  
3. **Should reuse an existing workflow?** Reuse in-thread needle fields for inbox.  
4. **Naming matches the app?** Photos (not Media); Designs / Collections; `In chat ·` plain language.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Chips + case + inbox deep |
| Business rules | OK | Participant-scoped only |
| Workflows | OK | Search → open thread (`?message=` when hit id available) |
| Edge cases | OK | Empty q; no matches; name vs deep hit |
| Permissions | OK | Same thread membership |
| User states | OK | Active + requests tabs |
| Notifications | N/A | |
| Error handling | OK | Empty state copy |
| Scalability | Later | Cap catalog id lookups / message id scans |
| Mobile interactions | OK | Chip rail scroll; BM-07 N/A (no sticky over list) |
| Accessibility | OK | Chip buttons, aria on search |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Cap deep scan volume

| Field | Content |
|-------|---------|
| Severity | Later |
| Notes | Limit product/collection name lookups and orderLabel id scans (e.g. 200–500) to keep inbox search snappy. |

---

## Disposition rationale

Proceed: extends shipped chat search without new IA; why-line resolves the only UX risk of deep inbox match.
