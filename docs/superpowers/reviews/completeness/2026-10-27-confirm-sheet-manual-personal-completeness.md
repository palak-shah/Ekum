# Feature Completeness Review — Confirm sheet Manual order no. and Personal note

**Date:** 2026-10-27  
**Module / ask:** Supplier Confirm / decline lines: add Manual order no. (textbox + photo +) and private Personal note at lock time; keep shared action note, relabeled Note to buyer.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Book number and private scratch are already on ⋯, but suppliers write them when they lock. Confirm is that moment. Same records, earlier entry — ⋯ stays the later edit home. Shared confirm note is still the message to the other party. |
| UX Designer | One job stays tick + qty/rate + Confirm. Manual is one compact textbox + quiet photo +. Personal starts collapsed (Add personal note). Shared note relabeled **Note to buyer** so it is not confused with Personal. No extra note textarea on Manual. Sticky footer unchanged (BM-07). |
| Solution Architect | Extend `decideOrderLines` with prefixed optional fields (`manualOrderNo`, `manualNoteImageUrls`, `personalNote*`). Persist only when the payload includes a confirm. Reuse `updateManualRef` / `updatePersonalNote` (omit `manualOrderNote`). Visibility unchanged: manual shared; personal caller-company only. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `TextInput` + `NoteAttachField` + tray; Confirm sheet; ⋯ Manual / Personal unchanged.  
2. **Duplicates another feature?** No — same Manual / Personal records, not a second store. Shared **Note to buyer** remains the trail/chat note.  
3. **Should reuse an existing workflow?** Yes — `PUT /manual-ref` and `PUT /personal-note` internals from Confirm.  
4. **Naming matches the app?** Manual order no.; Personal note; Note to buyer (supplier sheet — the other party is the buyer).  
5. **Units?** N/A — no ₹ / qty string change.

**Philosophy conflict?** No. “Decisions at the moment they matter” — Confirm is when they write the book number. ⋯ is not removed.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Confirm persists number + photos + personal; Decline all omits them |
| Business rules | OK | Personal never cross-company; manual visible to both; ⋯ note text not overwritten |
| Workflows | OK | Seed from existing ⋯ values; ⋯ still edits after lock |
| Edge cases | OK | Blank Confirm drafts: seeded state (empty omit/clear only what they cleared); photos cap 9 |
| Permissions | OK | Seller-only decideLines already |
| User states | OK | Mill seller uses the same sheet (seller hop) |
| Notifications | N/A | No new push (deferred on 2026-10-07) |
| Error handling | OK | In-sheet InlineNotice on decide failure; drafts stay |
| Scalability | OK | Same columns / one company note row |
| Mobile interactions | OK | Fields in sheet scroll above sticky Decline · Confirm (BM-07) |
| First glance (BM-11) | OK | Lines + Confirm loudest; Manual compact; Personal collapsed |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Labels; + aria Add photo on Manual |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Three optional blocks vs one job

| Field | Content |
|-------|---------|
| Gap | Confirm already has a shared note. Adding Manual + Personal can look like three composers. |
| Why it matters | BM-11 / one job per screen |
| Impact if ignored | Sheet feels like a CMS form at lock |
| Recommendation | Manual = one textbox + +; Personal `collapseEmpty`; relabel shared **Note to buyer**; no Manual note textarea |
| Priority | Required before implementation |

### G-002 — Confirm must not wipe ⋯ Manual note

| Field | Content |
|-------|---------|
| Gap | Compact Confirm has no Manual note field. Sending `note: null` would clear a ⋯ note. |
| Why it matters | Traders add a book note in ⋯ then Confirm |
| Impact if ignored | Silent data loss |
| Recommendation | decideLines omits `manualOrderNote`; only number + images |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Confirm / decline lines (seller): Manual order no. textbox + photo + (no voice, no extra note); Personal note collapsed; shared note labeled **Note to buyer**
- Persist Manual number/images + Personal on **Confirm** only (not Decline all)
- Seed from existing `manualRef` / `personalNote`; ⋯ sheets unchanged
- Docs + API/web units + `@functional @orders` journey; trader-eye on phone-width sheet

## Explicitly deferred / rejected

- Voice on Manual order no. (still deferred from 2026-10-07)
- Manual note textarea on Confirm (⋯ only)
- Notifications for manual/personal
- Putting these fields on Decline all

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
