# Live server Docker (git pull + tunnel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document and lightly scaffold shipping the existing Compose stack to a Linux server via git pull/rebuild, with an optional tunnel for HTTPS browser tests — no Caddy.

**Architecture:** Local Docker stays the day-to-day test surface. Server uses the same `docker-compose.yml`; a separate server `.env.docker` points CORS/media/`VITE_*` at the tunnel public origin. An example Cloudflare Tunnel config (optional) proxies to `http://127.0.0.1:8080`. Compose service graph is unchanged.

**Tech Stack:** Docker Compose, Nginx gateway (existing), Cloudflare Tunnel example (`cloudflared`), Markdown runbooks

## Global Constraints

- No Caddy / Certbot / host nginx TLS in this work
- OTP on screen for demos: `OTP_EXPOSE_DEV_CODE=true` and `NODE_ENV=development`
- Prefer hostname `https://live.ekum.app` when tunnel DNS supports it; otherwise document ephemeral tunnel URLs
- Never commit real JWT secrets or server `.env.docker`
- Local `http://localhost:8080` workflow must keep working
- Spec: `docs/superpowers/specs/2026-09-08-live-server-docker-deploy-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `docs/docker.md` | Canonical Docker runbook; add server + tunnel section |
| `.env.docker.example` | Comments for local vs server/tunnel origins |
| `docker/tunnel/cloudflared.config.example.yml` | Optional tunnel → `127.0.0.1:8080` |
| `docker/README.md` | Short pointer to server section in `docs/docker.md` |
| Spec status | Already Approved |

No Compose port-bind change required (localhost-only bind was dropped with Caddy).

---

### Task 1: Example Cloudflare Tunnel config

**Files:**
- Create: `docker/tunnel/cloudflared.config.example.yml`
- Create: `docker/tunnel/README.md` (short: install cloudflared, copy config, point DNS)

**Interfaces:**
- Consumes: Compose Nginx on host port `8080` (default)
- Produces: Documented tunnel service URL `http://127.0.0.1:8080`

- [ ] **Step 1: Add example config**

Create `docker/tunnel/cloudflared.config.example.yml`:

```yaml
# Optional operator tooling — not started by docker compose.
# Copy to a private path on the server (e.g. /etc/cloudflared/config.yml).
# Replace TUNNEL_UUID and credentials-file with values from `cloudflared tunnel create`.
#
# DNS: route live.ekum.app → this tunnel (Cloudflare Zero Trust / dashboard),
# then set server .env.docker origins to https://live.ekum.app and rebuild web.

tunnel: TUNNEL_UUID
credentials-file: /etc/cloudflared/TUNNEL_UUID.json

ingress:
  - hostname: live.ekum.app
    service: http://127.0.0.1:8080
  - service: http_status:404
```

- [ ] **Step 2: Add short tunnel README**

Create `docker/tunnel/README.md` covering:

1. Install `cloudflared` on the server  
2. `cloudflared tunnel create ekum-live` (or reuse)  
3. Copy example config; fill UUID + credentials path  
4. Route `live.ekum.app` to the tunnel  
5. Run: `cloudflared tunnel --config /path/to/config.yml run`  
6. Reminder: server `.env.docker` must use `https://live.ekum.app` **before** `docker compose build` / `up --build` for web  
7. Quick check without custom DNS: `cloudflared tunnel --url http://127.0.0.1:8080` (ephemeral URL; rebuild web with that origin only if you need matching `VITE_PUBLIC_ORIGIN` / CORS — same-origin `/api/v1` still works; CORS must include the browser origin)

- [ ] **Step 3: Verify files exist and contain `127.0.0.1:8080`**

Run (from repo root, PowerShell):

```powershell
Select-String -Path docker/tunnel/* -Pattern '127.0.0.1:8080' | Select-Object -First 5
```

Expected: matches in both example yml and README.

- [ ] **Step 4: Commit** (only if user asked to commit; otherwise stop after files exist)

```bash
git add docker/tunnel/cloudflared.config.example.yml docker/tunnel/README.md
git commit -m "docs: add optional Cloudflare Tunnel example for live Docker"
```

---

### Task 2: `.env.docker.example` server/tunnel comments

**Files:**
- Modify: `.env.docker.example`

**Interfaces:**
- Consumes: Task 1 hostname `live.ekum.app`
- Produces: Commented server block operators can copy mentally (still localhost defaults active)

- [ ] **Step 1: Add a commented “Server / tunnel” block** after the Public URL section in `.env.docker.example`

Keep the active defaults as localhost. Append comments like:

```bash
# --- Server / tunnel (on the Linux box only; do not commit real .env.docker) ---
# After DNS/tunnel gives you a stable HTTPS origin, set BEFORE rebuilding web:
# EKUM_HTTP_PORT=8080
# CORS_ORIGINS=https://live.ekum.app
# PUBLIC_MEDIA_BASE_URL=https://live.ekum.app/media
# VITE_API_BASE_URL=/api/v1
# VITE_PUBLIC_ORIGIN=https://live.ekum.app
# NODE_ENV=development
# OTP_EXPOSE_DEV_CODE=true
# JWT_ACCESS_SECRET=<openssl rand -base64 48>
# JWT_REFRESH_SECRET=<openssl rand -base64 48>
# See docs/docker.md § Server (git pull + tunnel) and docker/tunnel/README.md
```

- [ ] **Step 2: Confirm localhost defaults remain the uncommented values**

Run:

```powershell
Select-String -Path .env.docker.example -Pattern '^CORS_ORIGINS=|^VITE_PUBLIC_ORIGIN=|^OTP_EXPOSE_DEV_CODE='
```

Expected: `localhost:8080` and `OTP_EXPOSE_DEV_CODE=true` still active (not only in comments).

- [ ] **Step 3: Commit** (if user requested commits)

```bash
git add .env.docker.example
git commit -m "docs: note server/tunnel env overrides in .env.docker.example"
```

---

### Task 3: Runbook in `docs/docker.md` + pointer in `docker/README.md`

**Files:**
- Modify: `docs/docker.md`
- Modify: `docker/README.md` (if present; else create a short stub pointing to `docs/docker.md`)

**Interfaces:**
- Consumes: Task 1 paths `docker/tunnel/*`, Task 2 comment block
- Produces: Operator runbook matching the approved spec workflow

- [ ] **Step 1: Replace or narrow the Security note that says “Put a real reverse proxy… for anything beyond localhost”**

In `docs/docker.md` Security notes, change the TLS line so it does not mandate Caddy; point to the new Server section and tunnel instead. Example replacement bullet:

```markdown
- This Compose stack does **not** terminate TLS. For a shared demo on a Linux box, use **git pull + Compose** and an optional **tunnel** (see § Server below) — not a required host Caddy install.
```

- [ ] **Step 2: Add section `## Server (git pull + tunnel)`** before or after “Local `pnpm dev` vs Docker”

Content must include:

1. **Local vs server:** develop/test on `http://localhost:8080`; server is not the daily IDE target.  
2. **Ship:** commit → push → SSH → `git pull` → edit server `.env.docker` (tunnel origin + new JWTs) → `docker compose up -d --build` (or `pnpm docker:up` if pnpm available) → optional `pnpm docker:seed`.  
3. **Vite bake warning:** change `VITE_PUBLIC_ORIGIN` / related → must rebuild web image.  
4. **Tunnel:** link `docker/tunnel/README.md`; ingress to `http://127.0.0.1:8080`; prefer `live.ekum.app`.  
5. **Firewall tip:** if Nginx publishes `0.0.0.0:8080`, restrict public access to 8080; tunnel should use loopback.  
6. **Verify:** `curl -s http://127.0.0.1:8080/api/v1/health` on server; browser via tunnel HTTPS; OTP Dev code on login.  
7. **Troubleshooting rows** for: CORS/origin mismatch after tunnel URL change; stale web image; forgot rebuild after env change.

- [ ] **Step 3: Update File map table** in `docs/docker.md` to include `docker/tunnel/`

- [ ] **Step 4: Point `docker/README.md` at `docs/docker.md` server section** (one short paragraph + links to tunnel example)

- [ ] **Step 5: Spec self-check — skim approved spec deliverables**

Confirm each deliverable is covered:

| Spec deliverable | Where |
|------------------|--------|
| Runbook local vs server, git pull, tunnel, VITE rebuild | `docs/docker.md` § Server |
| `.env.docker.example` comments | Task 2 |
| Optional tunnel example | `docker/tunnel/` |
| No Caddy | No Caddy files added; security note updated |

- [ ] **Step 6: Commit** (if user requested commits)

```bash
git add docs/docker.md docker/README.md docs/superpowers/specs/2026-09-08-live-server-docker-deploy-design.md
git commit -m "docs: server git-pull + tunnel runbook for Docker demo"
```

---

### Task 4: Manual verification checklist (no code)

**Files:** none (operator checklist recorded at end of `docs/docker.md` Server section if not already)

- [ ] **Step 1: Ensure the Server section lists this checklist verbatim**

```markdown
### Verification checklist

- [ ] Local: `http://localhost:8080/api/v1/health` → ok; login shows Dev code
- [ ] Server (SSH): `curl -s http://127.0.0.1:8080/api/v1/health` → ok after pull/rebuild
- [ ] Tunnel: open public HTTPS URL; SPA loads; login shows Dev code
- [ ] Media: a seeded or uploaded image URL uses `{public origin}/media/...`
```

- [ ] **Step 2: Do not mark the feature “done” in chat until the operator has run local health at least once in this environment** (server/tunnel may be operator-only)

Run locally if Docker is up:

```bash
curl -s http://localhost:8080/api/v1/health
```

Expected: JSON with `"status":"ok"` (or document “stack not running” if down).

---

## Plan self-review

1. **Spec coverage:** Topology (tunnel→8080), workflow git pull, env table, OTP demo, deliverables 1–4, out-of-scope Caddy — all mapped to Tasks 1–3.  
2. **Placeholders:** none intentionally left.  
3. **Consistency:** hostname `live.ekum.app`, service `http://127.0.0.1:8080`, OTP/`NODE_ENV` match the approved spec.
