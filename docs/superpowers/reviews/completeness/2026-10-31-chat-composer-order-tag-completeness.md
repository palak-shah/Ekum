# Feature Completeness Review — Chat composer clip + order-tagged updates

**Date:** 2026-10-31  
**Module / ask:** Thread composer clips send. Later order pulses (including dispatch) are centered pills — trader cannot see which order. Jump-to-card highlight is a grey focus ring around the full row.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/orders.md`, Completeness `2026-10-30-chat-order-update-tags-completeness.md`  
**Disposition:** Proceed (composer clip). Redesign then Proceed (centered order pills → tagged bubbles; jump wash).

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior lock this slice **replaces** (historical, not deleted): centered `order_lifecycle` pills sharing leave-notice chrome; `isChatSystemNotice` treating that kind as a notice even with `referenceId`.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Place still posts **one** living card. Later pulses (note, confirm, qty, **dispatch**, quote, delivered, return, cancel, settle) must name **which** order without reprinting the card. Centered pills fail that job. Composer must not clip — traders send all day. |
| UX Designer | Same family as a reply quote, not a user Reply: thumb + **Order #**, no **Reply**, no left bar. Actor-side bubble; body stays You/{shop} copy. Leave notices and date chips stay centered. Jump is a quiet accent wash on the **bubble**, not a keyboard ring around empty row space. Composer: **+** left, voice/send right, **h-9** in a full pill — ticket Notes well unchanged. |
| Solution Architect | Set `replyToMessageId` on `order_lifecycle` / `order_note` to the living card. Stop treating that kind as `isChatSystemNotice`. Cluster tails follow actor-side bubbles. Serializer already fills `MessageReplyPreview`; order quotes preview **Order #** + design thumb. |

---

## Platform consistency (required)

1. **Existing patterns?** Reply quote chrome (minus bar / Reply for order tags). Kit field fill (`FIELD_IDLE_FILL_CLASS`). Jump uses existing `jumpToMessage`. Leave/date pills stay.  
2. **Duplicates another feature?** No second living card. Tags replace centered pills — they do not reprint Timeline.  
3. **Should reuse an existing workflow?** Yes — `ReplyQuote` + living `replyTo`. Composer stays + \| Message \| voice/send.  
4. **Naming matches the app?** You / {shop}. Never Seller/Buyer. Order # on the tag, not mill-lot hashes.  
5. **Units?** Qty copy unchanged (order unit + design name, not ₹). Dispatch copy stays `{shop} dispatched` / `dispatched part · LR …`.

**Philosophy conflict?** Yes — centered order pills fight “one card, one place, you can see which order.” Disposition is **Redesign** of the 2026-10-30 tag chrome, then lock chat.md / orders.md and build. Composer is chrome-only **Proceed**.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Composer fits. Every lifecycle + note is a tagged bubble. Place still one card. |
| Business rules | OK | Do not tag first Place / Ask rates / buy-for-buyer create. Do not reprint `logged an order`. |
| Workflows | OK | Confirm / dispatch / note → actor bubble with Order #; tap → living card. |
| Edge cases | OK | Legacy tags without `replyTo`: still bubble + jump via `livingMessageId` / resolved order ref. Missing living card → open ticket. |
| Permissions | N/A | Same party gates |
| User states | OK | Viewer-relative You vs shop on read |
| Notifications | OK | Ping + unread still from the tag row |
| Error handling | OK | Jump miss → toast. Invalid dates unchanged |
| Scalability | OK | Same extra system row per pulse |
| Mobile interactions | OK | Composer sticky; last bubble still clears chrome (BM-07). Jump wash no layout jump |
| First glance (BM-11) | OK | One living card. Tag is quiet Order # + line. Composer pill fully visible. Wash hugs bubble |
| Units (order / dispatch / Rate per) | OK | Qty tags = order unit on that design. No ₹ on tags. Dispatch is the event word, not a Rate per |
| Accessibility | OK | Order tag is a button (jump). Leave/date informational |
| Platform consistency | OK | After chat.md / orders.md lock |

---

## Gaps

### G-001 — Composer send is clipped

| Field | Content |
|-------|---------|
| Gap | Send is `h-12` inside a `py-1.5` well; thread column `overflow-hidden` chops the control |
| Why it matters | Everyday send looks broken |
| Impact if ignored | Traders miss the send tap / see a cut pill |
| Recommendation | **h-9** send/voice in a `rounded-full overflow-visible` thread well. Do not change shared `COMPOSER_SHELL_CLASS` (ticket Notes). Do not move + or mic |
| Priority | Required before implementation |

### G-002 — Centered order pills hide which order

| Field | Content |
|-------|---------|
| Gap | `isChatSystemNotice` treats `order_lifecycle` as a leave-style pill. Dispatch / confirm / note do not show Order # |
| Why it matters | Threads with more than one ticket become unreadable |
| Impact if ignored | Trader taps a pill and still does not know which card |
| Recommendation | **Redesign:** actor-side bubble + order tag (thumb + Order #, no Reply, no left bar) for **every** `order_lifecycle` and `order_note`. Leave/date stay centered |
| Priority | Required before implementation |

### G-003 — Jump highlight is a focus ring on the row

| Field | Content |
|-------|---------|
| Gap | `ekum-msg-flash` is a 3px `--ekum-focus-ring` on the full-width chrome row |
| Why it matters | Looks like keyboard focus around empty space, not “found this card” |
| Impact if ignored | Tap Order # feels unfinished |
| Recommendation | Flash class on the bubble shell; fading accent wash; no focus-ring. Same for all jump-to-message |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness Redesign then lock `docs/features/chat.md` (+ orders.md action-card line).
- Thread composer: **+** left, voice/send right, **h-9**, `rounded-full`, `overflow-visible`. Ticket Notes well unchanged.
- Every `order_lifecycle` + `order_note` is an actor-side tagged bubble (dispatch included). `replyToMessageId` = living card.
- ReplyQuote: no left bar (user replies too). Order tag omits **Reply**.
- `isChatSystemNotice` no longer treats `order_lifecycle` as a notice. Cluster tails follow actor bubbles.
- Jump highlight: accent wash on the bubble, not a focus ring on the row.
- Units + web/API tests + `@chat` confirm/dispatch tags; trader-eye.

## Explicitly deferred / rejected

- Second living card per ticket — **rejected**.
- Reprinting `logged an order` as a tag — **rejected**.
- Moving + or mic outside the well / adding emoji — **rejected**.
- Changing ticket Notes `COMPOSER_SHELL_CLASS` — **rejected**.
- Centered order pills — **rejected** (this Redesign).
- Leave notices / date chips stay centered.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
