# Curate from albums + as-is pack/design — design

**Date:** 2026-09-04  
**Status:** Approved (conversation); **split A/B** after review  
**Anchors:** [saved.md](../../features/saved.md), [00-concepts.md](../../features/00-concepts.md), [collections.md](../../features/collections.md), browse-select-curate-order design, collection-view-request Allow/Deny  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-04-curate-album-as-is-completeness.md`

## Problem

1. Selecting a **collection** then **Curate** only toasts “open and pick designs” — Order already expands albums; Curate feels broken and restrictive.  
2. Traders want **as-is** republish of a supplier **pack or design** into **their** catalog without picking every line.  
3. Locked (`allowForward: false`) lines should stay **visible and gray** (Selection/cart pattern), not a silent drop or toast-only wall.  
4. Instagram-style feed icons for republish/share would duplicate select-bar verbs and clutter Explore — **out of scope**.  
5. **Ask supplier** for pack permission is valuable but is a second product (chat Allow/Deny + grants) — **Slice B**, not blocking Slice A.

## Product promise

### Slice A (ship first)

1. **Curate** on albums uses the **same resolve pattern as Order**: **Use whole pack** | **Pick designs**.  
2. **Designs alone** skip resolve → Curate sheet (as-is one or many).  
3. After expand, existing Curate sheet: name → primary **Save draft**, secondary **Publish…** / add to existing.  
4. Locked / not-allowed rows are **grayed** with reason; Curate continues with **allowed only** (see mixed selection).  
5. Still **Curate / relist** — not a second Explore “Republish” verb; Forward/Share stay free.  
6. **No** always-on feed action icons.

### Slice B (follow-up)

7. On gray locked design/album → **Ask supplier** → chat Allow/Deny → **per-company relist grant** (≠ Connection, ≠ view Ask). Distinct chat card from view Ask.

## Split

| Slice | Scope | Disposition |
|-------|--------|-------------|
| **A** | Album resolve, designs as-is, name defaults, Save draft primary, gray + reason, continue with allowed | **Proceed now** |
| **B** | Ask supplier, RelistRequest, CatalogRelistGrant, chat card, notifications, revoke owner surface | **Proceed after A**; plan separately |

## Locked decisions (Slice A)

| Topic | Decision |
|-------|----------|
| Album + Curate | Resolve sheet mirrored from Order album resolve |
| Use whole pack | Expand all member designs into the Curate shortlist (then Curate sheet) |
| Pick designs | Open album in select mode; sticky **Continue Curate** / **Next collection** (or Continue Order) until Curate/Order finishes |
| Designs only | No resolve; open Curate sheet with selected designs |
| Name default | One source album → prefill pack name; else empty (required) as today |
| Primary CTA after expand | **Save draft**; **Publish…** still available |
| Locked lines | Gray + reason in Selection / resolve; **not** silent drop |
| Mixed / partial | After expand: **Continue with allowed**; show count of skipped locked (e.g. muted “3 locked — seller doesn’t allow pack”); if **zero** allowed → block Continue, stay on resolve/Selection with reason |
| Albums + designs already in Selection | Union into Curate set after album expand; de-dupe by product id |
| Ask supplier | **Slice B only** — Slice A: gray + reason, no Ask CTA |
| Feed icons | **No** |
| Forward / Share | Unchanged |

## Locked decisions (Slice B — when scheduled)

| Topic | Decision |
|-------|----------|
| Ask supplier | Chat **Allow / Deny** for pack permission |
| Allow effect | Per-company **relist grant** OR’d with `allowForward` in Curate ceiling — does **not** flip global allowForward |
| Grant grain | **Product-level** grants (expand album → ask/grant per design, or batch Allow that creates one grant per current member). Collection-scoped “future members too” is **out** unless revisited |
| Card copy | Distinct from view Ask (“wants to put … in their pack” vs “wants to see this collection”) |
| Deny | Silent to asker |
| Revoke | Required in Slice B: quiet owner list (or Who can put in pack) — not deferred forever |

## User flows

### Slice A — Album selected → Curate

1. Selection has ≥1 album (with or without designs).  
2. Tap **Curate** → **Curate from collections** resolve sheet (Order-like).  
3. Per album: **Use whole pack** or **Pick designs**.  
4. **Use whole pack** → load members; allowed enter Curate set; locked stay gray with reason (no Ask yet).  
5. Continue (if ≥1 allowed) → **Curate pack** sheet (Save draft primary).

### Slice A — Designs only → Curate

1. Selection is designs only.  
2. Tap **Curate** → Curate sheet if ≥1 allowed; locked remain gray in Selection.  
3. One design as-is: name can default to design name.

### Slice B — Ask supplier (later)

1. Gray locked row → **Ask supplier**.  
2. Chat card → Allow → product relist grant(s); Deny silent.  
3. Owner can revoke.

## Trust ladder

```
Forward / Share     → free (card as-is)
Bookmark            → free (private)
Curate / Publish    → needs allowForward (Slice A); OR per-company grant (Slice B)
Pack permission Ask → Slice B only
View Ask            → see gated pack only (existing)
```

## Technical sketch

### Slice A

- Reuse / twin `OrderCollectionResolveSheet` → shared resolve with `intent: order | curate`.  
- Expand album → product ids; filter with existing ceiling (`allowForward` + discoverability).  
- Selection: ensure `!allowForward` maps to unavailable + plain reason.  
- Curate sheet: Save draft as primary button order for this flow.

### Slice B

- `ProductRelistGrant` + `RelistRequest` + chat Allow/Deny (clone view-request; **new** message/card type).  
- Ceiling: `allowForward OR grant(product, company)`.  
- Owner revoke UI in same slice.

## Out of scope (both)

- Instagram feed icon row  
- Auto-publish without Curate sheet  
- Changing global `allowForward` from a single Allow  
- Product-level **view** Ask  
- Changing Order resolve behaviour beyond shared component  

## Spec self-review

- Split A/B explicit; Ask not blocking album Curate fix.  
- Mixed selection / zero-allowed rules locked for A.  
- Grant grain locked for B (product-level).  
- Feed clutter rejected.  
