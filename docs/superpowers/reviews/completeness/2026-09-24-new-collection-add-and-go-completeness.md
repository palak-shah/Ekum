# Feature Completeness Review — New collection add-and-go

**Date:** 2026-09-24  
**Module / ask:** New collection feels like a long form; sellers want add designs and go  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. Always-visible Description · Tags · three expandables fights “decisions at the moment they matter” and “one job per screen.” Redesign create; keep edit as the place for details.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Create job is **put designs in a pack and leave**. Who / rates / units already live in Settings. Description and tags are optional identity — not needed to save a draft. Publish is the moment for Who. |
| UX Designer | Empty: one big **Designs** invite. After shots: grid + quiet **Add designs**. One name field (`Name this pack`). No Description / Tags / Same for all / Set units / Who on create. Dock: **Save in Draft** (go) · **Create & Publish** opens the existing Who sheet. Chevron expandables stay on **edit**. |
| Solution Architect | Same create API and Settings defaults. Create no longer expands Who inline. `sameForAll` still applies to new photos from Settings even when the UI is hidden. |

---

## Platform consistency (required)

1. **Existing patterns?** Add designs batch is photos-first; Publish sheet already exists for Who. Kit `SearchInput` / docks.  
2. **Duplicates another feature?** No — removes a second Who surface on create.  
3. **Should reuse an existing workflow?** Yes — Settings defaults + Create & Publish sheet.  
4. **Naming matches the app?** **Name this pack**. Add designs. Save in Draft. Create & Publish.

**Philosophy conflict?** Yes vs 2026-09-24 “always-visible Description · Tags · three expandables” → this review **Redesigns** that create chrome. Edit keeps the longer form.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Draft + publish still work |
| Business rules | OK | Unique name; ≥1 design; Settings Who/rates |
| Workflows | OK | Photos → name → draft or Publish sheet |
| Edge cases | OK | First-sell consent on Publish sheet |
| Permissions | OK | Existing |
| User states | OK | Create vs edit |
| Notifications | N/A | |
| Error handling | OK | Name clash on field; publish errors in sheet |
| Scalability | N/A | |
| Mobile interactions | OK | Hide nav + one-row dock; shorter page (BM-07) |
| Accessibility | OK | `aria-label="Name"`; sheet labelled |
| Platform consistency | OK | After Redesign |

---

## Gaps

### G-001 — Description / tags on create

| Field | Content |
|-------|---------|
| Gap | Sellers cannot set description/tags until they open **Edit**. |
| Why it matters | Rare pack copy. |
| Impact if ignored | They add it after save — acceptable. |
| Recommendation | Edit only this slice. No Details row on create (clutter). |
| Priority | Future improvement |

---

## Approved scope for this slice

- **Create only:** Designs hero (empty) or grid + compact Add; **Name this pack**; dock. No Description, Tags, Same for all, Set units, Who rows.  
- **Create & Publish** opens the existing publish / Who sheet (Settings prefilled). **Save in Draft** does not.  
- **Edit** unchanged (name, description, tags, Same for all).  
- Docs + journeys: publish click goes through the sheet; create chrome does not assert expandables.

## Explicitly deferred / rejected

- Auto-name without a field (unique-name clashes).  
- Details expandable on create (G-001).  
- Changing edit chrome.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
