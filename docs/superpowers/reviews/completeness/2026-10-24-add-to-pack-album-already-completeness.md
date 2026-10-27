# Feature Completeness Review — Add to pack from album + already-in + drafts

**Date:** 2026-10-24  
**Module / ask:** Open a design from a collection → ⋯ **Add to collection / catalog**. The destination sheet shows packs this design is already in. Published vs drafts?  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior slice `2026-10-24-add-to-pack-published` hid drafts so Untitled rows would not bury live albums. That fight is gone: the sheet now groups Collections / Catalogs and uses You thumbs. Hiding drafts still blocks adding a design to a pack they are **building**. You Collections already lists published + draft together with a **Draft** chip.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same job from You Designs and from an album photo. Already-in must be visible so they do not re-add blind. Draft albums are destinations; Deleted are not. |
| UX Designer | Album ⋯: Bookmark · Edit · **Add to collection / catalog** · Remove from this collection · Delete. Sheet: already-in rows stay visible, idle border, quiet **Already in** — not Selected (tap must not mean Remove). Draft chip matches You list. Find + Select unchanged. |
| Solution Architect | `ProductView.collectionIds` from membership include. Intersection for multi-select: Already in only when **every** picked design is a member. Toggle / Select all skip those ids. PUT still merges. Album sheet seeds the open `ProductView` so mill members are not stuck on my-products. |

---

## Platform consistency (required)

1. **Existing patterns?** DesignSheet ⋯; AddToPackSheet; You Draft chip; accent-border select.  
2. **Duplicates another feature?** No — album ⋯ was missing the You verb. Remove stays the way out of **this** album.  
3. **Should reuse an existing workflow?** Yes — same sheet + PUT.  
4. **Naming matches the app?** Add to collection / catalog · Already in · Draft.  
5. **Units?** N/A.

**Philosophy conflict?** No. Showing drafts **redesigns** published-only from the prior slice so the sheet matches You, not a second filter language.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Album ⋯; already-in; drafts |
| Business rules | OK | Exclusive catalog still empty; catalogs only GC leftovers; already-in not removable here |
| Workflows | OK | You Designs sheet + album sheet + Designs select |
| Edge cases | OK | All destinations already-in → list them, Add disabled; mill member uses seeded product |
| Permissions | OK | Owner album only |
| User states | OK | Visitor album ⋯ unchanged |
| Notifications | OK | Same add toast |
| Error handling | OK | Existing CATALOG_EXCLUSIVE |
| Scalability | OK | Same Find |
| Mobile interactions | OK | Sheet footer Add (BM-07 existing) |
| First glance (BM-11) | OK | Already in quieter than Selected; Draft chip not a second title |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | already-in `aria-disabled`; Selected `aria-pressed` |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Album ⋯ missing Add to collection

| Field | Content |
|-------|---------|
| Gap | Collection DesignSheet has Remove / Delete but not Add to collection / catalog. |
| Why it matters | Opening a design from a pack is the moment they notice it should also live on another album. Sending them to You first is an extra hunt. |
| Impact if ignored | Two ⋯ menus for the same design. |
| Recommendation | Owner album DesignSheet: same Add verb as You. |
| Priority | Required before implementation |

### G-002 — Destinations hide current membership

| Field | Content |
|-------|---------|
| Gap | Sheet does not mark packs the design already sits in. |
| Why it matters | Traders forget which albums hold a design. Re-adding is a silent no-op. |
| Impact if ignored | They tap Add and think nothing happened, or hunt You. |
| Recommendation | Show those rows as **Already in**. Not togglable. Select all skips them. |
| Priority | Required before implementation |

### G-003 — Published-only hides packs they are building

| Field | Content |
|-------|---------|
| Gap | Prior slice listed Published only. |
| Why it matters | New collection stays Draft until Publish. Adding a live design into that draft is everyday. |
| Impact if ignored | They close the sheet and use album Add photos instead — longer path. |
| Recommendation | Published + Draft (Ready reads Draft). **Draft** chip. Deleted still hidden. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Owner collection DesignSheet ⋯ includes **Add to collection / catalog** (before Remove / Delete). Same sheet as You.  
- Destinations: non-deleted, non-General Collection packs (published **and** draft). **Draft** chip on draft/ready rows.  
- Rows the design (or every selected design) already belongs to pin first under **Already in** (ids + names + exclusive catalog). Not selectable, not in Add. Always load my-products so album open does not hide other memberships.  
- `collectionIds` on `ProductView`. Album pass-through of the open design so mill members resolve.  
- Catalogs still only for General Collection leftovers; max one; exclusive vs collections.

## Explicitly deferred / rejected

- Tapping Already in to Remove from that pack (album **Remove from this collection** stays the remove path).  
- Deleted albums in this sheet.  
- Visitor album Add to collection.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
