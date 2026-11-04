# Feature Completeness Review — Repost eligibility chrome

**Date:** 2026-11-02  
**Module / ask:** Explore Repost icon + Repost sheets: gray only when **zero** designs can curate; mixed packs stay tappable; skipped designs collapse; keep typed name after clash; omit invalid cover URLs; done icon on load when a second Repost would already be rejected.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same Curate ceiling. Share stays free. Relist Ask stays Cart/Selection only. Pack-only still cannot Ask. Mixed pack must still Repost the allowed rest. |
| UX Designer | Gray Explore Repost only at zero eligible (tooltip / toast why). Sheet: eligible first, **Skipped designs (N)** collapsed. Zero: count + one reason, hide Add existing / Add new / Explore Repost. Done icon on load; tap toasts already-reposted. |
| Solution Architect | Reuse `checkCurateProducts` / `assertProductsCuratable`. Stamp `repostEligibleCount` + align `viewerReposted` with `ALREADY_REPOSTED` (`!shouldReuseRepostChild`). No new Ask verbs, no schema. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Explore icon row, kit Sheet, 48px thumbs, `CurateWhyHint` **i**, Cart Relist Ask, Instagram done icon. Disabled-icon tooltip is local to Repost (user-specified), not a new kit Tooltip.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — `POST /collections/curate-check`; Cart Relist Ask unchanged.  
4. **Naming matches the app?** **Ask to put in my collection** only. No “Ask to share” / “Ask to relist”.  
5. **Units?** N/A — no ₹ or qty string change.

**Philosophy conflict?** No. Forward/Share stays free; Curate ceiling unchanged; mill Allow still does not list pack-only members.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Mixed stays on; zero grays Explore; sheets skip/collapse |
| Business rules | OK | Same codes; Ask only RELIST_NOT_ALLOWED on Cart/Selection |
| Workflows | OK | Feed icon vs Cart choose vs Explore publish sheet |
| Edge cases | OK | Name clash keep typed name; relative cover omit; already-reposted stamp |
| Permissions | OK | No Share/view/relist model change |
| User states | OK | Own / Trading off / done / zero eligible |
| Notifications | N/A | |
| Error handling | OK | Clash + photo URL + already-reposted toast |
| Scalability | OK | One batched `checkCurateProducts` per Explore page |
| Mobile interactions | OK | Coarse-pointer toast; sheet footer hide; BM-07 Sheet padding |
| First glance (BM-11) | OK | One job; skipped collapsed; optional i quiet |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | aria-disabled + focus tooltip; done aria-label Reposted |
| Platform consistency | OK | |

---

## Gaps

None Required.

### G-001 — Disabled-icon why is local to Explore Repost

| Field | Content |
|-------|---------|
| Gap | App has no kit Tooltip; InfoHint is the quiet **i**. |
| Why it matters | User asked hover/focus (desktop) and tap toast (mobile) on gray Repost. |
| Impact if ignored | Gray icon with no why. |
| Recommendation | Local to Repost ActionIcon; do not invent a whole-app Tooltip. |
| Priority | Required before implementation (in this slice) |

Closed by implementing the local hint.

---

## Approved scope for this slice

- Stamp `repostEligibleCount` from `checkCurateProducts` on Explore collection/design cards.  
- Gray Explore Repost only when count is 0 (plus own / not trading); mixed stays on.  
- Desktop hover/focus why; mobile tap toast: **You don't have permission to repost these designs.** Never open the sheet.  
- Repost sheets: eligible first; collapsed **Skipped designs (N)**; zero → **N designs unavailable** + shared reason; hide choose/Repost when none allowed.  
- Relist Ask only Cart/Selection for `RELIST_NOT_ALLOWED`; pack-only never Ask.  
- Seed name only on open / source id; keep typed name after clash.  
- Omit non-http(s) `coverImage` on create.  
- `viewerReposted` matches create conflict; tap done toasts **You already reposted this.**  

## Explicitly deferred / rejected

- Ask to share / Ask to relist  
- Ask on Explore Repost sheet  
- Listing pack-only members via Relist Allow  
- Order / chat / Share permission changes  
- Undo Repost from the feed  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (web + API units for this slice; no new e2e permission rewrite)  
