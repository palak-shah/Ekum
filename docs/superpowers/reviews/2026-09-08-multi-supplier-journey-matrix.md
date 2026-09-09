# Multi-supplier journey — test cases, friction, gaps

**Date:** 2026-09-08  
**Purpose:** One place to see how publish → curate → order (I handle vs Direct) works when **two suppliers** feed one trader pack — what to expect, what is confusing, what is missing — so we can decide changes deliberately.  
**Personas (seed):**  
- **Supplier A** — Kavita / Ahmedabad Loom Co (`seed-company-kavita`)  
- **Supplier B** — (second mill; may use a second Kavita-like catalog or another selling company; seed today is mainly Ravi + Kavita)  
- **Trader** — Ravi / Surat Silk House (`seed-company-ravi`) when trading is on  
- **Buyer** — Meena / Jaipur Emporium (`seed-company-meena`)  

**Anchors:** `docs/features/orders.md`, `saved.md`, `explore.md`, `catalog.md`, `collections.md`, `settings.md`, TradeLane + I-handle desk specs, Completeness Your paths / trio-subset / curate Slice A.

**Product decision (2026-09-08):** Completeness **Redesign** — [unified main + linked lots](../specs/2026-09-08-unified-main-linked-lots-design.md). Target: **one Place shape** (main + supplier lots). Direct = buyer sees the same desk (mills visible), not N orphan batch tickets. Sections below still describe **shipped today** unless marked **Target**.

---

## 1. Story in one picture

### Target (approved redesign)

```text
Supplier A + B publish → Trader curates both → Buyer Places once
        ↓
ONE main order (#MAIN)
  ├── Lot Supplier A
  └── Lot Supplier B
        ↓
Private (default): buyer sees trader only; mills soft-hidden
Transparent (Direct intent): buyer + trader see same main + A + B
```

Two supplier chats are fine **as linked lots under one main** — not as two unlinked orders.

### Shipped today (baseline under test)

```text
Buyer orders from curated pack / Selection
  ├─ I handle (from-pack) → ONE buyer↔trader ticket + mill desk per supplier
  └─ Direct / batch     → ONE order PER supplier (N chats, no shared main)
```

---

## 2. What ships today (baseline)

| Stage | Behaviour today |
|-------|-----------------|
| Publish | Who (Everyone / Followers / Selected) + Rules (rates, **Buyers can put this in their pack** / `allowForward`). Path radios **removed** — TradeLane / Your paths own path. |
| Bookmark | Album and design stay separate; Saved; Selection → Bookmark → Saved. |
| Selection | Traveling pile; Order · Curate · Bookmark · Share. Albums resolve for Order/Curate. |
| Curate | Whole pack / pick designs; locked gray (**Can't put in a pack**); **Ask to put in my pack** → Waiting → unlock on Allow. |
| Share | Chat cards + optional 48h link; types kept; **no** Direct/I handle on share. |
| Order curated multi-supplier | **`POST /orders/from-pack`** → Manage parent + held upstream per mill. |
| Order mixed / Direct | **`POST /orders/batch`** → one order per `product.companyId`. |
| TradeLane | Default **Me + no group**. Reveal On → one trio **per mill**, living card = **subset**. Your paths = future; live switch on order. |

---

## 3. Test cases and expected results

Legend: **Pass** = product intent matches code · **Fragile** = works but easy to misunderstand · **Gap** = missing / wrong / untested E2E · **Decide** = product must choose before build.

### A. Suppliers publish

| ID | Case | Steps | Expected result | Status |
|----|------|-------|-----------------|--------|
| A1 | Supplier A publishes designs | Add designs → Publish Who/Rules | Visible to allowed audience; rates/MOQ as set | Pass (e2e catalog) |
| A2 | Supplier A publishes collection | New collection → add designs → Publish | Pack on Explore for allowed viewers | Pass (e2e collections) |
| A3 | Supplier B same | Repeat for second supplier | Second catalog independent | Pass (manual / seed); **no dual-supplier publish e2e** |
| A4 | Forward blocked | Publish with **Buyers can put this in their pack** Off | Trader can still browse/order; Curate locks those designs | Pass (ceiling) |
| A5 | Path on publish | Open Publish | **No** Direct / I handle radios | Pass (removed) |

### B. Bookmark / Selection / Share (pre-order)

| ID | Case | Steps | Expected result | Status |
|----|------|-------|-----------------|--------|
| B1 | Bookmark both suppliers’ designs | Bookmark from Explore / album | Two design refs in Saved | Pass (saved e2e single shop) |
| B2 | Bookmark two albums | Bookmark pack A + pack B | Two collection refs; not merged | Pass |
| B3 | Selection mix designs+albums | Long-press both suppliers → Selection | Count `N designs · M collections`; four verbs | Pass (selection e2e) |
| B4 | Share Selection | Share → pick chats | Cards keep types (album stays album) | Pass |
| B5 | Share curated pack | Share trader pack | Chat + optional 48h link | Pass for own packs; **curated multi untested e2e** |
| B6 | Bookmark after Curate publish | Buyer bookmarks trader pack | Saved collection under trader | Pass (unit / partial e2e) |

### C. Trader curates from both suppliers

| ID | Case | Steps | Expected result | Status |
|----|------|-------|-----------------|--------|
| C1 | Curate designs from A + B | Selection designs from both → Curate → name → Save draft / Publish | One curated collection; members from two `companyId`s | **Pass** (`curate.multi-supplier.journey`) |
| C2 | Curate whole albums A + B | Select two albums → Curate → Use whole pack each | Designs expanded as-is; locked skipped | Pass Slice A; multi-album **light e2e** |
| C3 | Locked design in mix | One design `allowForward` false | Gray + reason; publish continues without it | Pass |
| C4 | Zero allowed after lock | All locked | Stay on Selection; no empty pack | Pass |
| C5 | Ask to put in my pack | Locked row | CTA → Allow → unlock; desk chain when via pack | Shipped (Slice B + desk chain) |
| C6 | Ceiling on publish | Curated pack publish audience wider than sources | Blocked / clamped to ceiling | Pass (unit) |
| C7 | Add to existing pack | Merge more foreign designs into draft/published | Membership grows; ceiling still applies | Pass (unit) |

### D. Buyer orders — I handle (one ticket)

| ID | Case | Steps | Expected result | Status |
|----|------|-------|-----------------|--------|
| D1 | Place from curated pack (A+B lines) | Open pack → Order → qty → Place | **One** chat/ticket with **trader**; API `from-pack` | **Pass** (`orders.from-pack-multi.journey`) |
| D2 | Trader Orders list / Find | Open Orders; Find mill name or mill `#` | **One** Trading row (buyer main); mill names on row; **no** mill list rows. Sub-order search → **opens main** (lots inside). Buyer reveal Off → no mill `#`/names to hunt. | Pass (desk design + e2e single mill) |
| D3 | Trader desk | Open buyer ticket | Two mill cards (A + B); qty/rate; Send per shop | **Pass** (`orders.from-pack-multi` D3) |
| D4 | Duplicate mill cards | Place from-pack | Exactly **one** card per mill | Pass (fixed 2026-09-08 double-spawn) |
| D5 | Send mill A only | Send to A | A released; B still Waiting; A chat after Send | Pass (Send-hold) |
| D6 | Soft-hide | Buyer opens main ticket / chat | **No** mill shop names on main; sees trader only | Pass (soft-hide) |
| D7 | Reveal Off (default) | After Send | Two 1:1s: buyer↔trader, trader↔mill | Pass |
| D8 | Reveal On one mill | See each other On + Send | Trio for that mill; card = **subset** + Part of main; main stays 1:1 | Pass (routing fix 2026-09-08) |
| D9 | Reveal On both mills | On for A and B | **Two** groups (never A+B+buyer+trader in one) | Pass (lane model) |
| D10 | Mill quotes → trader quotes buyer | A quotes; Send quote to Meena | Prefill From mill; Meena never sees mill name (Off) | Pass |
| D11 | Buyer accepts | Accept quote | Parent confirmed; released mills confirmed for dispatch | Pass |
| D12 | Ticket flip Me → mill | Requested, no quote | Stay on **one main**; **Mills** = observe; buyer sees mill desks; trader **Send** / **Send quote** under **Take over**. | **Pass** (`orders.from-pack-multi` D12 + observe Take over) |
| D13 | Your paths Me + Off | Future order same pair | Still I handle + no group | Pass |
| D14 | Your paths reveal On | Future order after Send | Trio for that lane | Pass |

### E. Buyer orders — Direct / batch (N tickets)

| ID | Case | Steps | Expected result | Status |
|----|------|-------|-----------------|--------|
| E1 | Selection mixes A+B without one pack stamp | Order → qty | **Batch**: two orders; confirm sheet **two chat links** | Pass (batch) |
| E2 | Own-design album Place | Order trader’s **own** designs only | Not from-pack; batch/single as own | Pass (`NOT_CURATED` fallback) |
| E3 | Stale `DIRECT_PACK` | Web still fallbacks on `DIRECT_PACK` | API **no longer** throws it — dead code path | Gap (cleanup) |
| E4 | Lane ticket = mill + curated Place | Buyer places curated pack | **Always** main + linked lots (`from-pack`). **Mills** = observe / involvement on that desk — not batch. | **Decided** (2026-09-09 uniform) |
| E5 | Facilitator on batch | Direct with trader in loop | Facilitator on mill tickets when stamped | Pass (partial) |
| E6 | List confusion | After batch (no pack) | Buyer sees **two** rows (A and B) — **correct** for true multi-shop Direct/batch. Not the with-trader pack path (that stays **one** main). Soften with confirm copy if needed; later main+lots only if one facilitator is clearly in Selection. | **Accepted** (2026-09-09) — not a pack bug |

### F. End-to-end matrix (recommended manual / future e2e)

| Flow | Publish A+B | Curate both | Order | Path | Reveal | Pass criteria |
|------|-------------|-------------|-------|------|--------|---------------|
| F1 | ✓ | ✓ | from-pack | Me | Off | 1 buyer ticket; 2 mill desks; soft-hide; Send each |
| F2 | ✓ | ✓ | from-pack | Me | On both | 2 trios; subset cards only |
| F3 | ✓ | ✓ | from-pack | Me | On A only | 1 trio + 1 private mill chat |
| F4 | ✓ | Selection mix no pack | batch | — | — | 2 orders; 2 chats |
| F5 | ✓ | Curate; one locked | Curate publish | — | — | Locked out of pack; rest publish |
| F6 | ✓ | Curate → Share → 48h | Guest open | — | — | Link works; login if needed |
| F7 | ✓ | Bookmark pack | Saved → Order | Me | Off | Same as F1 |

---

## 4. What is confusing or hard (UX / product)

| # | Issue | Why it hurts | Severity |
|---|--------|--------------|----------|
| 1 | **“One order” vs two unlinked chats** | Pack Place = one ticket; Direct/batch = two orphan tickets. **Not** confusing if both lots hang under one main (redesign). | High (shipped); redesign closes |
| 2 | **I handle vs Direct invisible at Place** | Path lives in Your paths — not on Place. **Skipped for now** (no Place preview copy). | Medium · deferred |
| 3 | **Soft-hide vs Reveal On** | **Fixed:** Reveal On ⇒ mill named on main order + group chat (buyer mill desk). | Was High |
| 4 | **Main vs subset in group** | Two `#`s. Fixed: group = subset; **Part of #main**. Optional title polish `{shop} lot · #subset · part of #main` — **only if traders still ask** (not a redesign). | Medium · deferred polish |
| 5 | **Two mill cards on desk** | Correct for two suppliers; looked like a bug when from-pack doubled one mill. | Was High → fixed |
| 6 | **Ticket “with mill” + many mills** | **Pass:** one main + mill cards; **Mills** = observe on main. | Was Medium → Pass |
| 7 | **Locked Curate without Ask** | **Fixed (Slice B):** Ask to put in my pack → chat Allow → Selection unlock. | Was Medium |
| 8 | **Ask to see** vs **Ask to put in pack** | Two jobs; only view Ask shipped. Copy must never share a bare **Ask**. | Medium — naming locked |
| 9 | **Open chat on Trading row** | **Fixed (BM-08):** parent `threadId` = buyer↔trader 1:1; mill trio via mill card **Open group chat**. | Was Medium |
| 10 | **Profile “When buyers order…”** | **Fixed:** control removed; path only on Your paths. New pair still Me + Off. | Was Medium |
| 11 | **`orderPathPreference` on collections** | **Fixed:** stop write/read; API returns null; column deferred drop. | Was Low |
| 12 | **Concepts doc stale** | `00-concepts` still “planned” in places while gap matrix says Works. | Low (docs) |

**Ask naming (locked)**

| Job | CTA / copy | Status |
|-----|------------|--------|
| Look through gated pack | **Ask to see this pack** | Shipped |
| Connect for rates/orders | **Request access** (not Ask to see) | Shipped |
| Unlock Curate when `allowForward` off | **Ask to put in my pack** | Shipped |

---

## 5. What is missing (build / test / decide)

### Must decide (product)

1. **~~Curated pack Place + TradeLane ticket=mill~~** → **Decided:** Place always main + linked lots. **Mills** = observe/involvement on that desk (uniform).  
2. **~~Quote when Me / Mills~~** → **Decided:** **Me** = Send + Send quote as today (quote on face after mill rates). **Mills** = observe; **Send** / **Send quote** under **Take over** only.  
3. **~~Multi-mill “This order is with → mill”~~** → **Pass (D12 uniform):** stay on main; Mills = observe.  
4. Keep **reveal / trio** as advanced opt-in (recommended) or hide until later?  
5. **Selection without pack stamp:** keep **batch** when truly multi-shop (E6 Accepted). Later: main+lots only when one facilitator is clearly in the loop.  
6. **Your paths:** system default **Me + Off**; trader may set few/all pairs to **Mills** for next orders — rare. Live tweak on **order page**.

### Missing features

| Item | Notes |
|------|--------|
| Ask supplier (relist / unlock pack use) | Shipped — Completeness 2026-09-08-relist-ask-slice-b + desk chain 2026-09-09 |
| Deliver curated pack (broadcast / targeted) | Partial / untested |
| Trader attention UX (buy / curate / follow-up) | Missing |
| Multi-hop anonymity hardening | Later |
| Schedule publish When | Deferred |

### Missing tests (high value)

| Test | Why |
|------|-----|
| `@functional` curate from **two** suppliers → publish | **Pass** — `curate.multi-supplier.journey` |
| `@functional` from-pack with **two** mills → desk + Send each | **Pass** — D1+D3 (`orders.from-pack-multi`); Send-one-of-two proven |
| `@functional` Selection mix → batch confirm **two** links | Direct story |
| `@functional` reveal On × two mills → two groups, subset cards | Trio rules |
| Cleanup / drop `DIRECT_PACK` fallback or restore API | Doc/code drift |
| Share curated multi + 48h link | Only own seed packs covered |

### Cleanup

- Remove or reimplement `DIRECT_PACK`.  
- ~~Align Profile path copy~~ → **Done:** Profile path control removed (2026-09-08).  
- ~~Purge collection `orderPathPreference` reads/writes~~ → **Done** (column drop later).  
- Refresh `00-concepts.md` dual-network table vs gap matrix.

---

## 6. Recommended change order (when you are ready)

1. **Close G-004** (quote/confirm when transparent) in redesign spec → Completeness **Proceed** slice.  
2. Implement unified Place (curated multi-supplier always main+lots); stop batch as Direct happy path for packs.  
3. Buyer desk when transparent (same mill cards as trader).  
4. **E2E spine** F1 + transparent variant.  
5. Place confirm copy: “One order · N suppliers”.  
6. ~~**D12 redesign**~~ → **Pass** (Mills observe on main). Ask supplier Slice B shipped.

---

## 7. Sign-off use

Use this doc to tick cases in a spreadsheet or Playwright plan.  
Mark each ID: **Pass / Fail / Skip / Decide**.  
Do **not** implement large path changes until §5 decisions are written as Completeness **Proceed**.

**Related Completeness / specs:**  
- `2026-09-08-your-paths-completeness.md`  
- `2026-09-08-trio-subset-card-completeness.md`  
- `2026-09-04-curate-album-as-is`  
- `2026-09-02-tradelane-design.md`  
- `2026-09-07-trader-i-handle-desk-design.md`
