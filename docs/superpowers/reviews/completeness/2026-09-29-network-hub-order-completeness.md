# Feature Completeness Review — Network hub order

**Date:** 2026-09-29  
**Module / ask:** You → Network list order: I see theirs → They see mine → Buyer groups → Connections → Invites  
**Anchors:** `docs/features/access-and-connections.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Everyday see-packs (I see theirs / They see mine) sit above trade desks (Connections, Invites). Buyer groups stay with publish — only when selling + canPublish. Same destinations; order only. |
| UX Designer | One list, same row chrome. No new tabs or labels. Buyer groups remains a conditional row, not a peer tab. |
| Solution Architect | Reorder `SEE_LINKS` then optional `/broadcast` then `TRADE_LINKS`. Routes and APIs unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Same Network hub rows; matches You → Network IA.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same links.  
4. **Naming matches the app?** I see theirs / They see mine / Buyer groups / Connections / Invites.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Order + conditional Buyer groups |
| Business rules | OK | Buyer groups still selling && canPublish |
| Workflows | OK | Deep links unchanged |
| Edge cases | OK | Non-publisher: four rows, no groups |
| Permissions | OK | Presence already gates groups |
| User states | OK | Same |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Same rows |
| Accessibility | OK | Same links |
| Chrome / clip (BM-07) | N/A | No new sticky bar |

---

## Required gaps

None.

## Deferred

URL rename `/network/following` / `followers` still later.

## Disposition

**Proceed** — approved scope: hub order only.
