# Feature Completeness Review — Orders list card glance

**Date:** 2026-10-30  
**Module / ask:** Restyle Orders list trade cards to a two-line glance (name · facts · lime your-move with verb icons; idle Waiting: supplier/buyer; 3px ship bar). Kit chrome, whole-card tap, Ekum verbs.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-10-21-orders-list-protocol-completeness`, `2026-10-21-orders-list-facts-designs-qty-completeness`, `2026-10-15-orders-list-counterpart-avatar-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

This is a **visual Redesign of TradeRow only** (supersedes list left rail + stacked protocol). Philosophy, tabs, no list POST, I-handle one parent row, and ticket docks stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One listing for buyer, supplier, and trader. Selling / Buying / Others already split the pile. Right cue is whose move: Confirm / Dispatch / Settle / Accept quote / **Forward**, or Waiting: supplier \| buyer. Never mill names. Never “Forward order” / “Accept order”. Ticket may still say Accept & forward. |
| UX Designer | Kit search, chips, 48px avatar, rounded cards. Two lines like Chats title + prototype facts. Lime disc is Needs you only (Theme C badge). Idle clock is muted. 3px charcoal bar when dispatch is in play — not a second ticket progress card, not teal, not lime. No left accent rail. Whole card stays one Link. |
| Solution Architect | No new APIs. Reuse `tradeNeedsYouLabel`, ship totals already on list lines, `manualRef.manualOrderNo` when present. Helpers for verb, waiting role, ship fraction. New kit icons: truck, clock, straight-right fwd. |

---

## Platform consistency (required)

1. **Existing patterns?** ListSearchRow / Chip / Avatar 48 / cards (not `listRowClass`). Lime = `bg-badge`. Chats title row for name + time.  
2. **Duplicates another feature?** No — ticket still owns Confirm / Dispatch / Send.  
3. **Should reuse an existing workflow?** Yes — `tradeNeedsYouLabel` / `traderIHandleNeedsYou` / `tradeListShipLine` totals.  
4. **Naming matches the app?** Confirm / Accept quote / Dispatch / Settle / list **Forward**. Waiting: supplier / buyer.  
5. **Units?** Whose = remaining ticket lines · which = **order** unit · surface = list facts (`#VONR · 0/60 sets sent`). No invented `/pc`. Mixed units omit the noun.

**Philosophy conflict?** No. List stays a scan. Role words keep toll/soft-hide. Lime stays needs-you counts/cues, not go.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Two-line card; icons; waiting; bar |
| Business rules | OK | Same Needs you rows; I-handle still Accept & forward |
| Workflows | OK | Tap opens ticket |
| Edge cases | OK | Inquiry keeps Inquiry #; mixed units no ship noun; 0/total bar width 0 |
| Permissions | OK | No list writes |
| User states | OK | Buyer / supplier / trader same TradeRow |
| Notifications | N/A | Nav count unchanged |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky; bar is inside the card (BM-07 N/A) |
| First glance (BM-11) | OK | Verb + icon loudest on Needs you; waiting quiet; name+facts one caption |
| Units (order / dispatch / Rate per) | OK | Order unit on facts and bar; not dispatch unit |
| Accessibility | OK | Card is a link; cue text not icon-only |
| Platform consistency | OK | Kit chrome; Theme C tokens |

---

## Gaps

### G-001 — Accept quote lime icon

| Field | Content |
|-------|---------|
| Gap | Prototype uses a rupee for quote. This slice uses CheckIcon for Confirm, Accept quote, Settle, and other needs-you except Dispatch and Accept & forward. |
| Why it matters | One extra glyph. |
| Impact if ignored | Quote rows look like Confirm. Verb still reads Accept quote. |
| Recommendation | CheckIcon this slice. |
| Priority | Future improvement |

### G-002 — Idle mill names on Trading mark

| Field | Content |
|-------|---------|
| Gap | Title may still show today’s quiet `Trading · mills` when reveal allows. Glance does not add new mill names. |
| Why it matters | Soft-hide already strips hidden mills from `orderListMillCue`. |
| Recommendation | Keep existing showContext preview on the title row, truncated. |
| Priority | Later |

---

## Approved scope for this slice

- Two-line `TradeRow`: name + time; facts + lime disc/verb or clock waiting.
- Drop left `border-l-accent` and stacked protocol line.
- Facts: `#VONR` (drop the word Order); middot; ship `0/60 sets sent` when dispatch is in play; else designs + shared-unit qty; manual no. when on the payload.
- Icons: CheckIcon Confirm family; TruckIcon Dispatch; straight-right arrow **Forward**.
- Idle open rows: `Waiting: supplier` / `Waiting: buyer`.
- 3px bottom bar when dispatch is in play; hide on requested with nothing shipped and on Completed.
- Whole card one Link. No list POST.

## Explicitly deferred / rejected

- Ticket progress card / notes / docks.
- List Confirm / Accept / Decline / Forward buttons.
- Mill-buy hop rows; path toggles; Direct autopilot.
- Prototype “Forward order”, “Waiting for {shop}”, teal bar, 40px search, Selling lime 7.
- Rupee icon for Accept quote (G-001).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
