# Feature Completeness Review — I-handle trader desk

**Date:** 2026-09-07  
**Module / ask:** Trader sees one Meena ticket for a multi-mill I-handle trip; mill hops are subsets; quote gate; Hold to stop pass-through  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/superpowers/specs/2026-09-07-trader-i-handle-desk-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One inbound ticket matches how the trader names the job. Subset # is only for mill chat / mill’s own list. Quote is the one money gate. Hold is rare and per mill — not a Dispute status. |
| UX Designer | Linked portal + Coming/Going taught the database. Desk = mill cards + one Meena CTA. Chat card must say part of `#A1B2C3`. Hold is once-in-years: last in ⋯ only — no banner, pill, or CTA. BM-07: mill cards + Send + bottom nav. |
| Solution Architect | Keep `downstreamOrderId` hops. Hide subset rows for the trader on list/Find. Pass-through is new vs today’s no auto-sync — explicit events only (confirm, qty, dispatch). Hold = flag on the mill hop. Trader mill chat deep-link remaps to parent. |

---

## Platform consistency (required)

1. **Existing patterns?** Order cards, mill groups as kit Cards, Send already exists, ⋯ for rare Hold, Timeline trail.  
2. **Duplicates another feature?** No. Direct **Take over** stays Direct→Me while requested. This Hold is I-handle pass-through only.  
3. **Should reuse an existing workflow?** Reuse Send, quote sheet, living cards, trail. Reuse hops — do not merge DB orders.  
4. **Naming matches the app?** Meena / Surat / `#A1B2C3`. Shop + mill # after Send. No Seller/Buyer on list titles. No Coming/Going on the glass.

**Philosophy conflict?** No — simpler than three inbox rows. Rejected Linked portal as chrome.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Desk, hide list rows, chat remap, quote gate, Hold/Resume, pass-through |
| Business rules | OK | Locked in design spec |
| Workflows | OK | Place → Send per mill → mill acts → Meena or Hold |
| Edge cases | Later | Whole-order Hold; settle when one mill done (rule: Meena not auto-settled) |
| Permissions | OK | Trader only for desk/Hold; mill never lists before Send |
| User states | OK | Needs you on Meena row |
| Notifications | OK | Existing hop notifies; quote-to-Meena is trader-triggered; Hold is silent to Meena and mill |
| Error handling | OK | Hold twice / Resume when not held → toast |
| Scalability | OK | N mills on one page; no extra list rows |
| Mobile interactions | OK | Scroll mill cards; last Send/Resume above nav (BM-07) |
| Accessibility | OK | Shop + # as text; ⋯ labelled Hold {shop} |
| Platform consistency | OK | Kit cards / pills / full-width Send |

---

## Gaps

### G-001 — Find must not resurrect mill rows

| Field | Content |
|-------|---------|
| Gap | Today Find lists every ticket the company is on |
| Why it matters | A `#D4E5F6` hit breaks “one order” |
| Impact if ignored | Trader hunts a second desk |
| Recommendation | Trader Find/list omit subset hops they buy (I-handle going). Mill still finds their ticket. Parent row shows **Trading** + mill names; Find by mill `#` / shop remaps to the parent |
| Priority | Required before implementation |

### G-002 — Partial mill on the Surat card

| Field | Content |
|-------|---------|
| Gap | 1 of 2 can’t supply is easy to mirror onto Meena |
| Why it matters | Buyer lines must not silently drop |
| Impact if ignored | Meena thinks a design vanished |
| Recommendation | Cue on mill card; Meena changes only when trader quotes/declines her |
| Priority | Required before implementation |

### G-003 — Whole-order Hold / settle sync

| Field | Content |
|-------|---------|
| Gap | Freeze all mills; settle Meena when both mills settle |
| Why it matters | Rare; two mills finish on different days |
| Impact if ignored | Trader settles Meena when her fulfillment is done |
| Recommendation | Defer whole-order Hold. Meena settle is trader-owned |
| Priority | Future improvement |

---

## Approved scope for this slice

- Trader Orders list + Find: hide I-handle mill subset tickets; parent row **Trading** + mill names; Type filter **Trading** (Find `trading` / `linked`); Find mill `#` / shop remaps to parent  
- `#A1B2C3` grouped by mill; Send; mill # after Send  
- Pass-through except mill quote; Hold/Resume per sent mill (⋯)  
- Trader mill chat order card → parent `#A1B2C3`  
- Needs you + Timeline on the parent  
- Units + `@orders` functional: two-mill I handle, list one row, Send, quote gate, Hold  

## Explicitly deferred / rejected

- Linked portal / Coming/Going chrome — **Rejected**  
- Mill order page as trader home — **Rejected**  
- Whole-order Hold — **Later**  
- TradeLane reveal On group — already specified elsewhere  
- Merging hops into one DB order — **Rejected**  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (when this slice is scheduled)  
