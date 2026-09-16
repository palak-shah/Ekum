# Feature Completeness Review — Find on Ekum no Request access when already chatting

**Date:** 2026-09-16  
**Module / ask:** Find on Ekum still offers **Request access** for a shop the user already has an active chat with (e.g. Surat ↔ Yash).  
**Anchors:** `docs/features/chat.md`, `docs/features/access-and-connections.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Chat already exists — Request access feels like asking again. Message / Add is enough from Find. Connect remains on company profile if they still need Connections-audience later. |
| UX Designer | Find row: Connected → Select/Add; pending request → Requested; **active chat** → Message only (no Request access); stranger → Request access + Message. |
| Solution Architect | Client: load active threads counterparts alongside connections; same FindOnEkumBlock. |

---

## Platform consistency

1. **Existing patterns?** Yes — Find on Ekum + ConnectionPicker.  
2. **Duplicates?** No.  
3. **Reuse?** Active threads list.  
4. **Naming?** Message / Request access / Select.

**Philosophy conflict?** No — fewer taps; chat already open.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap → OK | Hide Request access when active direct chat |
| Business rules | OK | Connection still separate; Open chat may already Connect |
| Workflows | OK | |
| Edge cases | OK | Pending outgoing still Requested |
| Permissions | N/A | |
| Notifications | N/A | |
| Mobile | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Request access while already chatting

| Field | Content |
|-------|---------|
| Gap | Find only checks Connection, not active chat |
| Why it matters | Feels like a second ask |
| Recommendation | Message only when counterpart has active thread |
| Priority | Required |

---

## Approved scope

- FindOnEkumBlock: fetch active threads; if counterpart in active chat and not Connected → Message only (no Request access).  
- Field mode also `excludeCompanyIds` for Connected (match link mode / docs).  
- Unit + chat.md edge case.  

## Deferred

- Auto-Connection from every trade thread  

## Sign-off

Proceed.
