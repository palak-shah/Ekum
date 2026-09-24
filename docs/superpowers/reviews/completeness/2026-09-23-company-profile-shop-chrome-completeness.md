# Feature Completeness Review — Company profile shop chrome

**Date:** 2026-09-23  
**Module / ask:** Same shop from a 1:1. Quieter Instagram-like chrome. 2-col photo grid, no names on cells. Collections have no cover.  
**Anchors:** `docs/features/company.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed (layout redesign)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Destination stays the **shop**. Follow ≠ Request access. No chat Media / groups / team on this page. |
| UX Designer | One hero (logo, city, about). One action row. 2-col photos. Designs: first photo + **name** under the cell. Collections: first **design** photo, never `coverImage`, no title. From chat: hide Message. |
| Solution Architect | Same APIs. Thread title link passes `{ fromChat: true }`. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit buttons; Select / long-press; PageHeader back.  
2. **Duplicates?** No. Explore tiles keep names.  
3. **Should reuse?** Shortlist, access request sheet.  
4. **Naming?** Follow · Message · Request access. Designs · Collections.

**Philosophy conflict?** No if we do not add counts, Stories, Reels, or chat Media.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Shop + trade actions unchanged |
| Business rules | OK | Trust ladder |
| Workflows | OK | Tap photo → design / album |
| Edge cases | OK | Empty shop; fromChat |
| Permissions | OK | Own shop: no Follow / Request |
| User states | OK | Follow / waiting / connected |
| Notifications | N/A | |
| Error handling | OK | In-page line + sheet notice |
| Scalability | OK | Existing pages |
| Mobile interactions | OK | BM-07 floater padding |
| Accessibility | OK | aria-label = name on photo |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Compact hero; drop stacked Follow explainer cards.  
- Action row: Follow · Message · Request access (stateful). Hide Message when opened from a 1:1.  
- Shop: 2-col square photo grid, hairline gutters. Design **name** under the photo (no “Design” subtitle). Collections stay photo-only.  
- Collections cell = first preview design photo — **not** cover.  
- Select / long-press on designs unchanged.

## Explicitly deferred / rejected

- Follower counts · story ring · Highlights · Reels  
- Chat Media / groups in common / team on shop  
- Removing `coverImage` from the pack editor (only unused on this shop grid)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
