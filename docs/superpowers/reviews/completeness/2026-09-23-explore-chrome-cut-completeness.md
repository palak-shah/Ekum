# Feature Completeness Review — Explore search chrome cut

**Date:** 2026-09-23  
**Module / ask:** Explore should not show Selection or Saved beside search. Selection already appears when items are picked. Saved lives under You / profile.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/saved.md`, ui-quality-bar §1  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two extra squares next to search duplicate the floater and You → Saved. Traders hunt chrome. Cut them. |
| UX Designer | Everyday Explore chrome is **search + one filter square**. Selection floater when the pile is non-empty. Saved from profile. |
| Solution Architect | Remove two buttons. No API change. Journeys open Selection via the floater. |

---

## Platform consistency (required)

1. **Existing patterns?** List chrome = search + one trailing 46×46 (filter).  
2. **Duplicates another feature?** Yes — floater + You → Saved.  
3. **Should reuse?** Floater / `/selection`; More → Saved.  
4. **Naming?** Unchanged.

**Philosophy conflict?** No — cutting a second path.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Filter stays; Saved/Selection still reachable |
| Business rules | N/A | |
| Workflows | OK | Long-press → floater → Your selection |
| Edge cases | OK | Empty pile: no header Selection (open `/selection` only if linked elsewhere) |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | One chrome row |
| Accessibility | OK | Filter labelled |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Explore idle chrome: search + **Filter** only.  
- No Saved bookmark square. No Selection check square / badge.  
- Selection still via long-press + **N selected · View** floater.  
- Saved still via You / More.

## Explicitly deferred / rejected

- Removing the selection floater  
- Moving Saved into bottom nav  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
