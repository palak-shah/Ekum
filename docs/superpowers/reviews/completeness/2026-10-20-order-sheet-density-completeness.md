# Feature Completeness Review — order sheet density (shared chrome)

**Date:** 2026-10-20  
**Module / ask:** How many / order sheets: compact − qty +, no Metre/Piece on the line, conversion only in the footer (split when mixed), no ₹ without a rate. One token file so name / subtext / qty box is a single future edit.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, UI quality bar  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Place path stays a sheet. ChatGPT’s wizard is a density reference, not a new IA. Traders count on the line; they read conversion once at the bottom. No published rate → no price, no total (Ask rates still works). |
| UX Designer | 40px stepper + “Metre” beside the name + `70 metres` in the footer repeats the unit three times and shouts over the design. Compact 32px − n + (16px type, iOS), name token matching cards/chats, trade shorts (`mtr`/`pcs`/`sets`). Sheets differ by job (This LR vs ±) but share type, color, placement. |
| Solution Architect | No API change. One leaf token file (`ui/designLineChrome.ts`) + `OrderDesignTitle` / footer helper. How many + builder go through `OrderLineStack`. Ticket sheets keep Qty\|Rate / This LR chrome. |

---

## Platform consistency (required)

1. **Existing patterns?** Catalog card / chat title `text-[15px] font-emphasis tracking-tight text-ink`; muted `text-[12px]` subtext; compact qty already on Dispatch This LR. Reuse `OrderLineStack`, `QtyStepper`, kit Sheet.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** How many / quote / confirm / dispatch / settle stay.  
4. **Naming matches the app?** Trade shorts, not “Metre” / “metres”. No Seller/Buyer on cards.

**Philosophy conflict?** No — clutter-free, one job per line, conversion at the moment it matters (the footer).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Qty / place / quote / dispatch unchanged; chrome only |
| Business rules | OK | Billing formula unchanged; hide ₹ when any counted line has no rate |
| Workflows | OK | Same taps; ± still How many / builder / Same for all only |
| Edge cases | OK | Mixed units stack; unknown pack size → sets only; no rates → qty rows, no money |
| Permissions | N/A | |
| User states | OK | Ask-rates How many with on-request catalog |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | One token file; N sheets import it |
| Mobile interactions | OK | Sticky footer still qty + CTA; 32px ± still tappable; BM-07 clearance unchanged |
| First glance (BM-11) | OK | Name + qty loudest; no sold-as title; optional Note stays quiet one-line |
| Accessibility | OK | aria-label still uses count noun; 16px qty type (no iOS zoom) |
| Platform consistency | OK | Cards/chats name token; no order-only type |

---

## Gaps

### G-001 — Ticket thumbs stay 64px

| Field | Content |
|-------|---------|
| Gap | How many thumbs are 48px; quote/confirm/dispatch stay 64px this slice. |
| Why it matters | Density still differs by surface. |
| Impact if ignored | Tickets feel roomier than Place. |
| Recommendation | Defer — tick + facts + This LR need the larger thumb this slice. |
| Priority | Future improvement |

### G-002 — Detail-page dual qty

| Field | Content |
|-------|---------|
| Gap | Order detail fact strip still shows `10 sets (= 40 pcs)`. Action sheets do not. |
| Why it matters | Ticket record vs acting sheet. |
| Impact if ignored | Packing on the page still has conversion on the line. |
| Recommendation | Keep on the page; packing-slip PDF unchanged. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Shared design-line tokens (name, subtext, qty box, ±).
- Compact QtyStepper; How many / builder rows via OrderLineStack; no Piece/Metre; no sets banner.
- Footer: one row per unit family; money only if every counted line is billable.
- Quote / confirm / dispatch / settle / amend / Change: same name + qty type; no `per mtr` on the line; sheet Qty is order unit only; no `—` price.
- Docs + units; trader-eye How many (mtr, sets, mixed, no rates), Confirm, Dispatch.

## Explicitly deferred / rejected

- ChatGPT Create Order page, success screen, Select buyer rewrite.
- ± on This LR / confirm Qty\|Rate.
- Packing-slip PDF dual qty.
- Explore card restyle beyond pointing the name default at the shared token.
- Always-on per-line Note → Add note (already locked quieter).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + trader-eye; no new journey — chrome only)
