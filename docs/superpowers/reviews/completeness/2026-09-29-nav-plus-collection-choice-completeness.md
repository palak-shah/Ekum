# Feature Completeness Review — Nav ＋ collection chooser

**Date:** 2026-09-29  
**Module / ask:** Bottom **＋** sheet: **Create new collection** → New collection screen; **Update existing collection** → My collections (add/edit/delete designs in any pack).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`, ui-quality-bar (one job, fewer paths, kit sheets)  
**Disposition:** Proceed

> 2026-09-28 skipped a **one-row** New sheet (extra tap, same destination). This ask is **two jobs**. A chooser is the same pattern as You **Add** (“What are you posting?”). Not a return of Add designs / Photo order on nav ＋.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Sell+upload ＋ must choose: start a pack vs change one they already have. Buy-only still Orders. No cap still a why-line toast. |
| UX Designer | Kit `Sheet` + bordered rows (You Add). Labels as asked. Update lands on You **Collections** — tap pack → viewer → **Edit** (existing). Empty list still opens; empty copy already has **New collection**. |
| Solution Architect | Intent `collection` opens the sheet. Destinations: `/catalog/collections/new` and `/catalog?tab=collections` (You). Caps unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Nav ＋; You library Collections; New collection editor; You Add choice sheet.  
2. **Duplicates another feature?** Update is You Collections, not a second editor. Create is the existing New collection page.  
3. **Should reuse an existing workflow?** Yes — no new pack-picker.  
4. **Naming matches the app?** Rows: **Create new collection** / **Update existing collection**. Library tab stays **Collections**. Page title stays **New collection**.

**Philosophy conflict?** No — two jobs, one tap to pick, then the real screen.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Two destinations |
| Business rules | OK | Caps / selling unchanged |
| Workflows | OK | Viewer → Edit still the edit path |
| Edge cases | OK | Zero packs → empty Collections |
| Permissions | OK | No uploads → toast |
| User states | OK | Buy-only → Orders, no sheet |
| Notifications | N/A | |
| Error handling | OK | Toast for blocked |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet z-80 above nav; two rows, no clip |
| Accessibility | OK | Create aria-label; row buttons |
| Platform consistency | OK | Kit Sheet + You Add row language |

---

## Gaps

None Required.

### G-001 — Direct ＋ → New collection (one tap)

| Field | Content |
|-------|---------|
| Gap | Sellers who only ever create lose one tap vs 2026-09-28. |
| Why it matters | Fewer taps was the last ＋ rule. |
| Impact if ignored | — |
| Recommendation | Accept: they now have two jobs. Deferred: remember last ＋ choice. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Sell + upload: **＋** opens a **Collection** sheet with **Create new collection** and **Update existing collection**.
- Create → `/catalog/collections/new`.
- Update → You Collections (`/catalog?tab=collections` → `/more?tab=collections`).
- Buy-only ＋ → `/orders`. No-cap ＋ → danger toast.
- No Add designs / Photo order / Invite on this sheet.

## Explicitly deferred / rejected

- Remember last ＋ row.
- Jumping Update straight into a pack editor (skip list).
- Adding designs create on nav ＋.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
