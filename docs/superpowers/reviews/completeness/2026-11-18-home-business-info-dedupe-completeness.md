# Feature Completeness Review — Home Business info dedupe

**Date:** 2026-11-18  
**Module / ask:** Home / visitor Business Profile lower face — stop repeating hero city & sell categories; hide empty GST “not shared”; hide empty Contacts/Team; Home same-person Contacts vs Team → Contacts only; About `View more` / `View less`.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/home.md`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Hero already shows city + sell categories. Repeating them in Business info is noise for busy traders. GST “not shared” is not shareable information — omit. Contacts vs Team jobs stay separate; only suppress duplicate chrome when one person appears in both. |
| UX Designer | Compact lower profile = fewer rows/cards, not new chrome. Keep foam cards + ink titles. About control must read as part of About (`View more` / `View less`). Omit empty Business info / Contacts / Team shells. |
| Solution Architect | UI-only visibility helpers. No schema/API. Pass hero city + sell slugs into `BusinessInfoSection`. Same-person = length-1 + normalized name match on Home. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — foam bordered cards, InfoRow, Call icon, Team More sheet; Orders/kit language unchanged.  
2. **Duplicates another feature?** No — removes duplication with hero.  
3. **Should reuse an existing workflow?** Yes — same Contacts / Team APIs and edit paths.  
4. **Naming matches the app?** Yes — `View more` / `View less`; no Seller/Buyer jargon.  
5. **Units?** N/A.

**Philosophy conflict?** No (cleaner one-job face). Prior Completeness locked city/categories always in Business info → this slice is an intentional **Redesign** of that display rule only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visibility rules only |
| Business rules | OK | GST privacy: still never show visitor GSTIN; only omit empty “not shared” |
| Workflows | OK | Team Invite/Edit unchanged when Team shown |
| Edge cases | OK | Different city/cats still show; multi-member Team shows both; empty sections hidden |
| Permissions | OK | Contacts still Connected/own; Team Home-only |
| User states | OK | Owner / visitor / Connected / stub |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No sticky chrome change |
| First glance (BM-11) | OK | 390px trader-eye required |
| Units | N/A | |
| Accessibility | OK | Keep testids; Call / Map links |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Business info always listed city/categories

| Field | Content |
|-------|---------|
| Gap | company.md §10 + 2026-11-16 Completeness always showed city/categories in Business info even when hero already had them |
| Why it matters | Duplicate lines fight the one-job face |
| Impact if ignored | Congested lower profile |
| Recommendation | Redesign display: show city / categories / Sells only when they add vs hero |
| Priority | Required before implementation |

### G-002 — GST not shared placeholder

| Field | Content |
|-------|---------|
| Gap | Owner without GSTIN and unverified visitor still saw “GST not shared” |
| Why it matters | Placeholder is not useful information |
| Impact if ignored | Settings-style empty rows |
| Recommendation | Show GST row only when shareable (GSTIN or verified) |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Pure visibility helper + `BusinessInfoSection` / About copy wiring  
- Docs: company.md §10 / edges, home.md Team line, gap-matrix  
- Units + 390px trader-eye screenshots  

## Explicitly deferred / rejected

- Schema/API, Follow/Connection/Block, Showcase, catalogue, Edit Profile field model  
- Merging Contacts and Team into one product concept  
- Changing GST privacy (visitor GSTIN still never shown)  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
