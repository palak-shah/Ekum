# Functional journeys + feature gap program — completion review

**Date:** 2026-08-11  
**Plan:** Functional journeys and gaps (Completeness gate + dual tracks)  
**Status:** Complete — **stop** (do not auto-start next wave)

---

## Verdict

Program delivered. Completeness gate is encoded; five modules reviewed (**Proceed**); functional and regression tracks are separate and green.

| Check | Result |
|-------|--------|
| Completeness template + Cursor rules | Done |
| Chat / Orders / Collections / Explore / Media Completeness | Proceed |
| `@functional` e2e | **5/5 passed** |
| `@smoke @regression` | **2/2 passed** |
| Web BM-* units | **12/12 passed** |

---

## What shipped

1. **Hard gate:** `docs/superpowers/reviews/completeness/TEMPLATE.md` + updated `.cursor/rules/quality-feature-gate.mdc` / `feature-tests-required.mdc` (platform consistency, Reject/Redesign).
2. **Completeness reviews** for five modules under `docs/superpowers/reviews/completeness/2026-08-11-*-completeness.md`.
3. **Gap matrix:** `docs/superpowers/reviews/feature-gap-matrix.md`.
4. **Taxonomy:** `pnpm test:e2e:functional` vs `pnpm test:e2e:smoke`; smoke retagged `@regression`.
5. **Journeys:**
   - Chat — send + search scopes/stepper  
   - Orders — request → quote → Accept quote → confirmed (BM-05)  
   - Collections — shortlist → Ask rates clears selection (BM-03)  
   - Explore — seeded browse, filter Escape dismiss (BM-02), open collection  
   - Media — chat photo fixture upload  
6. Feature docs updated with Automated verification sections.

---

## Explicitly not built (deferred / rejected)

- Requests inbox journey, dispatch→deliver, seller collection authoring, federated Explore search, catalog upload thumbs — **Future** in matrix.  
- Marketplace without connection; vanity Explore ranking; top-level Media tab; Slack-like groups — **Rejected** in Completeness.  
- Former Wave 2/3 as auto-run — **not started**.

---

## How to re-verify

```bash
pnpm --filter @ekum/web test
pnpm test:e2e:smoke
pnpm test:e2e:functional
```

Requires API + web up, DB seeded, `OTP_EXPOSE_DEV_CODE=true`.

---

## Product effect

End-user UI unchanged except stable testids. Process effect: future features must pass Completeness (coherence over “make every ask work”) and both verification tracks before done.
