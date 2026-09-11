# Plan — Long-press select without Safari link menu

**Spec:** `docs/superpowers/specs/2026-09-10-longpress-select-no-safari-menu-design.md`  
**Completeness:** Proceed (`2026-09-10-longpress-select-no-safari-menu-completeness.md`)

## Files

| File | Change |
|------|--------|
| `apps/web/src/ui/useLongPress.ts` | Export `LONG_PRESS_SURFACE_CLASS`; keep click swallow |
| `apps/web/src/index.css` | `.ekum-long-press-surface` touch-callout / user-select |
| `apps/web/src/ui/cards.tsx` | Opportunity + Design tiles: button + `navigate`, not Link |
| `apps/web/src/features/catalog/MyCatalogPage.tsx` | Product/collection tiles same pattern |
| `docs/features/explore.md` | Note: long-press must not open browser link menu |
| Unit + e2e | Hook/card behavior; Explore long-press stays on feed |

## Tasks

1. CSS + hook class constant  
2. cards.tsx press targets  
3. MyCatalogPage tiles  
4. Docs, gap matrix, tests  

## Done when

Long-press selects without Safari Open/New Tab; tap still opens; no visual redesign.
