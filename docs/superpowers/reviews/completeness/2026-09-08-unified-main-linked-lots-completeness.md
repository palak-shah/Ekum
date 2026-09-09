# Feature Completeness Review — Unified main order + linked mill lots

**Date:** 2026-09-08  
**Module / ask:** Stop two Place outcomes (I-handle one ticket vs Direct N batch orders). Always one **main** order with linked supplier lots; visibility (mills hidden vs shown) replaces “two flows.”  
**Anchors:** `docs/features/orders.md`, TradeLane, I-handle desk, journey matrix `2026-09-08-multi-supplier-journey-matrix.md`  
**Disposition:** **Redesign**

> Completeness keeps Ekum **coherent**. Two Place shapes for the same curated pack fight “one job / never get lost.” Unify structure; keep trader choice as **who sees mills**, not **how many orphan tickets**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Direct “2 suppliers → 2 chats” is fine **if** both hang under one main `#`. Today batch gives buyer two unrelated orders — that is the confusion, not two mill chats. |
| UX Designer | Trader desk already is main + mill cards. Buyer should see the same desk when transparent; soft-hide when private. One Place confirm, one list row. |
| Solution Architect | Curated / multi-supplier Place always creates Manage-like parent + N upstreams (today’s from-pack). Retire batch-as-primary for that path. TradeLane `ticket` / reveal become **visibility + chat routing**, not “create N bilateral orders.” |

---

## Platform consistency (required)

1. **Existing patterns?** Reuse I-handle desk (mill subset cards, Send-hold, Part of #main). Extend buyer view when mills visible.  
2. **Duplicates?** Replaces Direct batch Place for curated multi-supplier — does not invent a third order type.  
3. **Should reuse?** Yes — from-pack / linked upstreams; not a new graph.  
4. **Naming?** Main order / supplier lots (or mill cards). Avoid Seller/Buyer on chat body.

**Philosophy conflict?** Yes with **shipped** “Direct = N independent buyer tickets” — hence **Redesign**, not silent drift.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Buyer mill cards + list semantics TBD |
| Business rules | Gap | Who is “seller” on main when mills visible; confirm/quote ownership |
| Workflows | Gap | Place always main+lots; batch only for non-pack / Later |
| Edge cases | Gap | Mixed lane Me vs mill across two suppliers on one pack |
| Permissions | Gap | Soft-hide vs full desk for buyer |
| User states | OK | Default Me + mills hidden |
| Notifications | Gap | Which chat gets living cards |
| Error handling | OK | Partial mill spawn already |
| Scalability | OK | N mills on one parent |
| Mobile / BM-07 | Gap | Buyer desk chrome |
| Accessibility | Gap | |
| Platform consistency | Gap until docs locked | |

---

## Gaps

### G-001 — Two Place outcomes for one pack

| Field | Content |
|-------|---------|
| Gap | from-pack → one ticket; batch → N tickets |
| Why it matters | Same curation, different mental model |
| Impact if ignored | Buyer thinks “one pack = one order” and gets two chats with no link |
| Recommendation | Always main + linked lots for curated / multi-supplier Place |
| Priority | Required — redesign |

### G-002 — TradeLane `ticket=mill` means orphan Direct tickets

| Field | Content |
|-------|---------|
| Gap | Mill ticket creates buyer↔mill bilateral (or batch), not linked under main |
| Why it matters | Fights unified desk |
| Recommendation | `ticket` / reveal = visibility + chat; structure always parent+upstreams for this path |
| Priority | Required — redesign |

### G-003 — Buyer never sees mill desk (soft-hide always on parent)

| Field | Content |
|-------|---------|
| Gap | End buyer only sees trader hop today |
| Why it matters | Unified Direct needs buyer to see same main + A + B |
| Recommendation | When transparent: buyer sees mill cards (read/actions TBD). When private: soft-hide unchanged |
| Priority | Required for transparent mode |

### G-004 — Quote / confirm / settle ownership on unified Direct

| Field | Content |
|-------|---------|
| Gap | Who quotes buyer when mills are visible? |
| Why it matters | Blocks implementation |
| Recommendation | **Closed:** Trader still **Send quote** on main; mills quote trader on lots; buyer Accept on main. Transparent = visibility only. |
| Priority | Closed |

### G-005 — Selection mix without pack stamp

| Field | Content |
|-------|---------|
| Gap | Today → batch |
| Recommendation | Prefer same main+lots when all lines go through one trader; else Later / keep batch for true multi-seller without facilitator |
| Priority | Recommended — decide in redesign |

---

## Approved scope for this slice

**None for code.** Disposition is **Redesign**.

Docs to update before any build:

1. Design: `docs/superpowers/specs/2026-09-08-unified-main-linked-lots-design.md`  
2. Journey matrix §1–§5 decisions  
3. `orders.md` Dual trade target model  
4. TradeLane / I-handle desk notes pointing at redesign  
5. Gap matrix row

After design review + G-004 closed → new Completeness **Proceed** for implementation slice.

## Explicitly deferred / rejected

- Implementing buyer mill desk before design lock  
- Agent capability  
- Ask supplier Slice B (separate)  
- Keeping batch as the “Direct curated pack” happy path (**rejected** for that path)

## Sign-off

Required gaps closed or deferred in writing: **Yes** (G-004 closed; G-005 deferred as Recommended)  
Ready for implementation / `@functional` journeys: **No** until a follow-up Completeness **Proceed** slice scopes buyer desk + Place changes  
Next: Proceed slice after confirming G-005 (Selection without pack) or deferring it explicitly in that slice.  
