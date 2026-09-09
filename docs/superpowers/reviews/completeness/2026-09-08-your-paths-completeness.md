# Feature Completeness Review — Your paths + ticket mill

**Date:** 2026-09-08  
**Module / ask:** Ship **Your paths** (`/settings/paths`): list trader×supplier×buyer lanes; two switches (ticket Me/mill × see each other). Future-only from desk. Live ticket flip on order page only while Requested + no seller quote. Remove Direct/I handle from main Publish sheet. Place resolves existing TradeLane; new pair = Me + reveal Off (not Profile Direct).  
**Anchors:** `docs/features/00-concepts.md`, `orders.md`, `settings.md`, [2026-09-02-tradelane-design.md](../../specs/2026-09-02-tradelane-design.md), prior [2026-09-02-tradelane-path-completeness.md](./2026-09-02-tradelane-path-completeness.md), [2026-09-07-tradelane-reveal-on-completeness.md](./2026-09-07-tradelane-reveal-on-completeness.md)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Everyday Place/Send/Publish stay quiet. Path lives on Your paths + rare live order flip.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Your paths remembers the pair. Save = next orders. Open tickets unchanged from desk (**A**). First middle-hop without a lane stays quiet: Me, no group — even if Profile still says Direct. |
| UX Designer | You → Your paths. `ListSearchRow` + Card rows + Sheet with two switches (same copy as TradeLane). No four radios. Strip Publish “When they order”. BM-07: sheet CTAs clear content; list has no new sticky bar. |
| Solution Architect | Extend `TradeLane` writes for `ticket`. List/patch API for trader. At place: if lane exists for trader×seller×buyer use ticket→Manage/Direct; else default handle (create lane on Manage hop as today). Live `ticket` flip: cancel/recreate like Take over when Direct→Manage; Manage→Direct when Requested + no quote. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — You hub link, ListSearchRow, kit Sheet + accent-border switches (mill reveal).  
2. **Duplicates another feature?** No — Profile fallback for *unlaned* only; lane wins.  
3. **Should reuse an existing workflow?** Yes — mill reveal mutation style; Take over gate for live ticket.  
4. **Naming matches the app?** **Your paths**, **Me** / shop name, **see each other**. No “TradeLane” in UI.

**Philosophy conflict?** No — matches TradeLane Redesign; removes share-time path noise.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | List, search, patch ticket+reveal; place reads lane; strip Publish path |
| Business rules | OK | Future-only from Your paths; live ticket gate; reveal+Send-hold already shipped |
| Workflows | OK | First hop creates lane → appears on Your paths → edit → next order |
| Edge cases | OK | Empty list; trading off hides entry; multi-owner batch Later if conflicting lanes |
| Permissions | OK | Trading presence required |
| User states | OK | Empty until first middle-hop |
| Notifications | Later | Existing toast on save fail |
| Error handling | OK | Danger toast / InlineNotice |
| Scalability | OK | One row per trio |
| Mobile interactions | OK | No new sticky chrome (BM-07 N/A for new bar) |
| Accessibility | Later | Named switches |
| Platform consistency | OK | |

---

## Gaps

### G-002 — Live ticket vs Your paths (closed)

| Field | Content |
|-------|---------|
| Gap | Live vs future. |
| Recommendation | **Closed:** Your paths updates lane for **future** only. Live ticket flip only on order page while `requested` + no seller quote. Reveal live flip already shipped. |
| Priority | Required — closed |

### G-004 — Publish path (closed for this slice)

| Field | Content |
|-------|---------|
| Gap | Publish still offers Direct / I handle. |
| Recommendation | **Closed:** Remove from main Publish sheet. Pack column may remain null; place uses lane or default Me. Catalog share sheet path Later if still present. |
| Priority | Required — closed |

### G-006 — Place without lane

| Field | Content |
|-------|---------|
| Gap | Profile Direct still stamps first pair. |
| Recommendation | **Closed:** No lane → behave as ticket Me (handle). Do not invent a lane row until first Manage hop (existing upsert). Client may still send preference; **server** prefers lane, else defaults handle when facilitator/middle-hop. |
| Priority | Required — closed |

### G-007 — Manage → Direct live rewrite

| Field | Content |
|-------|---------|
| Gap | Flipping ticket to mill on a live Manage parent. |
| Recommendation | Allowed only Requested + no seller quote (and no released mill if that would orphan). Prefer cancel Manage parent + recreate Direct buyer↔mill with facilitator (mirror Take over inverse). Multi-mill parent: Later / block with plain message. |
| Priority | Required — closed with single-mill first |

---

## Approved scope for this slice

- Completeness + feature docs lock  
- API: list TradeLanes for trader; patch ticket+reveal (future)  
- Place/from-pack/batch: lane wins; no lane → handle default for middle-hop  
- Your paths UI + You link (trading only)  
- Order detail: **This order is with** when can flip (Requested, no quote)  
- Remove Publish “When they order” Direct/I handle  
- Units + `@functional` Your paths → next order follows  

## Explicitly deferred / rejected

- Rewriting open tickets from Your paths  
- Path on Place/Send  
- Catalog share sheet path strip (if still there — Recommended follow-up same PR if cheap)  
- Multi-mill live ticket→Direct  
- Agent / four radios  
- Hard-block Connection when reveal Off  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
