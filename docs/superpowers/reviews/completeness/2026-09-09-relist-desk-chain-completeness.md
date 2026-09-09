# Feature Completeness Review — Relist desk chain (Slice B+)

**Date:** 2026-09-09  
**Module / ask:** Desk-chain pack permission — Ask target by source; publish allow gates next hop; agent role later.  
**Anchors:** Slice B completeness `2026-09-08-relist-ask-slice-b`, `saved.md`, TradeLane / I-handle  
**Disposition:** Proceed (Redesign delta on Slice B)

> Completeness keeps Ekum **coherent**. Conflicts with I-handle → this redesign fixes Ask-to-mill when buyer only saw the design in your pack.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Mill Allow ≠ chain free pass. Your publish allow/deny-to-relist gates buyers. Direct mill post → mill ↔ them. |
| UX Designer | Same CTA/copy; Ask lands on the desk that published the pack they used. |
| Solution Architect | `sourceCollectionId` on Ask; `grantedByCompanyId` for revoke cascade; ceiling OR pack-open (`collection.allowForward`). |

---

## Platform consistency (required)

1. **Existing patterns?** Same Ask/Allow chat; Selection Waiting.  
2. **Duplicates?** No.  
3. **Reuse?** RelistRequest + ProductRelistGrant.  
4. **Naming?** Unchanged CTA; agent role deferred.

**Philosophy conflict?** No — aligns I-handle desk with pack permission.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Desk vs mill Ask target |
| Business rules | OK | Publish allow; no auto-cascade; revoke cascade |
| Workflows | OK | Via pack vs mill listing |
| Edge cases | OK | Mixed sources later; agent Later |
| Permissions | OK | Desk Allow requires own grant/ownership for foreign lines |
| User states | OK | |
| Notifications | OK | Same grant notif |
| Error handling | OK | |
| Scalability | OK | |
| Mobile interactions | N/A | No new chrome |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Agent role when buyer found both paths

| Field | Content |
|-------|---------|
| Gap | Buyer saw mill post and trader pack |
| Recommendation | Later — agent role |
| Priority | Future improvement |

---

## Approved scope for this slice

- Ask with optional `sourceCollectionId` → target = pack owner; omit → product owner  
- Selection lock: product allow OR grant OR source pack allow  
- Ceiling: same OR pack-open membership  
- Grant stores `grantedByCompanyId`; revoke cascades downstream grants  
- Docs + units + functional desk Ask vs mill Ask  

## Explicitly deferred / rejected

- Agent role / dual-path mediation  
- Flipping mill `allowForward` from desk Allow  

## Sign-off

Proceed — implement approved scope only.
