# Feature Completeness Review — Follow-ask extra gate

**Date:** 2026-09-24  
**Module / ask:** Follow tap asks; shop Allows look-through or put-in-pack, or Denies. Pending is not a follower.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/explore.md`, `docs/features/home.md`, `docs/features/company.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Wholesale catalogs should not open because someone tapped Follow. Extra approve gate fits the trust ladder. Do **not** hide Follow for sell-only. Do **not** merge with Request access. Publish stays Followers-first + Selected. |
| UX Designer | Shop: Follow / **Pending** / Following. Network Followers: chips **Asked** / **Following you**. Shop-facing copy **Look through** / **Put in a pack**. Follower never sees grant type. Home Needs for incoming asks. Kit chips, cards, buttons — no new checkbox language. |
| Solution Architect | One `Follow` row: `pending` \| `allowed` + `accessKind` `look` \| `pack`. Audience queries must filter **allowed** only. Curate: look-only (and not Connected) cannot put that seller’s designs in a pack. Seed rows migrate to allowed + look. |

---

## Platform consistency (required)

1. **Existing patterns?** Network lists, Home Needs, shop action row, catalog-style chips, kit Sheet/Button.  
2. **Duplicates another feature?** No — Request access stays Connection. Collection view Ask and pack/relist Ask stay pack-scoped.  
3. **Should reuse an existing workflow?** Reuse Followers + Home Needs; do not invent Waiting or a second request table.  
4. **Naming matches the app?** Pending (not Waiting). Look through / Put in a pack (not Buy/Trade on follower UI).

**Philosophy conflict?** Yes — concepts today say Follow is permissionless. **Intentional change:** lock docs first, then build. Not Reject (still Ekum trust, not a one-off chrome).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Ask → pending → allow look/pack or deny; unfollow cancels. |
| Business rules | OK | Pending ≠ follower. Follower never sees grant. Deny silent; can ask again. |
| Workflows | OK | Shop button, Explore Follow, Followers inbox, Home Needs. |
| Edge cases | OK | Self/block 404; already pending/allowed no-op; Connected still curates via existing ceiling. |
| Permissions | OK | Only the followed company decides / changes access. |
| User states | OK | Follow / Pending / Following; sell-only still shows Follow. |
| Notifications | Later | Home Needs is the attention path this slice. Bell later. |
| Error handling | OK | Danger toast; in-sheet errors on decide. |
| Scalability | OK | Same unique pair; filter `status: allowed` on audience. |
| Mobile interactions | OK | Followers decide buttons on cards; sheet only if needed; list padding above nav (BM-07). |
| Accessibility | OK | Named buttons, chip selected state, shop `data-testid`. |
| Platform consistency | OK | Separate from Request access; no grant label on Following page. |

---

## Gaps

None Required before implementation. Bell copy for follow-ask is **Later**.

---

## Approved scope for this slice

- Completeness + feature docs lock (concepts, access, explore, catalog, home, company, gap matrix).
- `Follow.status` + `Follow.accessKind`; audience = allowed only.
- Ask / unfollow / decide / change access APIs.
- Shop Follow / Pending / Following; Explore ask; hide Follow when pending or following.
- Followers: Asked + Following you (shop can change access).
- Following list: allowed only, no grant type.
- Home Needs → `/network/followers?tab=asked`.
- Curate: look-only and not Connected cannot put that seller’s designs in a pack.
- Tests: API, web units, functional journey.

## Explicitly deferred / rejected

- Hide Follow when buying is off — Rejected.
- Merge Follow with Request access — Rejected.
- Show grant type to the follower — Rejected.
- Waiting / feed-wide pending badge — Rejected.
- Change publish defaults — out of scope (already Followers + Selected).
- Push / bell for follow-ask — Later.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
