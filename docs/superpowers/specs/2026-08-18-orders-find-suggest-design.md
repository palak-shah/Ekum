# Orders find suggest — design

**Date:** 2026-08-18  
**Status:** Implemented (unified Orders feed + status/kind facets)  
**Surface:** Orders list (`/orders`) — orders, samples, and returns

## Problem

Traders need to find orders by company, design/SKU, or date. Permanent sort + dual date pickers were removed as clutter. Find must stay WhatsApp-dense: one field, suggestions that appear only while focused.

## Goals

- One compact search row; idle chrome = that row only (plus existing status / Buy·Sell chips).
- Suggest matches **counterpart**, **line name / SKU**, short **order id**, **dates** (relatives + typed parse), **kind** (Sample / Return / Order), and **lifecycle status**.
- Status chips (Needs you / In progress / Completed) and Buy/Sell apply when Find is **empty**. Any active Find (typed query, kind/status/date facet) **overrides** attention chips so matches are not hidden (e.g. searching `return` shows raised and completed returns).
- Hybrid: instant client filter on the loaded page; server when the query is “real” or a date range is active (`q` + `createdFrom`/`createdTo` on orders; samples/returns client-only).

## Non-goals (v1)

- My Catalog / Explore suggest for this work.
- Server-side Needs you / In progress facets (those stay client attention matchers).
- Persisting `quotedAt` or changing order timeline.
- Restoring UI sort / permanent date pickers.

## UX

### Placement

- Full-width search input above the status chip rail.
- Placeholder e.g. `Search name or status`.
- **No floating suggestion panel.** The list is the result (WhatsApp pattern). On focus with empty query, show quiet inline text shortcuts (Requested · Dispatched · Sample · Today)—not a card with section headers.
- Typing filters the list live (company, design, status words, dates).

### Suggestions

| Trigger | Suggestions |
|---------|-------------|
| Focus, empty query | Relatives: **Today**, **This week**, **Last month** |
| Typing text | Counterpart names, line names/SKUs, order id prefixes from the **currently loaded** order set (deduped, capped ~8) |
| Typing that looks like a date | Parsed day or month range (e.g. `18/08`, `Aug`, `2026-08-18`) plus matching relatives |

Picking a suggestion:

- Text match → set find needle (and optional “active filter” chip: company / design label).
- Relative or parsed date → set `createdFrom` / `createdTo` (local calendar day bounds) and show a small active chip (`This week`, `18 Aug`, …) with clear.

Typing without picking also filters live (same hybrid rule). Active filters under the field only when needle and/or date range is applied. Clear removes all find state; status chips unchanged.

### Composition with existing chips

Pipeline order:

1. Fetch orders (with optional server `q` + date range).
2. Client: Buy/Sell direction.
3. Client: Needs you / In progress / Done (`matchesNeeds` / `matchesProgress` / `matchesCompleted`).
4. Client: if still in “local-only” mode, also filter by needle / date on the page.

Empty state: short “No orders match” when chips + find yield nothing (keep chip rail visible).

## Hybrid fetch rule

Let `needle` = trimmed query text (excluding pure relative picks that only set dates).  
Let `hasDateRange` = active from/to from a relative or parsed date.

| Condition | Behavior |
|-----------|----------|
| `needle.length < 2` and not `hasDateRange` | Keep current fetch: `GET /orders?limit=50` (newest). Suggest + filter purely client-side on `results`. |
| `needle.length >= 2` **or** `hasDateRange` | Server: `GET /orders?limit=50` with `createdFrom` / `createdTo` when set, and `q` when `needle.length >= 2`. |

Debounce server refetch ~250ms while typing. Cancel in-flight on newer query.

Date bounds use the viewer’s local calendar (start/end of day → ISO for API). Relatives:

- **Today** — local midnight → end of today  
- **This week** — start of local week (Monday) → end of today  
- **Last month** — first day of previous calendar month → last day of that month  

## API

Existing list query already supports `createdFrom` / `createdTo` (and sort). Add optional:

```ts
q: z.string().trim().min(1).max(80).optional()
```

Server `q` matches (case-insensitive contains) any of:

- Counterpart company **name** (buyer or seller depending on actor side — both company names on the order are fine)
- Order item **name** or **sku**
- Order **id** (contains / prefix)

Combine with existing party + optional status + createdAt range filters via `AND`. Keep newest-first default. No new indexes required for v1 (seed/local scale); revisit if lists grow large.

## Web structure

- Pure helpers (unit-tested): parse relative labels → range; parse typed date tokens → range or null; match order against needle; build suggestion list from orders + relatives + date parses.
- `OrdersPage`: one controlled find field + dropdown; wire hybrid query key (`q`, `createdFrom`, `createdTo`); keep status/direction deferred filtering as today.
- Reuse kit `TextInput` / list patterns; do not force city/category `SuggestInput` (wrong kind). A small Orders-local suggest panel is fine.

## Testing

- Helper tests: relatives → ranges; typed dates; needle match on counterpart / SKU / id; no false date when typing a company name.
- API: list with `q` returns matching orders; with `q` + date range intersects correctly; empty `q` ignored.
- Light UI or attention composition: status chip + find both applied (manual or component test if cheap).

## Docs

One line in `docs/features/orders.md`: Orders list has find-suggest (company, design/SKU, dates) without permanent date chrome.

## Success

Ravi can focus Find, pick **This week** or type `Jaipur` / a SKU / `18/08`, see a short suggestion list, and narrow the list without adding a second filter row when idle.
