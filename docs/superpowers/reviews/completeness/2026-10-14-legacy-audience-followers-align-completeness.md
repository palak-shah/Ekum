# Feature Completeness Review — Legacy audience → Followers align

**Date:** 2026-10-14  
**Module / ask:** Stop “hidden Everyone”: UI shows My followers while DB/`canDiscover` still treats packs as `everyone` (or remapped `connections`) until Visibility save. Align defaults + migrate legacy rows so app, DB, and behaviour match.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/access-and-connections.md`  
**Disposition:** Proceed

> Trust ladder: Publish Who is Followers / Selected only. Display remap without writing DB is a silent leak.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Serious trust issue: seller believes Followers-only; buyers without follow still open `everyone` packs. Fix must not require tapping Update visibility. |
| UX Designer | Sheet already shows My followers for legacy Everyone/Connections — after fix, that chip must match live access. No new chrome. |
| Solution Architect | One-shot SQL migrate `everyone` + `connections` → `followers` on Product + Collection; Prisma + Zod defaults → `followers`; keep enum values for API compat; update docs. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Followers default already on web Publish helpers.  
2. **Duplicates another feature?** No — closes gap left by 2026-09-04 UI-only Followers default (explicitly deferred row migration).  
3. **Should reuse an existing workflow?** Reuse audience enum; no new Publish chips.  
4. **Naming matches the app?** My followers / Selected.

**Philosophy conflict?** No — strengthens “no Everyone on Publish.”

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Migrate + defaults |
| Business rules | OK | Selected unchanged; followers need allowed Follow |
| Workflows | OK | No new seller steps |
| Edge cases | OK | Draft + published both remapped |
| Permissions | OK | Closes open-catalog leak for remapped rows |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Single UPDATE |
| Mobile interactions | N/A | |
| First glance (BM-11) | N/A | Behaviour/data fix |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Display remap without DB write

| Field | Content |
|-------|---------|
| Gap | `audienceForPublishSheet` maps everyone/connections → Followers; live row stays wide |
| Why it matters | Seller trust; unintended view/order |
| Impact if ignored | Continues “hidden everyone” |
| Recommendation | Migrate rows + align defaults |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Prisma migration: Product + Collection `audience IN ('everyone','connections')` → `followers`; column defaults → `followers`
- Zod publish defaults → `followers`
- Docs: legacy remap is data migration, not “on next edit only”
- Unit coverage for schema default / sheet helpers (existing sheet tests stay)

## Explicitly deferred / rejected

- Removing `everyone` / `connections` from API enum (still valid for old clients until migrated)
- Migrating `tradeDefaults.publishDefaults` JSON (Publish sheet already defaults Followers)
- Auto-notify sellers about tightened packs

## Disposition rationale

Proceed — required trust fix; matches stated product default (Followers); no philosophy conflict.
