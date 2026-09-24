# Feature Completeness Review — Selection floater Order + view

**Date:** 2026-09-24  
**Module / ask:** Client wants **Order** as the floater’s main CTA. Keep a way to **view** the pile (count / thumbs).  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Order is the job; the list is still needed for mixed shops, faded lines, and album resolve. Two targets on one chip — not a second cart. |
| UX Designer | Same pill. Count + thumbs open Your selection. Accent **Order** reuses `/selection` + `{ openOrder: true }` (already used after Pick designs). No extra verbs on the chip (Curate / Bookmark / Share stay on the page). |
| Solution Architect | No new API. Existing SelectionPage `openOrder` handoff. |

---

## Platform consistency (required)

1. **Existing patterns?** Compact floater; Order primary on Your selection; nav state resume.  
2. **Duplicates?** No — not a shop dock.  
3. **Should reuse?** HowManyEach + collection resolve on Your selection.  
4. **Naming?** Order. Count line stays “N in selection”.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | View vs Order |
| Business rules | OK | Same skip/unavailable as page Order |
| Workflows | OK | Albums still resolve on Selection |
| Edge cases | OK | Floater still hidden on `/selection` / shop dock |
| Permissions | N/A | |
| User states | OK | Empty pile hides chip |
| Notifications | N/A | |
| Error handling | OK | Sheets / toasts on Selection |
| Scalability | N/A | |
| Mobile interactions | OK | Two hit targets; chip still above nav |
| Accessibility | OK | Named View / Order buttons |
| Platform consistency | OK | Not a one-off checkbox/pill row |

---

## Approved scope for this slice

- Split floater: count + thumbs → Your selection; **Order** → Your selection and start Order (resolve / qty).  
- Docs + functional: View still opens the list; Order on the chip opens the order sheet.

## Explicitly deferred / rejected

- Curate / Bookmark / Share on the floater  
- Order without landing on Your selection (back from the sheet would be orphaned)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
