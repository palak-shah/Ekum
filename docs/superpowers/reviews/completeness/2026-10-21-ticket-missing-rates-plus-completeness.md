# Feature Completeness Review — Missing rates as + under ₹

**Date:** 2026-10-21  
**Module / ask:** Ticket Total **Missing rates** should sit under the billed ₹ like extra leftover (`₹69,500` then `+Missing rates`), not a left-aligned line.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-ticket-total-missing-rates-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | ₹ is what we can bill. `+Missing rates` is the extra that is not in that ₹ — same language as +N leftover. |
| UX Designer | Right-align under All (or the family ₹). Tangerine `+` prefix. Toggle unchanged. |
| Solution Architect | Same cue string and highlight. Prefix at render only. |

---

## Platform consistency (required)

1. **Existing patterns?** Signed extra (`+N`) on Dispatch / Settle remainder.  
2. **Duplicates?** No.  
3. **Reuse?** Same toggle + ring.  
4. **Naming?** Still Missing rates / No pcs in a set, with `+`.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Toggle still lights uncounted rows |
| Business rules | OK | |
| Workflows | N/A | |
| Edge cases | OK | Combined cue still one `+` line |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Tap target stays the cue |
| First glance (BM-11) | OK | ₹ first; +cue quieter under it |
| Accessibility | OK | aria-pressed on the cue |
| Platform consistency | OK | +extra language |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Render `+{missingCue}` right-aligned under the last billed ₹ (All when mixed).  
- Do not use `text-ink` with tangerine (cx is not twMerge).  
- Docs + units. Toggle behaviour unchanged.

## Explicitly deferred / rejected

- Naming each uncounted design.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
