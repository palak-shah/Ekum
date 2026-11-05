# Feature Completeness Review — Follow Allow ⇒ Active Connection (backfill older rows)

**Date:** 2026-11-05  
**Module / ask:** Allowed follow (“I see theirs”) must have a real **Active Connection** in the DB — including older Allowed rows created before Allow upserted Connection. Fix Place Order **Connect with this business…** for those pairs.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Redesign of stale docs (“Allow does not create a Connection”). Code on new Allow already upserts Active Connection; this slice backfills older gaps.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Follow Allow means trade-ready trust: write Active Connection. Older Allowed-only pairs (seed Meena→Kavita, live pre-fix) must get the same row so Place works. |
| UX Designer | No new chrome. Connections list gains rows that were missing. Block stays silent and is never lifted by backfill. |
| Solution Architect | Shared helper: upsert Active unless Blocked. Call from Allow + seed + one-shot script. Idempotent. Connect ⇏ Follow. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — mutual unordered Connection pair; Allow already calls ensure.  
2. **Duplicates another feature?** No — finishes Follow ⇒ Connect.  
3. **Should reuse an existing workflow?** Reuse Connection upsert shape from Allow.  
4. **Naming matches the app?** I see theirs / Connections / Connect.  
5. **Units?** N/A.

**Philosophy conflict?** Stale docs said Allow ≠ Connection — **update docs** to Match code (not keep the old rule).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Backfill Allowed → Active Connection |
| Business rules | OK | Never lift Block; Connect ⇏ Follow |
| Workflows | OK | New Allow + seed + one-shot |
| Edge cases | OK | Already Active = no-op; Blocked = skip |
| Permissions | OK | Data repair only |
| User states | OK | Older Allowed get Connected |
| Notifications | N/A | No notify on backfill |
| Error handling | OK | Idempotent upserts |
| Scalability | OK | Scan Allowed follows once |
| Mobile interactions | N/A | |
| First glance (BM-11) | N/A | |
| Units | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

None Required after this slice.

---

## Approved scope for this slice

- Shared `ensureActiveConnectionUnlessBlocked` + `backfillActiveConnectionsForAllowedFollows`.  
- Wire Allow + seed + one-shot script.  
- Docs: Follow Allow ⇒ Active Connection; Open order may rely on that Connection.  
- Unit tests + gap matrix.

## Explicitly deferred / rejected

- Stop seeing removing Connection.  
- Collapsing Network Connections into follow lists.  
- Using trade-access follow-ifs as the fix instead of DB rows.
