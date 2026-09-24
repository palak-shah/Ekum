# Feature Completeness Review — Mill Send on parent Timeline

**Date:** 2026-09-20  
**Module / ask:** When the trader **Send**s a mill lot, append a Timeline row on the Manage parent (`You sent to {shop}`), same pattern as Hold/Resume.  
**Anchors:** `docs/features/orders.md`, `docs/superpowers/specs/2026-09-07-trader-i-handle-desk-design.md` (Timeline = whole trip)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Send is the main trader move; without a trail row the desk looks unfinished vs Hold noise. One row per mill Send. |
| UX Designer | Copy matches Hold: **You sent to {shop}**. Trader sees mill names (desks visible). Buyer soft-hide scrubs mill name → quiet **Updated** (no leak). |
| Solution Architect | `sendUp` already releases hops; add `trail.append` per released upstream with `seller` include. Soft-hide scrub: empty “You sent to” → fallback. |

---

## Platform consistency (required)

1. **Existing patterns?** Same as Hold/Resume trail on parent.  
2. **Duplicates?** No.  
3. **Reuse?** `OrderTrailType.Updated` + existing scrub.  
4. **Naming?** Shop name; “You sent to …”.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Trail row per Send |
| Business rules | OK | Soft-hide for buyer |
| Workflows | OK | Place → Send → Timeline |
| Edge cases | OK | Multi-mill = N rows; re-Send N/A (already released) |
| Permissions | OK | Trader only writes |
| User states | OK | |
| Notifications | N/A | Chat announce already exists |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile / a11y | OK | Existing Timeline |
| Platform consistency | OK | |

---

## Approved scope

- Append `You sent to {mill}` on parent when `sendUp` releases a hop.
- Scrub leftover “You sent to/held/resumed” for buyers hiding that mill.
- Docs + unit expect on `trail.append`.

## Explicitly deferred

- Buyer-facing friendly copy instead of scrubbed “Updated”.
- Backfill historical Sends.

## Sign-off

| Role | Disposition |
|------|-------------|
| Product / UX / Architecture (agent) | Proceed |
