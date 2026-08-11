# Ekum

A B2B textile trade platform. Ekum digitises the way textile companies already
work on WhatsApp — discover, showcase, chat, and order — under a single
**one company account, no roles** model.

This repository is the Phase 1 monorepo: a React PWA and a NestJS API sharing a
single source of truth for the domain model.

## Stack

- **Web** — React + TypeScript + Vite + React Router + TanStack Query + Tailwind (PWA, mobile-first)
- **API** — NestJS + Prisma + PostgreSQL
- **Contracts** — `@ekum/domain-types` (shared enums, zod schemas, DTOs)
- **Infra** — Azure + GitHub Actions

The backend and domain model are designed to stay shared with a future Flutter
app, so business rules live server-side and the domain contract is centralised.

## Layout

```
ekum/
  apps/
    web/                 React + Vite PWA (mobile-first)
    api/                 NestJS API
      prisma/            Prisma schema and migrations (owned by the API)
  packages/
    domain-types/        Shared TS types, enums, and zod schemas
    config/              Shared eslint and tsconfig presets
  .github/workflows/     CI
```

## Prerequisites

- Node.js >= 20 (repo developed on Node 24)
- pnpm 11 (`npm i -g pnpm` or `corepack enable`)
- PostgreSQL 14+ (local or Docker)

## Getting started

```bash
pnpm install

# API
cp .env.example apps/api/.env      # then edit values
pnpm --filter @ekum/api prisma:generate
pnpm --filter @ekum/api dev        # http://localhost:3000/api/v1/health

# Web
pnpm --filter @ekum/web dev        # http://localhost:5173
```

## Workspace scripts

- `pnpm dev` — run all apps in parallel
- `pnpm build` — build every package and app
- `pnpm lint` — lint everything
- `pnpm typecheck` — type-check everything
- `pnpm test` — run tests
- `pnpm format` — format with Prettier

## Documentation

Product-functional docs (user actions, business rules, seed walkthroughs) live under
[`docs/features/`](docs/features/README.md). Start with
[shared concepts](docs/features/00-concepts.md).

## Conventions

- All server-owned state flows through the API; the web app keeps it in TanStack
  Query, never a duplicate global store.
- Valid enum values come from `@ekum/domain-types` so the web and API cannot drift.
- Business rules (visibility, contact protection, source masking) are enforced
  server-side, never trusted to the client.
