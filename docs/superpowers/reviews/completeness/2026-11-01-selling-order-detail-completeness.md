# Feature Completeness Review — Selling 1:1 order detail chrome

**Date:** 2026-11-01  
**Module / ask:** Restyle **Selling 1:1 bilateral** order detail to the client HTML prototype: section order, buyer card, private note, folded Can’t supply, Dispatches after Designs, collapsed Timeline, always-on Chat + action bar.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-10-30-order-ticket-chrome-completeness`, `2026-10-31-ticket-notes-timeline-path-icons-completeness`, `2026-09-23-order-detail-shell-completeness`, client `Ekum Order Page Prototype (Copy).html`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

This is a **scoped visual Redesign of Selling 1:1 ticket chrome**. Buying, Direct, and I-handle keep today’s layout. No API, lifecycle, status vocabulary, or Notes-permission change.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One Selling 1:1 ticket: header → buyer → private note → progress → designs → dispatches → notes → timeline → always-on bar. Chat is one path (the bar). Wait copy stays role words. Confirm / Dispatch / Settle verbs and sheets stay. |
| UX Designer | Buyer name as title, **Buyer** under it. Private note labelled **Private note · Only you**. Can’t supply folded. Dispatches · N LRs. Timeline · N until tap. Bar: 48×48 chat icon left (line square), primary or wait right; completed = **Chat with {buyer}**. No five-tab nav on this page. |
| Solution Architect | Gate with `isSellingBilateralTicket` (selling + bilateral + not I-handle + no mill desks). Reuse dock verbs, thread URL, shipment helpers, Notes card. No new endpoints. |

---

## Platform consistency (required)

1. **Existing patterns?** PageHeader, StatusPill, ⋯, Avatar 48, kit Button / Card / BottomTradeDock, ticket design rows, hop Notes.  
2. **Duplicates another feature?** No — Chat still opens the existing 1:1 thread. Notes stay hop-scoped.  
3. **Should reuse an existing workflow?** Yes — `orderActionDock` verbs + sheets; `orderTicketWaitingCue`; `shipmentPrimaryLabel`.  
4. **Naming matches the app?** Buyer (not Sales party); **Dispatches**; **Private note · Only you**; **Waiting: buyer**; Chat (not Open chat). Status pills stay Placed / Confirmed / Part shipped / Dispatched / Settled.  
5. **Units?** Unchanged. Whose = remaining ticket lines · which = order unit on progress / qty · Rate per on the line. Pack conversion stays on Total.

**Philosophy conflict?** No if this chrome is **Selling 1:1 only**. Applying dock Chat / always-on bar / header-only Timeline to Buying, Direct, or I-handle would fight prior completeness → would be Reject this slice.

Prior reviews deferred dock Chat and wait-on-dock, and asked to keep five-tab nav. **This slice supersedes those three decisions for Selling 1:1 only.** Code already hides tabs on `/orders/:id`; we do not restore them. Idle Selling tickets get Chat-only dock instead of an empty bottom.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Reorder + Chat bar + fold + Dispatches chrome |
| Business rules | OK | Verbs / sheets / notes permissions unchanged |
| Workflows | OK | Chat → existing thread; Confirm / Dispatch / Settle sheets |
| Edge cases | OK | No threadId hides Chat; no private note hides card; 0 LRs hides Dispatches; all declined → empty main list + disclosure |
| Permissions | OK | Personal note company-only; hop Notes unchanged |
| User states | OK | Gate excludes buying / direct / manage / mill desks |
| Notifications | N/A | |
| Error handling | OK | Existing in-sheet / toast |
| Scalability | N/A | |
| Mobile interactions | OK | Always-on bar + `BOTTOM_DOCK_CLEARANCE_CLASS` (BM-07); no tab restore |
| First glance (BM-11) | OK | Buyer name loudest after header; wait quiet on bar; Can’t supply folded |
| Units (order / dispatch / Rate per) | OK | No ₹ / qty string change this slice |
| Accessibility | OK | Chat has visible **Chat**; wait has text; Timeline summary is a button |
| Platform consistency | OK | Kit Button / Card / dock; Selling-only gate |

---

## Gaps

### G-001 — Do not change Buying / Direct / I-handle

| Field | Content |
|-------|---------|
| Gap | Shared `OrderDetailPage` also renders those tickets. |
| Why it matters | Prior chrome (party chat, wait on party, dock only when there is a verb, newest Timeline row) is still the shipped behaviour for those paths. |
| Impact if ignored | Buyer wait and I-handle desk journeys break. |
| Recommendation | `isSellingBilateralTicket` gates every visual branch. |
| Priority | Required before implementation |

### G-002 — Always-on bar vs empty completed ticket

| Field | Content |
|-------|---------|
| Gap | Completed Selling tickets currently have no dock and no tabs. |
| Why it matters | Prototype always has Chat. Empty bottom is a dead screen. |
| Impact if ignored | Trader cannot open chat from a finished ticket without hunting the party icon. |
| Recommendation | Selling 1:1 always shows the dock. Complete / cancelled = Chat only. |
| Priority | Required before implementation |

### G-003 — One Chat path

| Field | Content |
|-------|---------|
| Gap | Party-row chat icon plus dock Chat would be two ways. |
| Why it matters | UI quality bar: if two ways exist, keep the shorter one. |
| Recommendation | Selling 1:1: Chat on the bar only. Other tickets keep the party icon. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Selling 1:1 section order: header · buyer · private note · progress · designs · dispatches · notes · timeline.  
- Buyer card: shop name + **Buyer**.  
- Personal note preview after buyer: **Private note · Only you**.  
- Fold declined lines under **N can't supply**.  
- Dispatches after Designs; heading count; LR · transporter · date · qty. Keep edit + packing-list PDF.  
- Timeline collapsed to **Timeline · N** until tap.  
- Always-on bar: Chat + existing verbs, or wait, or Chat only. No five-tab nav.  
- Status pills and ⋯ menu unchanged.

## Explicitly deferred / rejected

- Remap pills to New / Accepted / Part sent / Completed.  
- Extra accept/reject.  
- Buying / Direct / I-handle restyle.  
- New note / forward APIs or trio Notes.  
- Restore five-tab nav on the ticket.  
- Caption-on-the-right Designs heading polish; line **Changed** tags.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
