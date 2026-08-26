# Order path: Direct vs I handle — trust-first design

**Date:** 2026-08-21  
**Status:** Approved (Send-hold shipped 2026-08-22)  
**Supersedes for product language/routing:** [2026-08-21-open-toll-trade-simplicity-design.md](./2026-08-21-open-toll-trade-simplicity-design.md)  
**Anchors:** [2026-08-20-trader-dual-trade-slice-b-design.md](./2026-08-20-trader-dual-trade-slice-b-design.md), [orders.md](../../features/orders.md), [settings.md](../../features/settings.md)

## Problem

Curation is for a **good collection**, not “I always own the order.” Auto-routing teaches rules users shouldn’t learn. Showing the wrong party breaks trust.

## Product promise

**You always know who you’re dealing with. We never show the other end on a middle hop. We don’t guess upstream.**

## Mental model (keep this short)

1. Order the **name on the screen**.  
2. If that name is me and I need supply → **Change** / **Send** up.  
3. If I only put the collection together → buyers go to **owners**; I see **Shared**.

No trader caste. No Manage/toll words.

## Who sets the switch

**Only the company that owns the pack** (curator / republisher) — e.g. Ravi — under **You → Profile / Settings**.

Not Meena. Not Kavita.

## One switch (two values)

| Setting | Buyer’s ticket | I see |
|---------|----------------|-------|
| **Direct** (default) | Each **design owner** | **Shared** |
| **I handle** | **Me** | Desk: **Change** → **Send** |

UI hint under the control (so “Direct” isn’t abstract):

- Direct → “Buyers order from the design owners”  
- I handle → “Buyers order from me”

**Curate ≠ I handle.** Default **Direct**. Same default applies to **forward**, packs, and republish — one habit.

### Where the switch applies

| Surface | Uses Profile default? | Can override at send time? |
|---------|----------------------|----------------------------|
| Plain **forward** of someone else’s album/design | **Yes** | Yes — tweak on that share |
| My curated / republished **pack** (Explore, shop, chat share of that pack) | **Yes** | Yes — at publish/share/curate |

### Where it lives

1. **Profile** — default for **forwards + packs + republishes**.  
2. **At that forward / publish / share / curate** — override for this one.  
3. **One order** — if it was Direct and I must step in → **Take over** (escape only).

Resolve: **this share/pack setting > Profile**. Seller is fixed when the order is **created** (no accept-time seller flip).

## Desk words (only when I handle)

- **Send** — pass up unchanged  
- **Change** — edit rate/qty, then Send  
- **Waiting** — other side hasn’t moved  
- **Shared** — Direct path; I’m watching (not selling on that ticket)

Data: linked bilateral tickets. Screen: **one counterpart** per person.

## Trust iron rules

1. **Show only ticket parties.** On I handle, ends never see each other. Leak = bug.  
2. **Never guess upstream.** Route lives on the ask/line. Two candidates → user picks a **company name**.  
3. **Never change seller after place** (except explicit **Take over**, which creates the middle path clearly).  
4. **Same design ≠ same route.** Don’t merge paths.  
5. **I handle + several owners** → one buyer↔me ask; Send splits by owner/route.  
6. **Direct + several owners** → buyer’s confirm shows **each owner by name** before place; batch to those owners; I see **Shared**. (Critical: she must not think she ordered only “Ravi” while tickets go to mills.)  
7. **Forward** — same switch as packs: Direct → buyer↔owner (+ Shared); I handle → buyer↔me → Send to owner. Stamp the choice on the share so the open link/order path stays correct.  
8. **Oversell** — if I handle, I allocate on my desk; no silent cross-buyer magic.  
9. **Owner off Ekum** — no Send; I sell as a normal seller.  
10. **Meena’s first order screen** must show the real seller name(s) for that path — same as the tickets that will be created.

## Scenarios

| # | Situation | Direct | I handle |
|---|-----------|--------|----------|
| 1 | Forward Kavita album | Meena↔Kavita; Ravi Shared | Meena↔Ravi → Send → Kavita |
| 2–3 | My curated pack (Explore/chat), Kavita+Rekha | Confirm shows both names → batch; Ravi Shared | Meena↔Ravi → Send → Kavita + Rekha |
| 4 | Many buyers, short supply | Each mill’s own demand; Ravi watches | Ravi Change / decline / Send what he can |
| 5 | Republish Kavita only | Meena↔Kavita; Ravi Shared | Meena↔Ravi → Send → Kavita |

## Simplicity verdict (self-check)

| Test | Result |
|------|--------|
| Can Ravi explain it in one sentence? | Yes: “Default buyers go to owners on anything I share or publish; I can set I handle so they order me, then I Send up.” |
| Does curate force middle work? | No — default Direct |
| Does Meena learn modes? | No — she only sees company names |
| Wrong party shown? | Forbidden by rules 1, 3, 6, 10 |
| Guessing supplier when routes clash? | Forbidden by rule 2 |
| Everyday taps | Profile once; optional tweak per pack; Send when handling |

**Remaining complexity (acceptable):** multi-supplier Direct shows two (or more) sellers at confirm — one extra look, better than a wrong single name.

**Deferred (don’t build into v1 of this switch):** per-buyer overrides, per-source “always Direct for Kavita,” accept-time as main chooser.

## Non-goals

- Buyer/supplier Profile controls for this switch  
- Accept-time as the main seller chooser  
- Manage / toll / facilitator in UI  
- Three-party single order for users  
- Infinite-chain UI for ends  

## Gap vs shipped Slice B

| Today | This design |
|-------|-------------|
| Curated pack → always Manage | Pack path Direct or I handle |
| Forward → always Direct + facilitator | Follow Profile/share: Direct (**Shared**) or I handle |
| Take control | **Take over** escape |
| Trading on | Still required to curate / run Send desk / Take over |
| Soft-hide + links | Keep for I handle |

## Success

- Profile default + pack override.  
- Correct seller name(s) on Meena’s first screen.  
- Ends never meet on I handle.  
- Direct multi-supplier doesn’t force Ravi’s desk.  

## Decision log

| Decision | Choice |
|----------|--------|
| Curate means | Good collection only |
| Profile | Default Direct / I handle (pack owner) |
| Pack | Override at publish/share/curate |
| Default | **Direct** |
| Forward | Same Profile default + per-share tweak |
| Accept-time | Not main; **Take over** only |
| Direct multi-supplier confirm | Show each owner name |
| Data | Linked tickets when I handle |
| Upstream | Route on ask; pick if ambiguous |
| Escape label | **Take over** (avoid clashing with “I handle”) |
