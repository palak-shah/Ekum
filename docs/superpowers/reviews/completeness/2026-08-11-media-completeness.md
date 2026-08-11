# Feature Completeness Review — Media / Upload

**Date:** 2026-08-11  
**Module / ask:** Chat photo upload functional verification  
**Anchors:** `docs/features/media.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Media is not a tab — uploads inside chat/catalog/orders. Phase 1 image-only is correct. |
| UX Designer | Chat attach → image bubble; progress/errors matter. |
| Solution Architect | Reuse upload URL → put bytes → complete; visibility follows parent. |

---

## Platform consistency (required)

1. **Patterns?** Attach in composer; no Media nav item.  
2. **Duplicates?** No standalone DAM.  
3. **Reuse?** Same pipeline for catalog/chat/photo orders.  
4. **Naming?** Photos / designs — not “assets.”

**Philosophy conflict?** No. Reject a top-level Media library competing with Catalog.

---

## Gaps

### G-001 — Chat photo send unproven in e2e

| Field | Content |
|-------|---------|
| Gap | Seed walkthrough Meena chat photo |
| Why it matters | Core attach path |
| Impact if ignored | Upload regressions break trade context |
| Recommendation | `@functional @media` with fixture JPEG |
| Priority | Required before implementation |

### G-002 — Catalog design upload thumbs

| Field | Content |
|-------|---------|
| Gap | Ravi library upload not in this slice |
| Why it matters | Seller onboarding of designs |
| Impact if ignored | Supply path unproven |
| Recommendation | Future journey |
| Priority | Future improvement |

### G-003 — Upload failure / missing thumbnail UX

| Field | Content |
|-------|---------|
| Gap | Error + fallback documented, untested |
| Why it matters | Mobile networks fail |
| Impact if ignored | Silent stuck pending |
| Recommendation | Recommended unit/e2e later |
| Priority | Recommended enhancement |

### G-004 — Top-level Media app section

| Field | Content |
|-------|---------|
| Gap | Hypothetical Media tab |
| Why it matters | Duplicates catalog; confuses IA |
| Impact if ignored | Chrome clutter |
| Recommendation | Reject |
| Priority | Reject / Redesign |

---

## Approved scope

- Meena sends chat photo in seeded thread; image visible.

## Sign-off

**Yes** for Media `@functional` chat photo only.
