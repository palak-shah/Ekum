# Design — Explore long-press select stays (Android)

**Date:** 2026-09-12  
**Status:** Approved for Completeness / plan (Approach A)  
**Problem:** On Android, long-pressing an Explore pack or design to select often **flashes** selected then clears. Selection feels inconsistent and painful. Root cause: entering select mode **swaps** the press `<button>`; the browser’s follow-up click hits a fresh control whose `useLongPress` did not swallow that click, so `toggle` runs again and removes the item.

## Goal

Long-press Explore collection/design → item **stays** selected and select mode stays on. Short tap (no hold) still opens. No new Select chrome; no visual redesign beyond today’s checkmark in select mode.

## Approach (locked)

**A — Fix reliability only** (not B: no explicit Select entry; not C: keep long-press).

1. **Stable press surface** — `OpportunityCollectionCard` / `OpportunityDesignCard` use **one** media press button whether or not `selectMode` is on. Do not remount/swap the button when the first item is selected. Only change handlers and chrome (checkmark, `onClick` = toggle vs open).
2. **Harden `useLongPress`** — After a long-press fires, suppress the following activate/toggle for a short window (~300–500ms) even across re-renders (module-level or equivalent suppress token — not only a ref that dies with a remounted button). Keep existing click-swallow for the happy path.
3. **Same gesture model** — Hold = select (toggle into pick); when already selecting, tap toggles; when not selecting, short tap opens. No Select menu item.

## Scope

| In | Out |
|----|-----|
| Explore opportunity collection + design cards (`cards.tsx`) | Explicit Select control in Explore chrome (Approach B) |
| `useLongPress` swallow / post-fire suppress | Dropping long-press (Approach C) |
| Unit covering remount / delayed click after select | Chat message long-press |
| Fix identical button-swap on Saved / My Catalog **only if** the same pattern exists | Selection / Order / Curate product changes; visual redesign |

## Acceptance

- Android Chrome: long-press one Explore pack → selected + pick count stays; **no** flash-off.
- In select mode, tap toggles; short tap when not selecting still opens pack/design.
- Unit: simulate long-press then click after select-mode UI update → **no** double-toggle (item remains selected).
- Regression: iOS Safari still no link-preview menu on these surfaces (`LONG_PRESS_SURFACE_CLASS`).

## Docs / tests

- Note in `docs/features/explore.md` (long-press select must stick; Android ghost-click).
- Completeness review + gap-matrix touch if Explore select reliability is tracked.
- Unit: `useLongPress` + card select path; optional `@smoke` Explore long-press if already present.
