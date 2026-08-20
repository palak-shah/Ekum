# Feature Completeness Review — Explore

**Date:** 2026-08-11  
**Module / ask:** Explore browse, filter dismiss, open collection/product  
**Anchors:** `docs/features/explore.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Discovery by opportunity/interest, not vanity engagement. Follow ≠ trade access. |
| UX Designer | Filter menus must portal/dismiss (BM-02). Feed stays until search types (Search page). |
| Solution Architect | Server visibility/audience; don’t client-filter security. |

---

## Platform consistency (required)

1. **Patterns?** Bottom nav Explore; cards with why-line/time.  
2. **Duplicates?** Not a second Home feed — Home is Needs you / Followed.  
3. **Reuse?** Collection/product detail routes shared with catalog.  
4. **Naming?** Businesses / collections / designs — plain language.

**Philosophy conflict?** No. Reject “likes/viral ranking” as primary Explore model.

---

## Gaps

### G-001 — Browse seeded content + open detail

| Field | Content |
|-------|---------|
| Gap | No `@functional` proof Meena sees Surat / Wedding Edit |
| Why it matters | Cold-start discovery |
| Impact if ignored | Explore regressions invisible |
| Recommendation | Functional journey |
| Priority | Required before implementation |

### G-002 — Filter menu dismiss (BM-02)

| Field | Content |
|-------|---------|
| Gap | Portal + outside/Escape dismiss |
| Why it matters | Transform stacking trap was a real bug |
| Impact if ignored | Stuck overlays on mobile |
| Recommendation | Assert open + dismiss in journey |
| Priority | Required before implementation |

### G-003 — Federated `/search` + follow feed

| Field | Content |
|-------|---------|
| Gap | Documented; not in this slice |
| Why it matters | Find businesses by name |
| Impact if ignored | Discovery incomplete |
| Recommendation | Future journey |
| Priority | Future improvement |

### G-004 — Engagement vanity ranking

| Field | Content |
|-------|---------|
| Gap | Hypothetical likes-based Explore |
| Why it matters | Conflicts with opportunity ranking |
| Impact if ignored | Wrong product |
| Recommendation | Reject |
| Priority | Reject / Redesign |

---

## Approved scope

- Open Explore; see seeded supplier/collection; filter open/dismiss; open collection or product.

## Sign-off

**Yes** for Explore `@functional` as approved.
