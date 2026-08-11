# Feature Completeness Review — Orders (core trade)

**Date:** 2026-08-11  
**Module / ask:** Order lifecycle functional verification — request → quote → accept → confirmed  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Core trade path is the heart of Ekum. Dispatch/deliver/samples/returns are real but out of this slice (Future). Accept quote only after Rate quote (not catalog rates) is a Required rule to prove (BM-05). |
| UX Designer | You buy / You sell; chat living card; Accept quote CTA only when `canAcceptQuote`. Never Seller/Buyer on cards. |
| Solution Architect | Reuse `POST /orders`, `/quote`, `/accept-quote` + living upsert. Dual-persona e2e. Do not invent a parallel “deal” object. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — connection-gated trade, living chat reference, inquiry vs order intent.  
2. **Duplicates?** No — not a second cart checkout.  
3. **Reuse?** Yes — chat cards are the pulse; order detail is the timeline.  
4. **Naming?** Order # / Inquiry #; Accept quote (buyer); Confirm lines (seller).

**Philosophy conflict?** No. Reject any “marketplace cart without connection” redesign.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Full quote→accept unproven in e2e |
| Business rules | Gap | BM-05 canAcceptQuote gating unproven in UI |
| Workflows | Gap | Core trade Required; dispatch Future |
| Edge cases | Recommended | All-lines can’t supply → Decline |
| Permissions | OK | Active connection required |
| User states | OK | buying/selling via data |
| Notifications | Recommended | Quote/accept attention on Home |
| Error handling | Recommended | Quote validation errors |
| Scalability | OK | Line caps in schema |
| Mobile | OK | Quote sheet / detail CTAs |
| Accessibility | Recommended | CTA labels |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Core trade journey unproven

| Field | Content |
|-------|---------|
| Gap | request → quote → accept → confirmed not in `@functional` |
| Why it matters | Primary revenue path |
| Impact if ignored | Broken trade can ship unnoticed |
| Recommendation | Dual-persona `@functional @orders` journey |
| Priority | Required before implementation |

### G-002 — BM-05 Accept quote gating

| Field | Content |
|-------|---------|
| Gap | CTA only when `canAcceptQuote`; frozen quote copy |
| Why it matters | Wrong CTA confuses buyers; copy rewrite breaks history |
| Impact if ignored | Accept on non-quoted inquiries; trust damage |
| Recommendation | Assert CTA visible after quote, living card updates after accept |
| Priority | Required before implementation |

### G-003 — Dispatch → deliver

| Field | Content |
|-------|---------|
| Gap | Seed walkthrough §4–5 not in this slice |
| Why it matters | Fulfillment completeness |
| Impact if ignored | Later slice risk |
| Recommendation | Future functional journey |
| Priority | Future improvement |

### G-004 — Photo order / amend / samples / returns

| Field | Content |
|-------|---------|
| Gap | Documented flows outside core trade slice |
| Why it matters | Real seller/buyer needs |
| Impact if ignored | Matrix rows stay Partial/Untested |
| Recommendation | Separate Completeness + journeys later |
| Priority | Future improvement |

### G-005 — Marketplace without connection

| Field | Content |
|-------|---------|
| Gap | Hypothetical ask to place orders without access approve |
| Why it matters | Breaks trust ladder |
| Impact if ignored | Platform incoherence |
| Recommendation | Reject |
| Priority | Reject / Redesign |

---

## Approved scope for this slice

- Create order (API or UI) as Meena vs Ravi.  
- Ravi quote via API (UI assert Rate/Accept).  
- Meena Accept quote → confirmed language + living card update.  
- Dispatch/deliver/samples/returns out of scope.

## Sign-off

**Yes** — Proceed to Orders `@functional` for core trade only.
