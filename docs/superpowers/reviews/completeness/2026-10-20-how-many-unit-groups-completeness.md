# Feature Completeness Review — How many unit groups

**Date:** 2026-10-20  
**Module / ask:** Drop **Sets / Mtrs / Pcs** on every How many line. Group lines by order unit when mixed. Conversion stays the sticky footer summary.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, UI quality bar, `2026-10-20-order-sheet-density-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders count on the line; they read the unit once. Repeating Sets on every row is leftover from a standalone qty row. The footer already groups (`12 sets = 144 pcs`, then `70 mtrs`). Do not invent a second conversion place. |
| UX Designer | One unit (the usual pack): no heading, no per-line caption — sticky footer is the caption. Mixed units: section titles **Sets** / **Mtrs** (job changed), then name + pill. Different pack ratios stay in the same Sets group; odd line keeps `1 set = 20 pcs`. Reuse kit `SectionHeader` (13px). Do not add a sets-jargon banner. |
| Solution Architect | No API change. Restack How many + builder lists by order unit (`isPackOrderUnit` / native). Footer helper already groups. Same for all is sheet-wide today — hide it when the sheet has more than one order unit (do not apply 2 to both sets and metres). |

---

## Platform consistency (required)

1. **Existing patterns?** Name-only lines; `OrderLineStack` + foam pill; footer `howManyOrderFooterSummary`; kit `SectionHeader` when the job changes.  
2. **Duplicates another feature?** No — it is the density follow-up (stop repeating the unit). Footer grouping already ships.  
3. **Should reuse an existing workflow?** How many / Place + Order builder only. Quote / confirm / dispatch already have Qty without a Sets caption.  
4. **Naming matches the app?** Trade shorts: **Sets** / **Mtrs** / **Pcs** / **Dozen** as group titles. No Metre/Piece/Seller.

**Philosophy conflict?** No — one job per line, conversion at the moment it matters (footer), no extra chrome when every line is the same unit.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Qty / place / remove / notes unchanged; list order restacks when mixed |
| Business rules | OK | Pack size still per design; billing unchanged |
| Workflows | OK | Same taps; Same for all stays when all lines share one order unit |
| Edge cases | OK | Mixed units; mixed pack ratios in one Sets group; unknown pack size; mixed shops (shop stays subtext, not a group) |
| Permissions | N/A | |
| User states | OK | Ask-rates How many uses the same lines |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Client restack only |
| Mobile interactions | OK | Sticky footer still summary + Place; BM-07 last line above chrome; group titles add height only when mixed |
| First glance (BM-11) | OK | Name + pill loudest; Sets not competing on every row |
| Accessibility | OK | Stepper `aria-label` already includes the count noun (`sets for Navy`) |
| Platform consistency | OK | `SectionHeader`; no new chip/checkbox |

---

## Gaps

### G-001 — Same for all on mixed units

| Field | Content |
|-------|---------|
| Gap | Today one **Same for all** fills every line. Mixed sets + metres would copy one number into both. |
| Why it matters | 2 sets is not 2 metres. |
| Impact if ignored | Wrong counts from one tap. |
| Recommendation | Hide **Same for all** when the sheet has more than one order unit. One unit → unchanged. No per-group chip this slice (extra chrome). |
| Priority | Required before implementation |

### G-002 — Restack vs pick order

| Field | Content |
|-------|---------|
| Gap | Grouping restacks the list (all Sets, then Mtrs). A design may not sit where they picked it. |
| Why it matters | Mixed sheets only. |
| Impact if ignored | Brief hunt inside a short list. |
| Recommendation | Restack. Within a group, keep pick order. Pack units first (set / dozen / box), then mtr, then pc. |
| Priority | Required before implementation |

### G-003 — Ticket sheets

| Field | Content |
|-------|---------|
| Gap | Quote / confirm / dispatch / settle are not grouped. |
| Why it matters | Place vs ticket density. |
| Impact if ignored | Tickets still a Qty column, no Sets on the line (already). |
| Recommendation | Out of scope. Do not add Sets headings on tickets this slice. |
| Priority | Future improvement |

---

## Approved scope for this slice

- How many (Order + Ask) and Order builder only.
- Drop per-line **Sets / Mtrs / Pcs** on the qty row. Missing-pack quiet line stays when contents are blank.
- **One order unit:** no group heading. Sticky footer is the unit + conversion.
- **Mixed order units:** `SectionHeader` per group (**Sets**, **Mtrs**, **Pcs**, **Dozen**, …). Lines = name + × + pill. Footer still one row per family (already).
- **Different set→pc ratios:** one Sets group. Show `1 set = 20 pcs` only on lines that differ (existing `showPackSize`). Never a group-level “1 set = 12 pcs”.
- Hide **Same for all** when mixed order units.
- × still beside the name. Thumbs 48px. No rates banner.

## Explicitly deferred / rejected

- Per-group **Same for all**.
- Grouping by shop (split banner + shop subtext already).
- Grouping by pack ratio (12-pc vs 20-pc sets).
- Quote / dispatch / confirm restack.
- ChatGPT wizard / new Place page.
- Changing notes / search / other kit fields (stay 16px). Qty pill 14px-on-screen is a separate chrome lock.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — product go 2026-10-21; units on grouping + How many sheet. No new journey (chrome).
