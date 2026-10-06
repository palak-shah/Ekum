# Feature Completeness Review — collection photo / Set live on Edit

**Date:** 2026-10-06  
**Module / ask:** On Edit collection, photos added as designs stay **Not published**. Trader wants to set them live **on that photo / design sheet**, not hunt header Update.  
**Anchors:** `docs/features/collections.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Live pack already means membership is live. Photo-add creating Draft rows without a Set-live control on the tile/sheet fails the “submit where I added it” job. Do **not** Explore-publish the design (no `postedToMarketAt`). |
| UX Designer | Tap photo → sheet is edit. **Set live** on the unpublished tile (and in that sheet) is the decision at the moment. Draft packs stay draft until **Create & Publish** / **Publish**. |
| Solution Architect | Reuse `PUT …/products` promote-own-drafts on Published packs. No product `/publish` (that floods Explore tiles). |

---

## Platform consistency (required)

1. **Existing patterns?** Sticky **Update** still submits the pack; tile/sheet **Set live** is the same promote, at the photo. Kit Button in sheet; compact tile chip like Diff / Not published.  
2. **Duplicates another feature?** No — not Visibility (who/rates) and not solo design Publish.  
3. **Should reuse an existing workflow?** Yes — live-pack member promote.  
4. **Naming matches the app?** **Publish** — same word as pack/design. Pack-only (no Explore design tile). Trader rejected “Set live”.

**Philosophy conflict?** No

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Own Draft + live pack → Set live |
| Business rules | OK | Pack-only Published; no Explore design tiles |
| Workflows | OK | Photo add → tile **Set live**; sheet same; pack Update still bulk |
| Edge cases | OK | Draft/archived pack: no Set live. Foreign members: no. Selecting: tile opens select, not Set live |
| Permissions | OK | Owner editor only |
| User states | OK | |
| Notifications | N/A | Explore bump already on promote |
| Error handling | OK | persistDesigns toast |
| Scalability | OK | |
| Mobile interactions | OK | Chip on tile; sheet CTA; dock unchanged (BM-07) |
| First glance (BM-11) | OK | **Set live** replaces mute Not published on live packs |
| Accessibility | OK | Named button |
| Platform consistency | OK | |

---

## Gaps

### G-001 — unpublished photo members have no in-place live action

| Field | Content |
|-------|---------|
| Gap | Tile shows **Not published**; sheet is only Done. Trader cannot set that photo live there. |
| Why it matters | They added the photo to a live album; the job is “this design is in the pack now.” |
| Impact if ignored | They hunt Update / Visibility and think submit is broken. |
| Recommendation | **Set live** on own-draft tiles of a **published** pack; same in the design sheet. Promote via existing setProducts. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Own Draft members on a **Published** pack: tile **Set live**; sheet **Set live in this pack**.
- Action = persist membership (promote own drafts, pack who/rates, no Explore tiles).
- Draft pack: keep **Not published**; pack Publish still the door.

## Explicitly deferred / rejected

- Per-photo Explore Publish / who-rates sheet (Reject — pack-only).
- Set live on foreign curated members (N/A).
