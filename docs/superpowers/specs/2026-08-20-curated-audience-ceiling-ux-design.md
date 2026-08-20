# Curated audience ceiling UX — design

**Date:** 2026-08-20  
**Status:** Approved for implement  
**Surface:** Collection editor Visibility / Publish sheet + editor errors  
**Anchors:** [curation-ceiling.ts](../../../apps/api/src/catalog/curation-ceiling.ts), [2026-08-19-trader-curation-slice-a-design.md](./2026-08-19-trader-curation-slice-a-design.md)

## Problem

1. Curated packs reject publish/visibility when Who is wider than a sourced design allows — but the sheet still offers every audience, so users hit a red API error after the fact.
2. That error is written into the shared `error` state under the **Name** field, so a still-published pack looks broken.

## Goals

- Prevent invalid Who choices: fade + disable audiences wider than the sourced-design ceiling.
- Show a short why under Who when a ceiling applies.
- Keep Name-field errors for name/save only; publish/visibility failures stay in the sheet; design-member failures use toast.

## Non-goals

- Changing server ceiling rules or ranks.
- Hiding options entirely (disabled + hint is clearer).
- Product editor (own designs only).

## Approach

Client computes the same audience rank order as the API (`selected` < `connections` < `followers` < `everyone`) from foreign members’ `audience` + `companyId` on `ProductView`. No new API field.

## Behavior

### Who can see this

- Ceiling = narrowest foreign member audience (or none if all members are owned).
- Options with rank above the ceiling: `opacity` + `disabled`, not selectable.
- Hint when ceiling applies: “Limited by a sourced design’s audience.”
- On sheet open (and when members change while open): if current Who is over ceiling, clamp down to the max allowed audience.
- Own-only packs: unchanged.

### Errors

| Action | Where |
|--------|--------|
| Name / patch save | Name field (+ toast ok) |
| Publish / Update visibility | Inside Visibility sheet only (+ toast ok); clear when sheet closes or Who changes |
| Add/remove designs (PUT products) | Toast, not under Name |
| Photo upload / create validation for publish | Sheet if publish open; otherwise toast / create CTA area — never sticky under Name for audience ceiling |

## Files

- New helper + unit tests under `apps/web/src/features/catalog/`
- `PublishAudienceFields.tsx` — `maxAudience` prop
- `CollectionEditorPage.tsx` — wire ceiling, split error state
