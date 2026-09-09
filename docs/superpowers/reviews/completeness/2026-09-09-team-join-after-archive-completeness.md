# Feature Completeness Review — Team join after archive

**Date:** 2026-09-09  
**Module / ask:** Same phone may join Company B (or create a company) after membership at A is archived. Rejoin A stays unarchive. Live seat at A still blocks B.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/superpowers/specs/2026-08-23-company-team-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Phone × company seat; one **live** company at a time. No multi-company switcher.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Leavers must be removable from A then hireable at B on the same phone. A must archive first. Rehire at A already works. |
| UX Designer | No new screens. Same `/t/:token` join. Error only when still live elsewhere. |
| Solution Architect | Gate `findFirst` membership with `archivedAt: null`. New membership row for B; unarchive for same company A. Company onboarding same live-only gate. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Team invite + archive remove.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — invite join / onboarding create.  
4. **Naming matches the app?** Yes — Team, business, plain conflict copy.

**Philosophy check?** No conflict.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Join B after archive A; rejoin A; create company after archive |
| Business rules | OK | One live company; A must remove before B |
| Workflows | OK | No UI change |
| Edge cases | OK | Live A blocks B; same-company unarchive |
| Permissions | OK | New B seat gets default staff caps |
| User states | OK | JWT issued for joined company |
| Notifications | N/A | |
| Error handling | OK | Keep ALREADY_HAS_BUSINESS for live |
| Scalability | N/A | |
| Mobile interactions | N/A | No chrome |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Self-serve leave

| Field | Content |
|-------|---------|
| Gap | Staff cannot archive themselves |
| Recommendation | Deferred — owner removes |
| Priority | Future improvement |

### G-002 — Multi live companies / switcher

| Field | Content |
|-------|---------|
| Gap | Two live seats |
| Recommendation | Deferred (later phase) |
| Priority | Reject for this slice |

---

## Approved scope for this slice

- `TeamService.joinInvite`: block only on **live** membership elsewhere; allow create membership at B when prior seats archived; keep same-company unarchive.  
- `CompanyService.create`: block only on **live** membership.  
- Unit tests + `company.md` / concepts / gap matrix.  
- No new web screens.

## Explicitly deferred / rejected

- Company switcher / two live shops  
- Self-leave Team  
- Auto-archive when accepting B invite while live on A  

## Sign-off

| Role | Name / note | Date |
|------|-------------|------|
| Product | Proceed — live-link identity fix | 2026-09-09 |
| Engineering | Local workspace implementation | 2026-09-09 |
