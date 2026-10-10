# Feature Completeness Review — My collections listing chrome

**Date:** 2026-10-09  
**Module / ask:** Align You library listing with client prototype chrome: no company card, title **My collections**, `shared with N` (not Published), no listing dates, avatar top-right. Keep You route / nav / Designs tools.  
**Anchors:** `docs/features/settings.md`, `docs/features/collections.md`, `docs/features/catalog.md`, ui-quality-bar  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders open the library for albums, not a second Profile card. Shared-with count answers “who already has this?” better than the word Published. Keep create via ＋ and Designs/Find — do not promote a Catalog bottom tab in this slice. |
| UX Designer | One job: scan collections. Drop identity card. Shell title **My collections** + Back + same Home avatar menu on the right. Card line: `N designs` · optional `shared with N` (omit when not a countable Selected set). No date under tiles. |
| Solution Architect | Web chrome + subtitle helper only. Share count = `audienceCompanyIds.length` when Selected and live; Followers/Everyone/Connections omit the share clause. No API. |

---

## Platform consistency (required)

1. **Existing patterns?** Shell title band + Back (You); reuse `HomeAccountMenu` on `/more` (same as Home). Kit library tabs / Find / Feed·Grid / ＋ unchanged.  
2. **Duplicates another feature?** No — Profile remains `/settings/profile` via avatar menu.  
3. **Should reuse an existing workflow?** Create stays nav/library ＋, not an in-grid New tile.  
4. **Naming matches the app?** **My collections** (matches menu **My Collections** sense); plain `shared with N`.

**Philosophy conflict?** No. Deferred Catalog bottom tab / New-collection grid tile / header ⋯ (prototype extras).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Listing chrome only |
| Business rules | OK | Share count from Selected companies |
| Workflows | OK | Entry still avatar → My Collections → You |
| Edge cases | OK | Draft/Archived keep status word; unshared live = designs only |
| Permissions | N/A | |
| User states | OK | Buyers without library: no card, same empty/Saved |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome; BM-07 unchanged |
| First glance (BM-11) | OK | Album grid is the job; no loud identity card |
| Accessibility | OK | Same account menu testids; Back kept |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Followers / Everyone share copy

| Field | Content |
|-------|---------|
| Gap | Prototype only shows numeric `shared with N` |
| Why it matters | Followers is not a company count |
| Impact if ignored | Fake numbers |
| Recommendation | Omit share clause unless Selected with `audienceCompanyIds.length > 0` |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Remove You `you-identity` company card.
- Shell title `/more` → **My collections**; keep Back → Home.
- Show `HomeAccountMenu` on `/more` (top right).
- Collection Feed + Grid listing: no dates; no **Published** on list cards.
- Subtitle: `N designs` · `shared with N` when live Selected with ≥1 company; else designs only (plus Draft/Archived/scheduled status when not live).
- Update `docs/features/settings.md` + collections listing line; units + More/shell specs.

## Explicitly deferred / rejected

- Catalog bottom-nav tab.
- In-grid **New collection** tile.
- Header ⋯ on library (account stays avatar menu).
- Removing Designs / Find / Feed·Grid.
- Changing Edit / viewer status lines (Publish sheet still uses Published language where needed).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Units (More, shellTitle, listing subtitle). Trader-eye on You Collections.  
