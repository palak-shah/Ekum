# Feature Completeness Review — chat visibility labels

**Date:** 2026-08-27  
**Module / ask:** Distinguish owner-only vs team 1:1 chats with the same company in inbox and thread header.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Display only. Existing `shared` / `owner_only` model. Copy matches start-chat: **Team can see** / **Only you**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Owners can open two threads with one shop; unlabeled rows cause mistakes (share/forward to the wrong one). |
| UX Designer | Quiet muted label next to title and in header subtitle — not StatusPill. Both labels on direct chats. |
| Solution Architect | `ThreadSummary.visibility` already on API. Helper + UI. No schema change. |

---

## Platform consistency

1. **Existing patterns?** StartChatSheet wording; muted `text-xs`.  
2. **Duplicates?** No — start-chat already uses these words; list/header did not.  
3. **Reuse?** Same strings; apply on list, header, share/forward pickers.  
4. **Naming?** **Team can see** / **Only you**.

**Philosophy conflict?** No.

---

## Approved scope

- `threadVisibilityLabel` for direct threads
- Inbox title row, thread header subtitle, CatalogShareSheet + forward picker

## Deferred

- Visibility filters / tabs
- Staff seeing owner-only threads

## Sign-off

Proceed.
