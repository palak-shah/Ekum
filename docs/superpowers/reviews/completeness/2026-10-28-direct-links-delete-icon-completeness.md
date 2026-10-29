# Feature Completeness Review — Direct Links red delete icon

**Date:** 2026-10-28  
**Module / ask:** Compact Direct Links list still uses trailing **Remove** text. Replace it with a red delete icon (same job, quieter scan).  
**Anchors:** `docs/features/settings.md`, Completeness `2026-10-28-direct-links-compact-list-completeness.md`, Owner pack Delete (`TrashIcon` + `text-danger`)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite the compact-list completeness file. Confirm sheet, grouped Supplier | Buyer rows, and ＋ locked On rows stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Remove is destructive and rare. An icon on the right is enough; keep the confirm sheet so a fat-finger does not drop a path. |
| UX Designer | Match owner-pack Delete: `TrashIcon` + `text-danger`, 40×40 tap. `aria-label` **Remove Direct link**. No new chrome. Confirm title stays **Remove Direct link?** |
| Solution Architect | UI only. Same `DELETE /trade-lanes/:id`. |

---

## Platform consistency (required)

1. **Existing patterns?** Owner pack Delete icon; Connections used trailing text — user asked to switch this list to the delete icon.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Confirm sheet unchanged.  
4. **Naming matches the app?** Accessible name still Remove Direct link.  
5. **Units?** N/A.

**Philosophy conflict?** No. Compact list stays; only the trailing control changes.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Icon opens the same confirm |
| Business rules | OK | Next-orders-only revoke unchanged |
| Workflows | OK | Cancel / Continue stay |
| Edge cases | OK | Many rows; names wrap |
| Permissions | N/A | |
| User states | OK | Empty list has no icon |
| Notifications | N/A | |
| Error handling | N/A | Toast on remove unchanged |
| Scalability | OK | Icon is narrower than Remove text |
| Mobile interactions | OK | 40×40; last row above nav (BM-07) |
| First glance (BM-11) | OK | Pair + red trash is the job |
| Units | N/A | |
| Accessibility | OK | Named button, not icon-only without label |
| Platform consistency | OK | Same TrashIcon as owner pack Delete |

---

## Gaps

### G-001 — Trailing Remove text

| Field | Content |
|-------|---------|
| Gap | Compact rows still say **Remove**. With many links the word repeats louder than the pair. |
| Why it matters | Traders scan Supplier × Buyer; delete is occasional. |
| Impact if ignored | List stays wordy; thumb target fights the names. |
| Recommendation | Red `TrashIcon`, confirm sheet unchanged. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + settings / gap-matrix lock.  
- List trailing control = red delete icon (`path-remove-{id}`, aria-label Remove Direct link).  
- Units + trader-eye phone list.

## Explicitly deferred / rejected

- Changing the confirm sheet copy or making delete one-tap.  
- Per-row locked On rows (already on ＋ only).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
