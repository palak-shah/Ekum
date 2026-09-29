# Feature Completeness Review — Pack rate band, design shop name, Network / profile copy

**Date:** 2026-09-29  
**Module / ask:** CSV sr 16 T3 · sr 17 T3 · sr 77 T2 · sr 88 T6  
**Anchors:** `docs/features/explore.md`, `docs/features/company.md`, `docs/features/access-and-connections.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack title already names the album. Subtitle should add the rate span traders scan for (`9 designs · ₹280–₹445 /mtr`), not a lecture. Design cards (search tile, pack tile, pack photo sheet) must name the shop so a design is never anonymous. Network hub already has list hints — drop the sentence under the title. Who-sees-packs belongs on **Business profile**, one line. |
| UX Designer | Reuse `designCountLabel` + existing ₹ en-IN band. Space before unit matches the CSV (` /mtr`). Mixed units or all On request → count only (no fake band). Shop name is a quiet second line, not a new chip. Network: title + rows only. Profile: muted line under the header, not a new card. |
| Solution Architect | Compute band from loaded pack members (same DTO). No new API. Skip band when units differ. Design shop: `companyName` or pack company. Search `ProductTile` already has `company`. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — rate via `formatRate` numbers; shop name already on Explore posts and CompanyRow.  
2. **Duplicates another feature?** No — Network sentence duplicated They see mine / Connections hints.  
3. **Should reuse an existing workflow?** Who-sees-packs stays Network lists; profile only explains.  
4. **Naming matches the app?** “You choose who sees collections.” No Seller/Buyer.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Display-only |
| Business rules | OK | Gated rates stay On request / omitted from band |
| Workflows | OK | No new taps |
| Edge cases | OK | Mixed unit / empty products / no shop name |
| Permissions | N/A | |
| User states | OK | Owner pack still shows shop name on tiles |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sticky chrome |
| Accessibility | OK | Text in subtitle / card |
| Platform consistency | OK | |

---

## Gaps

None required.

---

## Approved scope for this slice

- Pack `PageHeader` subtitle: `{n design(s)} · ₹low–₹high /unit` when priced members share one unit; count only otherwise.  
- Design card / pack design popup / search design tile always show the shop name (curated foreign on own pack still `From {shop}`).  
- Remove Network subtitle under the title.  
- ~~One line on Business profile: **You choose who sees collections.**~~ **Rejected after ship** — product: no lecture on Business profile.

## Explicitly deferred / rejected

- Feed pack footer rate band (CSV is pack header).  
- Rate band on locked packs without member rates.  
- sr 16 T9 select hint.  
- sr 88 T6 Business profile audience line (product: no).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit coverage for this copy slice)  
