# Feature Completeness Review — Group identity inline

**Date:** 2026-09-23  
**Module / ask:** Group page circle should show a small camera to add a photo. The name under the circle should be editable. **Add a line** should expand a small text field in place (not a sheet).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `2026-09-23-group-info-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Photo, name, and one-line are the same owner job already on the group page. A sheet for “Add a line” and no way to rename fights “decisions at the moment they matter.” |
| UX Designer | Stay on the hero. Camera badge on the existing circle. Tap name → kit `TextInput` in that slot. **Add a line** / tap the line → same field expands there. Save on Enter or blur. No second chrome row. |
| Solution Architect | Extend `PATCH /threads/:id/group-profile` with optional `title` (same 1–120 as create). Photo + blurb already persist. Owners only. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `TextInput`, hidden file input + `uploadImage` (Group photo sheet), accent camera like catalog pick.  
2. **Duplicates another feature?** Thread ⋯ **Group photo** sheet can stay for the chat; group page is the primary place.  
3. **Should reuse?** Same `group-profile` PATCH.  
4. **Naming?** **Add a line** stays. No Description / Admin / Subject.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Photo · name · one-line on the hero |
| Business rules | OK | Owners only; empty name keeps the last name |
| Workflows | OK | Tap circle / name / Add a line — no sheet |
| Edge cases | OK | No photo → initial + camera; upload fail → danger toast |
| Permissions | OK | Non-owners: static photo / name / line |
| User states | OK | Header title follows saved name |
| Notifications | N/A | Silent rename |
| Error handling | OK | Danger toast |
| Scalability | N/A | One row update |
| Mobile interactions | OK | Inputs in the scroll hero; no sticky clip (BM-07) |
| Accessibility | OK | Camera labelled Add photo; name field labelled |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Rename on create-only slice

| Field | Content |
|-------|---------|
| Gap | 2026-09-23-group-info deferred name edit |
| Why it matters | Default titles are joined shop names |
| Impact if ignored | Traders cannot name the group after create |
| Recommendation | Allow `title` on group-profile |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Owner: camera badge on the photo circle → pick image → save immediately.  
- Owner: tap the name → inline `TextInput`; Enter / blur saves (trim, 1–120). Empty revert.  
- Owner: **Add a line** or tap the line → inline `TextInput` (80 chars) in that slot.  
- Non-owner: no camera, name and line are text only.  
- Thread ⋯ Group photo sheet unchanged.

## Explicitly deferred / rejected

- Changing name/photo from the thread header without opening the group page  
- Emoji-only names / description rich text  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
