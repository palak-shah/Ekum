# Feature Completeness Review — You Share icon

**Date:** 2026-09-29  
**Module / ask:** You card Share pill vs header Share icon (same as shop)  
**Anchors:** `docs/features/company.md` (shop header Share icon)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Edit is the card job. Share is occasional chrome — same as a shop. Two pills fight. |
| UX Designer | Share icon on the **You** title row, before ⋯. Card keeps **Edit** only. Verified stays. Matches shop Find + Share icons. |
| Solution Architect | `YouHeaderShare` in AppShell; drop share from `MorePage`. Same `CompanyShareSheet`. |

---

## Platform consistency

1. **Existing patterns?** Shop header Share icon.  
2. **Duplicates?** Pill + icon would. One icon.  
3. **Reuse?** CompanyShareSheet.  
4. **Naming?** aria-label Share.

**Philosophy conflict?** No.

---

## Approved scope

- You header: Share icon · ⋯  
- You card: Edit only.

## Sign-off

Required gaps closed: Yes  
Ready: Yes
