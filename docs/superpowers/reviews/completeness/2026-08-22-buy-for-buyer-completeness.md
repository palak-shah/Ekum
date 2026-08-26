# Feature Completeness Review — Buy for buyer

**Date:** 2026-08-22  
**Module / ask:** Seller/trader logs a ticket for a buyer who already agreed (phone or in person). Buyer **Accept**s.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`, TextileOS Journey 6 (not auto-approve)  
**Disposition:** Proceed

> Log what you already agreed. Buyer still says yes. Not a silent bill, not on the everyday Order sheet.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | After a call, the mill/trader needs to get the ticket into Ekum without asking the buyer to hunt the pack. Buyer must still Accept. Off-app buyers get a link + OTP on that phone. |
| UX Designer | Same album + How many each. Who on that sheet if selling/trading. Not a ＋ page. |
| Solution Architect | Create with `buyerCompanyId` (or thin company from name+phone). `createdByCompanyId` = seller. New **Accept** (not Accept quote). Token `/o/:token` ~7 days, one use. Reuse OTP + invite-return. |

---

## Platform consistency (required)

1. **Existing patterns?** ＋ New sheet (same tier as Photo order / Broadcast). ConnectionPicker (**Choose buyer**). Living order card. Referral-style Copy / WhatsApp — no SMS gateway.  
2. **Duplicates?** No — Photo order is buyer→supplier. Accept quote is after a Rate card.  
3. **Reuse?** Order create snapshots, trade thread, `order` notify, OTP, `randomToken`.  
4. **Naming?** **Buy for buyer** · **Accept** · **Decline**. Not proxy / seller-initiated / invoice.

**Philosophy conflict?** No — buyer still Accepts. Trust ladder unchanged. Not auto-approved.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Create + Accept / Decline + off-app token |
| Business rules | OK | Seller logs; buyer Accepts; one token |
| Workflows | OK | ＋ → who → designs/qty/rate → send |
| Edge cases | OK | Existing phone → their company; new → thin company |
| Permissions | OK | Actor is seller of those designs (own catalog, including curated they published) |
| User states | OK | Requested until Accept; expired token |
| Notifications | OK | On-app `order`; off-app link share only |
| Error handling | OK | Sheet + toast |
| Scalability | OK | One order + optional token row |
| Mobile interactions | OK | Sheets + page; last row clears chrome (BM-07) |
| Accessibility | OK | Button names |
| Platform consistency | OK | One menu home |

---

## Gaps

### G-001 — Menu home

| Field | Content |
|-------|---------|
| Gap | First lock was ＋ New; that is a second app. Traders also pick others’ designs. |
| Recommendation | **Redesign (locked):** How many each **Who** if selling/trading. No ＋ item. Drop ＋ Saved. |
| Priority | Required — locked |

### G-002 — Accept vs Accept quote

| Field | Content |
|-------|---------|
| Gap | Accept quote requires a Rate card |
| Recommendation | New **Accept** on seller-logged `requested` tickets. Confirm lines as logged. |
| Priority | Required |

### G-003 — SMS / WhatsApp send

| Field | Content |
|-------|---------|
| Gap | No SMS gateway |
| Recommendation | After create, **Copy / WhatsApp** the `/o/:token` link (same as invites). |
| Priority | Future improvement |

### G-004 — Via-trader / Send-up

| Field | Content |
|-------|---------|
| Gap | Trader logging a mill pack could spawn upstreams |
| Recommendation | Out of this slice — no chain picker, no auto Send-up. Ticket is seller=actor → buyer. |
| Priority | Future improvement |

### G-005 — HowManyEach / share sheet entry

| Field | Content |
|-------|---------|
| Gap | Tempting to add a buyer field on every order |
| Recommendation | Reject — keeps the everyday path one job. |
| Priority | Reject / Redesign |

---

## Approved scope

- Same Select → How many each. **Who** if selling/trading (not own-designs-only).  
- For me = today’s order. For a buyer = log ticket; they Accept.  
- Designs may be yours or others’. No auto Send-up.  
- On-app Accept / Decline; off-app `/o/:token` + OTP.  
- ＋ drops Buy for buyer and Saved.

## Explicitly deferred / rejected

- ＋ / You dedicated page; HowManyEach Who for buying-only; Ask rates for a buyer  
- Auto-approve, SMS send, via-trader picker, auto Send-up  
- Photo-only Buy for buyer (use catalog designs this slice)  
- Facilitator / Direct path on this create  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
