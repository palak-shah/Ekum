# Feature Completeness Review — Empty Save in Draft stays in the editor

**Date:** 2026-10-22  
**Module / ask:** New collection **Save in Draft** may be empty (name / category / designs). After save, stay on `/catalog/collections/:id` so the trader can keep adding name, designs, and Publish. Own draft from You opens the **editor**, not an empty album.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed (Redesign vs “Save in Draft leaves to You → Untitled list”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | First-time seller Save in Draft to park work, not to get dumped on a dead album. Empty draft is allowed; the job after save is still **name this pack / add designs / Publish**. You list still shows **Untitled** if they leave without a name. |
| UX Designer | One job: keep editing. No hop to You then hunt Draft. Own unpublished tile → editor (viewer hides unpublished members — empty grid). Published You tiles still open the album. Sticky Create & Publish / Save in Draft stay on create; after first save the page is Edit (Update collection). |
| Solution Architect | `completeCreate` already POSTs then navigates. Draft path navigates to editor instead of `?tab=collections`. Hydrate identity once per id so membership invalidate cannot wipe a typed name. PATCH collection before membership on Update. Category errors on Category, not under Collection name. |

---

## Platform consistency (required)

1. **Existing patterns?** Create dock, kit Field errors, You list Draft chip, editor `/catalog/collections/:id`.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same editor after create as Edit collection details.  
4. **Naming matches the app?** Untitled · Save in Draft · Collection name · Category.  
5. **Units?** N/A this slice.

**Philosophy conflict?** Yes — prior docs sent empty Save in Draft to the list. **Redesign** those lines, then Proceed. One job per screen: stay in the editor.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Empty Save in Draft allowed; stay on editor; Publish still needs name + category + ≥1 design |
| Business rules | OK | Unique names unchanged (clash sheet). Category required only on Publish / API patch when catalog has options |
| Workflows | OK | Create & Publish still leaves to published You list |
| Edge cases | OK | Own draft / ready / archived from You → editor; published → viewer + packManage |
| Permissions | OK | Owner only |
| User states | OK | Remount `/new` → `/:id` hydrates from GET |
| Notifications | OK | Toast **Collection saved** |
| Error handling | OK | Name error under name; category under Category |
| Scalability | N/A | |
| Mobile interactions | OK | Same sticky dock; content not clipped (BM-07) |
| First glance (BM-11) | OK | Name + Category still the identity job; empty album is not the landing |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Field error on the labeled control |
| Platform consistency | OK | No new chrome |

---

## Gaps

None Required after Redesign of the leave-to-list copy.

---

## Approved scope for this slice

- Save in Draft (empty or named) stays on `/catalog/collections/:id`.  
- You / library tap on own draft, ready, or archived collection opens the editor. Published stays viewer.  
- Identity hydrate once per collection id; Update PATCHes collection from the current form **before** membership invalidate.  
- Category API/client errors on `MasterCategoryField`; Collection name only for name errors.  
- Docs + units + creation journey.

## Explicitly deferred / rejected

- Unbury Publish onto the create dock as a second primary (Publish stays album **⋯** after first save).  
- Bottom **＋** collection-only (buy-only still Orders).  
- Viewer showing unpublished members to owners (editor is the manage surface).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
