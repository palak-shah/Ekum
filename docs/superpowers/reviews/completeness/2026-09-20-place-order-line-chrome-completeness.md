# Feature Completeness Review — Place-order line chrome

**Date:** 2026-09-20  
**Module / ask:** How many each / place order lines — tabular layout; − editable textbox +; tags under name; Add note expands inline; Same for all as chip → expand → Apply / Cancel.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`, UI quality bar  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Replaces preset chips + Same/Each mode with one scannable list and an optional bulk apply. Per-line notes already on `OrderItemInput`. |
| UX Designer | Matches approved mockups. Editable center field is required (type any piece count). Chip expand keeps Cancel from looking like cancel-order. |
| Solution Architect | Shared `QtyStepper` + sheet rewrite; pass `note` through batch/from-pack/create; shortlist may lack categories (show when present). |

---

## Platform consistency

1. **Existing patterns?** h-12 thumb, kit TextInput/TextArea, Sheet CTAs, × remove — yes. Stepper is new but matches locked design ask.  
2. **Duplicates?** No — replaces How many each chrome.  
3. **Reuse?** Same chrome on Order builder standard lines.  
4. **Naming?** Same for all · Apply · Cancel · Add note — plain trader language.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tabular list always; stepper typeable |
| Business rules | OK | Apply clears per-line overrides; notes optional |
| Workflows | OK | Place / Ask rates / Order for buyer unchanged |
| Edge cases | OK | One line left: hide/disable ×; empty textbox until valid |
| Permissions | N/A | |
| User states | OK | Tags when `categories` on product |
| Notifications | N/A | |
| Error handling | OK | Existing InlineNotice |
| Scalability | OK | Scroll list in sheet |
| Mobile | OK | Compact stepper; BM-07 scroll clearance in sheet |
| Accessibility | OK | aria on ± and qty field |
| Platform consistency | OK | Ask before inventing — user locked this shape |

---

## Gaps

### G-001 — Shortlist without categories

| Field | Content |
|-------|---------|
| Gap | Selection shortlist entries often lack tags |
| Recommendation | Show tags when `product.categories` present; omit line when empty |
| Priority | Required (graceful omit) |

### G-002 — Wire line notes

| Field | Content |
|-------|---------|
| Gap | Callers currently send only productId + quantity |
| Recommendation | Extend payload + batch/create maps to include optional `note` |
| Priority | Required |

---

## Approved scope

- HowManyEachSheet redesign (tabular, stepper with **editable** textbox, Same for all chip expand, Add note, ×).  
- OrderBuilder standard lines same chrome.  
- Pass line notes through place/ask APIs.  
- Docs + unit tests + light e2e/chrome assert.  

## Deferred

- Photo-order grid → full tabular (pieces sheet can use stepper later).  
- Persisting categories on shortlist entries.  
- Order detail read-only cleanup (separate slice).

## Sign-off

| Role | Outcome |
|------|---------|
| PM + UX + Architect | **Proceed** |
