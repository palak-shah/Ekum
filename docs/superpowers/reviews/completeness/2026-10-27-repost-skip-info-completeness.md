# Feature Completeness Review — Repost skip why (i)

**Date:** 2026-10-27  
**Module / ask:** Repost / Curate skip line — why skipped (and publish exceptions) live in the quiet **i**, not a second title. Old pack category does not unlock Curate.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/saved.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Skip is Curate ceiling, not missing Category. Follower still cannot put pack-only designs in a collection after the mill stamps Category. Why belongs behind **i** so the sheet job stays Publish. |
| UX Designer | Match `InfoHint` (collection Apply-all i). Keep `N skipped` quiet. Do not dump codes. Publish errors stay in-sheet `InlineNotice` and also in **i** so they can re-read. |
| Solution Architect | Reuse `curate-check` codes. No new API this slice. `NOT_DISCOVERABLE` includes pack-only members (`postedToMarketAt` null) — Category does not set that. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit `InfoHint` / `InfoIcon`.  
2. **Duplicates another feature?** No — skip summary already exists; this is the why.  
3. **Should reuse an existing workflow?** Yes — same i as Apply-all / Field `info`.  
4. **Naming matches the app?** Plain: can’t put in a collection / not listed. No Curate jargon.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | i lists distinct skip reasons + last publish exception |
| Business rules | OK | Relist lock, look-only, not listed; Category is not a Curate key |
| Workflows | OK | Explore per-post Repost + Cart Repost |
| Edge cases | OK | Mixed codes; extra message; zero skip but publish error |
| Permissions | N/A | |
| User states | OK | Loading / pack locked unchanged |
| Notifications | N/A | |
| Error handling | OK | InlineNotice stays for publish fail |
| Scalability | N/A | |
| Mobile interactions | OK | i panel existing z/[85]; sheet footer unchanged |
| First glance (BM-11) | OK | Count line quiet; why behind i |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | InfoHint label “Why these were skipped” |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Quiet skip count stays. **i** explains grouped skip codes and any publish exception.  
- Same on Explore Repost sheet and Cart Repost skip line.  
- Do not change Curate discoverability / Category rules this slice.

## Explicitly deferred / rejected

- Making pack-only designs curatable (postedToMarketAt / album membership). Later if product wants followers to republish pack-only members.  
- Category picker on Repost sheet.

## Test plan

- Unit: `curateWhyHintLines` per code + extra.  
- Repost sheet: skip line + i body.  
- Trader-eye: phone-width Repost with skips — i is quieter than Name / Who.
