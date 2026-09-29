# Feature Completeness Review — They see mine: Instagram list + search + revoke

**Date:** 2026-09-28  
**Module / ask:** Option 1: one **They see mine** list (who already sees you). **Asked · N** at the top (not a peer tab). Search on the list. **Stop them seeing** to revoke.  
**Anchors:** `docs/features/access-and-connections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Allowed list is the job. Asks are a doorway, not a twin tab. Revoke = they cannot see collections (silent; they may ask again). |
| UX Designer | No Asked / Seeing packs chips. Top row **Asked · N** (only if N > 0) → Asked screen (Allow / Decline). ListSearchRow + SearchInput; keep the list until they type. Row: grants + **Stop them seeing**. |
| Solution Architect | Default URL is the allowed list. `?tab=asked` stays for Home Needs. Deny on **allowed** deletes the follow (same decide deny). |

---

## Platform consistency (required)

1. **Existing patterns?** Network hub row; ListSearchRow; I see theirs **Stop seeing**; grant checks.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Decide deny for revoke.  
4. **Naming matches the app?** Asked · Stop them seeing. Not Remove / Unfollow.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Search client-side name/city |
| Business rules | OK | Revoke deletes follow; packs/feed door closes |
| Workflows | OK | Home still `?tab=asked` |
| Edge cases | OK | No asks → no Asked row; no match copy |
| Permissions | OK | Shop-only deny |
| User states | OK | |
| Notifications | OK | Silent like Decline |
| Error handling | OK | Toast |
| Scalability | OK | In-memory filter |
| Mobile interactions | OK | pb-24; search not a void |
| Accessibility | OK | Asked is a link; search labelled |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Main **They see mine**: search + allowed cards; **Asked · N** entry when asks exist.
- Asked is its own header screen (`?tab=asked`), not a chip.
- **Stop them seeing** → decide `deny` on allowed.
- Default landing is the allowed list even if asks exist.
- Docs + unit (tab default, filter, page) + API deny-allowed + functional journey.

## Explicitly deferred / rejected

- Search on the Asked screen.
- Peer tabs Asked / Seeing packs.
- Telling the other shop they were removed.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
