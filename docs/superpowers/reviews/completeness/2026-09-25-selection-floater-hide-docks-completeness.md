# Feature Completeness Review — Selection floater vs page docks

**Date:** 2026-09-25  
**Module / ask:** “4 in selection” covers Decline / Send quote on order detail; can cover any page dock. Hide or move.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Ticket desk is one job. The pile is another. Floater must not sit on Decline / Send quote. Pile stays; open it from Explore / Chats list / Your selection. |
| UX Designer | Same hide-when-band-owned rule as chat composer and shop dock. No drag-to-move pill (new gesture). No second dismiss control. |
| Solution Architect | Extend `shouldShowSelectionWorkspaceBar` by path. List `/orders` still shows the floater. |

---

## Platform consistency (required)

1. **Existing patterns?** Hide floater when another chrome owns the band above nav.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same helper.  
4. **Naming matches the app?** Selection / Your selection unchanged.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hide on docks; pile unchanged |
| Business rules | OK | |
| Workflows | OK | Order list / Explore still open the pile |
| Edge cases | OK | `/orders` list vs `/orders/:id` |
| Permissions | N/A | |
| User states | OK | Count > 0 still on Explore |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07: dock buttons fully tappable |
| Accessibility | OK | No covered Decline |
| Platform consistency | OK | Rejected drag-to-move |

---

## Approved scope for this slice

- Hide the Selection floater on screens that own the band above nav: order detail, photo-order builder, invite landing, design pages, pack viewer, design set, catalog editors.
- Keep it on Explore, Chats list, Orders **list**, idle company shop (no trade dock).

## Explicitly deferred / rejected

- **Rejected:** Draggable / “move this pill.” New gesture; hide is the product pattern.
- Home / Saved own-name.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
