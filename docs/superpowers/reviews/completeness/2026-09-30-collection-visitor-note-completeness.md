# Feature Completeness Review — Collection pack note for visitors

**Date:** 2026-09-30  
**Module / ask:** Supplier/trader pack **Description** must show to buyers/traders on the album, before designs. 3–4 lines; longer → subtle **View more**.  
**Anchors:** `docs/features/collections.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Description is written for the other shop, not for Edit. If buyers never see it, the field is wasted. Show on the album they open. |
| UX Designer | After the shop row, before the design grid. Four-line clamp. Quiet **View more** (accent link, not a second chrome row). Expand in place. Same on our album so we see what they see. |
| Solution Architect | `Collection.description` already stored. Attach on `CollectionPreviewView` only (not Explore tiles). Gated packs can still show the note. |

---

## Platform consistency

1. **Existing patterns?** Shop row + handle copy + designs. Home already says View more. Note link = `cxNoteLink` weight.  
2. **Duplicates?** Design-sheet notes stay on the design.  
3. **Reuse?** Album viewer, not a new page.  
4. **Naming?** **View more** / **View less**. No “Description” heading.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Filled note → show on album (owner and visitor). |
| Business rules | OK | Same audience as the album. |
| Workflows | OK | Open pack → read note → browse designs. |
| Edge cases | OK | Empty/whitespace hidden. Gated pack still shows note. |
| Permissions | OK | Preview already 404s when they cannot see the pack. |
| User states | OK | Visitor vs owner. |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | 1000-char field. |
| Mobile interactions | OK | Clamp, no extra sticky bar (BM-07 unchanged). |
| Accessibility | OK | Button name View more / View less. |
| Platform consistency | OK | |

---

## Approved scope

- Preview API includes pack `description`.  
- Album: note above designs (after shop row) for visitors **and** owner. `line-clamp-4` + **View more** when overflow.

## Explicitly deferred

- Description on Explore / shop tiles.

## Sign-off

Required gaps closed: Yes  
Ready: Yes
