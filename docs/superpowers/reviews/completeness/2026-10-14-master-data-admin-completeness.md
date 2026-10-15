# Feature Completeness Review — Master data, admin tags & category-aware collections

**Date:** 2026-10-14  
**Module / ask:** Spreadsheet Master Categories replace SuperCategory onboarding; normalized master options; company custom tags; Admin Console Tag Management + bulk paste; category-aware collection create/edit  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/onboarding.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/admin.md`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders pick real deal-in Master Categories (sheet Section A), not five coarse supers. Collection tags/units filter by that category. Ops manage official item/quality/size via Admin Console on the same OTP account. |
| UX Designer | Onboarding stays chip multi-select (denser wrap, no second page). Collection: auto category when one; compact pick when many. Admin is a separate shell with Back to Ekum — never mixed into trader bottom nav. |
| Solution Architect | Normalize MasterCategory / MasterOption / links / CategoryUnit; separate CompanyCustomTag; keep `categories String[]` as label snapshots. Platform admin = `User.isPlatformAdmin` live on guard. Seed from transcribed sheet JSON until xlsx lands. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit chips, TagSuggestInput, RateRangeFields One rate / A range, OTP auth, Profile as entry for rare ops.  
2. **Duplicates another feature?** Replaces SuperCategory + in-code `CATEGORY_TAXONOMY` as live source; does not duplicate CatalogTag company scope (migrates to CompanyCustomTag).  
3. **Should reuse an existing workflow?** Collection editor cascade slots; Profile chips; same session for admin.  
4. **Naming matches the app?** Master Category / Item tags / Quality / Size; Admin Console; Back to Ekum.

**Philosophy conflict?** Yes (onboarding grain + taxonomy source of truth) → **Redesign** locked in feature docs below → **Proceed** for this slice.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Master categories, options, units, custom tags, admin CRUD+bulk, collection scoping |
| Business rules | OK | One vs many category; category change clears invalid; custom never auto-global |
| Workflows | OK | Onboard → create collection → tags/units; Profile → Admin Console |
| Edge cases | OK | Revoked admin mid-session; empty others migration; archive vs delete |
| Permissions | OK | Backend `@RequirePlatformAdmin` every admin API |
| User states | OK | Non-admin never sees entry; unauthorized `/admin` redirects |
| Notifications | N/A | No new push for admin tag ops |
| Error handling | OK | Preview for bulk; InlineNotice/toasts per kit |
| Scalability | OK | Indexed slug/kind; company custom cap retained |
| Mobile interactions | OK | Compact category pick on collection; admin usable on phone column |
| First glance (BM-11) | OK | One job: deal-in chips / pack tags / admin tag list |
| Accessibility | OK | Labels persist; chips removable |
| Platform consistency | OK | After Redesign docs |

---

## Gaps

### G-001 — Spreadsheet file missing in repo

| Field | Content |
|-------|---------|
| Gap | No `.xlsx` checked in; source is image transcription |
| Why it matters | Full Excel importer cannot claim completeness |
| Impact if ignored | Drift vs client sheet |
| Recommendation | Seed JSON from image; defer xlsx importer until file lands |
| Priority | Future improvement (Required: do not invent cells) |

### G-002 — 13 onboarding chips denser than 5

| Field | Content |
|-------|---------|
| Gap | More chips on first screen |
| Why it matters | Clutter risk |
| Impact if ignored | BM-11 fail |
| Recommendation | Compact wrap; no second page; short labels |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Replace SuperCategory with 13 Master Categories (sheet Section A)
- Normalized master tables + CompanyCustomTag + Collection.masterCategoryId + User.isPlatformAdmin
- Idempotent seed from `sheet-2026-10-14.json`
- Category-aware collection tags/units; category-change resolve
- Admin Console from Profile; Tag Management + bulk paste
- Tests for collection / custom / admin / bulk

## Explicitly deferred / rejected

- Full admin CRUD for Master Categories / Units UI
- Auto-promote custom → official
- Real xlsx/CSV full import UI until file is in repo
- Parallel admin login

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
