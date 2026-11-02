# Feature Completeness Review — Sender avatar + reply who

**Date:** 2026-10-31  
**Module / ask:** Incoming bubbles print the shop at the top. 1:1 colors already say who. Show who with a WhatsApp-style avatar on the last of a streak. Reply quotes name the quoted shop. Mill-lot cards print a second parent Order #.  
**Anchors:** `docs/features/chat.md`, Completeness `2026-10-30-chat-thread-placed-by-completeness.md`, `2026-10-30-chat-order-note-under-thumbs-completeness.md`  
**Disposition:** Proceed (chrome + identity)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Confirmed **1:1 and groups**: no incoming shop name on the bubble; avatar on cluster tail; reply names who. Outgoing teammate line stays. Mill-lot card: no parent hash.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Who wrote = wash + avatar, not a shop title on every incoming. Reply names the quoted shop (or You). Mill lot is this hop — not a second Order #. |
| UX Designer | Incoming: 28px column; Avatar only on last consecutive from that shop; spacer on earlier. Outgoing: no avatar. User quote: shop name + snippet (not the word Reply). Order tags stay Order #. |
| Solution Architect | `inCardSenderLine` incoming null. `senderCompanyId` on reply preview. `orderCardCopy` drops parent / For-order noise. Stop auto-stamping For order on mill create. |

---

## Platform consistency (required)

1. **Existing patterns?** Cluster tail already exists. Group thumbs exist; extend to 1:1 + tail-only. Reply quote family unchanged (no left bar).  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same thread / same quote chrome.  
4. **Naming matches the app?** You / shop. Never Seller/Buyer. Never other-shop staff names.  
5. **Units?** N/A.

**Philosophy conflict?** No. Group name-on-bubble → avatar is an intentional lock (user). I-handle soft-hide: do not name mills on the buyer parent chat.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Send / reply / tags unchanged |
| Business rules | OK | Other shops never see our staff names on quotes (shop / You) |
| Workflows | OK | Composer reply strip names who |
| Edge cases | OK | Unavailable original: no sender. Date chips skip, do not break cluster |
| Permissions | N/A | |
| User states | OK | 1:1 + group |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | 28px spacer so bubbles don’t jump; last content still clears composer |
| First glance (BM-11) | OK | No Jaipur Emporium title on incoming; one avatar at streak end; mill card has one Order # |
| Units | N/A | |
| Accessibility | OK | Avatar `name` still set for initials |
| Platform consistency | OK | Teammate line on ours; forwarded provenance stays |

---

## Gaps

None required. Group name-on-bubble dropped by confirmation. Parent `#` on mill card dropped — not which mill.

---

## Approved scope for this slice

- Incoming shop name off bubbles (text, tags, trade cards). Outgoing teammate stays.
- Incoming avatar 1:1 + group, cluster tail only, 28px spacer otherwise.
- User reply + composer: quoted shop or You. Order tags unchanged.
- `MessageReplyPreview.senderCompanyId` from parent.
- Mill-lot card: no Part of / For order. Real mill note stays. Stop auto For-order stamp on mill create.

## Explicitly deferred / rejected

- Naming mills on the buyer parent chat — **rejected** (soft-hide).
- Other-shop staff names on quotes — **rejected**.
- Moving + / mic — **rejected**.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + trader-eye; no new journey)
