# Feature Completeness Review — Exit Selecting after action, Publish label, missing-field toast

**Date:** 2026-10-27  
**Module / ask:** Successful Explore dock actions must drop checks and exit Selecting; You row More **Unhide Draft** is **Publish**; missing name / category / designs on bulk publish shows **Add mandatory fields to publish.** and keeps the sheet open.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Dock verbs finish the staging job. After Add to cart / Share / Order / Message **succeed**, the trader is done picking — Select pill returns. Cancel (sheet close without send) keeps the pile. You list **Unhide Draft** is the wrong word for go-live; **Publish** matches the Publish sheet. A count toast **Published 0, 1 failed** hides why (often category / name / empty pack). |
| UX Designer | WhatsApp-style: after the action, taps open again — leftover checks after send feel stuck. **Hide Draft** stays the inverse of live → draft. Disabled **Publish** on an empty pack is still correct. Trader toast is one line; sheet stays so they can dismiss and fill fields. |
| Solution Architect | `clearSelection()` empties both stores **and** unarms both select flags (Tap Select arms both; emptying one store does not unarm the sibling). Message `onSent` only — feed / design-sheet enquire does not clear staging. Bulk `allSettled` reasons → `ApiError.code`; mandatory codes share one copy. |

---

## Platform consistency (required)

1. **Existing patterns?** Explore staging already page-local (leave / last uncheck). Dock success is the same job ending. You **Publish** matches page ⋯ Publish. Toast + in-sheet `InlineNotice`-style line, sheet stays on failure (not a silent close).  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** `clearSelection()` for every successful dock clear; same bulk publish sheets.  
4. **Naming matches the app?** Publish (not Unhide). Mandatory fields — not INVALID_NAME jargon.  
5. **Units?** N/A — no rate or qty string change.

**Philosophy conflict?** No — one job per screen; leftover Selecting after send fights that. **Unhide** is product-jargon for go-live.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Dock success exits Selecting; Publish label; mandatory-fields toast |
| Business rules | OK | Cancel / close without send leaves picks. Cart park unchanged. Album / shop / Saved 0-until-Clear unchanged |
| Workflows | OK | Add to cart already exits. Share already `clearSelection`. Order + Message now same |
| Edge cases | OK | Multi-shop Message still disabled. Empty pack Publish still disabled. Mixed bulk fail: not all-mandatory → server line |
| Permissions | N/A | |
| User states | OK | Select at 0 until pick / Clear / leave / successful dock action |
| Notifications | OK | Toast on send / publish; no extra push |
| Error handling | OK | Mandatory codes → trader copy, sheet open. Relist / consent / network → API message, sheet open. Full success closes |
| Scalability | N/A | |
| Mobile interactions | OK | Dock hides with Selecting; BM-07 unchanged |
| First glance (BM-11) | OK | Select pill after send; **Publish** on More; toast names the miss |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Same Select / Publish / sheet controls |
| Platform consistency | OK | Feed Message enquire does not clear Explore staging |

---

## Gaps

None Required.

---

## Approved scope for this slice

- `clearSelection()` also `resetBrowseShortlistSelectMode` + `resetBrowseAlbumPickSelectMode`; `clearExploreStaging` is that call
- Order success uses `clearSelection()` (still `clearBrowseCart` on cart-page)
- Selection dock Message `onSent` → `clearSelection()`; close without send does nothing
- You row More label **Publish** (action id / test id `unhide`)
- Bulk collection (and product) publish: `INVALID_NAME` / `CATEGORY_REQUIRED` / `COLLECTION_EMPTY` → **Add mandatory fields to publish.**; keep sheet open on any failure
- Docs + units + Message dock `@explore` journey

## Explicitly deferred / rejected

- Shop dock and album / shop / Saved “0 selected until Clear”
- Renaming Hide Draft
- Client-side skip of empty/untitled packs before opening the Publish sheet
- Feed / DesignSheet Message enquire clearing staging

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
