# Feature Completeness Review — Typography weight pass

**Date:** 2026-10-17  
**Module / ask:** Centralize semantic font-weight tokens; lighten overweight UI (bold/semibold → regular/medium) without resizing chrome or redesigning layout  
**Anchors:** `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need a calmer screen: less “everything is loud.” Hierarchy stays (page title, prices/qty, names) but everyday chrome stops shouting. No new screens or flows. |
| UX Designer | Keep Inter + approved density (PageHeader ~17px, body ~15px, Button 14px, Chip 12–13px, fields 16px). Weight roles: body 400 · emphasis 500 · title 600. Bold 700 only for tiny unread digits and avatar initials. Secondary lines use muted + 400. |
| Solution Architect | Mirror color tokens: `--ekum-weight-*` in theme → `@theme` utilities `font-body` / `font-emphasis` / `font-title`. Migrate kit first, then hotspots. Not a Brand Kit 24/18/16 size rollout. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Button / Chip / PageHeader / cards; WhatsApp-tight chrome density.  
2. **Duplicates another feature?** No — extends theme token system (colors already).  
3. **Should reuse an existing workflow?** Yes — same `tokens.css` + `@theme` path as Appearance colors.  
4. **Naming matches the app?** Plain role names (body / emphasis / title); no Seller/Buyer labels.

**Philosophy conflict?** No — calm chrome supports “clutter-free, never get lost.”

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | N/A | Visual only |
| Business rules | N/A | |
| Workflows | N/A | |
| Edge cases | OK | Compact qty stay readable; title weight on critical money/qty |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | CSS vars + utility migrate |
| Mobile interactions | OK | No sticky chrome height change; BM-07 unchanged |
| First glance (BM-11) | OK | Trader-eye required after migrate — lighter, prices/qty still clear |
| Accessibility | OK | Contrast via existing ink/muted; weights do not replace color |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Arbitrary font sizes remain

| Field | Content |
|-------|---------|
| Gap | Many `text-[Npx]` sizes stay; this slice only standardizes **weight** |
| Why it matters | Size inconsistency is a separate noise source |
| Impact if ignored | Acceptable for this calm pass |
| Recommendation | Defer size token purge |
| Priority | Future improvement |

### G-002 — Bold 700 exceptions

| Field | Content |
|-------|---------|
| Gap | Tiny nav/unread badge digits (~10px) and Avatar letterforms need 700 for legibility |
| Why it matters | Medium washes out at that size |
| Impact if ignored | Unreadable badges / initials |
| Recommendation | Keep `font-bold` only there; list in approved scope |
| Priority | Required before implementation (document exceptions) |

---

## Approved scope for this slice

- Completeness + lock weight roles in `00-concepts.md` Chrome density
- `--ekum-weight-body|emphasis|title` + `font-body` / `font-emphasis` / `font-title`
- Kit + PageHeader + cards + shared chrome migrate
- Feature hotspots then remaining screens: overweight → body/emphasis/title; secondary → muted + body
- Keep sizes, layouts, colors, iOS `text-base` fields
- Bold exceptions: unread/nav badge digits; Avatar initials

## Explicitly deferred / rejected

- Brand Kit page 24px / section 18px / body 16px resize — Rejected for this slice (redesign)
- Full purge of arbitrary `text-[Npx]` — Deferred
- Color / spacing / layout redesign — Out of scope

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit + trader-eye; no new journeys)
