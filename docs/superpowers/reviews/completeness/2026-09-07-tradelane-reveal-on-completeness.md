# Feature Completeness Review — TradeLane reveal On (I-handle trio)

**Date:** 2026-09-07  
**Module / ask:** Ship reveal On for ticket Me: same I-handle desk; one reusable seller–trader–buyer group for order updates. Not Your paths; not ticket=mill.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/chat.md`, [2026-09-02-tradelane-design.md](../../specs/2026-09-02-tradelane-design.md), [2026-09-07-trader-i-handle-desk-design.md](../../specs/2026-09-07-trader-i-handle-desk-design.md), prior [2026-09-02-tradelane-path-completeness.md](./2026-09-02-tradelane-path-completeness.md)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Shipped I-handle desk = reveal Off. This slice adds reveal On only.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | First pair stays quiet (`me`/`false`). Trader flips “see each other” when it hurts. Reveal On does not change who the ticket is with (still Me / Manage desk). Multi-mill = one lane row per mill×buyer; each can reveal independently. |
| UX Designer | One switch on Manage parent (trader): **{Mill} and {Buyer} can see each other** Off/On + short why-line. Kit toggle/row language — not four radios. Mill desks stay. No Related box. BM-07: switch lives in page body / More sheet, not a new sticky bar. |
| Solution Architect | Persist `TradeLane`. Ensure/reuse trio via existing group fingerprint. Send-hold: mill joins group only after **Send**. Flip Off stops routing new cards to group; keep group. Soft-hide Approach A still applies on parent trail for *other* upstream names; once mill is in the trio they are a party by name. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — order detail + kit Sheet; group create reuse from Chats.  
2. **Duplicates another feature?** No — not Linked portal; not Direct facilitator-only metadata.  
3. **Should reuse an existing workflow?** Yes — `createGroup` fingerprint; I-handle Send-hold; desk mill cards.  
4. **Naming matches the app?** **See each other** / shop names. No “TradeLane” in UI.

**Philosophy conflict?** No — matches TradeLane Redesign + desk.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Lane + reveal flip + trio + card routing |
| Business rules | OK | G-002/G-003 closed below |
| Workflows | OK | Create lane on first Manage hop; flip on order |
| Edge cases | OK | Multi-mill per seller×buyer; Off keeps group |
| Permissions | OK | Trader seller on Manage parent; trading presence |
| User states | OK | Default Off; no group until On + mill released |
| Notifications | Later | Existing chat/order notices |
| Error handling | OK | Danger toast / InlineNotice on save fail |
| Scalability | OK | One row per trader×seller×buyer |
| Mobile interactions | OK | No new sticky chrome (BM-07 N/A for new bar) |
| Accessibility | Later | Named switch |
| Platform consistency | OK | |

---

## Gaps

### G-002 — Live reveal flip (closed for this slice)

| Field | Content |
|-------|---------|
| Gap | Mid-lifecycle reveal flip. |
| Recommendation | **Closed:** Flip reveal anytime on live Manage parent. On → ensure trio (if mill released) + update lane; new living cards for that pair route to trio. Off → lane `reveal=false`; new cards use 1:1s again; do not delete group. Ticket flip (Me/mill) deferred. |
| Priority | Required — closed |

### G-003 — Send-hold vs group (closed for this slice)

| Field | Content |
|-------|---------|
| Gap | Mill must not see Meena before Send. |
| Recommendation | **Closed:** Trio participants = trader + buyer + mill only after that mill hop has `upstreamReleasedAt`. If reveal On while hop held: create lane reveal true but **defer** adding mill / posting mill-visible cards until Send. Buyer↔trader 1:1 remains until trio is fully formed; after Send, ensure trio and prefer trio for buyer-visible updates for that pair. |
| Priority | Required — closed |

### G-004 — Multi-mill switch copy

| Field | Content |
|-------|---------|
| Gap | Desk may have several mills. |
| Recommendation | Reveal is **per** TradeLane (trader×that mill×buyer). Each mill card (or a row under it) gets its own see-each-other switch. Not one global trip switch. |
| Priority | Required — closed in scope |

---

## Approved scope for this slice

- Prisma `TradeLane` + create `me`/`false` on first I-handle upstream spawn / Send path for that seller×buyer.  
- `PATCH` (or order action) reveal for trader on Manage parent, scoped to a mill company (or upstream order id).  
- `ensureTradeLaneGroup` + fingerprint reuse; title = three business names.  
- Route order cards for that pair to trio when `reveal` and mill released.  
- UI: see-each-other on mill desk / order More for trader.  
- Docs: desk = reveal Off; gap matrix.  
- Units + `@functional` smoke for flip On → group of three.

## Explicitly deferred / rejected

- Your paths  
- ticket `mill` (Direct)  
- Everyday Place/Send path controls  
- Profile/pack path burial (G-004 from 2026-09-02 — later)  
- Agent / four radios  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
