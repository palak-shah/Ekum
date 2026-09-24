# Feature Completeness Review — Curate pack name clash + not visible

**Date:** 2026-09-24  
**Module / ask:** Curate from Your selection: name already used, designs the shop cannot curate, no empty leftover draft. Supplier pack name vs our name.  
**Anchors:** `docs/features/saved.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Name clash is *our* pack, not the supplier’s. Same title as Rishabh’s album is allowed. Not-visible is ceiling, not a crash. |
| UX Designer | In-sheet **You already have this pack.** + **Add to it**. Gray rows **Can't see this now** before Save. No toast dump. |
| Solution Architect | Names unique per `companyId` only. `POST /collections/curate-check` matches setProducts ceiling. Create-then-put: delete the draft if members fail. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet `InlineNotice` + selection gray + **Can't put in a pack**.  
2. **Duplicates?** No — tighter errors on the existing Curate sheet.  
3. **Should reuse?** `curateExistingTargets` + `assertProductsCuratable`.  
4. **Naming?** **Add to it** · **Can't see this now**.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Clash → add; blocked rows gray; no empty draft |
| Business rules | OK | Own-shop name only; supplier names never clash |
| Workflows | OK | Stay in Curate sheet |
| Edge cases | OK | All blocked → stay on selection; check fail → still save (orphan deleted) |
| Permissions | OK | Check uses same uploads gate as set products |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | In-sheet notice, not toast |
| Scalability | OK | One check POST for the pile |
| Mobile interactions | OK | Sheet notice; no extra bottom chrome |
| Accessibility | OK | `role="alert"` InlineNotice |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Own-name clash: in-sheet + **Add to it** (no create).
- Supplier / other-shop names: no clash (document only).
- `POST /collections/curate-check`; gray **Can't see this now**; leave those ids out of Save.
- If create succeeds and members fail, delete that draft.

## Explicitly deferred / rejected

- Warn when a *supplier* album has the same title.
- Auto-rename (`Test 12 sep 2`).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
