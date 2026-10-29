# Feature Completeness Review — Direct Link auto-repost locked row

**Date:** 2026-10-28  
**Module / ask:** Direct Links create sheet and cards must show that auto-repost is On — last locked row — so the trader knows what happens when they Save. Not a toggle.  
**Anchors:** `docs/features/settings.md`, `docs/features/explore.md`, `docs/superpowers/specs/2026-09-02-tradelane-design.md`, `docs/superpowers/reviews/completeness/2026-10-28-auto-repost-future-only-supplier-completeness.md`  
**Disposition:** Redesign of “no auto-repost row”, then **Proceed** for this slice

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite `2026-10-28-direct-links-network-completeness.md`, `2026-10-28-auto-repost-selected-buyer-completeness.md`, or `2026-10-28-auto-repost-future-only-supplier-completeness.md`. Auto-repost rules stay: Selected buyer, future-only, no create-time backfill. This review only **shows** that lock on Direct Links.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Direct Link already auto-reposts new supplier packs to this buyer. Hiding that row meant Save looked like orders + group only. The trader must see the third outcome before they create the path. |
| UX Designer | Same locked On row as Direct supplier orders / share a group. **Last** of the three. Label: **New supplier posts go to this buyer.** Not a switch. Ticket/reveal stay hidden. |
| Solution Architect | UI only. No `behaviors.autoRepost` toggle. Eligibility stays Direct Link + Relist/`allowForward`. |

---

## Platform consistency (required)

1. **Existing patterns?** `PathLockedDefaults` locked On rows. Yes.  
2. **Duplicates another feature?** No. Does not add a second Repost control.  
3. **Should reuse an existing workflow?** Same locked-defaults block on create sheet and list cards.  
4. **Naming matches the app?** Supplier × Buyer. **Posts** / buyer, not Auto-repost jargon, not Mill.  
5. **Units?** N/A.

**Philosophy conflict?** Network completeness hid auto-repost to avoid a fake toggle. Showing it as a **locked** On row matches Direct-order + group. **Redesign** the hide, not a new switch.

---

## Locked copy

Order on create sheet and on each Direct Link card:

1. Direct supplier orders  
2. Supplier, buyer, and you share a group  
3. **New supplier posts go to this buyer** (last)

Still not editable. Old albums do not hop (future-only stays).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visibility of existing hop |
| Business rules | OK | No toggle |
| Workflows | OK | Save still mill ticket + group + future hop |
| Edge cases | OK | Empty picker still shows the three On rows |
| Permissions | N/A | |
| User states | OK | Create + list cards |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Third row in scrollable sheet above Save (BM-07) |
| First glance (BM-11) | OK | Last row is the catalog outcome; not louder than Supplier/Buyer pick |
| Units | N/A | |
| Accessibility | OK | Same row pattern |
| Platform consistency | OK | Locked On, not checkbox |

---

## Gaps

### G-001 — Auto-repost invisible at Save

| Field | Content |
|-------|---------|
| Gap | Locked defaults omitted auto-repost. Trader could not see that new supplier posts would go to this buyer. |
| Why it matters | Direct Link is orders + group **and** future Selected hop. |
| Impact if ignored | Surprise posts on the trader’s catalog; revoke copy mentions automatic reposting they never saw. |
| Recommendation | Locked On row, last. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + settings / tradelane / gap-matrix lock. Successor note only if needed; do not rewrite prior completeness.  
- Third locked On row on create sheet and list cards.  
- Units + Direct Links functional assert on the create sheet.

## Explicitly deferred / rejected

- Per-lane auto-repost toggle.  
- Backfill of older albums.  
- Mill rename on order desk.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
