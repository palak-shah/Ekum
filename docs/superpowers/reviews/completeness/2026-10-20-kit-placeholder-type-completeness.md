# Feature Completeness Review — Kit placeholder type

**Date:** 2026-10-20  
**Module / ask:** All field placeholders the same as Rate / Category: 14px roman muted (not italic, not 16px ghost).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Placeholder hints should read as one quiet caption language across collection create and the rest of the kit. Rate already set the size; other fields should not look like a different type system. |
| UX Designer | Italic + 16px + muted/50 made Rate look smaller than Collection search / set-contains / Design name. One token: 14px, roman, muted. Typed text stays 16px so iOS does not zoom. |
| Solution Architect | One `FIELD_PLACEHOLDER_CLASS` on kit TextInput chrome and TextArea. Callers that already set `placeholder:` keep their override. No copy change; no new placeholders on Collection name / Description. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Field / TextInput / TextArea. Matches Category `text-sm` and Rate placeholder.  
2. **Duplicates another feature?** No — same chrome, one size.  
3. **Should reuse an existing workflow?** N/A (visual token).  
4. **Naming matches the app?** Unchanged copy.

**Philosophy conflict?** No.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | N/A | Visual only |
| Business rules | N/A | |
| Workflows | N/A | |
| Edge cases | OK | Fields that set their own `placeholder:` skip kit tokens |
| Permissions | N/A | |
| User states | OK | Empty Rate / 1 set contains / search / design name / notes |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Typed `text-base` unchanged (iOS zoom). No sticky chrome change (BM-07). |
| First glance (BM-11) | OK | Placeholders quieter and even; one job still the form |
| Accessibility | OK | Placeholder is hint only; labels unchanged |
| Platform consistency | OK | Kit-wide so every screen matches Rate, not a collection-only one-off |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Kit TextInput + TextArea placeholders: `placeholder:not-italic placeholder:font-body placeholder:text-sm placeholder:text-muted`.
- Rate field inherits the same tokens (no one-off).
- Units + trader-eye on New collection Rate / 1 set contains.

## Explicitly deferred / rejected

- Adding placeholders to Collection name / Description.
- Shrinking typed text to 14px on all fields (iOS zoom).
- Optional / “Choose a category” copy.

---

## Decision

**Proceed.**
