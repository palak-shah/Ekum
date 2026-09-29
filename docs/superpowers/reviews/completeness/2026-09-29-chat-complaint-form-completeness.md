# Feature Completeness Review — Chat ＋ Complaint + find / filter

**Date:** 2026-09-29  
**Module / ask:** Raise a complaint from 1:1 chat ＋; photos on the card; list in In chats + thread filter. Do not tag the whole chat.  
**Anchors:** `docs/features/chat.md`, `docs/features/orders.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Against this shop. A moment, not the whole 1:1. Subject required. Photos + order optional. Find + filter need a card. |
| UX Designer | Last ＋ row. Kit sheet: What's wrong, Add photos, More, order rows. Card = subject + More + design·date (never Order #) + thumbs. |
| Solution Architect | Optional `orderId` + `images[]`. `MessageType.Complaint`. `view=complaints` + find kind. |

---

## Platform consistency

1. **Existing patterns?** Attach last; chat photos; In chats; thread filter; trade card.  
2. **Duplicates?** Tagging the thread would bury later trade. Return escalate is a mill return.  
3. **Reuse?** Complaint API + `uploadImage` + attach order rows.  
4. **Naming?** Complaint / What's wrong / More / Add photos.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Raise + photos + find + filter |
| Business rules | OK | 1:1; against counterpart; order must match |
| Workflows | OK | ＋ → sheet → card |
| Edge cases | OK | No orders = hide picker; groups hide ＋ row; max 9 photos |
| Permissions | OK | Party on order if tied |
| User states | OK | |
| Notifications | Later | Emitter deferred |
| Error handling | OK | In-sheet |
| Scalability | OK | |
| Mobile interactions | OK | BM-07 sheet; camera/gallery like chat ＋ |
| Accessibility | OK | Required * |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Respond / resolve desk

| Field | Content |
|-------|---------|
| Gap | No respond UI |
| Why it matters | Against shop cannot reply in-app |
| Impact if ignored | Card is a record only |
| Recommendation | Later |
| Priority | Future improvement |

---

## Approved scope

- 1:1 ＋ last Complaint form.  
- Optional photos (same camera/gallery as chat ＋).  
- Optional order.  
- Complaint card in thread (thumbs).  
- In chats + thread filter.  
- Do **not** tag the whole chat.

## Explicitly deferred / rejected

- Respond / resolve, notifications, groups, Ekum support dest, thread-level complaint tag.

## Sign-off

Required gaps closed: Yes (G-001 deferred)  
Ready: Yes
