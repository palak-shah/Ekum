# Feature Completeness Review — Professional Home + Orders tab chrome

**Date:** 2026-11-17  
**Module / ask:** Professional Instagram-class Home by copying locked chrome (Orders underline tabs, foam actions, kit Chip completeness) — stop inventing lime tab rails / outlined pills; add process + test anti-loophole gates.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/home.md`, `docs/features/company.md`, `docs/features/collections.md`  
**Disposition:** Proceed (Redesign vs prior Completeness that locked lime underline + chip-on ink on kind tabs)

> Completeness keeps Ekum coherent. Conflicts with “lime tab = brand” → **Redesign** to Orders `text-accent` + `h-1 bg-accent`; lime stays attention-only (Chip / counts).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Multi-day collage vs 30-min partner prototypes. One tab language across Orders/Home/You; Home face = photos + quiet secondary actions. |
| UX Designer | IG hierarchy: foam pills, Chip completeness when incomplete, charcoal Orders bar, white catalogue body (no third dialect). |
| Solution Architect | Shared `underlineTabChrome`; class swaps; no API change. Sibling-parity unit asserts. |

---

## Platform consistency (required)

1. **Existing patterns?** Orders Selling/Buying/Others underline; kit `Chip` (chip-on); `bg-foam` secondary.  
2. **Duplicates?** No — collapses three tab dialects into one.  
3. **Reuse?** `underlineTabChrome` + kit Chip.  
4. **Naming?** Unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** Prior “lime underline on You/Home tabs” → **Redesign**. Charcoal go + lime attention only (Theme C).

---

## Edge matrix (this slice — required asserts)

| Who / surface | Edge | Assert |
|---------------|------|--------|
| Owner Home + Orders + You | Same selected tab language | Shared helper; `text-accent` + `h-1 bg-accent`; not `border-badge` |
| Owner Home | Empty cover / incomplete | Foam actions + tab bar still present; Chip nudge only when gaps |
| Owner Home | Completeness dismissed / complete | No Chip band |
| Visitor catalogue / shop preview | Tabs | Same `underlineTabChrome` language |
| Empty catalogue | Omit section | No invent chrome when section hidden |

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Presentation |
| Business rules | OK | Theme C jobs locked |
| Workflows | OK | Destinations unchanged |
| Edge cases | OK | Matrix above |
| Permissions | N/A | |
| User states | OK | Home / You / Orders / visitor |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky |
| First glance (BM-11) | OK | Screenshot vs Orders required |
| Units | N/A | |
| Accessibility | OK | Charcoal selected clearer than lime-on-white type |
| Platform consistency | OK | After Redesign |

---

## Gaps

None Required for this slice. Standing rules (`ui-source-of-truth`, test anti-loophole) prevent recurrence.

---

## Approved scope for this slice

- Standing Cursor rules: UI source-of-truth + test anti-loophole.
- Shared `underlineTabChrome`; wire Orders + Home catalogue + You library; delete lime `border-badge` kind-tab path.
- Home: foam action pills; kit Chip completeness; white catalogue body (drop invent bordered dialect if it fights photos-first).
- Docs: company/collections/home one-liners; gap matrix.
- Units: sibling parity + named edges; 390px trader-eye vs Orders.

## Explicitly deferred / rejected

- Full-app redesign; re-litigating Theme C charcoal go.
- Rewriting every historical Playwright file (fix when touched).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + trader-eye for this chrome slice; no new e2e journey required)  
