# Feature Completeness Review — Trader mill hop selling-order card + notes composer shell

**Date:** 2026-10-31  
**Module / ask:** On a released I-handle mill hop, the trader stays on that ticket and sees prototype screen 1 (stacked Supplier + **For {buyer} · your selling order**). Ticket Notes put **+** inside the chat composer well.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-10-21-orders-list-hop-cue-completeness` (list mill hops stay off), `2026-10-31-ticket-notes-timeline-path-icons-completeness`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

A generic **Related orders** box and listing mill hops still fight I-handle. This slice is **not** those: after **Send**, the trader may open the mill hop they already buy on, and jump back to the selling parent. List stays one Trading row. Mill never sees the parent.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader’s mill hop job after Send is “this buy from the mill, and the sell it feeds.” Soft-hide: mill sees their lot only; buyer never opens mill hops from the list. Held hops stay on the parent desk (Send lives there). |
| UX Designer | Screen 1: 48px mill Avatar, **name** then **Supplier** (not `supplier · Name`). Chain row: **For {buyer} · your selling order #{id}** / **Dispatch goes straight to {buyer}**. Notes: one `COMPOSER_SHELL_CLASS` well — **+ \| field \| Add** inside, like chat. How many labeled attach unchanged. |
| Solution Architect | `deskOrderId` only while `upstreamReleasedAt` is null. Downstream `relatedOrders` already returned for the trader on the mill hop; mill skip stays. Mill `#` on the parent mill desk (after Send) is a link to `/orders/{upstreamOrderId}`. Find still maps mill `#` to the parent list row. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Card + chain `LinkIcon` + `ChevronRightIcon`; 48px `Avatar`; chat `COMPOSER_SHELL_CLASS`; hop-scoped Notes.  
2. **Duplicates another feature?** No list mill row. Not a Related box on the parent (mill desks stay). Not mill-profile links.  
3. **Should reuse an existing workflow?** Yes — `relatedOrders` downstream + existing mill desk `#`.  
4. **Naming matches the app?** **Supplier** (stacked subtitle); **your selling order**; **Dispatch goes straight to {buyer}**. Company names, not Seller/Buyer on chat cards.  
5. **Units?** N/A — no ₹ or qty string change.

**Philosophy conflict?** The old lock “never open mill hops / no Related box” conflicts with screen 1. **Redesign** that lock for **released mill hops, trader only** — not mill, not buyer, not the list.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | After Send: mill `#` → mill hop; hop card → parent; Notes + in shell |
| Business rules | OK | Held → still redirect to parent. Released → stay. Mill relatedOrders empty. Buyer no mill hop card |
| Workflows | OK | Send still on parent desk. Find mill `#` still parent list row |
| Edge cases | OK | Multi-mill: each mill `#` is that hop. Declined mill: no `#` link |
| Permissions | OK | Trader is buyer on mill hop; mill 404 while held |
| User states | OK | Before Send bounce; after Send screen 1 |
| Notifications | N/A | |
| Error handling | OK | Existing 404 / Send errors |
| Scalability | OK | One relatedOrders read already on GET |
| Mobile interactions | OK | No new sticky (BM-07) |
| First glance (BM-11) | OK | One hop row under Supplier; notes well matches chat |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Hop row is a link; mill `#` is a link; plus aria-label unchanged |
| Platform consistency | OK | Chat composer shell; chain icon already I-handle |

---

## Gaps

### G-001 — Do not list mill hops

| Field | Content |
|-------|---------|
| Gap | Screen 1 is a ticket, not a Buying list row. |
| Why it matters | `2026-10-21-orders-list-hop-cue` rejected mill subset rows. |
| Recommendation | List / Find still one Trading parent. Entry is mill `#` on the desk after Send. |
| Priority | Required before implementation |

### G-002 — Mill never sees the parent

| Field | Content |
|-------|---------|
| Gap | Hop card names the end buyer and parent `#`. |
| Why it matters | Soft-hide: mill sees their lot only (`buildRelatedOrders` skips mill). |
| Recommendation | Keep mill `relatedOrders` empty. No hop card for mill / end buyer. |
| Priority | Required before implementation |

### G-003 — Held hops stay on the desk

| Field | Content |
|-------|---------|
| Gap | Opening a waiting mill hop would hide Send. |
| Recommendation | `deskOrderId` = parent while `upstreamReleasedAt` is null. |
| Priority | Required before implementation |

### G-004 — Notes + lives in the chat well

| Field | Content |
|-------|---------|
| Gap | Current composer is + outside kit TextArea. |
| Recommendation | `layout="composer"` uses `COMPOSER_SHELL_CLASS`; inner field transparent. Labeled How many / dispatch unchanged. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- After Send, trader mill `#` opens the mill hop; held hops still redirect to the parent.  
- Mill hop (trader): stacked Supplier party + chain hop card to the selling parent.  
- Mill / end buyer never see that card. List stays one parent row.  
- Ticket Notes composer: **+** and **Add** inside the shared chat well.

## Explicitly deferred / rejected

- Mill subset rows on the Orders list.  
- Related box on the Manage parent (mill desks stay).  
- Mill seeing parent buyer / parent `#`.  
- Restyling How many / dispatch NoteAttachField.  
- Restyling party lines on tickets that are not the trader mill hop.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
