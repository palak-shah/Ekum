# Feature Completeness Review — Selection Message who + what

**Date:** 2026-10-13  
**Module / ask:** Enquire Message sheet: show attachment title + Message to shop so traders know what goes and to whom.  
**Anchors:** `docs/features/chat.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Message already sends one catalog card; chrome was silent on pile + recipient. Fix trust without a second path. |
| UX Designer | Match How many: sheet title + foam “Message to {shop}”; shop avatar on composer. One job: type note and send. |
| Solution Architect | UI-only on `SelectionMessageSheet`; reuse `pickSelectionLabel` for multi; no API change. |

---

## Platform consistency (required)

1. **Existing patterns?** How many “Order goes to …” foam banner + Sheet title/Close.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same enquire send path.  
4. **Naming matches the app?** Message to {business name}; collection/design names when singular.

**Philosophy conflict?** No — fewer mysteries, same send.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Title + banner + shop avatar |
| Business rules | OK | Send unchanged |
| Workflows | OK | Explore / dock / shop / DesignSheet |
| Edge cases | OK | Multi → count label |
| Mobile / BM-07 | OK | Content-height sheet |
| First glance BM-11 | OK | Who + what louder than input alone |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Attachment title helper + Message to banner + shop avatar on enquire sheet.
- Units + chat/explore docs.

## Explicitly deferred / rejected

- Multi-shop Message.
- Changing card payload / enquire note behaviour.
