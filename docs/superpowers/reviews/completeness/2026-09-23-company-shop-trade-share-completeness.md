# Feature Completeness Review — Company shop trade dock + Share profile

**Date:** 2026-09-23  
**Module / ask:** Order / Curate / Ask for rates on the shop after Select; Share profile (connections / Find on Ekum / WhatsApp); hide tab bar on Your selection and while the shop dock is up.  
**Anchors:** `docs/features/company.md`, `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed (Redesign of “trade verbs only on Your selection”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Shop dock is a **shortcut for this seller’s** traveling picks, not a second cart. Mixed-seller leftovers stay in the pile. Share is the shop card, not a catalog card. |
| UX Designer | Dock matches the design page (Curate · Ask for rates · Order). Hide tab bar when a focused job owns the bottom. Floater stays on hubs; hidden on this shop only while the dock is up. Quiet Share on the action row. |
| Solution Architect | Reuse HowManyEach, CurateFromSelectionSheet (`productIds` scoped), ConnectionPicker, `shareOrCopyInvite`. Order success **removes this shop’s ids only** (do not `clearBrowseShortlist`). Text chat + `/company/:id` URL — no new message type. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Button` dock, Select / long-press, ConnectionPicker, OS share fallback.  
2. **Duplicates?** No — Your selection still hosts mixed-seller Order / Bookmark / Share.  
3. **Should reuse?** Traveling shortlist, existing order + curate sheets.  
4. **Naming?** Order · Curate · Ask for rates · Share. Follow ≠ Request access.

**Philosophy conflict?** Yes vs older “verbs only on Your selection” → **Redesign** those docs, then Proceed.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Shop-scoped dock + Share |
| Business rules | OK | One pile; dock = `companyId` of this shop |
| Workflows | OK | Select here or on Explore; act here or later on Your selection |
| Edge cases | OK | Other-seller-only pile keeps floater; Clear = this shop; Explore Surat pick already counts |
| Permissions | OK | Own shop: Share only, no trade dock |
| User states | OK | Not connected: same as design page (API error in sheet) |
| Notifications | N/A | |
| Error handling | OK | In-sheet / toast |
| Scalability | OK | No new APIs |
| Mobile interactions | OK | Hide nav; dock `bottom-0` + safe area; BM-07 |
| Accessibility | OK | Named Share / dock buttons |
| Platform consistency | OK | After doc lock |

---

## Gaps

### G-001 — Verbs-only-on-selection docs

| Field | Content |
|-------|---------|
| Gap | `explore.md` / `saved.md` said trade verbs are not on a shop/Explore dock |
| Why it matters | Silent drift |
| Impact if ignored | Two sources of truth |
| Recommendation | Lock shop dock + hide-nav in feature docs |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Hide bottom nav on `/selection` and on `/company/:id` while this shop has selected designs (not own shop).  
- Shop dock: Curate (Trading on) · Ask for rates · Order — this shop’s shortlist lines only.  
- Hide floater on that company page only when the dock is up.  
- Share profile: connections + Find on Ekum + OS share of `/company/:id`.  
- Placeholder tile for designs with no photo (initial, not a broken image).  

## Explicitly deferred / rejected

- Hide nav on create collection / create design  
- Collections select on the shop  
- Bookmark on the shop  
- Design-page hide-nav  
- Unauth shop / 48h `/s/` company kind  
- `company_card` message type  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
