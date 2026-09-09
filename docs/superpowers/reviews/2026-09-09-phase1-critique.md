# Phase 1 critique — adversarial review

**Date:** 2026-09-09  
**Lens:** Skeptical client / first-time trader / UX critic (not automation green)  
**Release posture:** **Live link** (not demo-only). Blockers **1–3** closed; majors **5,7–10** + polish **13–15,17–18** closed 2026-09-09. Remaining live risks: desk density **#4**, soft-hide/reveal **#6**, gap soft spots **#11**.

## Verdict

Ship live with known advanced-path risks. Default path (curated pack → Me + reveal Off → Send → Dispatch → **Dispatched · complete**) is the supported spine. Mills flip / reveal On / Selection mix Place remain easy-to-confuse — product still ships them; do not rely on a script alone to hide bugs.

---

## Blockers (closed)

| # | Issue | Status |
|---|--------|--------|
| 1 | Two CTAs both said **Take over** | **Fixed** — **Handle myself** vs **Desk tools** |
| 2 | **You** vs shell **More** | **Fixed** — `/more` shell title cleared; PageHeader **You** |
| 3 | **Dispatched** looked unfinished + **Delivered** in filter | **Fixed** — tone `success`; Delivered off primary filter |

---

## Majors

| # | Issue | Fix posture |
|---|--------|-------------|
| 4 | Desk density | **Live risk** — Direct→“also next for pair” sheet **deferred** (client pointer). Prefer quiet first order. |
| 5 | Place confirm path copy | **Fixed** — “One order · N mills” vs “N separate chats · one per shop” |
| 6 | Soft-hide vs Mills / reveal On | **Live risk** — default Me+Off; flipping surfaces mill names |
| 7–10 | Explore / Ask jargon / Selection empty / deliver residue | **Fixed** |
| 11 | Broadcast / trader attention / team caps / reveal×2 | **Live limits** — broadcast backup only; attention Missing; caps Partial |
| 12 | Ask triad | **OK** — full CTA strings |

---

## Polish

| # | Issue | Status |
|---|--------|--------|
| 13 | Floater “N selected · View” | **Fixed** — “N in selection” |
| 14 | Ticket **Me** | **Fixed** — **With me** (order + Your paths) |
| 15 | Dispatched vs Settled | **Fixed** — both complete: **Dispatched · complete** (full ship) · **Settled · complete** (qty settled) |
| 16 | **I trade on Ekum** gates | **Verify** before release (seed Ravi Trading on) |
| 17 | Parties Buyer · Seller on manage | **Fixed** — manage → **Trader** · Buyer |
| 18 | ApiError toasts | **Fixed** — SCREAMING_CODE messages → plain fallback |
| 19 | BM-07 under load | Spot-check phone with selection > 0 |
| 20 | Selection mix → N tickets | Documented behaviour; confirm copy distinguishes |

---

## Supported live spine

Curated pack → one main → Send mills → quote → accept → **Dispatch** → **Dispatched · complete** (or **Settled · complete** after short-ship settle).

**Higher confusion risk (still in product):** Desk tools vs Handle myself (now distinct), Mills flip, reveal On×2, Selection mix Place.
