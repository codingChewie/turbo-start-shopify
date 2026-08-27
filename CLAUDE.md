# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shopify + Sanity headless commerce starter — pnpm monorepo with Turborepo orchestration.

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

# Studio schema tooling (run from apps/studio)
npx sanity schema extract --enforce-required-fields --force
npx sanity typegen generate
npx sanity deploy

# Seed data (run from apps/studio)
npx sanity dataset import ./seed-data.tar.gz production --replace
```

Tests run with Vitest in `apps/web` (`pnpm test`, or `pnpm --filter web test`).
Specs live in `__tests__/` directories and are `.test.ts` — components are
exercised with `createElement` + `renderToStaticMarkup`, not JSX, because the
config's include glob matches `.ts` only.

## Architecture

```
apps/
  web/          → Next.js 16 (App Router, Turbopack, React Compiler, RSC)
  studio/       → Sanity Studio v6 (custom structure, plugins, blueprints)
packages/
  env/          → @workspace/env — T3 env validation (Zod v4), client.ts + server.ts
  sanity/       → @workspace/sanity — Sanity client, GROQ queries, live preview, generated types
  ui/           → @workspace/ui — Shadcn (new-york style) + Tailwind v4 primitives
  logger/       → @workspace/logger — Logger class wrapping console.*
  typescript-config/ → shared tsconfig presets
```

### Data Flow

1. **GROQ queries** defined with `defineQuery` in `packages/sanity/src/query.ts` — composable fragments for images, links, rich text, page builder blocks
2. **`sanityFetch()`** from `packages/sanity/src/live.ts` (via `next-sanity/defineLive`) — used in RSC pages for data fetching with live preview support
3. **Page Builder** (`apps/web/src/components/pagebuilder.tsx`) — client component mapping `_type` → React section component via `BLOCK_COMPONENTS` record. Uses `useOptimistic` from `@sanity/visual-editing` for live editing
4. **Section components** in `apps/web/src/components/sections/` — `hero`, `cta`, `faq-accordion`, `feature-cards-with-icon`, `subscribe-newsletter`, `image-link-cards`
5. **Types** auto-generated: run `pnpm --filter studio type` → outputs to `packages/sanity/src/sanity.types.ts`

### Adding a New Page Builder Block

1. Create Sanity schema in `apps/studio/schemaTypes/blocks/`
2. Register it in `apps/studio/schemaTypes/index.ts`
3. Add GROQ fragment in `packages/sanity/src/query.ts` and include in `pageBuilderFragment`
4. Run `pnpm --filter studio type` to regenerate types
5. Create React component in `apps/web/src/components/sections/`
6. Register in `BLOCK_COMPONENTS` map in `apps/web/src/components/pagebuilder.tsx`
7. Add type to `PageBuilderBlockTypes` union in `apps/web/src/types.ts`

### Sanity Studio Structure

- **Documents**: `blog`, `page`, `faq`, `author`, `product`, `collection`, `productVariant`, `redirect`
- **Singletons**: `homePage`, `blogIndex`, `settings`, `footer`, `navbar`
- **Shopify objects**: `shopifyProduct`, `shopifyProductVariant`, `shopifyCollection`, `inventory`, `option`, `priceRange`, etc.
- **Blueprint** (`sanity.blueprint.ts`): auto-redirect function — creates redirect documents on slug change

### Key Patterns

- **Env validation**: `@workspace/env/client` and `@workspace/env/server` — validated imports, never raw `process.env`
- **Path aliases**: `@/*` → `apps/web/src/*`, `@workspace/ui/*` → `packages/ui/src/*`
- **SEO**: `getSEOMetadata()` in `apps/web/src/lib/seo.ts`, OG images via `/api/og` route
- **Visual editing**: `VisualEditing` from `next-sanity` + `createDataAttribute` per block, draft mode via `/api/presentation-draft`
- **Redirects**: fetched from Sanity at Next.js build time via `queryRedirects` in `next.config.ts`

## Tooling

- **Node**: >=24.10
- **Package manager**: pnpm 11.24.0 (workspace protocol, catalog for shared versions in `pnpm-workspace.yaml`)
- **Formatter/Linter**: Biome 2.5.10 — double quotes, semicolons, 2-space indent, 80 char width, trailing commas es5
- **Import order** (Biome): URL/Node → packages → blank line → aliases/paths
- **TypeScript**: strict, `noUncheckedIndexedAccess`, module NodeNext, target ES2022
- **Tailwind CSS v4**: CSS-first config via `@import "tailwindcss"`, OKLCH color tokens, dark mode via `@custom-variant`
- **React Compiler**: enabled via `babel-plugin-react-compiler` in Next.js config
- **Sanity Studio pins**: `sanity`, `@sanity/vision` and the six plugins in `apps/studio/package.json` are pinned to exact versions, not ranges. The Studio is held on the `@sanity/ui` v3 line and every package crosses to v4 at a patch bump, so a caret or tilde would put a second `@sanity/ui` in the tree. What pins the whole line is `sanity-plugin-lucide-icon-picker`: 1.0.3 is its latest and last release, and it imports `Popover`/`Menu` from the `@sanity/ui` root and `TrashIcon`/`SyncIcon`/`EllipsisHorizontalIcon` from the `@sanity/icons` root — all moved to subpaths in `@sanity/ui` v4 / `@sanity/icons` v5, so `sanity build` fails with `MISSING_EXPORT` the moment the Studio crosses. Crossing means replacing that plugin (it backs the `lucide-icon` field type used by navbar, footer and the icon cards). Do not loosen them or bump a Sanity plugin to `latest` without reading the comment in `pnpm-workspace.yaml` first; after any install, `pnpm --filter studio why @sanity/ui` must show 3.x only.

## Environment Variables

**Web** (`apps/web/.env`):
- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `NEXT_PUBLIC_SANITY_STUDIO_URL`
- `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`

**Studio** (`apps/studio/.env`):
- `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, `SANITY_STUDIO_TITLE`, `SANITY_STUDIO_PRESENTATION_URL`
