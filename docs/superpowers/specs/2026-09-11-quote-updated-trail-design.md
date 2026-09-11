# Design — Quote / Quote updated trail summaries

**Date:** 2026-09-11  
**Status:** Implemented  

## Behavior

| Event | Timeline summary |
|-------|------------------|
| First Send quote | `Quoted — ₹2,75,000` |
| Later Send quote | `Quote updated — ₹2,83,800` |

- Trail `type` stays `quoted`.  
- Detect update with `quotedAt` **or** prior trail quote **or** existing seller quote message (legacy tickets often lack `quotedAt`).  
- Amount = quote total (rate × offered qty on supplyable lines), `en-IN` with ₹.  
- **Existing** bare `Quoted` trail rows are healed on Timeline open (first → `Quoted — ₹…`, later → `Quote updated — ₹…` using current line total).
