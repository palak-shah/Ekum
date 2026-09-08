# Cloudflare Tunnel (optional)

Expose the Compose Nginx gateway for remote browser tests. **Not** part of `docker compose` — run `cloudflared` on the host.

Full server workflow: [`docs/docker.md`](../../docs/docker.md) § Server (git pull + tunnel).

## Setup

1. Install [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) on the Linux server.
2. Authenticate and create a tunnel, e.g. `cloudflared tunnel create ekum-live`.
3. Copy [`cloudflared.config.example.yml`](./cloudflared.config.example.yml) to a private path (e.g. `/etc/cloudflared/config.yml`). Fill in `TUNNEL_UUID` and `credentials-file`.
4. In Cloudflare DNS / Zero Trust, route **`live.ekum.app`** to this tunnel.
5. Run:

```bash
cloudflared tunnel --config /etc/cloudflared/config.yml run
```

Ingress target is **`http://127.0.0.1:8080`** (Compose Nginx).

## Env before rebuild

On the server, set `.env.docker` so public origins match the tunnel hostname **before** building web:

- `VITE_PUBLIC_ORIGIN=https://live.ekum.app`
- `CORS_ORIGINS=https://live.ekum.app`
- `PUBLIC_MEDIA_BASE_URL=https://live.ekum.app/media`

Then `docker compose up -d --build` (Vite bakes `VITE_*` at image build).

## Quick try without custom DNS

```bash
cloudflared tunnel --url http://127.0.0.1:8080
```

That prints an ephemeral `*.trycloudflare.com` URL. Same-origin `/api/v1` still works; set `CORS_ORIGINS` (and rebuild if you rely on baked `VITE_PUBLIC_ORIGIN`) to that origin if the browser origin must match.
