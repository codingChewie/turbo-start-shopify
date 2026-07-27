# AGENTS.md

Guidance for AI coding agents working in this repository. Shopify + Sanity headless commerce — pnpm monorepo, Turborepo.

Read this before writing code. For task-specific recipes, use the skills in `.claude/skills/`.

## Commands

```bash
pnpm dev                  # all apps (web :3000, studio :3333)
pnpm build                # all
pnpm lint                 # biome lint
pnpm format               # biome format --write
pnpm check-types          # tsc --noEmit across all packages
pnpm --filter web test    # vitest (cart, markdown, shopify/product-card)
pnpm --filter studio type # schema extract + typegen — run after ANY schema change
```

`pnpm --filter studio type` regenerates `packages/sanity/src/sanity.types.ts`. Any change to a Sanity schema or a GROQ query needs it, and code depending on the new types will not typecheck until it runs.

## Architecture rules

These are the ones that get written wrong. They are not style preferences — breaking them produces code that fails at runtime or build.

**1. Every Shopify call goes through `storefrontQuery()`**

`apps/web/src/lib/shopify/client.ts`. It returns a discriminated union, not a value:

```ts
type StorefrontQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; kind: "network" | "graphql" | "unknown" };
```

Always handle the `ok: false` branch. Never call `storefront.request()` directly — you lose the error classification and logging. The module is `server-only`; it cannot be imported into a client component.

**2. Page builder blocks cannot fetch Shopify**

`apps/web/src/components/pagebuilder.tsx` is a `"use client"` component, so every section under it is client-side. Blocks that need Shopify data get it injected: the page fetches server-side, keys results by block `_key`, and passes them down through `PageBuilderProps`.

Follow the `featuredProducts` precedent — see the `featuredProductsByKey` prop and its doc comment in `pagebuilder.tsx`, and `apps/web/src/components/sections/featured-products.tsx`. Adding a `fetch` to a section component is always wrong.

A block registered in the GROQ fragment but missing from `BLOCK_COMPONENTS` renders `UnknownBlockError`, not nothing. Both registries have to agree.

**3. Cart mutations go through the intent pipeline**

`apps/web/src/lib/cart/` — `intents.ts` (build the intent) → `engine.ts` (pure `applyIntent` / `fold` / `recalcTotals`) → `controller.ts` (`CartController`). Server actions live in `apps/web/src/app/cart/actions.ts`.

Never issue cart GraphQL directly; the optimistic-update and conflict-classification logic lives in the engine and gets bypassed. Cart mutations that change server state must call `invalidateCartCache()` from `apps/web/src/lib/cart/server.ts`.

**4. Generated files are never hand-edited**

`packages/sanity/src/sanity.types.ts` and `apps/studio/schema.json` are generated. Run the typegen command instead.

`packages/sanity/src/sanity.types.ts` is the only copy, exported as `@workspace/sanity/types`. Import types from there.

## Conventions

**Formatting** (Biome 2.3.8, `biome.jsonc` is authoritative) — 80 columns, 2-space indent, LF, double quotes including JSX, semicolons always, `es5` trailing commas.

**Import order** is enforced by Biome's organize-imports assist:

```
URL / protocol-prefixed / node:
external packages
                              ← blank line
@/… aliases and relative paths
```

**Lint** — `useConst` and `useTemplate` are errors. `noExplicitAny`, `noConsole`, `useExhaustiveDependencies` and `noExcessiveCognitiveComplexity` are warnings. `noConsole` is off under `**/scripts/**` and `packages/logger/`. Use `Logger` from `@workspace/logger` in app code rather than `console`.

**TypeScript** — strict, `noUncheckedIndexedAccess`, module `NodeNext`, target ES2022. Indexed access returns `T | undefined`; handle it rather than asserting.

**No barrel files.** Import from the module that defines the symbol.

**Path aliases** — `@/*` → `apps/web/src/*`, `@workspace/ui/*` → `packages/ui/src/*`, plus `@workspace/{env,sanity,logger}`.

**Env vars** are validated. Import from `@workspace/env/client` or `@workspace/env/server`, never raw `process.env`. Adding one means editing the zod schema, `experimental__runtimeEnv` (client only), `turbo.json` `globalEnv`, and the relevant `.env.example`.

**UI** — shadcn/ui (new-york) in `packages/ui/src/components/`. Add components with `pnpm dlx shadcn@latest add <name> -c packages/ui`; don't hand-write a primitive that the CLI can generate.

## Data flow

1. GROQ queries are defined with `defineQuery` in `packages/sanity/src/query.ts` — composable fragments for images, links, rich text, and page builder blocks.
2. `sanityFetch()` from `packages/sanity/src/live.ts` is used in RSC pages, and carries live-preview support.
3. Product and collection pages fetch Sanity and Shopify **in parallel** — Sanity holds editorial content and drives `generateStaticParams`; Shopify holds live price and inventory. See `apps/web/src/app/products/[handle]/page.tsx`.
4. Products exist in Sanity as `product` documents whose `store.*` subtree is synced read-only by Sanity Connect for Shopify. Don't write to `store.*`.

## Skills

`.claude/skills/` holds tested playbooks for recurring tasks. Prefer them over improvising:

- `add-pagebuilder-block` — add a block to the Sanity page builder
- `enable-ai-assistant` — add the turbo-start-aisle AI shopping assistant
- `generate-thumbnails-agentic` — page builder block thumbnails via Playwright MCP
