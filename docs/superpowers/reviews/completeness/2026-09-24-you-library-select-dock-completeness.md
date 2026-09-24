# Feature Completeness Review — You library select dock

**Date:** 2026-09-24  
**Module / ask:** Select own designs/collections — Curate, Order for buyer, and lifecycle (Publish / Archive / etc.)  
**Anchors:** `docs/features/catalog.md`, `docs/features/saved.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Own published lines: sell (Order for buyer) and pack (Curate). Own drafts/archive: Publish / Hide / Archive / Restore. Not Place order or Ask rates (those are inbound). |
| UX Designer | One dock, no “To selection” extra hop. Published: Order for buyer primary, then Curate · Hide · Archive. Draft: Publish · Archive. Archived: Restore. Share / Bookmark stay on Your selection (mixed piles). |
| Solution Architect | Reuse `sendToSelection` + `/selection` nav state `openOrder` / `openCurate`. Lifecycle mutations unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Shop dock is Curate · Ask rates · Order for *other* shops. Own library is the owner dock.  
2. **Duplicates another feature?** Replaces quiet To selection, does not add a second pile.  
3. **Should reuse?** How many each (buyer-only for own), Curate sheet, bulk publish/archive.  
4. **Naming matches the app?** Order for buyer · Curate · Publish · Hide · draft · Archive · Restore.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Own published only for trade verbs; drafts toast if we tried |
| Workflows | OK | Collections still resolve on Your selection |
| Edge cases | OK | Empty pick disables |
| Permissions | OK | Curate if selling or trading |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Existing toasts |
| Scalability | N/A | |
| Mobile interactions | OK | Extra dock row → extra list padding (BM-07) |
| Accessibility | OK | Named buttons |
| Platform consistency | OK | |

---

## Approved scope for this slice

- You / catalog select dock: trade verbs on **Published**; lifecycle on the matching filter.
- Drop **To selection** copy/button.

## Explicitly deferred / rejected

- Ask rates / Place order on own library.
- Bookmark / Share on this dock.
- Trade dock on own public shop (still none).

## Sign-off

Required gaps closed: Yes. Ready: Yes.
