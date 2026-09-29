# Feature Completeness Review — They see mine: keep Stopped

**Date:** 2026-09-28  
**Module / ask:** After **Stop**, the business stays on **They see mine** as **Stopped** (does not vanish).  
**Anchors:** `docs/features/access-and-connections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Stop is a shop-side pause of follow access, not “forget this business.” Same idea as Connection pause: the actor still sees the row. Catalog door closes immediately. Silent to them. |
| UX Designer | Same card. See / Share off. **Stopped** in the same quiet slot as Stop (not a CTA). Tick **See** or **Share** to let them in again — no second Allow. Asked **Decline** still clears the ask (they were never on this list). |
| Solution Architect | Persist `status=stopped` (string; no enum migration). `GET /follows/followers` = allowed + stopped. Audience / I see theirs / shop **Seeing packs** stay **allowed only**. Deny on **allowed** → stopped. Deny on **pending** still deletes. Re-ask while stopped → pending (Asked). |

---

## Platform consistency (required)

1. **Existing patterns?** Connection pause stays on the actor’s list; silent revoke. See/Share/Stop one quiet row.  
2. **Duplicates another feature?** No — not Block.  
3. **Should reuse an existing workflow?** Same decide deny; resume via decide look/pack on stopped.  
4. **Naming matches the app?** **Stopped** / **Stop**. Not Unfollow / Remove.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Row remains; grants off |
| Business rules | OK | Stopped is not a follower for packs/feed |
| Workflows | OK | Resume ticks; re-ask → Asked |
| Edge cases | OK | Decline pending deletes; I see theirs Stop seeing still deletes |
| Permissions | OK | Shop only |
| User states | OK | allowed vs stopped |
| Notifications | OK | Silent |
| Error handling | OK | Existing toasts |
| Scalability | OK | Same list |
| Mobile interactions | OK | Same row; BM-07 padding already |
| Accessibility | OK | Stopped is text; See/Share still labelled |
| Platform consistency | OK | Pause-on-my-list |

---

## Approved scope for this slice

- Deny on **allowed** sets `stopped` (keep row). List includes stopped. UI: See/Share off + **Stopped**.
- Tick See / Share on a stopped row → allow look / pack.
- Re-ask while stopped → pending (Asked); they leave this list until Allow.
- Decline on Asked still deletes.
- Docs + API/web units + functional: Stop keeps Jaipur; Meena is no longer Seeing packs.

## Explicitly deferred / rejected

- Stopped rows on **I see theirs**.
- Telling the other shop they were stopped.
- Decline-on-ask appearing as Stopped on They see mine.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
