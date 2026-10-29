# Feature Completeness Review — Direct Link: one group, orders join it

**Date:** 2026-10-28  
**Module / ask:** Direct Link already promises one mill–buyer–trader group. Place / Order for buyer was opening a new group (or 1:1) instead of putting the order in the group that already exists for those three shops.  
**Anchors:** `docs/features/00-concepts.md`, `docs/superpowers/specs/2026-09-02-tradelane-design.md`, Completeness `2026-10-28-direct-links-network-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite prior Direct Link / Order-for-buyer-pack completeness files.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One Direct Link = one group. Save may form it (locked “share a group”). Every later mill ticket for that trio goes in **that** chat. Never a second trio for the same three shops. |
| UX Designer | Chats stays one thread titled with the three shops. Open chat on the ticket is that group. No extra unnamed groups piling up. |
| Solution Architect | `ensureTradeLaneGroup` already intends reuse (`groupThreadId` + exact company set). Stamp the group on Direct Link **create**. Place looks up the mill lane for this buyer in either mill/trader orientation so the card lands on the stored thread. Match active participants (`leftAt` null) so a leftover leave-row cannot force a clone. |

---

## Platform consistency (required)

1. **Existing patterns?** TradeLane `groupThreadId`; Direct Place trio; SAME_CHAT on manual groups.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — `ensureTradeLaneGroup`, not a new chat type.  
4. **Naming matches the app?** Direct link · group.  
5. **Units?** N/A.

**Philosophy conflict?** No. Spec already says one group per mill×buyer; create once, reuse.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | One group; orders attach |
| Business rules | OK | Remove link still closes that group only |
| Workflows | OK | Save → group ready; Place / Order for buyer join it |
| Edge cases | OK | Either shop created the link (trader/mill swapped); leftover left participant |
| Permissions | N/A | Same trio |
| User states | OK | Empty Chats vs one trio |
| Notifications | OK | Living card on that thread |
| Error handling | N/A | |
| Scalability | OK | No N groups per N orders |
| Mobile interactions | N/A | |
| First glance (BM-11) | OK | One chat, not a stack of trios |
| Units | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — New group per order / order not in existing trio

| Field | Content |
|-------|---------|
| Gap | Direct Link Save does not stamp `groupThreadId`. Place looks up only trader=actor × mill=pack. The other orientation’s group is ignored, so a new trio is created or the card stays 1:1. |
| Why it matters | Traders already have the three-shop chat. A second group per order is noise. |
| Impact if ignored | “Group is not formed” / inbox fills with clone trios. |
| Recommendation | Create-or-reuse on Save. Attach every Direct mill ticket to that thread. Find the mill lane by buyer + {trader, mill} either way. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + spec lock.  
- Direct Link create: `ensureTradeLaneGroup`, persist `groupThreadId`.  
- Direct Place / Order for buyer: reuse that thread (trio mill lane either orientation).  
- Exact-company match uses shops still in the group (`leftAt` null).  
- Units.

## Explicitly deferred / rejected

- Auto-creating a group when three shops chat without a Direct Link.  
- Merging unrelated 4+ shop groups.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
