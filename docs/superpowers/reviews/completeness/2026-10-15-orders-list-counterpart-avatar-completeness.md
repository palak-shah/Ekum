# Feature Completeness Review — Orders list counterpart avatar

**Date:** 2026-10-15  
**Module / ask:** Orders list cards — remove design thumbnails; always show counterparty shop Avatar (logo or initials) before the name. Sell → buyer; Buy → supplier (existing `counterpart`).  
**Anchors:** `docs/features/orders.md`, Completeness `2026-10-09-orders-list-textile-card`, `2026-10-09-orders-list-photo-viewer`  
**Disposition:** Proceed  

> Intentional redesign of list media only. List PhotoViewer / overlapping design thumbs are superseded. Photo viewing stays on order detail.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | List job is who + status + next action — product photos clutter the feed. Client prototype: shop avatar beside name. |
| UX Designer | Match Chats inbox: kit Avatar 48, fixed media column, initials when no logo. Keep facts, StatusPill, time, protocol. |
| Solution Architect | No API change — `counterpart.name` + `counterpart.logoUrl` already on list. Drop list gallery wiring from `OrdersPage`. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Avatar` (same as inbox / connections).  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — counterparty summary already on OrderView.  
4. **Naming matches the app?** Shop name unchanged; no Seller/Buyer labels on the card body.

**Philosophy conflict?** No — cleaner list, fewer taps clutter; aligns with “one job per screen” glance.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Avatar always; row still opens ticket |
| Business rules | OK | Counterpart already soft-hidden |
| Workflows | OK | Detail still has line PhotoViewer |
| Edge cases | OK | No logo → initials; complaints may have no logo |
| Permissions | N/A | |
| User states | OK | Buy/Sell use serializer counterpart |
| Notifications | N/A | |
| Error handling | OK | Avatar broken-image → initials |
| Scalability | OK | Single 48px media (no stack width) |
| Mobile interactions | OK | No sticky chrome change |
| First glance (BM-11) | OK | Shop identity first; no thumb noise |
| Accessibility | OK | Avatar alt / initials text |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Always kit Avatar in Orders list media column (orders, samples, complaints).  
- Remove design thumb stack and list PhotoViewer from list rows.  
- Update `docs/features/orders.md` + unit harness for avatar/initials.  
- Preserve facts, StatusPill, time, protocol, filters, navigation.

## Explicitly deferred / rejected

- Relocating photo glance to another list gesture.  
- API field for initials (client derives from name).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
