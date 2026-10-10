# Feature Completeness Review — Confirm primary · Send quote secondary

**Date:** 2026-10-08  
**Module / ask:** Main seller path = **Confirm** (qty + rate + lock). Keep **Send quote** as a secondary soft-offer. I-handle: trader **Send** to mill may change qty/rate; mill **Confirm** (edit if needed).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, I-handle desk completeness  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Everyday tickets lock with Confirm; quote stays for negotiation / inquiry / soft pass. I-handle mill hop is already Send-with-patch → mill Confirm — reinforce in docs/cues, do not invent a second path. |
| UX Designer | One loud dock job: **Confirm** (teal). **Send quote** quiet (ghost). Order: Decline · Send quote · Confirm (rare/secondary before primary right). When Confirm is off (I-handle desk / Send all), Send all or Send quote is teal only if it is the sole everyday job. |
| Solution Architect | No API remove. Chrome + dock helpers + docs + needs-you copy where it still says quote-first for bilateral. Keep Accept quote + quote API. Parent I-handle **Confirm stays off** until mills are sent (existing rule). |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — sticky dock, Confirm sheet already has Qty\|Rate; quote sheet kept.  
2. **Duplicates another feature?** No — quote remains the soft offer; Confirm locks.  
3. **Should reuse an existing workflow?** Yes — mill card qty/rate + Send; mill Confirm sheet.  
4. **Naming matches the app?** Confirm / Send quote / Send — unchanged.

**Philosophy conflict?** No — fewer taps on everyday path; quote not deleted.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Reorder dock priority; keep both flows |
| Business rules | OK | Quote still soft; Confirm locks; I-handle Confirm off on parent |
| Workflows | OK | Bilateral Confirm-first; mill Send→Confirm |
| Edge cases | OK | After quote: Confirm still primary; Accept quote unchanged for buyer |
| Permissions | N/A | |
| User states | OK | Inquiry may still use quote; Confirm also firms |
| Notifications / chat | OK | Rate card only when quote used |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Same dock row; BM-07 unchanged |
| First glance (BM-11) | Gap | Confirm must read as the one job; quote quieter |
| Accessibility | OK | Same buttons, clearer primary |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Dock chrome still teal on Send quote before first quote

| Field | Content |
|-------|---------|
| Gap | Before `hasSellerQuote`, Send quote is primary teal and Confirm is secondary. |
| Why it matters | Fights “main path = Confirm”. |
| Impact if ignored | Traders keep hunting quote for everyday lock. |
| Recommendation | Always: Confirm teal when shown; Send quote ghost when Confirm (or Send all) is also shown. |
| Priority | Required before implementation |

### G-002 — Docs still describe quote-teal dock / quote-first Line outcomes

| Field | Content |
|-------|---------|
| Gap | `orders.md` Line outcomes + I-handle dock copy. |
| Recommendation | Update to Confirm-primary; quote secondary; mill Send→Confirm. |
| Priority | Required before implementation |

### G-003 — I-handle parent Confirm still off

| Field | Content |
|-------|---------|
| Gap | Trader cannot Confirm buyer ticket while mill desks exist (by design — don’t lock before Send). |
| Why it matters | User asked Confirm as main path; parent still uses Send quote to pass rates. |
| Recommendation | **Defer** enabling parent Confirm — keep Send quote for soft pass / Accept. Mill hop is Confirm-primary. Revisit parent Confirm only after mills firm if product wants lock-without-Accept. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Seller requested dock: **Decline · Send quote (ghost when Confirm or Send all present) · Confirm (teal)**; after quote same order (Confirm teal).  
- I-handle with Send all: **Decline · Send quote (ghost) · Send all (teal)**.  
- Alone Send quote (no Confirm, no Send all): Send quote may stay teal (only job).  
- Docs: Line outcomes + I-handle Me row — Confirm primary; quote secondary; mill Send may change qty/rate; mill Confirm (edit optional).  
- Unit + chrome e2e: Confirm right of Send quote; Confirm primary styling when both show.  
- Trader-eye phone dock.

## Explicitly deferred / rejected

- Removing Send quote / Accept quote / Rate cards.  
- Enabling Confirm on I-handle parent while mills unsent or as replacement for quote-pass (G-003).  
- Changing mill Send API (already patches qty/rate).

## Verification

- `iHandleDesk` / dock unit tests; `orders.chrome.journey` dock order.  
- BM-11: bilateral Requested dock — Confirm loudest.
