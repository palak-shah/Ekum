# Feature Completeness Review — Share has no view gate

**Date:** 2026-09-30  
**Module / ask:** Chat Share of 17 designs failed with “You can only share objects your business can access.” Product: share is not an access check. If the recipient cannot open a design, they Ask the supplier — already shipped.  
**Anchors:** `docs/features/explore.md`, `2026-09-03-forward-free-view-on-open-completeness.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Passing a card is free. Trust ladder runs when they open. Ask to see is the access path. |
| UX Designer | Red access error on Share is the wrong job and looks like a dead end. |
| Solution Architect | `validateProductShareable` required `postedToMarketAt`. Pack publish leaves that null. Allow **Published** (not blocked). Drafts of others stay rejected. Curate unchanged. |

---

## Platform consistency

1. **Existing patterns?** Forward free; view on open; Ask to see this pack.  
2. **Duplicates?** No.  
3. **Reuse?** Same Ask path as gated pack open.  
4. **Naming?** No “your business can access” on a successful share path.

**Philosophy conflict?** No — matches forward-free Redesign.

## Approved scope

- Chat share: published product (pack-only or Explore) when sender is not blocked.
- Recipient still gated on open; they Ask the supplier.
- Keep reject: missing, blocked, other shop’s draft.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
