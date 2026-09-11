# Feature Completeness Review — New collection photos = Add designs camera

**Date:** 2026-09-11  
**Module / ask:** New collection / edit collection **Photos** capture should use the same ContinuousCamera path as **Add designs** (not native one-shot `capture`).  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`, `ContinuousCamera`, DesignBatchPage  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same job (each photo → draft design) must not teach two camera habits. |
| UX Designer | Phone: Photos → ContinuousCamera (Gallery on chrome). Desktop: file multi-select. Drop Camera/Gallery sheet. Designs library sheet unchanged. |
| Solution Architect | Reuse ContinuousCamera + uploadImage; create pending photos / edit quick-create products unchanged after files land. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — ContinuousCamera from Add designs / Photo order.  
2. **Duplicates another feature?** No — aligns capture only.  
3. **Should reuse an existing workflow?** Yes — ContinuousCamera.  
4. **Naming matches the app?** Photos / Designs; each photo → draft design.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Continuous capture → pending / library designs |
| Business rules | OK | Cap 24; one photo = one design |
| Workflows | OK | New + edit album Photos |
| Edge cases | OK | Camera unavailable → gallery; park sheet not needed (no Update sheet) |
| Permissions | OK | uploads already required |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Existing upload errors |
| Scalability | OK | |
| Mobile interactions | OK | Portal camera; BM-07 N/A (fullscreen) |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope

- Phone **Photos** → ContinuousCamera (Gallery on chrome); desktop → gallery multi-select  
- Remove Camera/Gallery choice sheet  
- Docs: collections.md  
- Unit: max-shots helper reuse

## Explicitly deferred

- Redirecting New collection into full Add designs batch screen  
- SKU naming parity with Add designs (`EK-…`) for quick photos

## Sign-off

Proceed — implement approved scope only.
