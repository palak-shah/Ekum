# Feature Completeness Review — Collection same-for-all + photos-first

**Date:** 2026-09-18  
**Module / ask:** New/Edit collection: optional Same for all designs, unlimited photos per design, photos-first create (WhatsApp-trained), rate ranges  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Suppliers dump photos into packs often without rates. Optional Same for all + per-tile edit covers both personas without blocking Save. Matches Add designs inheritance, not a second CMS. |
| UX Designer | Photos first → optional caption (Same for all row) → name → send. Summary row + sheet avoids stacked forms. Tap tile for more photos (no cap). Plain trader copy. |
| Solution Architect | Reuse batch override helpers; add `rateMax` for display ranges; orders keep single `rate` snapshot. No Collection DB column for same-for-all (session + apply-on-write). |

---

## Platform consistency (required)

1. **Existing patterns?** Same for all / Diff / Use same as all from Add designs; ContinuousCamera append; kit Sheet + Field.  
2. **Duplicates another feature?** No — brings collection editor up to batch parity without deep-linking away.  
3. **Should reuse an existing workflow?** Yes — designBatchHelpers override model + camera park/append.  
4. **Naming matches the app?** Same for all designs; Add photos; On request when blank.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Photos-only path + optional details + member photos |
| Business rules | OK | Library picks not overwritten; foreign curated no photo add |
| Workflows | OK | Create + edit inherit; new designs get filled same-for-all |
| Edge cases | OK | Empty same-for-all; Diff tiles; keep ≥1 photo |
| Permissions | OK | Own products only for photo/rate apply |
| User states | OK | Create pending + edit members |
| Notifications | N/A | |
| Error handling | OK | Upload failures toast / inline; soft payload warn only |
| Scalability | OK | No hard photo cap; reuse upload concurrency |
| Mobile interactions | OK | Sheet above nav; camera parks member sheet |
| Accessibility | OK | aria labels on Add photos / Same for all row |
| Platform consistency | OK | Matches Add designs language |

---

## Gaps

### G-001 — Member sheet lacked photos / same-for-all

| Field | Content |
|-------|---------|
| Gap | Update this design had fields only; no pack-level Same for all |
| Why it matters | Docs already promised Add designs parity; suppliers stuck |
| Impact if ignored | Broken create/edit path |
| Recommendation | Implement this slice |
| Priority | Required before implementation |

### G-002 — Rate as single number only

| Field | Content |
|-------|---------|
| Gap | Traders quote ranges (1200–1400) |
| Why it matters | Forced false precision or Notes misuse |
| Impact if ignored | Wrong catalog copy |
| Recommendation | `rate` + optional `rateMax`; text input; orders keep `rate` |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Optional Same for all summary row + sheet on New/Edit collection  
- Inheritance to new photo/quick-add designs; Diff + Use same as all  
- Unlimited photos per design (collection + Add designs); member Add photos  
- `rateMax` + text rate parsing/display; ProductEditor + batch aligned  
- Docs + units + `@collections` coverage for photos-only + inherit + add photos  

## Explicitly deferred / rejected

- Order math on ranges  
- Overwriting library-pick fields on add  
- Persisting Same for all as a Collection column  
- Forcing details before Save/Publish  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
