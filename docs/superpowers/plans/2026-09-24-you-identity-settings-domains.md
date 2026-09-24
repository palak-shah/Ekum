# You identity + Settings domains — plan

> **For agentic workers:** This slice is **already shipped**. Do not rebuild You. Use this plan to stay on the locked model and to grow Settings without a redesign.

**Goal:** You = identity + published presence. Edit / Share / Settings stay three jobs. Settings grows by domain cards.

**Completeness:** [2026-09-24-you-identity-settings-domains-completeness.md](../reviews/completeness/2026-09-24-you-identity-settings-domains-completeness.md) — Proceed.

**Locks:** `docs/features/00-concepts.md`, `docs/features/settings.md`.

---

## Locked jobs

| Word | Means | Surface |
|------|--------|---------|
| **Edit** | Manage my business / profile / content | You identity → `/settings/profile`. Library **Add** stays on You. |
| **Share** | Share my Ekum identity | You **Share** → `CompanyShareSheet` (chat + OS / copy). |
| **Settings** | Configure Ekum | You **⋯ → Settings** → `/settings`. Never mix with Edit. |

Do not rename Edit to Manage Profile. Do not put Edit or Share in **⋯**.

---

## Already shipped (do not redo)

- You identity card: shop name primary, person · city, **Edit · Share**, Verified, Buying / Selling / Can publish. No vanity stats.
- Header **⋯**: Network, Settings, Log out.
- Library: Designs \| Collections (Chats segment) + **Add**. Chips Published / Draft / Archived / Saved. **Grid / Feed** on the chip row.
- Settings domains that exist today: **Business & Roles** (Team, Your paths if trading), **Dispatch**, **Billing**.
- Reusable `SettingsDomainCard` + `SettingsDomainGroup`.
- `@functional` You + billing journeys; units on More / domain card / shortcuts.

**Files:** `MorePage.tsx`, `MyCatalogPage.tsx`, `SettingsPage.tsx`, `SettingsDomainCard.tsx`, `youShortcuts.ts`.

---

## How Settings grows (required for future features)

Do **not** redesign `/settings` when a feature needs a toggle.

1. Prefer a new **link** inside an existing domain (`settingsBusinessRoleLinks` or a new list on that group).
2. If it is a new job, add a **domain group** (`SettingsDomainGroup` + cards or compact rows).
3. Ship a domain only when it has real rows. No empty Account / Privacy / Notifications cards.

| Domain (examples) | When it may appear |
|-------------------|--------------------|
| Business & Roles | Team, Your paths — **exists** |
| Dispatch / Billing | Addresses, GST firms — **exists** |
| Account & Security | Only when login / session / wipe settings exist |
| Privacy & Visibility | Only when find-me / audience prefs exist as Settings (not Edit) |
| Notifications | Only when type mutes exist |
| App Preferences | Only when a real app pref exists |

---

## Explicitly out of scope

- Followers, likes, stories, reels, vanity badges.
- Public shop `/company/:id` redesign.
- Moving published-content management off You into Edit.
- Instagram-style posts chrome.

---

## Optional follow-ups (only if asked)

- [ ] Register Dispatch / Billing in one `settingsDomains()` list so the page is data-driven (no product change).
- [ ] Seller-persona browser pass on You with published designs (Meena empty-library already checked).
- [ ] Public shop: keep Edit / Share meaning identical if that screen is touched later.

---

## Verify (if touching this area again)

- `pnpm --filter @ekum/web exec vitest run src/features/settings/`
- `pnpm --filter @ekum/e2e exec playwright test tests/functional/you.profile.journey.spec.ts tests/functional/settings.billing-firms.journey.spec.ts`
- You: identity first, Edit ≠ Settings, Share sheet, Add visible, chips secondary.
- Settings: compact groups; adding a feature does not need a new Settings UI kit.
