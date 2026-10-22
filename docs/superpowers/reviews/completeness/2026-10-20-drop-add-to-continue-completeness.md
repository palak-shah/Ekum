# Feature Completeness Review — Drop Add designs to continue

**Date:** 2026-10-20  
**Module / ask:** New collection dock: always **Create & Publish** · **Save in Draft**. No **Add designs to continue**.  
**Anchors:** `docs/features/collections.md`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Empty create already has the two add tiles. A second dock CTA that only scrolls is extra. Publish stays gated on name / category / designs. |
| UX Designer | One sticky row: **Create & Publish** (disabled until ready) · **Save in Draft**. Hero tiles / **tap to change** strip stay. |
| Solution Architect | Remove the empty-dock branch and scroll ref. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Dual create dock.  
2. **Duplicates another feature?** Continue duplicated the add tiles.  
3. **Should reuse an existing workflow?** Same add tiles.  
4. **Naming matches the app?** **Create & Publish**. **Save in Draft**.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Dock primary is always Create & Publish |
| Business rules | OK | Enable rules unchanged |
| Workflows | OK | Create only |
| Edge cases | OK | Empty still Save in Draft |
| Permissions | N/A | |
| User states | OK | Empty: disabled Publish; after members: same button enables when ready |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Same dock height (BM-07) |
| First glance (BM-11) | OK | Add tiles do the add job; dock is publish / draft |
| Accessibility | OK | Named Create & Publish |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Always **Create & Publish** · **Save in Draft**.  
- Keep **N designs · tap to change**.  
- Docs + e2e chrome.

## Explicitly deferred / rejected

- Removing **Save in Draft**.  
- Removing the tap-to-change strip.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
