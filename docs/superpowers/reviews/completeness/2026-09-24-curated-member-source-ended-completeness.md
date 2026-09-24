# Feature Completeness Review — Curated member fade when source ended

**Date:** 2026-09-24  
**Module / ask:** On a trader’s curated pack, fade a design when the mill has ended it (archive / unpublish). Do not drop it because they only edited their album.  
**Anchors:** `docs/features/saved.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Curate is a design pointer. Ending the design ends the live offer. Taking it out of one mill album does not. |
| UX Designer | Same gray + reason as Your selection (**Archived** / **Not published**). Still listed; no select / order. Look (photos) stays. Owner can × on edit. |
| Solution Architect | Use `Product.status` already on pack members. No live-mirror of mill `CollectionProduct`. |

---

## Platform consistency (required)

1. **Existing patterns?** Selection fade + `reasonFromProductStatus` + `isPublishedForSelection`.  
2. **Duplicates?** No — pack viewer was missing the fade.  
3. **Should reuse?** Those helpers.  
4. **Naming?** **Archived** · **Not published** · **No longer available**.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Fade on viewer + editor; skip order/select |
| Business rules | OK | Status only — not mill album membership |
| Workflows | OK | Owner removes via × if they want it gone |
| Edge cases | OK | Pack-only Published design stays if mill only left their album |
| Permissions | N/A | |
| User states | OK | Owner and buyer both see fade |
| Notifications | N/A | No ping when mill archives |
| Error handling | OK | Toast if they try to select |
| Scalability | OK | No extra API |
| Mobile interactions | OK | Tile fade; no new chrome |
| Accessibility | OK | Reason text on the tile |
| Platform consistency | OK | |

---

## Approved scope

- Fade + reason on collection viewer tiles and editor member thumbs when status is not Published.
- Block select / long-press / How many each (already published-only).
- Photo look still allowed.
- Docs: mill album edit ≠ fade; mill archive/unpublish = fade.

## Explicitly deferred

- Auto-remove from the curated pack.
- Push when the mill archives.
- Hide from buyers entirely (fade instead).

## Sign-off

Yes · 2026-09-24
