# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

**Conventions, architecture rules and data flow live in [`AGENTS.md`](./AGENTS.md).** Read that first — it is the single source for how to write code here, and it is shared with Cursor and Codex. This file covers only what's specific to running the repo.

## Project Overview

Shopify + Sanity headless commerce starter — pnpm monorepo with Turborepo orchestration.

```
apps/
  web/          → Next.js 16 (App Router, Turbopack, React Compiler, RSC)
  studio/       → Sanity Studio v5 (custom structure, plugins, blueprints)
packages/
  env/          → @workspace/env — T3 env validation (Zod v4), client.ts + server.ts
  sanity/       → @workspace/sanity — Sanity client, GROQ queries, live preview, generated types
  ui/           → @workspace/ui — Shadcn (new-york style) + Tailwind v4 primitives
  logger/       → @workspace/logger — Logger class wrapping console.*
  typescript-config/ → shared tsconfig presets
```

## Commands

```bash
# Development (web :3000, studio :3333)
pnpm dev              # all apps
pnpm dev:web          # Next.js only
pnpm dev:studio       # Sanity Studio only

# Build
pnpm build            # all
pnpm build:web        # web only
pnpm build:studio     # studio only

# Quality
pnpm lint             # biome lint
pnpm format           # biome format --write
pnpm format:check     # biome format (check only)
pnpm check-types      # tsc --noEmit across all packages
pnpm --filter web test  # vitest — cart, markdown, shopify/product-card suites

# Studio schema tooling
pnpm --filter studio type      # schema extract + typegen → packages/sanity/src/sanity.types.ts
pnpm --filter studio extract   # schema extract only
npx sanity deploy              # from apps/studio

# Seed data
pnpm seed:shopify     # faker products → Shopify Admin API (needs SHOPIFY_ADMIN_ACCESS_TOKEN)
pnpm verify:shopify   # check store state
npx sanity dataset import ./seed-data.tar.gz production --replace   # from apps/studio
```

Tests are vitest, scoped to `apps/web`, and there is no `test` task in `turbo.json` — run them through the filter above.

## Skills

`.claude/skills/` holds tested playbooks. Prefer them over improvising:

| Skill | Use for |
|---|---|
| `add-pagebuilder-block` | Adding a block to the Sanity page builder |
| `enable-ai-assistant` | Adding the turbo-start-aisle AI shopping assistant |
| `generate-thumbnails-agentic` | Page builder block thumbnails via Playwright MCP |

## Sanity Studio

- **Singletons**: `homePage`, `blogIndex`, `collectionsIndex`, `settings`, `footer`, `navbar`
- **Page builder blocks**: defined in `apps/studio/schemaTypes/blocks/`, registered in `blocks/index.ts` — **that file is the source of truth for which blocks exist**
- **Shopify objects** (`apps/studio/schemaTypes/objects/shopify/`): synced read-only by Sanity Connect; never write to `store.*`
- **Blueprint** (`sanity.blueprint.ts`): auto-redirect function creating `redirect` documents on slug change
- **Structure**: `apps/studio/structure.ts`; presentation URL resolution in `apps/studio/location.ts`

## Other

- **SEO**: `getSEOMetadata()` in `apps/web/src/lib/seo.ts`, OG images via `/api/og`
- **AI agent surfaces**: content negotiation serves Markdown to agents (`apps/web/src/proxy.ts`, `app/api/markdown/route.ts`), plus `app/llms.txt/route.ts`
- **Visual editing**: `VisualEditing` from `next-sanity` + `createDataAttribute` per block; draft mode via `/api/presentation-draft`
- **Redirects**: fetched from Sanity at Next.js build time via `queryRedirects` in `next.config.ts`
- **Node** >=22, **pnpm** 10.28.0 (workspace protocol, catalog in `pnpm-workspace.yaml`)

## Environment Variables

**Web** (`apps/web/.env`): `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `NEXT_PUBLIC_SANITY_STUDIO_URL`, `NEXT_PUBLIC_STORE_CURRENCY`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`, `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_API_VERSION`

**Studio** (`apps/studio/.env`): `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, `SANITY_STUDIO_TITLE`, `SANITY_STUDIO_PRESENTATION_URL`, `SHOPIFY_ADMIN_ACCESS_TOKEN` (seed scripts only)

Validated via `@workspace/env` — see AGENTS.md for the four places a new variable must be registered.
