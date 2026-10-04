# Feature Completeness Review — Chat WhatsApp parity

**Date:** 2026-10-02  
**Module / ask:** Eleven chat inbox/thread bugs — group photo on All Chats, public leave notices, no free-form group create from ＋, long-press highlight, swipe-to-reply, message menu placement, Archived Unarchive swipe, remove Pin message, starred cards + Unstar, remove Select chats, Android half-lines.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/orders.md` (mill reveal trio)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Groups stay trade-lane only (trader reveal); free-form multi-shop New group from ＋ is removed. Leave notices become thread-wide (WhatsApp), not company-side only.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders expect WhatsApp judgment on inbox/thread chrome. Free-form groups fight Ekum’s “group = reveal trio” model — kill ＋ multi-create. Leave must be visible to everyone remaining. |
| UX Designer | One job per control: qty/reply/pin-chat loud; optional note/select-chats/pin-message quiet or gone. Group photo on inbox; centered leave pill; swipe reply; menu never clipped. |
| Solution Architect | Prefer `thread.imageUrl` for groups; public system messages (no `side: company` on leave); portal message menus; keep `ensureTradeLaneGroup` as only group creator. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit Avatar, inbox swipe, portal menus, Card list rows, mill-reveal groups.  
2. **Duplicates another feature?** No — removes Select chats and Pin message duplication with Star / Pin chat.  
3. **Should reuse an existing workflow?** Groups only via order reveal (existing).  
4. **Naming matches the app?** Yes — business names; `{Name} left` / `{Business} left`.

**Philosophy conflict?** No — removing free-form group create *aligns* with trade-lane groups.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Eleven scoped fixes |
| Business rules | OK | Leave public; ＋ single shop; pin = chat only |
| Workflows | OK | Reveal still creates groups |
| Edge cases | OK | Non-replyable types skip swipe-reply |
| Permissions | OK | Group photo owners unchanged |
| User states | OK | Archived Unarchive swipe |
| Notifications | N/A | |
| Error handling | OK | Existing leave/archive errors |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07 menus; borders; swipe axis lock |
| First glance (BM-11) | OK | Required trader-eye before done |
| Accessibility | OK | Menus portaled; aria on Unarchive |
| Platform consistency | OK | |

---

## Gaps

None Required open — scope is the approved list below.

---

## Approved scope for this slice

- Group `imageUrl` on All Chats (+ forward picker)
- Public leave / exit notices + centered system UI + `lastMessageAt` bump
- StartChatSheet: one shop only; no New group name
- Long-press row highlight; Archived Unarchive swipe; remove Select chats; Android borders
- Swipe-to-reply; portal/flip message menu; remove Pin message; starred cards + Unstar
- Docs + units + BM-11 glance

## Explicitly deferred / rejected

- Azure Blob
- Redesigning Group Info name/photo edit
- Changing mill-reveal creation logic beyond leave visibility

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
