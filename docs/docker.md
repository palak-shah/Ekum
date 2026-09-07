# Running Ekum with Docker

Production-like local stack: **PostgreSQL**, **Nest API**, **React SPA (static)**, and **Nginx** as the only public entrypoint.

| | |
|--|--|
| **Public URL** | http://localhost:8080 |
| **Health** | http://localhost:8080/api/v1/health |
| **Compose file** | [`docker-compose.yml`](../docker-compose.yml) |
| **Env template** | [`.env.docker.example`](../.env.docker.example) → copy to `.env.docker` |

Day-to-day hot reload still uses host `pnpm dev`. Use Docker for demos, full-stack smoke checks, and a consistent environment.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Engine + Compose v2)
- Disk space for Node build images (~2–4 GB first build)
- Ports **8080** free on the host (change with `EKUM_HTTP_PORT` in `.env.docker`)

Optional on the host: Node/pnpm only if you also develop outside Compose.

---

## Quick start

```bash
# from repo root
cp .env.docker.example .env.docker
pnpm docker:up          # or: npm run docker:up
```

1. Wait until `pnpm docker:ps` shows `nginx` and `api` healthy.
2. Open **http://localhost:8080** (prefer `localhost` over `127.0.0.1` if another process also binds 8080).
3. (Optional) load seed personas:

```bash
pnpm docker:seed
```

Stop (keep database + media volumes):

```bash
pnpm docker:down
```

Wipe volumes (fresh DB and media):

```bash
pnpm docker:down:volumes
```

---

## Architecture

```
Browser
   │
   ▼
Nginx :8080  (published)
   ├── /          → web :80   (static SPA)
   ├── /api/      → api :3000
   └── /media/    → api :3000
                      │
                      ▼
                 Postgres :5432  (internal only)
```

| Service | Role | Host ports |
|---------|------|------------|
| `nginx` | Gateway / reverse proxy | `8080→80` (or `EKUM_HTTP_PORT`) |
| `web` | Built Vite app served by nginx | none (internal) |
| `api` | NestJS + Prisma; local media volume | none (internal) |
| `postgres` | PostgreSQL 16 | none (internal) |

**Same-origin API:** the web image is built with `VITE_API_BASE_URL=/api/v1`, so the browser talks to Nginx only. CORS is set to `http://localhost:8080`. Media URLs use `PUBLIC_MEDIA_BASE_URL=http://localhost:8080/media`.

Volumes:

- `ekum_pg` — Postgres data
- `ekum_media` — API local disk media (`apps/api/.media`)

---

## npm / pnpm scripts

Defined in root [`package.json`](../package.json). Use either `pnpm <script>` or `npm run <script>`.

| Script | Command | Purpose |
|--------|---------|---------|
| `docker:build` | `docker compose build` | Build `api` and `web` images |
| `docker:up` | `docker compose up -d --build` | Build and start the stack |
| `docker:down` | `docker compose down` | Stop containers; **keep** volumes |
| `docker:down:volumes` | `docker compose down -v` | Stop and **delete** DB + media volumes |
| `docker:logs` | `docker compose logs -f --tail=200` | Follow logs |
| `docker:ps` | `docker compose ps` | Status / health |
| `docker:seed` | `docker compose exec -w /app api pnpm --filter @ekum/api db:seed` | Seed DB inside `api` |

---

## Configuration

### `.env.docker`

Copy from `.env.docker.example`. Compose injects this file into the **api** container (`env_file`).

Important variables:

| Variable | Notes |
|----------|--------|
| `EKUM_HTTP_PORT` | Host port for Nginx (default `8080`) |
| `CORS_ORIGINS` | Must match the URL you open in the browser |
| `PUBLIC_MEDIA_BASE_URL` | Absolute media base as seen by the browser |
| `JWT_*_SECRET` | ≥32 chars; change before any shared use |
| `OTP_EXPOSE_DEV_CODE` | `true` for local demos only — never in real production |
| `VITE_API_BASE_URL` | Baked at **web image build** time (default `/api/v1`) |
| `VITE_PUBLIC_ORIGIN` | Baked at build time (default `http://localhost:8080`) |

`DATABASE_URL` is set in Compose to `postgresql://ekum:ekum@postgres:5432/ekum?schema=public` and does not need to be in `.env.docker`.

If you change `VITE_*` values, rebuild the web image:

```bash
pnpm docker:build
pnpm docker:up
```

### File map

| Path | Purpose |
|------|---------|
| [`docker-compose.yml`](../docker-compose.yml) | Services, volumes, healthchecks |
| [`docker/Dockerfile.api`](../docker/Dockerfile.api) | Monorepo build → Nest runtime |
| [`docker/Dockerfile.web`](../docker/Dockerfile.web) | Monorepo Vite build → nginx SPA |
| [`docker/api-entrypoint.sh`](../docker/api-entrypoint.sh) | `prisma migrate deploy` then `node dist/main.js` |
| [`docker/nginx/gateway.conf`](../docker/nginx/gateway.conf) | Public reverse proxy |
| [`docker/nginx/web.conf`](../docker/nginx/web.conf) | SPA `try_files` for the web image |

---

## Lifecycle details

### First boot

1. Postgres becomes healthy (`pg_isready`).
2. API entrypoint retries `prisma migrate deploy` until the DB accepts connections.
3. API listens on `:3000` inside the network; healthcheck hits `/api/v1/health`.
4. Nginx starts after API is healthy and proxies traffic.

### Seed personas

After the API is up:

```bash
pnpm docker:seed
```

Uses the same Prisma seed as local (`pnpm --filter @ekum/api db:seed`). Seed media lands in the `ekum_media` volume.

### Logs and debugging

```bash
pnpm docker:logs
docker compose logs api --tail=100
docker compose exec api sh
```

### Rebuild after code changes

Compose is **not** hot-reload. Rebuild:

```bash
pnpm docker:up          # includes --build
# or
pnpm docker:build && pnpm docker:up
```

---

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| `env_file: .env.docker` missing | `cp .env.docker.example .env.docker` |
| Port 8080 in use | Set `EKUM_HTTP_PORT=9080` in `.env.docker` and update `CORS_ORIGINS` / `VITE_PUBLIC_ORIGIN` / `PUBLIC_MEDIA_BASE_URL`, then rebuild web |
| API never healthy | `docker compose logs api` — often migrate/JWT/config; ensure secrets ≥32 chars |
| Blank SPA / API 404 | Confirm you use **http://localhost:8080** (not :3000 / :5173) |
| “Could not send the code” on login | Rebuild web after relative `/api/v1` fix (`pnpm docker:build` + `pnpm docker:up`). Prefer **localhost** over `127.0.0.1` if another process also binds 8080 |
| Stale frontend | `pnpm docker:build` then `pnpm docker:up` (Vite env is build-time) |
| Need empty database | `pnpm docker:down:volumes` then `pnpm docker:up` |
| Docker CLI not found | Install/start Docker Desktop; ensure `docker compose version` works in the same shell |

---

## Local `pnpm dev` vs Docker

| | Host `pnpm dev` | Docker Compose |
|--|-----------------|----------------|
| Web | Vite :5173 | Nginx :8080 (static) |
| API | :3000 | Internal; via Nginx `/api` |
| Postgres | Your local install or other | Compose `postgres` service |
| Reload | Instant | Rebuild images |
| Best for | Feature work | Demos / full-stack check |

Do not run host API on :3000 and Compose Nginx expecting the Compose `api` service at the same time if ports/volumes conflict—pick one stack.

---

## Security notes (demo stack)

- Default JWT secrets in `.env.docker.example` are **dev-only**.
- `OTP_EXPOSE_DEV_CODE=true` returns OTP codes in API responses for easy login demos.
- Postgres credentials `ekum`/`ekum` are for local Compose only; not exposed on the host by default.
- This stack does **not** include TLS. Put a real reverse proxy / load balancer in front for anything beyond localhost.
