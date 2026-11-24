# Feature Completeness Review — Repost audit #24–#40 copy

**Date:** 2026-11-24  
**Module / ask:** Ship audit rows #24–#40 from `2026-11-23-repost-bug-sheet-audit.md` — trader-facing copy + light chrome (thumb-only skip rows, Same-for-all chip, one album `from` line, catalogue spelling).  
**Anchors:** `docs/features/explore.md`, `docs/features/collections.md`, `docs/features/access-and-connections.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One dialect for pricing modes and Show rates; plain loaders; no helper noise; catalogue spelling; clearer Pack follow notify. |
| UX Designer | Thumb-only skip rows; one `from` line on curated visitor album; short exclusive + empty add. |
| Solution Architect | String/helper renames via packKindCopy / QtyStepper / RepostSkipSection; notify listener one line. |

---

## Platform consistency (required)

1. **Existing patterns?** Shared RepostPricingFields, PublishAudienceFields, packNoun.  
2. **Duplicates?** No — collapses dual dialects.  
3. **Reuse?** packKindCopy, QtyStepper chip helper.  
4. **Naming?** Same as supplier / Edit rate / Set margin; On request / Show rates; Allow repost / Allow download.  
5. **Units?** #35 chip includes order unit noun only — no ₹ invent.

**Philosophy conflict?** No (copy Redesigns documented).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Copy + light chrome only |
| Business rules | OK | #30 keep Allow\* |
| Workflows | OK | |
| Edge cases | OK | Blocked skip rows keep reason |
| Notifications | OK | #40 Pack FollowAllowed |
| Mobile / BM-07 | OK | |
| First glance BM-11 | OK | Less helper noise |
| Units | OK | All: n sets |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Catalog vs catalogue

| Field | Content |
|-------|---------|
| Gap | Prior Completeness locked American “catalog” |
| Recommendation | Redesign — UI **catalogue** via packNoun |
| Priority | Required (this slice) |

### G-002 — Album Order goes banner

| Field | Content |
|-------|---------|
| Gap | Curated visitor stacked Order goes + mill jargon |
| Recommendation | Redesign — album keeps one `from {shop}`; How many Order goes stays |
| Priority | Required (this slice) |

---

## Approved scope

- Completeness + feature doc locks.
- #24–#28, #31–#33, #35–#40 as planned.
- #29 #30 #34 verify; fix only if wrong.
- Specs + audit sheet update.

## Explicitly deferred

- #41+ behaviour bugs.
- Renaming Allow → Add +.
- Supplier “someone reposted” notify.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
