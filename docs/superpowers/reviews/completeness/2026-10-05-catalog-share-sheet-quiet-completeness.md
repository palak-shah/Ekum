# Feature Completeness Review — catalog Share sheet quiet (Publish-style groups)

**Date:** 2026-10-05  
**Module / ask:** Share sheet feels crowded; buyer-group **Add** rows are small. Quiet the sheet by matching Publish Selected group chips.  
**Anchors:** `docs/features/explore.md`, `docs/features/broadcast.md`, `docs/features/collections.md`, PublishAudienceFields  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Share job is pick who gets chat cards. Stacked group cards + shops + why-line compete; chips keep groups available without a second list language. |
| UX Designer | Reuse Publish Selected chips (`rounded-full` toggle). Hide zero-selected why-line. Shops stay ConnectionPicker. No Create group on Share. |
| Solution Architect | UI-only in `CatalogShareSheet`; recipient union logic unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — PublishAudienceFields buyer-group chips + ConnectionPicker.  
2. **Duplicates another feature?** No — same Share sheet, quieter chrome.  
3. **Should reuse an existing workflow?** Reuse Publish chip language; do not invent expand/collapse.  
4. **Naming matches the app?** Buyer groups · Share · Clear · Share a link.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Toggle groups → same recipient union |
| Business rules | OK | Unique shops unchanged |
| Workflows | OK | Share / link footer unchanged |
| Edge cases | OK | No groups → chips section hidden |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Existing InlineNotice |
| Scalability | OK | Chip wrap for many groups |
| Mobile interactions | OK | Sheet footer CTA; scroll body |
| First glance (BM-11) | OK | One job: pick recipients |
| Accessibility | OK | Chip buttons retain test ids |
| Platform consistency | OK | Match Publish |

---

## Approved scope for this slice

- Completeness Proceed.  
- CatalogShareSheet: Publish-style group chips; hide `0 selected · posts into chat` until count &gt; 0.  
- Docs (explore / broadcast) + unit + gap matrix + trader-eye.

## Explicitly deferred / rejected

- Create / Add group management on Share (stays Publish / Network).  
- Changing ConnectionPicker row chrome app-wide.  
- Expand/collapse “Buyer groups · N” row (Publish chips preferred).

## Disposition rationale

Reuse existing Publish Selected pattern — quieter Share without a new IA.
