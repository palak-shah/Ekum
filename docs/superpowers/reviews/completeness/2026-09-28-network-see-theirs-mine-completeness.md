# Feature Completeness Review — Network: I see theirs / They see mine

**Date:** 2026-09-28  
**Module / ask:** Replace Network **Following** / **Followers** with option 2: **I see theirs** / **They see mine**.  
**Anchors:** `docs/features/access-and-connections.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | These lists are who can see collections, not social follow. Titles must say I vs they. |
| UX Designer | Same Network cards: short title + why-line. Page headers match the cards. Stop-seeing on the I-see-theirs list (not Unfollow). |
| Solution Architect | Routes stay `/network/following` and `/network/followers`. API unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Network hub rows; PageHeader = row title.  
2. **Duplicates another feature?** No — not Connections, not Requests.  
3. **Should reuse an existing workflow?** Same lists.  
4. **Naming matches the app?** Chosen pair: **I see theirs** / **They see mine**. Hints: collections you can see / businesses you let see yours.

**Philosophy conflict?** No. Follow API stays the See-new-packs door.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Copy only |
| Business rules | OK | |
| Workflows | OK | |
| Edge cases | OK | Empty states drop follow jargon |
| Permissions | N/A | |
| User states | OK | |
| Notifications | Later | Home still says Follow ask |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Same rows |
| Accessibility | OK | Headings match titles |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Network hub: **I see theirs** — Businesses whose collections you can see. **They see mine** — Businesses you let see your collections.
- Matching page titles.
- I-see-theirs row action **Stop seeing** (toast **Stopped seeing**).
- Empty states without Follow/Following/Followers.
- Network why-line: not “follows”.
- Docs + unit + functional assert titles.

## Explicitly deferred / rejected

- Publish Who **My followers**.
- Shop **See new packs** / **Seeing packs**.
- Home Needs **Follow ask**.
- URL path rename.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
