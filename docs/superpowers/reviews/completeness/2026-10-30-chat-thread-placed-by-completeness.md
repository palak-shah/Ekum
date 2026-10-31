# Feature Completeness Review — Chat thread placed-by + chrome

**Date:** 2026-10-30  
**Module / ask:** Chat thread: “Order placed by {shop}” + small Decline; thumb `+n` only on the 3rd cell; WhatsApp cluster tails; chevron on hover/long-press; menu icons; short-text timestamp hug.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Redesign, then Proceed on the mapping below

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior locks this slice **replaces** (historical, not deleted): Completeness 2026-10-30-chat-prototype-chrome living-card “never `logged an order`” as the only attribution; **View order →** and **Decline** on one footer row; `+n` on the last thumb even when fewer than 3; every bubble sharp inner corner; always-visible chevron; other-types long-press **Select**; text time on a reserved row.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Buyer cannot see who logged a ticket (1:1 omits `who`, body stripped). Attribution is **Order placed by {shop}.** / **You placed this order.** — not “logged an order”. Decline stays buyer-only, on that sentence. Inbox preview stays `Order #… Requested`. |
| UX Designer | Keep the living card (thumbs, View order). Cluster tail = last consecutive same-side bubble (text + cards). Chevron idle-hidden (hover / long-press menu). Select is a menu item so long-press does not fight the chevron. Short text hugs time like WhatsApp `float:right`. Menu rows = icon + label, same family as MoreActionsSheet, still a popover. |
| Solution Architect | `loggedForBuyer` on `MessageReference` (create ≠ buyer). `canDeclineOrder` unchanged. `messageHasClusterTail` on the thread list. Shared `chatBubbleCorners(mine, { tail })`. No page-local prototype CSS. |

---

## Platform consistency (required)

1. **Existing patterns?** Living `ChatTradeCardView`, kit quiet text Decline (not a new chip), MoreActionsSheet icon+label language on the existing portaled menu, `chatBubbleCorners` for text and cards.  
2. **Duplicates another feature?** No second system message for “placed by”.  
3. **Should reuse an existing workflow?** Same `POST /orders/:id/cancel`. Select stays the menu item + forward dock.  
4. **Naming matches the app?** You / business name. Never Seller/Buyer. Never “logged an order” on the card.  
5. **Units?** N/A — no ₹ or qty string change. Design **count** stays on the subtitle.

**Philosophy conflict?** Yes — prior chrome (footer Decline pair, always-on chevron, long-press Select, `+n` on 1–2 thumbs, every-bubble tail) fights WhatsApp thread judgment and the trader’s placed-by ask. Disposition is **Redesign**: update chat.md first, then build.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Placed-by on `loggedForBuyer` cards; Decline only when `canDeclineOrder` |
| Business rules | OK | Buyer-placed: no line, no Decline. Quotes: Accept + Decline secondary if both |
| Workflows | OK | Long-press idle → menu; Select from menu; Selecting: chevron hidden, tap toggles |
| Edge cases | OK | 1–2 thumbs no overlay; 3 + extra → `+n` on 3rd. Group incoming splits by shop |
| Permissions | OK | Logger sees “You placed this order.” without Decline |
| User states | OK | After decline, line stays, button gone |
| Notifications | N/A | |
| Error handling | OK | Existing decline toast |
| Scalability | OK | Cluster helper O(n) per row is fine |
| Mobile interactions | OK | Hover chevron on pointer; long-press menu on touch. BM-07: overlay chevron, no idle `pr-8` clipping time |
| First glance (BM-11) | OK | One living card; placed-by is a quiet sentence; tail only on last of a run |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Menu items keep accessible names; chevron `aria-label="Message actions"` |
| Platform consistency | OK | After chat.md update |

---

## Gaps

### G-001 — Placed-by attribution stripped

| Field | Content |
|-------|---------|
| Gap | `{shop} logged an order` is stored then stripped; 1:1 has no `who`; buyer cannot see who logged the ticket |
| Why it matters | Decline without “who placed this” is a mystery tap |
| Impact if ignored | Traders think the card is a normal buyer request |
| Recommendation | `loggedForBuyer` on the reference. Card sentence **Order placed by {shop}.** / **You placed this order.** Small quiet **Decline** on that line. Footer **View order →** only. Still never paint `logged an order` |
| Priority | Required before implementation |

### G-002 — `+n` on 1–2 thumbs

| Field | Content |
|-------|---------|
| Gap | `itemCount − images` overlays `+n` on the last cell even when only one 60px thumb is shown |
| Why it matters | One design looks like “+1”, not a photo |
| Impact if ignored | Traders screenshot a count badge instead of the design |
| Recommendation | Thumb size: overlay only when 3 cells are showing **and** extra remain. Full/compact albums keep BM-01 |
| Priority | Required before implementation |

### G-003 — Tail on every bubble + always-on chevron + Select long-press

| Field | Content |
|-------|---------|
| Gap | Sharp inner corner on every message; chevron always painted; text long-press enters Select |
| Why it matters | Not WhatsApp clustering; long-press cannot both open the menu and enter Select |
| Impact if ignored | Streaks look like a stack of tailed cards; hover/long-press chevron fights Select |
| Recommendation | Tail only on last consecutive same-side message (plus CSS beak). Chevron on hover (pointer) or while menu open (long-press opens menu). Select from the menu. Idle long-press no longer enters Select |
| Priority | Required before implementation |

### G-004 — Short text time on its own row

| Field | Content |
|-------|---------|
| Gap | Text bubbles reserve a `mt-0.5` time row under “Ok” |
| Why it matters | Sparse leftover line on short messages |
| Impact if ignored | Traders read a broken caption |
| Recommendation | Time `float:right` in the same text box (11px badge). Photo / document / voice / trade-card keep a trailing row |
| Priority | Required before implementation |

---

## Approved scope for this slice

- `loggedForBuyer` on `MessageReference`; placed-by sentence + inline Decline; View order footer only (quotes keep Accept + secondary Decline).
- Thumb `+n` only on the 3rd cell when extra remain; keep 60×60.
- `chatBubbleCorners(mine, { tail })` + cluster helper; text and trade cards.
- Chevron overlay (no idle `pr-8`); hover / long-press menu; Select from menu; while Selecting hide chevron.
- Icon+label rows on the existing popover (Reply / Forward / Copy / Star + existing Edit / Select / Delete).
- Text-bubble time hug (11px).
- Docs: chat.md living card, buy-for-buyer, CTAs, Message actions; gap matrix.

## Explicitly deferred / rejected

- Separate system message instead of the living card.
- “logged an order” on the card or inbox.
- Converting the chevron popover to MoreActionsSheet.
- Two-step phone “long-press only reveals chevron, then tap it”.
- Clock timestamps, doodle wallpaper, trade-card-only 8px corners.
- Theme C plan file — do not edit.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
