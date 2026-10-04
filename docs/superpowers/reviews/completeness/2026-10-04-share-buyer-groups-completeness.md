# Feature Completeness Review — Share sheet buyer groups

**Date:** 2026-10-04  
**Module / ask:** On catalog **Share**, let the trader pick **buyer groups** as a shortcut to send a collection/design into chats. Overlap (same shop in two groups) → **one** post. Not a second Broadcast compose.  
**Anchors:** `docs/features/broadcast.md`, `docs/features/explore.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Share is still “post this pack/design into chats.” Groups save re-tapping companies. Count and toast are unique shops. |
| UX Designer | Same sheet. Groups first (if any), ConnectionPicker rows (Add/Selected), then companies. Clear wipes both. No Broadcast copy. |
| Solution Architect | Client union: selected companies ∪ members of selected lists, `dedupeCompanyIds`. Still `POST /threads/direct` + messages. Never `POST /broadcasts`. Drop group members who are not a live connection (same as Broadcast eligibility). |

---

## Platform consistency (required)

1. **Existing patterns?** `CatalogShareSheet` + ConnectionPicker accent rows; buyer groups from `/broadcasts/lists`.  
2. **Duplicates another feature?** No — Compose stays hidden; this is Share convenience.  
3. **Should reuse an existing workflow?** Yes — same chat cards as today.  
4. **Naming matches the app?** **Buyer groups** · **Share with N** (unique shops).

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Groups + companies; unique send |
| Business rules | OK | Same shareable units as Share; drafts unchanged |
| Workflows | OK | One sheet; Publish still uses groups for audience |
| Edge cases | OK | Empty lists hidden; empty group adds 0; overlap once |
| Permissions | OK | Lists GET for signed-in company; hide on fail/empty |
| User states | OK | No groups → sheet unchanged |
| Notifications | N/A | Chat delivery as today |
| Error handling | OK | In-sheet notice; no broadcast path |
| Scalability | OK | Union in memory |
| Mobile interactions | OK | Same sheet scroll + sticky Share |
| First glance (BM-11) | OK | Groups only when they exist; quiet count |
| Accessibility | OK | Row buttons + Selected/Add |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Create group from Share

| Field | Content |
|-------|---------|
| Gap | Publish can **Create group** on the sheet; Share will not. |
| Why it matters | Trader with zero groups still taps companies. |
| Impact if ignored | First group is Network / Publish. |
| Recommendation | Defer — keep Share one job. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Fetch `/broadcasts/lists` when Share is open.
- If any non-empty group exists, show selectable **Buyer groups** rows (same accent-border language as companies).
- Recipients = unique company ids from selected companies **and** selected groups’ members (connected only).
- Button / “N selected” use that unique count. Two groups sharing shop X → one DM.
- Still no `POST /broadcasts`. Clear resets groups + companies.
- Docs: Share may use groups as a shortcut; Publish groups stay audience.

## Explicitly deferred / rejected

- Create/edit groups from Share (G-001).
- Reopening Broadcast compose as a second send door.
- Sharing drafts / unpublished via groups.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
