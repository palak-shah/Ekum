# Feature Completeness Review — Chat living-card pin, lifecycle tags, date chips

**Date:** 2026-10-30  
**Module / ask:** Stop the living order card from jumping sides / collapsing when the other shop acts; append centered WhatsApp-style tags for qty / confirm / decline (and later lifecycle); date chips + in-thread clock like the prototype.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/orders.md`  
**Disposition:** Redesign, then Proceed on the mapping below

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior locks this slice **replaces** (historical, not deleted): later upserts rewriting `senderCompanyId` + bumping `createdAt`; compact lifecycle pulses on the living card (`isRichOrderChatMessage` COMPACT set); in-thread `timeAgo` on bubbles.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One living `order_card` / `rate` per ticket stays. Confirm / qty / decline must not look like the other shop sent a new card. The card stays on the original sender’s side, in its original thread spot, still rich (thumbs + note). The new event is a **centered tag** at the bottom. Inbox last line follows the tag. Dates read like WhatsApp (`Today` / `Yesterday` / `11 Oct`) with a clock on the bubble, not `19h`. |
| UX Designer | Reuse leave-notice chrome (`rounded-full bg-surface`, 12px, centered) for tags and date chips — same family, no hairline. Copy is **You** / **{shop}**, never Seller/Buyer. Tap a tag → jump to that order’s living card. Compact pulses go away; title on the pinned card still updates (Requested → Confirmed → Settled) so scroll-back is not a lie. Seen ticks stay beside the clock. Date chips do not break cluster tails. |
| Solution Architect | Pin on later `upsertOrderThreadMessage`: do not change `senderCompanyId` or `createdAt`. Append `system` + `metadata.kind = order_lifecycle` + `referenceId` = order id. `lastMessageAt` + unread + notify come from the **tag**. Extend `isChatSystemNotice` so that kind is a notice even with `referenceId`. Tag copy lives in domain-types (`orderLifecycleTagCopy`). In-thread clock = locale `HH:mm`; inbox keeps `timeAgo`. |

---

## Platform consistency (required)

1. **Existing patterns?** Leave-notice pills; one living trade card; cluster tails already skip notices; `MessageTimeMeta` + Seen ticks; inbox `messagePreviewText`.  
2. **Duplicates another feature?** No second trade card. Tags replace compact pulses — they do not reprint Timeline.  
3. **Should reuse an existing workflow?** Same pill chrome as `{Name} left`. Jump uses existing `jumpToMessage`.  
4. **Naming matches the app?** You / business name. Confirm + can’t supply uses **can’t supply**, not declined-on-the-tag when mixed. Never Seller/Buyer.  
5. **Units?** Qty tags use **order unit** + design name (`3 → 2 pcs`), not Rate per, not ₹. Pack vs design N/A on tags.

**Philosophy conflict?** Yes — moving the living card to the actor’s side and collapsing it into a pulse fights “one card, one place, bubble side = who placed.” Disposition is **Redesign**: lock chat.md (and orders.md trail line), then build. Not a second card.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pin sender + createdAt; stay rich; tag after later upserts; date chips; in-thread clock |
| Business rules | OK | Still one living card. Do not tag first Place / Ask rates / buy-for-buyer create. Do not reprint `logged an order` |
| Workflows | OK | Place → confirm: card stays; tag at bottom. Qty after lock: tag with before → after + order unit |
| Edge cases | OK | Confirm + can’t supply; multi-line qty name overflow; quote sent vs updated; LR on dispatch tag; tap tag with living card missing → open ticket |
| Permissions | N/A | Same party gates as today |
| User states | OK | Viewer-relative You vs shop on read (`message.mine` = tag actor) |
| Notifications | OK | Ping + unread from the tag, not by moving the card |
| Error handling | OK | Missing living card: open order. Invalid dates: no chip / empty clock |
| Scalability | OK | One extra system row per lifecycle pulse (same as leave notices) |
| Mobile interactions | OK | Centered pills; no new sticky chrome (BM-07 N/A). Cluster tails ignore tags + chips |
| First glance (BM-11) | OK | Card does not jump. Tag is quiet. Date chip once per day. Clock + ticks on last outgoing |
| Units (order / dispatch / Rate per) | OK | Tag qty = **order unit** on that **design**. No ₹ on tags. Living card totals unchanged |
| Accessibility | OK | Tag is a button (jump). Date chip is informational. Ticks keep Seen |
| Platform consistency | OK | After chat.md / orders.md lock |

---

## Gaps

### G-001 — Living card rewrites sender and createdAt

| Field | Content |
|-------|---------|
| Gap | `upsertOrderThreadMessage` sets `senderCompanyId` to the actor and `createdAt: new Date()`. Green/right becomes white/left; the card flies to the bottom |
| Why it matters | Traders think the other shop sent a new order, or that theirs vanished |
| Impact if ignored | Trust break on Confirm / qty — the jump they already felt |
| Recommendation | On later upserts, update `body` / `metadata` / type only. Keep first author and original `createdAt` |
| Priority | Required before implementation |

### G-002 — Compact pulses replace the rich card

| Field | Content |
|-------|---------|
| Gap | Confirm / Decline / Settled / Dispatched map to compact pulses (`COMPACT_ORDER_EVENTS`) |
| Why it matters | The living card is the trade object — thumbs + note must stay when you scroll to it |
| Impact if ignored | Card collapses into a chip; tags would duplicate that motion |
| Recommendation | Always-rich living cards. Compact pulses go away; tags carry the pulse |
| Priority | Required before implementation |

### G-003 — No thread-visible lifecycle event except moving the card

| Field | Content |
|-------|---------|
| Gap | Unread / inbox / notify were faked by bumping the card’s `createdAt` |
| Why it matters | Pinning the card without a new row would hide Confirm from the inbox |
| Impact if ignored | Silent confirm; or we keep the jump |
| Recommendation | Append `order_lifecycle` system tag. `lastMessageAt` + unread + notify from that row. Tap → living card (`referenceId` = order id, `livingMessageId` in metadata) |
| Priority | Required before implementation |

### G-004 — In-thread times are relative (`19h`)

| Field | Content |
|-------|---------|
| Gap | `MessageTimeMeta` uses `timeAgo`. Prototype / WhatsApp show a clock and a date chip on day change |
| Why it matters | Traders scan “when today” by clock, not “19h” |
| Impact if ignored | Thread feels like a feed, not a chat |
| Recommendation | Date chips: Today · Yesterday · `11 Oct` (other year include year). In-thread `HH:mm` (`en-IN` 24h). Inbox keeps `timeAgo` |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness Redesign then lock `docs/features/chat.md` (+ orders.md action-card / chat line).
- Pin living card on later upserts (no sender / `createdAt` rewrite); keep rich chrome; still update title/body/metadata.
- Append centered `order_lifecycle` tags for: qty after lock, confirm, confirm + can’t supply, decline, buyer amend; also quote sent/updated, accepted quote, dispatched / part (LR if present), dispatch edited, settled, delivered, cancelled, return raised.
- Do **not** tag first Place / Ask rates / buy-for-buyer create.
- You / {shop} copy. Inbox last line = tag body when newest is a tag.
- Date chips + in-thread clock; inbox `timeAgo`; cluster tails skip tags (and chips are UI-only).
- Units + web/API tests; trader-eye: buyer places (green, right) → supplier confirms → card stays; tag `{shop} confirmed`; date chip; clock + ticks.

## Explicitly deferred / rejected

- Second living card per ticket — **rejected**.
- Reprinting `logged an order` as a tag — **rejected**.
- ₹ / Rate per on qty tags — **rejected** (order unit + design name only).
- Media page / ⋯ Media — out of scope.
- Grey sent/delivered ticks — out of scope (Seen ticks stay as locked).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + trader-eye this slice; existing `@chat` journeys still cover send/search)
