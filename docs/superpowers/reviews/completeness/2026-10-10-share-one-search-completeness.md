# Feature Completeness Review — Share one search + Find on Ekum button

**Date:** 2026-10-10  
**Module / ask:** Universal Share recipient picker: one search filters connections; quiet **Find on Ekum** link after 2+ characters (or immediately if empty network) — same as New chat — not a second empty Find field and not auto platform results while typing.  
**Anchors:** `docs/features/explore.md`, `docs/features/chat.md`, `docs/features/access-and-connections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Share is WhatsApp-style forward: known network first. Find on Ekum is a secondary door (cold start / not in list), not Instagram whole-graph search in the typeahead. |
| UX Designer | Reuse New chat `findOnEkum="link"` + `externalQuery`. One keyboard session; tap Find uses the same text (no retype when query ≥ 2). Find in Explore stays quiet when empty. |
| Solution Architect | Flip Share ConnectionPicker to link mode only. No FindOnEkumBlock auto-searchReady. Order/Publish field pickers unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — New chat / ConnectionPicker `link` mode.  
2. **Duplicates another feature?** No — same Find path, Share entry only.  
3. **Should reuse an existing workflow?** Yes — `findOnEkum="link"`.  
4. **Naming matches the app?** Yes — Find on Ekum / Find in Explore.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | One search + Find button + externalQuery |
| Business rules | OK | Add into share recipients via existing callbacks |
| Workflows | OK | Matches New chat ladder |
| Edge cases | OK | Empty network → Find link immediately; Explore secondary |
| Permissions | N/A | |
| User states | OK | With / without connections |
| Notifications | N/A | |
| Error handling | OK | Find miss copy unchanged |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet scroll; BM-07 unchanged |
| First glance (BM-11) | OK | No second idle Find box; Find quieter than connection list |
| Accessibility | OK | Existing link / field labels |
| Platform consistency | OK | WhatsApp share first |

---

## Gaps

None Required for this slice.

---

## Approved scope for this slice

- `UniversalShareSheet` → `findOnEkum="link"`.
- Docs: Share uses New chat Find-as-link pattern.
- Unit updates for empty network + type 2+ → Find link → results without second Find input when query ≥ 2.

## Explicitly deferred / rejected

- Auto-showing Find hits while typing.
- Scroll-into-view on Find reveal.
- Migrating Order / Publish pickers off field mode.
- Merging Explore browse into the search field.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
