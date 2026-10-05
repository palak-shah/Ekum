# Feature Completeness Review — Curated pack source cue + Find by mill

**Date:** 2026-10-04  
**Module / ask:** Owner of a curated pack must see **where designs belong** (**From {shop}**). You Find on Collections (and in-pack / Designs when the mill name is on the row) matches **original design owners**. Curated mill designs stay **out of My Designs**.  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`, `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack is yours; mill identity must not vanish. Find “Yash” on Collections (and inside the pack). Designs tab stays your catalog. |
| UX Designer | Hide own shop row (unchanged). Owner **From Yash** is a real caption (semibold ink), not a whisper. Same on You feed/grid and each foreign tile. |
| Solution Architect | `collectionOwnerSourceLine` + `memberShops` already exist. Loudness is UI. `collectionMemberFind` must include mill names so Find is not only list-side `memberShops`. |

---

## Platform consistency (required)

1. **Existing patterns?** **From {shop}** / **Yours and {shop}** — keep copy. ConnectionPicker-level chrome not needed.  
2. **Duplicates another feature?** No Curated chip.  
3. **Should reuse an existing workflow?** Owner source line + album find.  
4. **Naming matches the app?** **From {shop}**. Not Supplier / Seller.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Louder From; Find mill on packs |
| Business rules | OK | References; mill not copied to My Designs |
| Workflows | OK | You → Collections; open pack |
| Edge cases | OK | Own-only pack stays silent; 3+ mills **From N shops** |
| Permissions | OK | Owner cue only |
| User states | OK | Visitors still see pack shop row |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile interactions | OK | Caption under title; no extra chrome row |
| First glance (BM-11) | OK | From is the mill job; tags stay muted |
| Accessibility | OK | Text, not colour alone |
| Platform consistency | OK | |

---

## Gaps

None required. Create-group-from-Share remains unrelated.

## Approved scope for this slice

- Owner pack: **From {shop}** under title (`text-sm font-semibold text-ink`).
- Foreign member tiles (owner): **From {shop}** in ink, not muted.
- You Collections feed/grid: source as its own caption line (not buried in photos · status).
- `collectionMemberFind` includes mill company names; You Collections Find + in-pack Find keep mill names.
- Docs: owner From is required when members are foreign; mill designs not listed under Designs.

## Explicitly deferred / rejected

- Listing mill designs as rows on **You → Designs**.
- Visitor-facing Curated chip or mill shop row on the pack (buyers still see the curator).

## Sign-off

Yes · 2026-10-04  
