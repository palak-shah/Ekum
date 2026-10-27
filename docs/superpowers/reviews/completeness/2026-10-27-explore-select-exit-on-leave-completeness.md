# Feature Completeness Review — Explore select exit on leave

**Date:** 2026-10-27  
**Module / ask:** Explore Selecting must drop when the trader leaves `/explore` for any other page, and when the last pick is unchecked.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Explore Select is a short staging job on the feed. Leaving the page (tabs, Home, a collection, a design, Cart) means the job is abandoned. Cart stays the park. Album / shop / Saved keep traveling picks and **0 selected** until Clear. |
| UX Designer | WhatsApp-style: leave or empty pile exits multi-select so the next tap opens, not toggles. Name still opens; picks do not ride onto that page. Empty **Select** (0 items) stays until first pick, Clear, or leave. |
| Solution Architect | Pathname change in AppShell (not Explore unmount) so Strict Mode remount does not wipe. Last uncheck unarms **both** stores — Tap Select arms both, so one store’s toggle is not enough. Do not change the shared shortlist hook. |

---

## Platform consistency (required)

1. **Existing patterns?** Chat message select already dies on leave / empty. Explore follows that. Album / shop / Saved stay at 0 until Clear (Select all exists there).  
2. **Duplicates another feature?** No — tightens Explore staging lifetime. Cart unchanged.  
3. **Should reuse an existing workflow?** `clearSelection()` plus the two select-mode resets.  
4. **Naming matches the app?** Select / Clear / Cart unchanged.  
5. **Units?** N/A — no rate or qty string change.

**Philosophy conflict?** No — one job per screen; leftover checks after leaving Explore fight that.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Leave `/explore` clears staging; last uncheck exits Selecting |
| Business rules | OK | Cart not cleared. Query/hash on `/explore` is not leave |
| Workflows | OK | Add to cart still parks. Order/Share/Message sheets stay on Explore |
| Edge cases | OK | Empty Select + leave; mixed pack+design; name open |
| Permissions | N/A | |
| User states | OK | Select at 0 stays until pick / Clear / leave |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Dock hides with Selecting; BM-07 unchanged |
| First glance (BM-11) | OK | Select pill returns; feed taps open again |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Same Select / Clear controls |
| Platform consistency | OK | Explore page-local; other surfaces still travel |

---

## Gaps

None Required.

---

## Approved scope for this slice

- `explorePathLeft` / `clearExploreStaging` / `exitExploreSelectIfEmpty`
- AppShell pathname listener: leave `/explore` → drop staging + select mode
- Explore toggles: combined count 0 → unarm both stores
- Docs + units + `@explore` functional journey

## Explicitly deferred / rejected

- Cart lifetime / Clear cart
- Album, shop, Saved, You library “stay at 0 until Clear”
- Changing Explore **Back** destination (still Home; that leave also clears)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
