# Feature Completeness Review — Quote Same for all: type into box + rate range

**Status:** Superseded 2026-09-20 — quote is a single rupee (`2026-09-20-quote-rate-single-completeness.md`)  
**Anchors:** `docs/features/orders.md`, catalog `rateInput`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders type `120` or `120-140`. The box must take keys as soon as it opens. Firm quote total uses the low. |
| UX Designer | Reuse catalog `rateFieldInputProps` (text, not number keypad). autoFocus. Wider field so `1200-1400` fits. Per-line Rate same so Apply range is not stripped. |
| Solution Architect | `parseRateInput` / `formatRateInput`. Submit `rate` = low. `rateMax` on order lines deferred. |

---

## Platform consistency

1. Same rate typing as catalog / collection Same for all.  
2. Not a second range widget.  
3. Reuse `rateFieldInputProps`.  
4. Placeholder `1200 or 1200-1400`.

**Philosophy conflict?** No.

---

## Checklist

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Focus + digits/`-`; Apply fills lines |
| Business rules | OK | Quote send uses low; 0/empty no Apply |
| Workflows | OK | Send quote + mill Send |
| Edge cases | OK | Invalid range no Apply |
| Mobile | OK | text inputMode so `-` exists |
| Platform consistency | OK | |

---

## Deferred

- Persist `rateMax` on quote lines / chat totals as a band.

## Sign-off

Required gaps closed or deferred: Yes  
Date: 2026-09-20  
