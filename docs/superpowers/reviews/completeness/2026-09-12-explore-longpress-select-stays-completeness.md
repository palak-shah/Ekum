# Feature Completeness Review — Explore long-press select stays

**Date:** 2026-09-12  
**Module / ask:** Fix Android Explore long-press select flash-off (Approach A — reliability only)  
**Anchors:** `docs/features/explore.md`, spec `2026-09-12-explore-longpress-select-stays-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Bugfix to existing WhatsApp-style long-press select — no new Select chrome.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Contract already documented: hold = select, tap = open. Android ghost-click after remount breaks trust; fix stickiness. |
| UX Designer | No new chrome; stable press surface + swallow. Avoid Approach B (Select entry) for this slice. |
| Solution Architect | Root cause is conditional button swap in `Opportunity*Card` + `useLongPress` ref dying on remount. Fix both. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — long-press select, Selection stores, checkmark in select mode.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Selection / Explore cards.  
4. **Naming matches the app?** Unchanged.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Select stays after long-press |
| Business rules | N/A | |
| Workflows | OK | Unchanged gesture model |
| Edge cases | OK | Ghost click after select-mode re-render |
| Permissions | N/A | |
| User states | OK | Empty pick leaves select mode (existing) |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Android primary; iOS callout regression |
| Accessibility | OK | Same buttons |
| Platform consistency | OK | |

---

## Gaps

None Required. Optional later: Approach B Select entry if traders still struggle after A.

---

## Approved scope for this slice

- Stable media press button on `OpportunityCollectionCard` / `OpportunityDesignCard` (and `DesignTile` if same swap)
- `useLongPress` post-fire suppress that survives remount (~300–500ms)
- Unit: long-press + delayed click after select UI update → no double-toggle
- `docs/features/explore.md` one-line note on Android stickiness
- Same-pattern fix on Saved / My Catalog **only if** identical button swap exists

## Explicitly deferred / rejected

- Explicit Select control in Explore chrome (Approach B)
- Dropping long-press (Approach C)
- Chat message long-press
- Visual redesign / Selection product changes

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit primary; smoke if already present)
