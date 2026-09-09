# Relist Ask (Slice B) — design delta

**Date:** 2026-09-08  
**Status:** Approved (plan)  
**Anchors:** [curate-album-as-is](./2026-09-04-curate-album-as-is-design.md), Completeness `2026-09-08-relist-ask-slice-b`  
**Implements:** Ask to put in my pack

## UX locks

| Moment | Behaviour |
|--------|-----------|
| After Ask | Non-blocking; row **Waiting for Allow**; other Selection actions OK |
| Allow | Chat primary (**You can put this in your pack**) + notif pattern |
| Selection | Unlock state only (no Allowed banner) |
| Deny | Silent to asker; Selection stays locked |

## Copy

- CTA: **Ask to put in my pack**
- Owner pending: **Wants to put … in their pack**
- Allowed: **You can put this in your pack**
- Never bare **Ask** / **Ask to see**
