# Feature Completeness Review — Save in Draft leaves to You list + toast

**Date:** 2026-11-18  
**Module / ask:** Client bug #58 — **Save in Draft** navigates to You library list with success toast (no longer stay on editor).  
**Anchors:** `docs/features/collections.md`, `2026-10-22-collection-empty-draft-stay-editor-completeness` (superseded for leave path)  
**Disposition:** Redesign → Proceed

> Supersedes the leave-path lock in `2026-10-22-collection-empty-draft-stay-editor`: empty/named Save in Draft now **leaves** to the list. Own draft tiles from You still open the **editor**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Client wants “saved” feedback and a list home after parking a draft. Toast confirms; list shows Untitled / Draft chip so they can reopen. Publish path unchanged (already leaves). |
| UX Designer | One clear done state: leave editor → You Collections/Catalogs list + toast. Re-enter via You draft tile (still editor). No second Save path. |
| Solution Architect | `completeCreate` / draft save: navigate with `youLibraryHrefAfterPackPublish` (same as publish leave); keep toast. Drop `stayOnEditor` for plain Save in Draft. Append mid-flow may still stay if product needs it — this slice: **always leave on Draft save**. |

---

## Platform consistency (required)

1. **Existing patterns?** Publish already leaves via `youLibraryHrefAfterPackPublish` + toast.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same leave href as Publish.  
4. **Naming matches the app?** Save in Draft · Collection saved.  
5. **Units?** N/A.

**Philosophy conflict?** Yes vs 2026-10-22 stay-on-editor → **Redesign** that leave path, then Proceed.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Draft save → list + toast |
| Business rules | OK | Empty draft still allowed |
| Workflows | OK | You draft tile → editor unchanged |
| Edge cases | OK | Catalog vs regular list target |
| Permissions | OK | Owner only |
| User states | OK | Remount editor from You |
| Notifications | OK | Toast on leave |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | |
| First glance (BM-11) | OK | List is the home after save |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | Matches Publish leave |

---

## Gaps

### G-001 — Update feature docs + e2e that asserted stay

| Field | Content |
|-------|---------|
| Gap | `collections.md` + `creation.collection.journey` expect stay-on-editor. |
| Recommendation | Rewrite leave copy; assert list URL + toast. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Save in Draft (empty or named) → You library list (`youLibraryHrefAfterPackPublish`) + success toast.  
- Own draft from You still opens editor.  
- Publish leave unchanged.  
- Docs + units + creation journey.

## Explicitly deferred / rejected

- Stay-on-editor after Save in Draft (superseded).  
- Changing You draft → editor open behavior.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
