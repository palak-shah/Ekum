# Feature Completeness Review — discard guard WIP

**Date:** 2026-08-24  
**Module / ask:** Leave confirm when half-done create/edit/send flows would lose work  
**Disposition:** Proceed

---

## Locked UX

- Title: **Leave the page?**
- Body: **Changes you have made will be discarded.**
- **Cancel** (default focus) · **Leave**
- Applies to route changes (bottom nav) and explicit back when WIP.
- Hard refresh / pull-to-refresh / tab close: browser “Leave site?” (`beforeunload`); overscroll refresh dampened while dirty.

---

## Disposition rationale

Prevents silent loss (photo order photos); shared kit + per-surface dirty rules.
