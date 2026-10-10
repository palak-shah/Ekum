# Feature Completeness Review — Collection name label, placeholders, rate mode

**Date:** 2026-10-09  
**Module / ask:** New collection (and shared identity fields): italic light placeholders; **Collection name** label; remove empty-rate **On request** caption; replace **Add range** text link with an explicit **Single rate / Range** toggle for the whole collection.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Name needs a peer label like Rate / Description. Empty rate still means no number stamped; surfacing **On request** next to the field fights “set a pack rate.” Mode should be an intentional Single vs Range choice, not a quiet link. |
| UX Designer | Kit `Field` + capsule **One rate / A range** radiogroup (client switch). Placeholders italic + lighter gray so typed values stay loud. |
| Solution Architect | Reuse `RateRangeFields` (create + member sheet). Caption helper returns empty when no rate; Publish Who **rate visibility** On request unchanged. Kit placeholder chrome so all page fields match. |

---

## Platform consistency (required)

1. **Existing patterns?** `Field` labels; kit TextInput/TextArea placeholders. Rate mode uses a capsule radiogroup (client-approved diverge from Chip rail).  
2. **Duplicates another feature?** No — clarifies existing From/To.  
3. **Should reuse an existing workflow?** Same `RateRangeFields` + `parseRateParts`.  
4. **Naming matches the app?** **Collection name** · **One rate** · **A range** · **Rate per pc** (dispatch unit label unchanged).

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Label; mode chips; hide On request caption; italic placeholders |
| Business rules | OK | Blank rate still allowed (no stamp / no ₹); Who rateVisibility separate |
| Workflows | OK | Create + edit identity; member sheet shares rate control |
| Edge cases | OK | Switch Range → Single clears high end; open with existing `to` starts on Range |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | OK | Keep inverted-range caption |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome |
| First glance (BM-11) | OK | Mode chips quiet under Rate; name label matches Rate |
| Accessibility | OK | Chips + labelled fields; aria on rate inputs |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Kit / TextInput chrome: placeholders `italic` + lighter muted.
- Collection identity: `Field` **Collection name** (placeholder kept).
- `RateRangeFields`: capsule switch **One rate** | **A range**; remove **Add range** text links; do not show **On request** caption when empty.
- Docs `collections.md` + unit/e2e assertions.

## Explicitly deferred / rejected

- Changing Publish Who **Rates on / On request** visibility control.
- Requiring a rate on create.
- Native OS switch control (use capsule radiogroup instead).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
