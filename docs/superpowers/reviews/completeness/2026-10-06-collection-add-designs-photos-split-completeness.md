# Feature Completeness Review — collection Designs / Photos split

**Date:** 2026-10-06  
**Module / ask:** New collection empty CTA opens camera for “Designs”, prompting permission even when picking existing designs. Split **Designs** (library) vs **Photos** (camera/gallery). Teach one-photo-per-design via Done/outcome language, not unread sublabels.  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`, Add designs empty CTA  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two doors: library vs capture. Permission only when Photos. Same-design extras stay tap-tile → Add photos. |
| UX Designer | Side-by-side tiles. Camera Done = **Add N designs** for new-design batches. No Designs on camera. People don’t read fine print — teach by outcome. |
| Solution Architect | CollectionEditorPage CTAs + optional ContinuousCamera doneLabel / batchAsDesigns. Recipient/create logic unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Match Add designs one-photo-per-design outcome; kit dashed CTAs; ContinuousCamera Gallery.  
2. **Duplicates?** No — restores clearer two-door entry.  
3. **Reuse?** Library sheet + camera + member Add photos.  
4. **Naming?** Designs · Photos · Add N designs · Gallery.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Library vs camera split |
| Business rules | OK | One photo → one design on Photos path |
| Workflows | OK | Append path keeps Done |
| Edge cases | OK | Camera fail → gallery |
| Permissions | OK | Camera only on Photos |
| User states | OK | Create empty + add-more |
| Notifications | N/A | |
| Error handling | OK | Existing upload errors |
| Scalability | N/A | |
| Mobile interactions | OK | Fullscreen camera |
| First glance (BM-11) | OK | Two equal doors |
| Accessibility | OK | Distinct test ids / labels |
| Platform consistency | OK | |

---

## Approved scope

- Completeness Proceed.  
- Side-by-side Designs / Photos; omit Designs on collection camera; Done = Add N designs for new-design batch.  
- Docs + units + gap matrix + trader-eye.

## Explicitly deferred

- Renaming Photos tile to “One photo per design” (keep Photos).  
- Changing Photo order Done label.  
- Redesigning member Add photos sheet.

## Disposition rationale

Fixes permission spam and design-vs-photos confusion with structure + outcome language, aligned with Add designs.
