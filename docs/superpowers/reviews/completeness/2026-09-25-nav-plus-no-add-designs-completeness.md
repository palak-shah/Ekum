# Feature Completeness Review — Nav ＋ drops Add designs

**Date:** 2026-09-25  
**Module / ask:** Remove **Add designs** from bottom-nav **＋**. Add stays on You → My designs / collections.  
**Anchors:** `docs/features/catalog.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two add-design doors (＋ and You). Keep the library door; ＋ stays create-pack / Orders / why-line. |
| UX Designer | One job: add designs from the library. ＋ is not a second catalog home. |
| Solution Architect | Delete the `/catalog/products/new` button on `AppShell` New sheet only. Route and You **＋** unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** You library **＋** / Add.  
2. **Duplicates another feature?** Yes — that is why we cut nav ＋.  
3. **Should reuse an existing workflow?** You → My designs / collections Add.  
4. **Naming matches the app?** New collection stays on nav ＋.

**Philosophy conflict?** No — fewer paths.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Add designs still `/catalog/products/new` from You |
| Business rules | OK | Upload cap still gates You Add |
| Workflows | OK | New collection still from nav ＋ |
| Edge cases | OK | Buy-only / explain unchanged |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet still one row or why-line |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None required.

## Approved scope for this slice

- Nav **＋** New sheet: no **Add designs**.
- Keep **New collection**, Orders (buy-only), why-line.
- Lock catalog / chrome docs.

## Explicitly deferred / rejected

- Removing Home **Add designs**.
- Removing You Add.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
