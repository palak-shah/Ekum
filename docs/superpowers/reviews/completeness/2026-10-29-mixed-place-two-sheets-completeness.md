# Feature Completeness Review — Mixed Place two sheets + mill credit + I-handle Send

**Date:** 2026-10-29  
**Module / ask:** Mixed curated Place is two How many sheets (Direct mill first, then one I-handle). Show supplier name on Collection and Catalog packs, default off. I-handle Send only for mills with no Direct Link.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/explore.md`, `docs/features/collections.md`  
**Disposition:** Redesign of “one How many for mixed Direct + I-handle”, then **Proceed**

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite `2026-10-28-direct-link-order-workflow-completeness.md` (routing + mapping) or auto-repost completeness files. Direct vs Manage routing at `createFromPack` stays. This review redesigns the **checkout sequence** and locks mill credit + Send desk.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Locked example: mill 1 Direct Link, mills 2 and 3 none. Buyer Place: sheet 1 **Order goes to {mill 1}** → Direct ticket + trio. Sheet 2 one I-handle How many for mill 2+3 → one buyer↔trader ticket; trader Sends two hops. Lists: trader **Shared** + **Trading**; buyer Direct mill ticket + one I-handle (mills unnamed). Direct mills never sit on the I-handle desk. Show supplier name off by default on both pack kinds. |
| UX Designer | Two sequential How many (same kit). Do not jump to chat between sheets. Sheet 1 names the Direct mill. Sheet 2 names the **trader**, never mill 2/3 (soft-hide). After both, land on the Direct ticket (trio). Send / Decline / Send all stay mill-card language. Hold / Resume last in mill **⋯**. Mill credit checkbox already exists — show it for Catalog as well as Collection when the pack has mill members. |
| Solution Architect | Two `POST /orders/from-pack` with item subsets (API already splits Direct vs Manage). Collection preview exposes `directMillCompanyIds` via `laneRoutesDirect`. Shortlist partition; after Direct success keep How many open on remainder; remember first Direct for land. `buildMillDesks` only Manage hops (exclude Direct). Order for buyer: same ticket split after Choose buyer (qty already on the sheet); two API subsets, not a second qty sheet. |

---

## Platform consistency (required)

1. **Existing patterns?** How many sheet, from-pack, trio at Direct Place, I-handle Send-hold, `From {shop}` toggle. Yes.  
2. **Duplicates another feature?** No second order module.  
3. **Should reuse an existing workflow?** Yes: `createFromPack` subsets + mill desk.  
4. **Naming matches the app?** Direct links. Send to {mill}. Show supplier name. Trading / Shared. No Seller/Buyer on chat card body.  
5. **Units?** No ₹/qty string change.

**Philosophy conflict?** The 2026-10-28 mixed Place lock said **one** How many / Place. Two sheets is a **Redesign** of checkout only — routing, Send-hold, and soft-hide stay. Not silent drift.

---

## Locked examples

**Mill credit.** Collection and Catalog Publish: **Show supplier name** when the pack has mill members. Default off. Album / Explore / design tiles credit `From {shop}` only when on. Own-only packs: no checkbox. Auto-repost hops stay forced on.

**Send.** I-handle hops only. Qty/rate → **Send to {mill}** / **Send all**. Decline drops the hop. After Send: mill 1:1; Confirm / qty / Dispatch / Can’t supply pass through. Hold / Resume in mill **⋯**. Direct mill tickets: no mill cards, nothing to Send.

**Buyer Place, 1 Direct + 2 I-handle.** Sheet 1 = Direct mill lines. Sheet 2 = remainder (one parent, two hops). Cancel sheet 2 leaves the Direct ticket.

**Several Direct mills.** Sheet 1 = all Direct lines (one mill → goes-to that shop; 2+ → split banner of those Direct tickets). Then I-handle remainder. All-Direct: sheet 1 only. All I-handle: one parent as today.

**Order for buyer.** Same ticket split (trader × mill × **that** buyer). Qty stays one How many; Choose buyer then two API subsets.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Two sheets; mill credit both kinds; Send desk Direct-free |
| Business rules | OK | Soft-hide sheet 2; Direct never Send; land on trio |
| Workflows | OK | Sequential How many; no chat hop between; Order for buyer split at Choose buyer |
| Edge cases | OK | All-Direct; all I-handle; cancel sheet 2; 2+ Direct mills |
| Permissions | OK | Same TradeLane lookup as createFromPack |
| User states | OK | Cancel remainder; Direct already placed |
| Notifications | OK | Existing Direct facilitator / mill Send |
| Error handling | OK | Sheet 1 fail does not open sheet 2; sheet 2 fail keeps Direct |
| Scalability | OK | Two from-pack calls; mill-id list on preview |
| Mobile interactions | OK | Same How many sheet; BM-07 already cleared |
| First glance (BM-11) | OK | Sheet 1 mill name; sheet 2 trader; quiet mill credit |
| Units (order / dispatch / Rate per) | N/A | No unit string change |
| Accessibility | OK | Existing checkbox + sheets |
| Platform consistency | OK | After checkout redesign lock |

---

## Gaps

### G-001 — One How many hid the Direct mill

| Field | Content |
|-------|---------|
| Gap | Mixed Place was one sheet to the trader. Buyer did not see that mill 1 is a trio Direct ticket. |
| Why it matters | First sheet must say the order goes to supplier 1, then I-handle remainder. |
| Impact if ignored | Buyer thinks one trader ticket; mill 1 trio is a surprise. |
| Recommendation | Two sequential How many; Direct first. |
| Priority | Required before implementation |

Closed in this slice.

### G-002 — Followers mill credit vs Catalog packs

| Field | Content |
|-------|---------|
| Gap | Show supplier name exists for curated packs; Catalog must use the same default-off rule. |
| Why it matters | Same mill members, two pack kinds, two credit languages is drift. |
| Recommendation | Same checkbox + `showSourceShops` for both kinds. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + `orders.md` Place two sheets + mill credit in explore/collections + gap matrix. Do not rewrite 2026-10-28 mixed Place file.  
- Collection preview `directMillCompanyIds`; partition How many; two from-pack subsets; land on first Direct.  
- Catalog + Collection mill credit default off; album/Explore honor it. Auto-repost still forced on.  
- `buildMillDesks` never includes Direct hops. Hold/Resume stay in mill **⋯**.  
- Units + functional mixed 1 Direct + 2 hops. Trader-eye two How many (phone width).

## Explicitly deferred / rejected

- Second How many qty sheet for Order for buyer (qty already filled; Choose buyer splits tickets).  
- Solo design market auto-repost.  
- Payments.  
- Exploding an open Manage ticket into Directs.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
