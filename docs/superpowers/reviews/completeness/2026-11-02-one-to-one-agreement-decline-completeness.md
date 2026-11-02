# Feature Completeness Review — 1:1 hide agreement line + button Decline

**Date:** 2026-11-02  
**Module / ask:** On Selling + Buying 1:1 tickets: drop the extra Confirmed by / Quote accepted line under the party (status pill already says it); render dock Decline as a real outlined kit button.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-02-buying-ticket-prototype-polish-completeness`  
**Disposition:** Proceed

Visual-only on `oneToOneTicket`. No API, Timeline copy, Cancel restyle, or Direct / I-handle change.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Status pill is Confirmed / Part shipped. A second “Confirmed by supplier” / “Quote accepted by you” under the shop is noise. Decline is a real verb — it should look tappable, not a teal caption. |
| UX Designer | Header pill is enough. Decline uses kit `secondary` (same outline as Edit), not `ghost`. Cancel stays ghost. |
| Solution Architect | Gate the party-card `agreementStepLabel` with `!oneToOneTicket`. Timeline still uses that helper when expanded. |

---

## Platform consistency (required)

1. **Existing patterns?** Status via `StatusPill`. Dock verbs via kit `Button`. Secondary = Edit.  
2. **Duplicates another feature?** The party line duplicates the pill — remove it on 1:1.  
3. **Should reuse an existing workflow?** Yes — kit secondary.  
4. **Naming matches the app?** Decline unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hide line; Decline outline |
| Business rules | OK | |
| Workflows | OK | Decline still opens the same sheet / cancel |
| Edge cases | OK | Seller-logged buyer Decline; seller requested Decline |
| Permissions | OK | |
| User states | OK | `oneToOneTicket` only |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Dock height unchanged (48px) |
| First glance (BM-11) | OK | Pill is the status; Decline looks tappable |
| Units | N/A | |
| Accessibility | OK | Button still named Decline |
| Platform consistency | OK | Direct / I-handle keep the line and ghost Decline |

---

## Gaps

### G-001 — Do not strip Timeline agreement copy

| Field | Content |
|-------|---------|
| Gap | `agreementStepLabel` also feeds Timeline steps. |
| Why it matters | Expanded Timeline is the history. |
| Recommendation | Hide only the parties-card line on 1:1. |
| Priority | Required before implementation |

### G-002 — I-handle mill Decline stays ghost

| Field | Content |
|-------|---------|
| Gap | Requested dock Decline is shared with mill `order-mill-decline-all`. |
| Recommendation | `secondary` only when `oneToOneTicket`. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- 1:1: no Confirmed by / Quote accepted under the party.  
- 1:1 dock Decline (`order-dock-decline`): kit `secondary`.  
- Selling and Buying 1:1 share this.

## Explicitly deferred / rejected

- Restyle Cancel.  
- Hide agreement from Timeline.  
- Change Direct / I-handle / mill-card Decline.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
