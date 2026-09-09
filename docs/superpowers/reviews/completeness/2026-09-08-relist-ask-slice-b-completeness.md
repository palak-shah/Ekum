# Feature Completeness Review — Relist Ask (Slice B)

**Date:** 2026-09-08  
**Module / ask:** **Ask to put in my pack** → chat Allow/Deny → product relist grants; owner revoke.  
**Anchors:** `docs/features/saved.md`, `access-and-connections.md`, `00-concepts.md`, curate-album-as-is design  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Distinct from **Ask to see this pack** and Connect.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Unlocks Curate when `allowForward` off without flipping global policy. Non-blocking Ask; Allow in chat; Selection unlocks state-only. |
| UX Designer | Selection CTA + Waiting; chat card like view Ask with distinct copy; revoke like Granted on request. |
| Solution Architect | Clone view-request; ProductRelistGrant OR’d in ceiling; product-level grants only. |

---

## Platform consistency (required)

1. **Existing patterns?** Chat Allow/Deny footer; Selection gray row; product owner grant list.  
2. **Duplicates?** No — separate from view Ask / Connect.  
3. **Reuse?** Collection view request flow.  
4. **Naming?** **Ask to put in my pack** · **Wants to put … in their pack** · never bare Ask.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Ask / Allow / Deny / grant / revoke |
| Business rules | OK | Product grants; same-owner batch |
| Workflows | OK | Non-blocking Selection |
| Edge cases | OK | Pending re-ask returns same; mixed owner reject |
| Permissions | OK | Target = product owner |
| Notifications | OK | Mirror view Ask Allow feedback |
| Mobile / BM-07 | OK | No new sticky bar |
| Platform consistency | OK | |

---

## Approved scope

- RelistRequest + ProductRelistGrant; API; ceiling OR grant.  
- Selection Ask / Waiting / unlock; Thread card; product revoke list.  
- Units + `@functional` journey.

## Explicitly deferred

- Collection-scoped future members.  
- Flipping global `allowForward` from Allow.  
- Product-level view Ask.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
