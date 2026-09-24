# Feature Completeness Review — How many each: tags + sell unit

**Date:** 2026-09-24  
**Module / ask:** Qty sheet only showed name; need tags and how they sell (set / dozen / metre, min).  
**Anchors:** `docs/features/orders.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Decide qty with the same facts as the design page. Shop/Selection pile currently drops tags and unit. |
| UX Designer | Under the name: tags line, then sell line (Set / Dozen · 12 pcs / Metre · min N · rate). No new chrome. |
| Solution Architect | Hydrate from explore product detail when the sheet opens. `piecesPerPack` still not a field — show unit type, not a guessed set size. |

## Platform consistency

1. Same muted 12px lines as today’s tags/rate.  
2. Not a second design page.  
3. Reuse formatRate + explore detail.  
4. Plain words: Set, Dozen, Metre, min.

**Philosophy conflict?** No.

## Approved scope

- Line meta: tags · sold-as unit · min · rate.  
- Hydrate details when How many each opens.  
- Docs + units.

## Explicitly deferred

- `piecesPerPack` on the design (how many pcs in a set).

## Sign-off

Required gaps closed: Yes. Ready: Yes.
