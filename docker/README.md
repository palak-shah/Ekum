# Ekum Docker stack

Full runbook: **[`docs/docker.md`](../docs/docker.md)**

**Server (git pull + tunnel):** [`docs/docker.md` § Server](../docs/docker.md#server-git-pull--tunnel) · optional Cloudflare example: [`docker/tunnel/README.md`](./tunnel/README.md)

## Quick start

```bash
cp .env.docker.example .env.docker
pnpm docker:up          # or: npm run docker:up
# http://localhost:8080
# optional: pnpm docker:seed
```

| Script | Purpose |
|--------|---------|
| `pnpm docker:up` | Resolve VERSION/git meta, build, tag `version` + `sha-*`, start |
| `pnpm docker:build` | Same meta + build/tag without starting |
| `pnpm docker:meta` | Write `.env.build` only |
| `pnpm docker:down` | Stop (keep volumes) |
| `pnpm docker:down:volumes` | Stop + wipe DB/media |
| `pnpm docker:logs` | Follow logs |
| `pnpm docker:ps` | Status |
| `pnpm docker:seed` | Seed database |

Version check: `GET /api/v1/version` · Settings → **About Ekum** · see [`docs/docker.md`](../docs/docker.md#version-identity).
