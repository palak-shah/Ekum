# Design — Quote / Quote updated trail summaries

**Date:** 2026-09-11  
**Status:** Implemented (display collapse 2026-09-18)

## Behavior

| Event | Timeline summary |
|-------|------------------|
| First Send quote | `Quoted — ₹2,75,000` |
| Later Send quote | `Quote updated — ₹2,83,800` |

- Trail `type` stays `quoted` (append-only in DB).  
- **Display (buyer):** Order detail Timeline collapses prior `quoted` rows — one quote line (latest summary) plus quiet **Edited** when re-quoted. Seller timeline keeps the full quote history. Chat living quote card already updates in place for both.  
- Detect update with `quotedAt` **or** prior trail quote **or** existing seller quote message (legacy tickets often lack `quotedAt`).  
- Amount = quote total (rate × offered qty on supplyable lines), `en-IN` with ₹.  
- **Existing** bare `Quoted` trail rows are healed on Timeline open (first → `Quoted — ₹…`, later → `Quote updated — ₹…` using current line total).
