# Feature Completeness Review — Orders timeline, complaint, dispatch edit, list sort

**Date:** 2026-10-05  
**Module / ask:** Timeline newest-first + More; complaint from order (trader vs supplier pick + trader escalate-as-trader); editable past dispatches with buyer chat pulse; Orders list by last edited + Explore-style when; Complaint type in Orders Find.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need latest status first, correctable LRs, and shop issues still via 1:1 complaint — with an explicit against pick on Trading tickets and a trader-named escalate to mill. List should surface last activity. |
| UX Designer | Collapse Timeline to latest + More; gray prior LRs in Dispatch more with Edit; Complaint last in ⋯; accent-border against pick; Explore-style when stamps. |
| Solution Architect | PATCH shipment + recompute; `order_dispatch_edited` living card; GET complaints list; optional `forwardedFromComplaintId`; soft-hide on escalate. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit Sheet, living order card, ChatComplaintSheet, ConnectionPicker selection rows, explorePostedWhen.  
2. **Duplicates another feature?** No — escalate is a new complaint as trader, not buyer impersonation or returns.  
3. **Should reuse an existing workflow?** Yes — chat ＋ Complaint form + order attach; dispatch sheet qty language.  
4. **Naming matches the app?** Complaint / What's wrong / Send to supplier / Trader · Supplier cues; no Seller/Buyer on chat card body.

**Philosophy conflict?** No — intentional redesign of append-only shipments (edits allowed with chat pulse) and complaint entry (still chat-centric, not a return form on the ticket).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Timeline, complaint entry/escalate/find, dispatch edit, list sort |
| Business rules | OK | Soft-hide; settle locks shipment edit; qty 0 removes line from LR |
| Workflows | OK | Order ⋯ → pick → chat sheet; Send to supplier → mill 1:1 |
| Edge cases | OK | One target skips pick; settled rejects PATCH |
| Permissions | OK | Seller edits shipments; party raises complaint; escalate trader-only |
| User states | OK | |
| Notifications | Later | Chat card pulse is the notify; push emitter Later |
| Error handling | OK | In-sheet / toast |
| Scalability | OK | |
| Mobile interactions | OK | BM-07 sheets + dock clearance |
| First glance (BM-11) | OK | Latest status loud; More quiet; gray priors secondary |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Mill response does not mirror to buyer

| Field | Content |
|-------|---------|
| Gap | Escalate creates trader→mill complaint only |
| Why it matters | Buyer not auto-updated when mill replies |
| Impact if ignored | Trader relays manually |
| Recommendation | Later |
| Priority | Future improvement |

### G-002 — Edit shipment after Settle

| Field | Content |
|-------|---------|
| Gap | PATCH rejected when order is `settled` |
| Why it matters | Settle rewrote agreed qty |
| Impact if ignored | Trader cannot fix LR after settle |
| Recommendation | Defer |
| Priority | Future improvement |

---

## Approved scope for this slice

- Timeline newest-first; default latest + More / Less.  
- Order ⋯ Complaint → against pick (trader vs supplier) when needed → chat deep link with order attached.  
- Trader **Send to supplier**: new complaint as trader on mill 1:1; prefill; soft-hide.
- Multi-supplier escalate: default mill from designs / lot (lines are one supplier); quiet **Change** for other released mills.  
- Orders Find Type **Complaint** + `GET /complaints`.  
- Dispatch more shows gray prior LRs + Edit (qty + LR/transporter/parcels); PATCH; trail + `order_dispatch_edited`.  
- Orders feed sort `updatedAt` desc; `explorePostedWhen` stamps.

## Explicitly deferred / rejected

- Mill reply auto-mirror to buyer; respond/resolve desk UI; shipment edit after settle; push notifications for complaints.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
