# Rate all on quote — design

**Date:** 2026-09-08  
**Status:** Approved  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-08-rate-all-quote-completeness.md`

## Problem

Same rate for all / Each design chips force a mode and hide the Rate column when “same” — feels complicated for busy traders.

## Decision

- Drop the chips and mode.
- When 2+ open (supplyable) designs: one top **Rate all** field; typing fills every open line’s rate.
- Clearing **Rate all** restores each line to its default (quote prefill / mill line rate).
- Always show per-line Rate inputs (Design | Qty | Rate).
- Editing a line after bulk fill is allowed; Rate all is not a lock.
- Can’t supply lines are not filled by Rate all.
- Single design: no Rate all field.
- Same on Send quote sheet and mill held desk before Send.
- API unchanged.

## Copy

**Rate all** (placeholder or Field label). Not “Same rate for all” / “Each design”.
