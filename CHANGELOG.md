# Changelog

All notable changes to Ekum are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
with a `0.x.y` release line while the product is in beta.

Release version lives in the root [`VERSION`](./VERSION) file (not hardcoded in the PWA or API UI).
Each Docker/Vite build also gets a unique **build id**, Git commit SHA, and build timestamp.

---

## [Unreleased]

### Key changes

- 

### Known issues

- 

---

## [0.1.0] — 2026-10-19

### Key changes

- Version identity: semver from `VERSION`, per-build metadata baked into Docker images.
- Public API `GET /api/v1/version`; Settings → About Ekum shows App and API identity.
- Non-production builds show a discreet TEST badge (version + short commit).
- Docker images tagged with release version and `sha-<shortSha>` (not only `latest`).

### Known issues

- Images are tagged locally on Compose rebuild; CI does not yet push to a registry.
