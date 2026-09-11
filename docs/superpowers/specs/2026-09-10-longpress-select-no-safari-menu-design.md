# Design — Long-press select without Safari link menu

**Date:** 2026-09-10  
**Status:** Implemented  
**Problem:** On iOS Safari, long-press on Explore collection/design cards (real `<Link>` / `<a href>`) opens the native **Open / Open in New Tab** link preview. That fights Ekum’s WhatsApp-style **long-press → Selection** and forces traders to dismiss the browser menu every time.

## Goal

Long-press on selectable collection/design surfaces → **select only**.  
Short tap → open the same destination as today.  
**No visual redesign.**

## Approach

Replace long-pressable **`<Link>`** press targets with **`<button type="button">`** (or equivalent non-`<a>` control) that:

1. On long-press → existing `onLongSelect` (swallow follow-up click).
2. On short tap → `navigate(path)` to the same routes (`/collections/:id`, `/explore/products/:id`, catalog equivalents).

Keep company-name / avatar **`<Link>`**s in card headers (short tap to shop; not the primary long-press select target).

Backstop CSS on long-pressable select surfaces: `-webkit-touch-callout: none` and `user-select: none` (utility class).

Strengthen `useLongPress` only if needed so post-long-press activate never navigates.

## Scope

| In | Out |
|----|-----|
| Explore opportunity cards + design tiles (`cards.tsx`) | Changing Selection / Order / Curate model |
| My Catalog product/collection tiles that long-press + `Link` | Chat message long-press (already non-link) |
| Any other **select + Link** tile with the same pattern | Visual chrome / copy changes |
| Unit/e2e: long-press selects and does not navigate | Desktop “right-click open in new tab” as a product feature |

## Acceptance

- Long-press Explore collection or design: item selects; stay on Explore; **no** Safari Open / New Tab sheet.
- Short tap still opens collection viewer / design detail.
- After select mode starts, taps toggle select (unchanged).
- Same behavior on Saved / My Catalog where long-press + Link currently coexist.

## Visual

Unchanged layout, type, palette, and selected checkmarks. Only the browser overlay goes away.
