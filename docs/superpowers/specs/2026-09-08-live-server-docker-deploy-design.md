# Live server Docker deploy (git pull + tunnel test)

**Date:** 2026-09-08  
**Status:** Approved for implementation (product chat)  
**Anchors:** [`docs/docker.md`](../../docker.md), [`docker-compose.yml`](../../../docker-compose.yml), [`.env.docker.example`](../../../.env.docker.example)

## Problem

Run the same Docker Compose stack on an existing Linux box for shared testing, without a host reverse proxy (no Caddy/nginx+Certbot). Operators develop and verify on **local Docker**; the server is updated by **git pull** and Compose rebuild. A **tunnel** exposes the server stack for remote browser tests.

## Decisions

| Choice | Decision |
|--------|----------|
| Day-to-day dev/test | Local Docker (`http://localhost:8080`) |
| Ship to server | Commit → push → SSH → `git pull` → `docker compose up -d --build` |
| Public access for server testing | **Tunnel** (e.g. Cloudflare Tunnel or similar) in front of Compose Nginx — **not** Caddy |
| Host TLS / port 443 management | Out of scope (tunnel provider handles HTTPS) |
| Auth demo | OTP on screen (`OTP_EXPOSE_DEV_CODE=true`, `NODE_ENV=development`) |
| Optional hostname | Prefer stable name `live.ekum.app` via tunnel DNS if the tunnel product supports it; otherwise use the tunnel-issued URL for tests |

## Topology

```
Laptop                         Server
──────                         ──────
Local Docker :8080             Compose (postgres, api, web, nginx :8080)
  ↑ test here                    ↑ git pull + compose up
                                 │
                                 ▼
                           Tunnel agent  →  public HTTPS URL
                           (e.g. live.ekum.app or *.trycloudflare.com)
```

- Compose shape unchanged.
- Tunnel points at `http://127.0.0.1:8080` (Compose Nginx).
- No host Caddy; no requirement to open 80/443 on the box if the tunnel is outbound-only.

## Workflow

1. **Local:** edit → `pnpm docker:up` (or rebuild) → test at `http://localhost:8080`.  
2. **Git:** commit → push.  
3. **Server:** SSH → `git pull` → ensure server `.env.docker` matches the **tunnel public origin** (CORS / media / `VITE_PUBLIC_ORIGIN`) → `docker compose up -d --build` → optional seed.  
4. **Test server:** start/ensure tunnel → open the tunnel HTTPS URL → login (OTP on screen).

**Important:** Vite bakes `VITE_PUBLIC_ORIGIN` at **web image build**. Server `.env.docker` must use the public tunnel origin (or `https://live.ekum.app` if that is the tunnel hostname) **before** building web on the server. Local `.env.docker` stays on `http://localhost:8080`.

## Configuration

### Local `.env.docker`

Keep current localhost demo values (`http://localhost:8080`, OTP expose on).

### Server `.env.docker` (never commit)

| Variable | Server / tunnel value |
|----------|------------------------|
| `VITE_PUBLIC_ORIGIN` | Public HTTPS origin (e.g. `https://live.ekum.app`) |
| `CORS_ORIGINS` | Same origin |
| `PUBLIC_MEDIA_BASE_URL` | `{origin}/media` |
| `VITE_API_BASE_URL` | `/api/v1` |
| `OTP_EXPOSE_DEV_CODE` | `true` |
| `NODE_ENV` | `development` |
| `JWT_*_SECRET` | Distinct random secrets (≥32 chars) |

**Trust posture:** shared demo — OTP visible in UI. Not production lock-down.

## Repo deliverables (implementation scope)

1. Runbook section: local vs server env, git pull deploy, tunnel point-at-8080, rebuild note for `VITE_*`.  
2. `.env.docker.example` comments for server/tunnel origins (no secrets).  
3. Optional example tunnel config snippet (e.g. Cloudflare `config.yml` → `http://127.0.0.1:8080`) under `docker/` — documented as optional operator tooling, not required in Compose.  
4. **No Caddy**; no host TLS compose service.

Local Compose port publish stays as today (`EKUM_HTTP_PORT` → host) so local Docker Desktop keeps working. Localhost-only bind is **not** required for this approach (tunnel can target published 8080 on loopback; prefer tunnel → `127.0.0.1:8080` and firewall 8080 from the public internet if the port is published on `0.0.0.0`).

## Out of scope

- Caddy / Certbot / host nginx TLS (Approach A dropped)  
- CI/CD  
- SMS OTP / production `OTP_EXPOSE=false`  
- Azure media  
- Requiring Remote SSH for coding (optional; operator may still SSH for pull/compose)

## Tests / verification

- Local: health + login OTP on `http://localhost:8080`  
- Server after pull/rebuild: health on `http://127.0.0.1:8080`  
- Via tunnel: SPA + OTP login on the public HTTPS URL; media loads under `{origin}/media`
