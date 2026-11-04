# Feature Completeness Review — I-handle desk HTML parity

**Date:** 2026-11-03  
**Module / ask:** I-handle Selling Manage parent — party hide, dock chat picker, mill/You list-row open, drop You Button CTAs (match HTML prototype screenshots).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-03-ihandle-desk-you-card-completeness`, `2026-11-02-trader-ihandle-completeness`, client prototype + user screenshots  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

**Architecture lock (approved):** Desk-over-hop stays. Trade summary is trip orientation on Manage with mill desks — **no party card** painting the trader as supplier. Mill/You headers open hops as quiet list rows (Orders list language). Confirm/Dispatch/Settle only on hops. Dock chat with who-to-chat sheet when multiple threads. Held mills still cannot open.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader desk must not say “supplier = my shop.” Trip is You sell to / You buy from / Goods go. Open mill after Send must be obvious. Message lives at the bottom like 1:1. |
| UX Designer | HTML nested Buying row (avatar · hash · status · chevron). You open must not look like a primary Dispatch Button. Wait cue survives without party card. |
| Solution Architect | No schema. Reuse BottomTradeDock, SellingDockChat, Sheet, FulfilmentDeskCard. Chat targets = buyer threadId + released millThreadIds. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — trade summary, FulfilmentDeskCard, Orders list row, SellingDockChat, order-trader-selling-hop chain.  
2. **Duplicates another feature?** No if dock is the only message entry on Manage.  
3. **Should reuse an existing workflow?** Yes — hop operate; deskOrderId bounce for held.  
4. **Naming?** You / mill shop / buyer; Buying # on mill subline.  
5. **Units?** N/A — chrome only.

**Philosophy conflict?** No under desk-over-hop + party hide. Parent operate CTAs or held-hop open → **Reject**.

---

## Verified current behaviour (code, not assumption)

| Concern | Verified state |
|---------|----------------|
| Party card | Always rendered; Manage shows trader as supplier · buyer |
| Trade summary | Present when millDesks; seller mill names |
| Mill open | Released `#` link only; no header chevron; held hopOrderId null |
| You open | `#` + chevron + footer Button Confirm/Dispatch (navigate-only) |
| Dock chat | Only oneToOneTicket; Manage has Send all / empty without chat |
| Mill hop | Stacked Supplier = mill; For {buyer} · your selling order chain |
| Held bounce | deskOrderId → parent replace navigate |

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Party mislabel; Dispatch Button; weak mill open; no dock chat |
| Business rules | OK | Guards stay |
| Workflows | Gap | Message / open hop |
| Edge cases | OK | Held no open; 1 chat target skips sheet |
| Permissions | OK | Soft-hide mill names; buyer no You hop |
| User states | Gap | Wait cue must move off party |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | OK | |
| Mobile (BM-07) | Gap | Dock chat + Send all clearance |
| First glance (BM-11) | Gap | Match HTML 390px |
| Units | N/A | |
| Accessibility | Gap | Header Link must have clear name |
| Platform consistency | OK | if Proceed as locked |

---

## Gaps

### G-001 — Party card shows trader as supplier

| Field | Content |
|-------|---------|
| Gap | Manage party paints Surat as supplier while trade summary already orients the trip. |
| Why it matters | Trader thinks they are the supplier on the parent ticket. |
| Impact if ignored | BM-11 miss; HTML mismatch. |
| Recommendation | Hide party when mill desks on trader Manage; keep wait cue under summary. |
| Priority | Required before implementation |

### G-002 — Message not at bottom; multi-party unclear

| Field | Content |
|-------|---------|
| Gap | Chat on party buyer row; Manage dock has no chat. |
| Why it matters | HTML docks message; multiple mills need a picker. |
| Recommendation | Dock chat; sheet when 2+ targets (buyer + released mills). Drop Manage mill header chat. |
| Priority | Required before implementation |

### G-003 — Mill hop open affordance weak

| Field | Content |
|-------|---------|
| Gap | Only small `#` after Send; no list-row header. |
| Recommendation | Released mill header = Link row (avatar · Buying # · cue · chevron). Held: no open. |
| Priority | Required before implementation |

### G-004 — You Dispatch Button looks like operate

| Field | Content |
|-------|---------|
| Gap | Footer Button “Dispatch” / “Confirm” on parent. |
| Recommendation | Remove Buttons; quiet header open only. |
| Priority | Required before implementation |

### G-005 — Open held mill / parent Confirm Dispatch POST

| Field | Content |
|-------|---------|
| Gap | Would fight deskOrderId bounce and hop lifecycle. |
| Recommendation | **Reject**. |
| Priority | Reject / Redesign |

---

## Approved scope for this slice

- Completeness + orders.md / gap matrix lock.  
- Hide Manage party when mill desks; wait cue with trade summary.  
- Dock chat + who-to-chat sheet; drop Manage mill header chat.  
- Mill/You headers as quiet list-row opens; remove You Button CTAs.  
- Unit + functional + BM-11 390px.

## Explicitly deferred / rejected

- Opening held mill hops.  
- Parent Confirm/Dispatch POST.  
- Goods go auto vs godown change.  
- Schema / You hop retirement.  
- Buying / Direct / Selling 1:1 restyle beyond shared dock patterns.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
