# Feature Completeness Review — Mutual connection

**Date:** 2026-09-12  
**Module / ask:** One Approve → one mutual Connected pair; either side Pause/Block; drop dual “buy from” rows.  
**Anchors:** `docs/superpowers/specs/2026-09-12-mutual-connection-design.md`, `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Dual rows confuse traders. One Connected pair after Approve matches “we’re connected.” Mutual published/Connections visibility is the right trade trust. |
| UX Designer | One Network card: Connected + Pause/Block both sides. Drop They buy / You buy. No sticky chrome issues. |
| Solution Architect | Directed owner/viewer edges must become one unordered pair + migrate seed dual edges. All `connected?` / audience helpers must treat membership as mutual. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Request → Approve; Network → Connections; silent Pause/Block; Follow separate.  
2. **Duplicates another feature?** No — simplifies Connection.  
3. **Should reuse an existing workflow?** Yes — same Requests / Approve path.  
4. **Naming matches the app?** Connected (not Seller/Buyer labels on the card).

**Philosophy conflict?** No — intentional redesign of Connection from directional to mutual (locked in design). Silent block/pause and Selected audience unchanged.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Spec locks mutual + either-side controls |
| Business rules | OK | Block > Pause > Active merge; Approve ≠ unblock |
| Workflows | OK | Request → Approve → one row |
| Edge cases | OK | Already connected; dual-edge migrate; pending request |
| Permissions | OK | Either Pause/Block; only actor Resume/Unblock |
| User states | OK | Active / paused / blocked list masking |
| Notifications | N/A | Pause/Block stay silent |
| Error handling | OK | Already connected; blocked before approve |
| Scalability | OK | One row per pair |
| Mobile interactions | OK | List only; BM-07 N/A |
| Accessibility | OK | Same kit cards |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Audience helper sweep

| Field | Content |
|-------|---------|
| Gap | Many Prisma filters use `connectionsAsOwner` / directed viewer. |
| Why it matters | Mutual visibility fails if any path still requires seller-as-owner. |
| Impact if ignored | One-way catalog after Approve — product lie. |
| Recommendation | Shared `isConnected(a,b)` / OR both directions in migrate window; then pair model. |
| Priority | Required before implementation |

### G-002 — ConnectionView `role` removal

| Field | Content |
|-------|---------|
| Gap | Web uses `role === 'owner'` for Pause and labels. |
| Why it matters | Both sides need actions; labels must die. |
| Recommendation | Drop role; expose canPause/canResume/canBlock/canUnblock (actor-scoped). |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Schema: one mutual pair; migrate dual directed rows  
- Approve creates/upserts mutual active pair  
- List: one card; Connected; either-side Pause/Block  
- Audience / discovery / company gates: mutual connected  
- Seed: one Ravi↔Meena connection  
- Docs: concepts + access-and-connections  
- Tests: unit + functional Connections list one row; mutual visibility  

## Explicitly deferred / rejected

- Follow = chat only  
- Auto-connect from order/message  
- Changing Ask-to-see / relist Ask  
- Showing buy/sell direction on connection cards  

## Sign-off

Required gaps closed or deferred in writing: Yes (G-001/G-002 in plan)  
Ready for implementation / `@functional` journeys: Yes — after plan  
