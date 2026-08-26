# Feature Completeness Review — chat attach search + multi-share

**Date:** 2026-08-24  
**Module / ask:** Chat + attach pickers (design / collection / order): hide scrollbar, icon-only back, search, multi-select + Send (n)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Extends existing attach sheet; same card types; ConnectionPicker selection language.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders share several designs in one go; search needed for long catalogues. |
| UX Designer | Accent-border toggle rows + sticky Send (n); icon-only back; no visible scrollbar. |
| Solution Architect | Client sequential sends; no new API. |

---

## Platform consistency

1. **Existing patterns?** Yes — Sheet, TextInput, Button, accent selection rows.  
2. **Duplicates?** No.  
3. **Reuse workflow?** Same attach menu → picker steps.  
4. **Naming?** Share a design / collection / order; Send (n).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Search + multi + Select all/Clear + sequential cards |
| Mobile / chrome | OK | List clears sticky Send (BM-07) |
| Permissions | OK | Existing chat compose |
| Error handling | OK | Keep failed ids; show notice |

---

## Disposition rationale

Proceed: small UX expansion of shipped attach; locked send model (separate cards).
