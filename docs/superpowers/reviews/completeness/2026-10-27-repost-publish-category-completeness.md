# Feature Completeness Review — Repost publish without Category pick

**Date:** 2026-10-27  
**Module / ask:** Explore per-post Repost succeeds and the new pack shows under **You** — Category must not block peer Repost.  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader taps Repost, toast may say already-reposted, Explore shows nothing under **You**. Cause: publish requires Category; Repost has no picker; failed create is deleted (or leftover draft 409s as success). Skip/i is not this hole. |
| UX Designer | Do **not** add a Category field on Repost. Supplier already categorized; old packs may have none. Sheet job stays Who / Publish. |
| Solution Architect | Stamp source `masterCategoryId` on create. Publish uses `required: false` when this is a peer Repost. Reuse leftover draft instead of `ALREADY_REPOSTED`. Own Explore pin already exists. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — create already `required: false`; comments say supplier categorized.  
2. **Duplicates another feature?** No picker.  
3. **Should reuse an existing workflow?** Yes — source Category, same publish Who.  
4. **Naming matches the app?** You / Repost.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Copy source Category; publish peer Repost without a pick |
| Business rules | OK | Own editor publish still requires Category when 0 or 2+ shop categories |
| Workflows | OK | Explore per-post Repost |
| Edge cases | OK | Old source with no Category; leftover draft; mill category not in follower list (resolve already allows) |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Draft reuse; still show other publish exceptions in **i** |
| Scalability | N/A | |
| Mobile interactions | OK | No new chrome |
| First glance (BM-11) | OK | Sheet unchanged |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Stamp source pack/design Category on Repost create.  
- Peer Repost publish does not require a Category pick.  
- Leftover draft from a failed publish is reused (not “already reposted” with no live post).  
- Own live pack still appears on Buying / Stories **You**.

## Explicitly deferred / rejected

- Category picker on the Repost sheet (still deferred).  
- Making pack-only designs curatable.

## Test plan

- Unit: create stamps source Category; draft reuse; publish peer Repost `required: false`.  
- Trader-eye: Repost a listed mill pack → post under **You**.
