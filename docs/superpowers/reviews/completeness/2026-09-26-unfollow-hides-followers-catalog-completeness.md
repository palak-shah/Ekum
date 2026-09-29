# Feature Completeness Review — Unfollow hides Followers catalog

**Date:** 2026-09-26  
**Module / ask:** After A turns off **Seeing packs**, A must not keep B’s Followers-audience shop packs. Demo seed was **Everyone**, so unfollow looked like a no-op.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | See new packs is the Followers door. Cancel deletes the follow. B idle does not keep a grant. Everyone was a leftover public door — not offered on Publish. |
| UX Designer | Shop grid should empty for Followers packs after Seeing packs off. No extra chrome. |
| Solution Architect | API already gates `followers` on allowed follow. Seed + query invalidation were the leak. Connection does **not** unlock Followers. |

---

## Platform consistency (required)

1. **Existing patterns?** Same Follow API + `canDiscoverCollection`.  
2. **Duplicates another feature?** No — not pack Ask, not Connect.  
3. **Should reuse an existing workflow?** Unfollow already `deleteMany`.  
4. **Naming matches the app?** Seeing packs off = end follow.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Seed Followers; invalidate shop/explore/preview |
| Business rules | OK | Other doors unchanged |
| Workflows | OK | |
| Edge cases | OK | Connected + unfollow still hides Followers |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | N/A | No chrome change |
| Accessibility | N/A | |
| Platform consistency | OK | |

## Approved scope for this slice

- Seed published catalog **Followers** (not Everyone).
- Invalidate follow + catalog queries on follow change.
- Unit: Followers pack 404 when Connected but not following.

## Explicitly deferred / rejected

- Hiding legacy Everyone packs on unfollow (still public if any remain).
- Auto-revoke per-pack **Granted on request**.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + seed; existing explore journey still Meena→Ravi follow)
