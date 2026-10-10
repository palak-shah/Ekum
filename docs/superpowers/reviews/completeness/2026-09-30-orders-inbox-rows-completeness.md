# Feature Completeness Review — Orders list like Chats

**Date:** 2026-09-30  
**Module / ask:** Orders list rows should share inbox geometry. Action dock hides bottom nav. Still orders, not chats.  
**Anchors:** `docs/features/orders.md`, `docs/features/chat.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same tickets. Glance like Chats: shop, one line, when. Job stays on the order page. |
| UX Designer | Quiet **card stack** (gap + rounded border). 48 Avatar, name + time, verb preview (not “Needs you ·” on every row), facts line. Needs you = left accent. Optional trailing design thumb. No swipe / unread / pin / Call / Reminder. |
| Solution Architect | Preview helper. Dock visibility store so nav hides only while CTAs exist. |

---

## Platform consistency

1. **Existing patterns?** Kit Avatar + inbox row spacing. Dock hide-nav like profile edit.  
2. **Duplicates?** No.  
3. **Reuse?** InboxThreadRow geometry, not InboxThreadRow itself (no swipe).  
4. **Naming?** You buy / You sell / Trading; Needs you verbs unchanged.

**Philosophy conflict?** No.

## Approved scope

- TradeRow inbox layout; Needs you as preview; third facts line Order # · N designs.
- Hide app nav while order action dock is on; dock at the bottom edge.
- Empty copy: orders and samples only.

## Explicitly deferred

- How-many / builder Place dock hiding nav.
- Chat thread still keeps tab bar.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
