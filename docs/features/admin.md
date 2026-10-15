# Admin Console

## Purpose

Platform ops surface for Ekum staff to manage approved master data (starting with Tag Management). Not part of the trader product chrome.

## Who uses it

Users with `User.isPlatformAdmin = true`, provisioned via `PLATFORM_ADMIN_PHONES` (server env). Same mobile OTP session as the trader app — no second login.

## User flows

1. Sign in with the existing OTP flow.
2. On **Profile**, when `isPlatformAdmin` is true, tap **Admin Console** → `/admin`.
3. Admin shell has its own layout (wider ops column, no trader bottom nav) and **Back to Ekum** returns to the regular app. The shell scrolls inside the page column.
4. Tag Management: pick **Master Category** then **Option type** first. The tag list stays empty until both are set (filters do not mutate tags).
5. **Search or add** — one field filters the list (server `q`) and **Add** creates a tag when there is no case-insensitive exact match in the loaded results (server still rejects true duplicates). Exact matches show a quiet “already in this list” hint; Add stays disabled.
6. List is paginated (**25** per page via `take`/`skip`); **Load more** fetches the next page. Compact rows: name, Active/Archived, Edit (sheet → PATCH), Archive / Restore (confirm), Delete (confirm).
7. **Bulk paste** stays separate: paste comma / newline / tab / Excel column → Preview → correct or remove → Refresh preview → Save new. Commit is transactional and idempotent.
8. Non-admins never see the Profile entry. Direct `/admin` navigates away to Home. Every `/v1/admin/**` API returns 403 if the live DB flag is false (including after mid-session revoke).

## Business rules

- Authorization is always enforced on the API from the live `isPlatformAdmin` flag — not JWT-only, not frontend-only.
- Prefer **Archive** for official options. **Restore** reactivates an archived option after a case-insensitive duplicate check against other **active** options of the same kind. Hard **Delete** removes the master option and its category links when the admin confirms; collection label snapshots may remain. Prefer archive when unsure.
- Custom company tags are never auto-promoted into master data from this console in this release (admin adds official values explicitly).
- List API returns `{ items, total, take, skip }` (default take 25, max 100).

## Where it lives

- Web: `/admin` layout + Tag Management under `apps/web/src/features/admin/`
- API: `apps/api/src/admin/` with `@RequirePlatformAdmin()`
- Provisioning: `PLATFORM_ADMIN_PHONES` applied at API boot / seed
