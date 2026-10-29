# Feature Completeness Review — One trio (any name order) + Order for buyer who-is-acting

**Date:** 2026-10-29  
**Module / ask:** Duplicate Direct Link groups for the same three shops; mill own-catalog Order for buyer wrongly went trio and deadlocked (Requested + createdBySeller = no Dispatch). Chat must follow who is acting.  
**Anchors:** Completeness `2026-10-28-direct-link-reuse-group-completeness.md`, `2026-10-28-for-buyer-direct-group-completeness.md` (own-catalog→trio **superseded** for mill logs), `docs/superpowers/specs/2026-09-02-tradelane-design.md`  
**Disposition:** Proceed

Do **not** overwrite prior Direct Link completeness files.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same three shops = one group no matter whose name is first. Trader logging mill goods for a buyer + Direct Link = that trio. Supplier logging **their own** collection for their buyer = mill–buyer 1:1 (Confirmed, Dispatch / Decline). Mixed pack splits: Direct mill slice → trio; own slice → 1:1. No Direct Link → one I-handle parent (buyer sees both as the actor) plus trader–mill 1:1. |
| UX Designer | Chats: one three-name row. Mill own log: SS 1:1 with Dispatch on mill, Decline on buyer — never an empty mill dock. Extra JE-first / SS-first clones leave the inbox. |
| Solution Architect | `ensureTradeLaneGroup` matches **company set**, keeps stamped `groupThreadId` or oldest, closes clones, moves living order cards. Remove mill-own + mill-lane → Direct in for-buyer. Mixed no-Direct folds own into one Manage parent. |

---

## Platform consistency (required)

1. **Existing patterns?** Direct Place trio; I-handle parent + mill hop; own-catalog auto-confirm.  
2. **Duplicates?** No — collapses clones; does not add a fourth chat type.  
3. **Reuse?** `ensureTradeLaneGroup`, `pathForPair`, own-log confirm.  
4. **Naming?** Direct link · group · Order for buyer · Dispatch · Decline.  
5. **Units?** N/A.

**Philosophy conflict?** No. Direct Link trio is Place / trader mill hop. Mill logging own goods stays a phone-agreed log. `2026-10-28-for-buyer-direct-group` putting mill own SKUs on the trio is **superseded**.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | One trio; who-is-acting routing; heal stuck mill Direct logs |
| Business rules | OK | Same three shops any order; mixed Direct vs I-handle |
| Workflows | OK | Save / Place join trio; mill own log 1:1 |
| Edge cases | OK | Swapped mill/trader args; leftover left participant; race create |
| Permissions | N/A | Same parties |
| User states | OK | AL Dispatch; SS Decline; JE Shared on Place mill ticket only |
| Notifications | OK | Living card on the right thread |
| Error handling | N/A | |
| Scalability | OK | No N groups per N orders |
| Mobile interactions | OK | Existing docks; BM-07 unchanged |
| First glance (BM-11) | OK | One three-name row; mill Dispatch visible |
| Units | N/A | |
| Accessibility | OK | Existing Open chat / docks |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Mill own log on Direct Requested (deadlock)

| Field | Content |
|-------|---------|
| Gap | `createdBySeller` hides Confirm; Requested hides Dispatch. Buyer only Declines. |
| Why it matters | In-process ticket cannot move. |
| Impact if ignored | AL cannot ship; SS cannot accept. |
| Recommendation | Own catalog never Direct. Heal open mill-logged Direct Requested onto mill–buyer 1:1 Confirmed. |
| Priority | Required before implementation |

### G-002 — Clone trios by title order

| Field | Content |
|-------|---------|
| Gap | `ensureTradeLaneGroup(SS,AL,JE)` created a second group when JE-first already existed. |
| Why it matters | Same three shops look like three chats. |
| Impact if ignored | Orders scatter; traders cannot find the card. |
| Recommendation | Match company set; close clones; move OrderCards. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Same three companies = one group any name order; close clones; stamp `groupThreadId`; move living cards.  
- Mill own-catalog Order for buyer = mill–buyer 1:1 Confirmed (Dispatch / Decline). Remove mill-own Direct hop.  
- Trader mill goods + Direct Link = trio (mill Confirm).  
- Mixed + Direct: own 1:1 + mill trio. Mixed no Direct: one I-handle parent.  
- Heal mill-logged Direct Requested → mill–buyer 1:1 Confirmed.  
- Units + functional journey + trader-eye docks.

## Explicitly deferred / rejected

- Settled mill–buyer 1:1 (`#L5WN`).  
- Merging mill–JE I-handle 1:1 (`#6LDO`) into a trio.  
- Auto-merge of historical tickets already Confirmed on 1:1 besides mill-logged Direct Requested.

## Persona / dock / chat matrix (required tests)

| Path | Ticket | Chat | Mill dock | Buyer dock |
|------|--------|------|-----------|------------|
| Supplier own catalog for buyer (± Direct Link) | Confirmed, createdBySeller | mill–buyer 1:1 | Dispatch | Decline |
| Trader mill goods + Direct Link | Direct mill Requested | **the** trio | Confirm | Cancel / wait |
| Mixed own + mill, Direct Link | own 1:1 Confirmed + mill Direct | 1:1 + trio | Dispatch on own; Confirm on mill | Decline on own; mill ticket as Place |
| Mixed own + mill, no Direct Link | one Manage | buyer–actor 1:1; actor–mill 1:1 | Send on mill hop | one 1:1, both collections as actor |
| Place for himself + Direct Link | mill Direct Requested | **the** trio | Confirm | — |

Fail: second trio for same three shops; mill own log on trio; mill dock `none` on a mill log.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
