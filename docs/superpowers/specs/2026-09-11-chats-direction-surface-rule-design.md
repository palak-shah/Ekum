# Chat business-object direction surface rule

**Date:** 2026-09-11  
**Status:** Approved (product ask)  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-11-chats-direction-surface-rule-completeness.md`

## Rule

Message **direction** owns the card surface. Business-object **status** does not.

| Direction | Surface | Text / links |
|-----------|---------|---------------|
| Incoming | Warm/light `bg-surface`, thin Ekum teal left rail | Dark primary, muted secondary, teal View links |
| Outgoing | Solid Ekum `bg-accent` | White primary/secondary/links |

Quote may keep a commercial **Accept quote** CTA, but the card shell still follows the table above. On outgoing teal, Accept uses a contrasting surface button so it does not disappear into the fill.

Status labels (Requested / Updated / Dispatched / Accepted / Quote) remain copy in the header — never alternate fills (no pale kind-soft green/grey cards).

## Non-goals

- New colors, gradients, decorative effects  
- 3+1 IA / API / logic changes  

## Implementation

Shared `ChatTradeCard` (+ pulse + Thread legacy fallback) themes from `model.mine`.

**Pulse shell must be a `div` (role=button), never a native `<button>`.** Tailwind preflight sets `button { background-color: transparent }`, which stripped outgoing teal on tappable Dispatched/Accepted pulses while white “View order” text remained — the Jaipur pale-card bug.
