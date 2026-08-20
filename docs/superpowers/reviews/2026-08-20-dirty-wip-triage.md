# Dirty WIP triage (2026-08-20)

Uncommitted work sitting on `wip/product-ongoing` beside the already-pushed browse-select / business-shop slice.

## Recommendation

**Stash** this tree so the branch stays clean for the PR. Recover later with `git stash pop`.

Do **not** discard — ~1k lines of orders/referrals/network work.

## Buckets

| Bucket | Size (approx) | Notes |
|--------|---------------|--------|
| Orders UI | Large (`OrdersPage`, `OrderDetailPage`, `tradeFind`/`tradeList`) | Find/filter / attention — separate from batch Order already shipped |
| Network hub | New `features/network/*` | Connections / followers / requests pages |
| Referrals | API + web edits | Invite/share helpers untracked |
| Chats | `StartChatSheet` + ChatsPage | Start-chat flow |
| Shell / home / auth | Home, More, Toast, kit, router, Login, onboarding | Cross-cutting chrome |
| Types / saved API | domain-types + saved.service | May couple to network/orders |

## Commands (when you choose)

```bash
# Park safely
git stash push -u -m "wip: network referrals orders chats shell"

# Or commit as its own WIP commit (keeps history, dirties PR if not careful)
# Prefer a new branch off main for this WIP instead of mixing into browse-select PR.
```

## PR for shipped slice

Still needs `gh auth login`, then:

```bash
gh pr create --base main --head wip/product-ongoing --title "…" --body-file docs/superpowers/reviews/2026-08-20-browse-select-pr-body.md
```

Or compare: https://github.com/palak-shah/Ekum/compare/main...wip/product-ongoing?expand=1
