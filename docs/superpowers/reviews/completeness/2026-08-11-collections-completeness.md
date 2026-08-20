# Feature Completeness Review — Collections

**Date:** 2026-08-11  
**Module / ask:** Buyer collection view + shortlist → order/ask rates; selection clear  
**Anchors:** `docs/features/collections.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Collections are albums of designs, not a second photo store. Seller create/publish is important but out of this slice’s journey; buyer path + shortlist clear is Required. |
| UX Designer | Shortlist sticky bar; Select all / Clear all; no ghost selection after order (BM-03). |
| Solution Architect | Reuse CollectionViewer + order builder/ask-rates; membership M2M already exists. |

---

## Platform consistency (required)

1. **Patterns?** Yes — Explore/company → `/collections/:id`; designs vs collections tabs stay separate.  
2. **Duplicates?** No — not a second catalog root.  
3. **Reuse?** Ask rates / place order reuse Orders workflows.  
4. **Naming?** Albums / designs (not “posts” vanity).

**Philosophy conflict?** No. Reject treating collections as independent photo dumps without product rows.

---

## Gaps

### G-001 — Shortlist → order/ask rates clears selection

| Field | Content |
|-------|---------|
| Gap | BM-03 persist race — needs `@functional` proof |
| Why it matters | Ghost selection confuses next order |
| Impact if ignored | Wrong designs submitted / user distrust |
| Recommendation | Functional journey after success |
| Priority | Required before implementation |

### G-002 — Seller create / publish / quick-add photos

| Field | Content |
|-------|---------|
| Gap | Seller album authoring not in this slice |
| Why it matters | Supply-side completeness |
| Impact if ignored | Catalog growth path unproven |
| Recommendation | Future Completeness + journey |
| Priority | Future improvement |

### G-003 — Publish audience sheet + consent

| Field | Content |
|-------|---------|
| Gap | First-time sell consent / audience |
| Why it matters | Trust + capability unlock |
| Impact if ignored | Accidental overshare |
| Recommendation | Future with catalog publish |
| Priority | Future improvement |

---

## Approved scope

- Meena opens seeded Wedding Edit.  
- Shortlist ≥1 → Ask for rates or Order → selection cleared.  

## Sign-off

**Yes** for Collections `@functional` as approved.
