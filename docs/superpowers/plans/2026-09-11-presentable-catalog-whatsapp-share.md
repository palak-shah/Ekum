# Presentable WhatsApp shares (catalog + invite) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Presentable WhatsApp cards for **48h catalog shares** (blurred collage + seller) and **Invite to connect** (business + Ekum); bots get real OG HTML; **＋ → Invite** one-tap shares.

**Architecture:** Catalog: seller copy + sharp `og-image` + nginx. Invite: finish presentable path (`referral-og`, focused `/r/`) — bot edge + ＋ one-tap create+share.

**Tech Stack:** NestJS, sharp, Vitest, React, nginx gateway, `shareInvite` helpers.

## Scope note

Invite landing + OG HTML + share copy already exist in tree; this plan **finishes** invite (＋ share + bot routing) and **adds** catalog collage polish.

## Global Constraints

- Title: `{Seller} · {Pack or design name}`
- Description: `{Seller} shared a {collection|design} on Ekum — open to view.`
- Share text: `{Seller} shared {Pack} on Ekum`; no duplicate naked URL when URL is in share payload (use `nativeShareFields`)
- Collage: up to 4 blurred thumbs; soft blur; quiet Ekum mark; absolute https `og:image`
- Closed packs: OG may use teaser thumbs; SPA `/s/` landing rules unchanged (`designs` empty when not open)
- Seller = catalog **owner** company name
- No PNG in the native share sheet
- Commit only when the user asks (skip commit steps unless requested)

## File map

| File | Role |
|------|------|
| `packages/domain-types/src/catalog.ts` | `ShareLinkView.companyName` |
| `apps/api/src/catalog/share-link.service.ts` | Load owner name + teaser thumbs for OG |
| `apps/api/src/catalog/share-link-og.ts` | Seller-aware OG HTML |
| `apps/api/src/catalog/share-link-og-image.ts` | sharp collage builder |
| `apps/api/src/catalog/share-link.controller.ts` | `GET :token/card`, `GET :token/og-image` |
| `docker/nginx/gateway.conf` | Reliable bot → card (no SPA fallthrough) |
| `apps/web/src/lib/shareInvite.ts` | `catalogShareCopy({ name, kind, companyName })` |
| `apps/web/src/features/browse/CatalogShareSheet.tsx` | Pass company name into copy |
| `apps/web/src/app/AppShell.tsx` (+ small helper) | ＋ Invite → create+share |
| `docs/features/collections.md` / `media.md` / `referrals.md` | Shipped behaviour |
| `docs/superpowers/reviews/feature-gap-matrix.md` | Gap row |

---

### Task 1: Share copy includes seller + CatalogShareSheet

**Files:**
- Modify: `apps/web/src/lib/shareInvite.ts`
- Modify: `apps/web/src/lib/shareInvite.spec.ts`
- Modify: `apps/web/src/features/browse/CatalogShareSheet.tsx`
- Modify: `packages/domain-types/src/catalog.ts` — add `companyName: string` to `ShareLinkView`
- Modify: `apps/api/src/catalog/share-link.service.ts` — populate `companyName` from owner company

**Interfaces:**
- Produces: `catalogShareCopy({ name, kind, companyName }) → { title, text }`
- Produces: `ShareLinkView.companyName`

- [ ] **Step 1: Failing tests**

```ts
expect(catalogShareCopy({
  name: 'Mill Lot',
  kind: 'collection',
  companyName: 'Surat Silk House',
})).toEqual({
  title: 'Surat Silk House · Mill Lot',
  text: 'Surat Silk House shared Mill Lot on Ekum',
});
```

- [ ] **Step 2: Implement copy**

```ts
export function catalogShareCopy(options: {
  name: string;
  kind: 'collection' | 'product';
  companyName: string;
}): { title: string; text: string } {
  const seller = options.companyName.trim() || 'A business';
  const item = options.name.trim() || (options.kind === 'collection' ? 'a collection' : 'a design');
  return {
    title: `${seller} · ${item}`,
    text: `${seller} shared ${item} on Ekum`,
  };
}
```

- [ ] **Step 3: API `companyName` on ShareLinkView**

In `share-link.service` `get()`, select `company: { select: { name: true } }` on collection/product and set `companyName: collection.company.name` (same for product). Update existing service/OG specs’ fixture objects with `companyName: '…'`.

- [ ] **Step 4: CatalogShareSheet**

```ts
const copy = catalogShareCopy({
  name: link.name,
  kind: link.kind,
  companyName: link.companyName,
});
await shareOrCopyInvite({ url, title: copy.title, text: copy.text });
```

(`nativeShareFields` already omits duplicate `url` when text contains it — for catalog, **do not** put URL in `text`; pass so `shareMessageText` adds URL once, or prefer omit-from-text and rely on `url` field only where supported. Spec: avoid naked URL as hero — keep URL once via `shareMessageText` for WhatsApp reliability, same as today, but title/text carry seller.)

- [ ] **Step 5: Run**

`pnpm --filter @ekum/web exec vitest run src/lib/shareInvite.spec.ts`  
`pnpm --filter @ekum/api exec vitest run src/catalog/share-link.service.spec.ts`

---

### Task 2: Seller-aware OG HTML

**Files:**
- Modify: `apps/api/src/catalog/share-link-og.ts`
- Modify: `apps/api/src/catalog/share-link-og.spec.ts`
- Modify: `apps/api/src/catalog/share-link.controller.ts` — point `og:image` at collage URL when available

**Interfaces:**
- Produces: `shareLinkOgCopy(view) → { title, description }`
- Consumes: `view.companyName`, `view.name`, `view.kind`

- [ ] **Step 1: Failing test**

```ts
expect(html).toContain('Surat Silk House · Wedding silks');
expect(html).toContain('Surat Silk House shared a collection on Ekum — open to view.');
expect(html).toContain('og:image" content="https://beta.ekum.app/api/v1/share-links/t1/og-image');
```

- [ ] **Step 2: Implement**

```ts
export function shareLinkOgCopy(view: ShareLinkView): { title: string; description: string } {
  const seller = view.companyName.trim() || 'A business';
  const what = view.kind === 'collection' ? 'collection' : 'design';
  const name = view.name.trim() || what;
  return {
    title: `${seller} · ${name}`,
    description: `${seller} shared a ${what} on Ekum — open to view.`,
  };
}
```

`shareLinkOgHtml` options add `imageUrl` (collage or cover) built by controller as  
`${webOrigin}/api/v1/share-links/${token}/og-image` when teasers exist, else cover, else app icon.

Use **API-absolute** image URL WhatsApp can fetch: prefer  
`${publicApiOrWeb}/api/v1/share-links/${token}/og-image`  
where public host is first `CORS_ORIGINS` origin (same as pageUrl) so path is `https://beta.ekum.app/api/v1/share-links/.../og-image` via gateway.

- [ ] **Step 3: Run** `pnpm --filter @ekum/api exec vitest run src/catalog/share-link-og.spec.ts`

---

### Task 3: Teaser thumbs + og-image collage (sharp)

**Files:**
- Create: `apps/api/src/catalog/share-link-og-image.ts`
- Create: `apps/api/src/catalog/share-link-og-image.spec.ts` (layout/pure helpers without network)
- Modify: `apps/api/package.json` — add `sharp`
- Modify: `apps/api/src/catalog/share-link.service.ts` — `teaserImagePaths(token)` always up to 4 thumbs
- Modify: `apps/api/src/catalog/share-link.controller.ts` — `@Public() GET :token/og-image`

**Interfaces:**
- Produces: `layoutTeaserSlots(count: number): 'single' | 'dual' | 'triple' | 'quad'`
- Produces: `async buildShareLinkOgPng(options: { imageBuffers: Buffer[]; sellerLabel: string }): Promise<Buffer>`
- Produces: `ShareLinkService.teaserAbsoluteUrls(token, mediaBase): Promise<string[]>` (internal)

- [ ] **Step 1: Add dependency**

`pnpm --filter @ekum/api add sharp`  
`pnpm --filter @ekum/api add -D @types/sharp` if needed (sharp ships types).

- [ ] **Step 2: Teaser load (closed packs included)**

In service, private method used by card/og-image only:

```ts
async teaserImagesForLink(row): Promise<string[]> {
  // collection: up to 4 product.images[0] in position order; if empty, [coverImage].filter(Boolean)
  // product: [images[0]].filter(Boolean)
  // Do NOT gate on `open` — OG tease only
}
```

SPA `get()` still returns `designs: []` when `!open`.

- [ ] **Step 3: Collage builder**

- Canvas ~1200×630 (WhatsApp-friendly).  
- Draw each thumb cover-fit into slots; apply moderate blur (`sharp().blur(8)` or composite pre-blurred).  
- Bottom-left or corner: white/soft “Ekum” text via SVG overlay composite.  
- Optional seller strip (truncate).  
- Output JPEG or PNG buffer; `Content-Type: image/jpeg`, `Cache-Control: public, max-age=3600`.

Pure unit test: `layoutTeaserSlots(1|2|3|4)` and maybe composite with 1×1 pixel fixtures.

- [ ] **Step 4: Controller**

```ts
@Public()
@Get(':token/og-image')
@Header('Content-Type', 'image/jpeg')
async ogImage(@Param('token') token: string, @Res() res: Response) {
  const buf = await this.links.buildOgImage(token);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(buf);
}
```

On failure (no images): return redirect or generate solid canvas with seller + name + Ekum; never 500 empty for bots if link valid.

- [ ] **Step 5: Run** `pnpm --filter @ekum/api exec vitest run src/catalog/share-link-og-image.spec.ts src/catalog/share-link-og.spec.ts`

---

### Task 4: Harden nginx bot routing for `/s/` and `/r/`

**Files:**
- Modify: `docker/nginx/gateway.conf`

**Why:** `if` + `rewrite … last` inside regex location often falls through to SPA — matches observed homepage OG.

- [ ] **Step 1: Replace with named locations**

```nginx
map $http_user_agent $ekum_share_bot {
  default 0;
  ~*(WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|Slackbot|LinkedInBot) 1;
}

location ~ ^/s/(?<share_token>[^/]+)$ {
  error_page 418 = @og_share_link;
  if ($ekum_share_bot) { return 418; }
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_pass http://web:80;
}

location @og_share_link {
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_pass http://api:3000/api/v1/share-links/$share_token/card;
}

location ~ ^/r/(?<invite_token>[^/]+)$ {
  error_page 418 = @og_referral;
  if ($ekum_share_bot) { return 418; }
  # … same proxy headers …
  proxy_pass http://web:80;
}

location @og_referral {
  # … headers …
  proxy_pass http://api:3000/api/v1/referrals/$invite_token/card;
}
```

Confirm `$share_token` / `$invite_token` are visible in named locations (nginx captures from the matched location that issued 418). If not, use `rewrite` to `/internal-og-share/$share_token` internal location instead.

- [ ] **Step 2: Manual verify (local or beta)**

```bash
curl -sA "WhatsApp/2.0" "https://beta.ekum.app/s/<token>" | head
# expect og:title with seller · name, not bare "Ekum" marketing blurb
curl -sA "WhatsApp/2.0" "https://beta.ekum.app/r/<token>" | head
```

Vite middleware already proxies bots in dev — leave as-is unless broken.

---

### Task 5: ＋ → Invite to connect creates + shares

**Files:**
- Modify: `apps/web/src/app/AppShell.tsx` **or** `ReferralComposePage.tsx`
- Prefer: extract tiny `shareOpenConnectInvite()` used by FindOnEkum + ＋ to avoid drift
- Create: `apps/web/src/features/referrals/shareOpenConnectInvite.ts` (+ spec if pure)
- Modify: `apps/web/src/features/access/FindOnEkumBlock.tsx` to call helper (optional DRY)

**Interfaces:**
- Produces: `async shareOpenConnectInvite(api, origin, companyName): Promise<'shared'|'copied'>`

- [ ] **Step 1: Helper**

```ts
export async function shareOpenConnectInvite(options: {
  postReferral: () => Promise<ReferralView>;
  origin: string;
  companyName: string;
}): Promise<'shared' | 'copied'> {
  const referral = await options.postReferral();
  const url = `${options.origin}/r/${referral.token}`;
  const copy = inviteShareCopy({
    kind: 'connect',
    companyName: options.companyName || referral.referrer.name,
  });
  return shareOrCopyInvite({ url, ...copy });
}
```

- [ ] **Step 2: AppShell ＋ button**

On “Invite to connect”: close sheet → call helper (create `{}` referral + share) → toast “Link copied” if copied; on error danger toast. Optionally `navigate('/referrals')` after success — do **not** require filling New invite form first.

Keep `/referrals/new` for vouch/note flows from Invites list.

- [ ] **Step 3: Smoke** — ＋ → Invite opens system share sheet (or copies on desktop).

---

### Task 6: Docs + gap matrix + verification

**Files:**
- Modify: `docs/features/collections.md` (48h WhatsApp teaser)
- Modify: `docs/features/media.md` if share/OG mentioned
- Modify: `docs/features/referrals.md` (＋ one-tap share)
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md`
- Update design status line to Implemented when done

- [ ] **Step 1: Docs** — short bullets matching shipped behaviour.  
- [ ] **Step 2: Run** web shareInvite + API share-link / og-image / og specs.  
- [ ] **Step 3: Bot curl** on `/s/` and `/r/` after deploy.

---

## Spec coverage check

| Spec section | Task |
|--------------|------|
| A OG title/description/seller | 2 |
| B Collage og-image | 3 |
| C Share payload + companyName | 1 |
| D Bot / nginx | 4 |
| E ＋ Invite share | 5 |
| Closed pack teaser / landing unchanged | 3 (teaser separate from `designs`) |
| Docs | 6 |

## Placeholder scan

None intentional — nginx capture caveat documented with fallback.
