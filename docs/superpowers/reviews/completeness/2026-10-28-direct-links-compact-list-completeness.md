# Feature Completeness Review — Direct Links compact list

**Date:** 2026-10-28  
**Module / ask:** Direct Links list will have many rows. Current per-link cards (names + three locked On rows + Remove) waste real estate. Show a compact table: Supplier | Buyer | Remove on the right.  
**Anchors:** `docs/features/settings.md`, `docs/superpowers/reviews/completeness/2026-10-28-direct-link-auto-repost-row-completeness.md`, Network grouped list (`NetworkPage`)  
**Disposition:** Redesign of list chrome, then **Proceed** for this slice

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite prior Direct Links / auto-repost completeness files. Create-sheet locked On rows, future-only hop, Supplier copy, and Remove confirm stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The list job is scan pairs and remove one. Locked outcomes are the same for every link — they belong on **＋**, not repeated on 50 cards. |
| UX Designer | Match **Network** grouped rows (one rounded surface, dividers), not an HTML `<table>` and not fat `Card`s. Quiet header: Supplier · Buyer. Names truncate. **Remove** trailing on each row (confirm sheet unchanged). |
| Solution Architect | UI only. Same TradeLane list/remove API. |

---

## Platform consistency (required)

1. **Existing patterns?** Network grouped list + Connections trailing text action. Yes.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Remove still opens the confirm sheet.  
4. **Naming matches the app?** Supplier · Buyer · Remove.  
5. **Units?** N/A.

**Philosophy conflict?** Repeating locked On rows on every card fights real-estate and one-job-per-screen. **Redesign** the list; keep the locks on create. Not a native HTML table (would be a one-off vs Network rows).

---

## Locked layout

**List:** one `rounded-2xl border` stack. Header row (muted): Supplier | Buyer. Each data row: seller name | buyer name | **Remove**. No avatars, no On rows, no second title.

**＋ sheet:** unchanged — pickers + three locked On rows.

**Empty / search:** unchanged.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Scan + remove |
| Business rules | OK | Locks still on create |
| Workflows | OK | Confirm Remove stays |
| Edge cases | OK | Long shop names truncate |
| Permissions | N/A | |
| User states | OK | Empty vs many rows |
| Notifications | N/A | |
| Error handling | N/A | Toast on remove unchanged |
| Scalability | OK | One row per link |
| Mobile interactions | OK | Trailing Remove; last row above nav (BM-07) |
| First glance (BM-11) | OK | Pair + Remove is the job |
| Units | N/A | |
| Accessibility | OK | Remove still a named button; `path-remove-{id}` |
| Platform consistency | OK | Network list, not `<table>` |

---

## Gaps

### G-001 — Fat cards do not scale

| Field | Content |
|-------|---------|
| Gap | Each Direct Link repeats three locked On rows. Many links = a long, unreadable stack. |
| Why it matters | Traders keep lots of supplier×buyer paths. |
| Impact if ignored | They cannot scan or find Remove. |
| Recommendation | Compact two-column list; locks only on ＋. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + settings / gap-matrix lock.  
- Grouped list: Supplier | Buyer | Remove.  
- Units + trader-eye phone list (with at least one row if possible).

## Explicitly deferred / rejected

- HTML `<table>` / spreadsheet chrome.  
- Editing a link from the row.  
- Avatars on Direct Link rows.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
