# Feature Completeness Review — Business profile section borders

**Date:** 2026-11-17  
**Module / ask:** Prototype groups Business Profile blocks with a light border. Ekum already cards Contacts/Team; catalogue sat ungrouped.  
**Anchors:** `docs/features/company.md`, `docs/features/home.md`  
**Disposition:** Proceed

> Visual grouping only. No Catalogue heading (tabs stay the chrome). Same foam card as Business info / Contacts (`rounded-xl border border-line bg-surface`).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Sections are look, not new jobs. View more / Team / edit unchanged. |
| UX Designer | Light border around catalogue; Business info title sits in the card header like Contacts. No second title language. |
| Solution Architect | Class on existing section wrappers. No API. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — foam cards already on Business info.  
2. **Duplicates?** No.  
3. **Reuse?** Same `border-line` card.  
4. **Naming?** No new labels.  
5. **Units?** N/A.

**Philosophy conflict?** No. Older visual-alignment lock asked for a Catalogue heading — still omitted; grouping is the border.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Layout |
| First glance (BM-11) | OK | Phone: catalogue in a quiet card |
| Mobile / BM-07 | OK | Dock clearance stays outside the card |
| Platform consistency | OK | |

## Approved scope

- Catalogue (Home + visitor shop) in one light-border foam card; tabs + list + View more inside.  
- Business info `h2` becomes the first card’s header row.  
- Contacts / Team cards unchanged.

## Explicitly deferred

- Catalogue heading text, prototype yellow nudge, extra section titles.
