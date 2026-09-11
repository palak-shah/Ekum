# Feature Completeness Review — Long-press select without Safari menu

**Date:** 2026-09-10  
**Module / ask:** Stop iOS Safari link preview on Explore (and sibling) long-press select  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Long-press = Selection; tap = open. Browser menu breaks that contract. |
| UX Designer | No visual change; remove confusing system chrome. |
| Solution Architect | Non-`<a>` press targets + navigate on tap; CSS callout backstop. |

## Platform consistency

1. Existing patterns? Yes — WhatsApp-style long-press already documented.  
2. Duplicates? No.  
3. Reuse? Same Selection stores and card chrome.  
4. Naming? Unchanged.

**Philosophy conflict?** No.

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Select vs open preserved |
| Workflows | OK | |
| Mobile interactions | OK | Core fix |
| Accessibility | OK | button + navigate; company Links remain |
| Platform consistency | OK | |

## Approved scope

- Button (non-link) press targets for long-pressable collection/design tiles  
- Touch-callout CSS backstop  
- Regression coverage for Explore long-press stays on feed  

## Explicitly deferred

- Redesigning select UX  
- Removing company header Links  

## Sign-off

Required gaps closed: Yes · Ready: Yes
