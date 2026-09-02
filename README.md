# Turbo Start Shopify

A production-ready headless commerce starter built with Shopify, Sanity, and Next.js — monorepo architecture with visual editing, type-safe data, and everything you need to ship fast.

Built by [Roboto Studio](https://robotostudio.com/services/shopify) and used in production client builds.

![Turbo Start Shopify](https://raw.githubusercontent.com/robotostudio/turbo-start-shopify/main/turbo-start-shopify-og.jpg)

**[Live demo →](https://turbo-start-shopify-web.vercel.app)**

[![Node.js](https://img.shields.io/badge/node-%3E%3D24.10-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11.24-orange)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Sanity](https://img.shields.io/badge/Sanity-v6-red)](https://www.sanity.io/)
[![Shopify](https://img.shields.io/badge/Shopify-Storefront%20API-green)](https://shopify.dev/docs/api/storefront)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Monorepo with Turborepo** — shared packages, fast builds, one `pnpm dev` to run everything
- **Next.js 16 App Router** — React Server Components, React Compiler, Turbopack, dynamic OG images
- **Sanity Studio v6** — visual editing, live preview, page builder, auto-redirects on slug change
- **Shopify Storefront API** — products, collections, cart, checkout, search
- **Type-safe end-to-end** — auto-generated Sanity types, Zod env validation, strict TypeScript
- **Tailwind CSS v4** — CSS-first config, OKLCH color tokens, dark mode, Shadcn components
- **SEO optimized** — dynamic metadata, OG images, sitemaps, JSON-LD structured data

## Architecture

### Data Flow

```
Shopify (products, collections, cart)
    ↕ Storefront API
Next.js 16 (App Router, RSC)
    ↕ GROQ queries via sanityFetch()
Sanity CMS (pages, blog, navigation, SEO)
```

### Monorepo Structure

```
apps/
  web/              → Next.js 16 frontend
  studio/           → Sanity Studio v6

packages/
  env/              → T3 env validation (Zod)
  sanity/           → Client, GROQ queries, live preview, generated types
  ui/               → Shadcn + Tailwind v4 primitives
  logger/           → Structured logger
  typescript-config/ → Shared TypeScript presets
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24.10
- [pnpm](https://pnpm.io/) 11.24+
- A [Shopify Partner](https://www.shopify.com/partners) account
- A [Sanity](https://www.sanity.io/) account

## Getting Started

### 1. Clone and install

```bash
npx create-sanity@latest -- --template robotostudio/turbo-start-shopify
```

Or clone manually:

```bash
git clone https://github.com/robotostudio/turbo-start-shopify.git
cd turbo-start-shopify
pnpm install
```

### 2. Set up Shopify

> **Warning:** Dev stores are permanent. They cannot be converted to a live store or transferred to a client. Use one for testing only.

1. Create a **Dev** store in the [Dev Dashboard](https://dev.shopify.com/dashboard/) under **Stores > Create store**. Enable generated test data if you want sample products
2. In the store admin, install the [Headless](https://apps.shopify.com/headless) channel, add a storefront, turn on the inventory permission under **Storefront API permissions**, and copy its **public access token**
3. Note your **store domain** (e.g. `your-store.myshopify.com`)
4. (Optional, seed script only) Create an app in the Dev Dashboard with the Admin API scopes `write_products`, `read_products`, `read_locations`, `write_discounts`, `read_discounts`, install it on your store, then [get a token](https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant) from its Client ID and secret. Tokens last 24 hours

### 3. Set up Sanity

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage)
2. Note your **project ID** and **dataset** name (default: `production`)
3. Under **API > Tokens**, create a read token and a write token

### 4. Configure environment variables

Copy the example files and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/studio/.env.example apps/studio/.env
```

See the [Environment Variables Reference](#environment-variables-reference) below for all required values.

### 5. Seed content

Import the included Sanity seed data:

```bash
cd apps/studio
npx sanity dataset import ./seed-data.tar.gz production --replace
```

This seed has no products. Products come from Shopify. Skip this if you enabled generated test data in step 2, otherwise seed some:

```bash
pnpm seed:shopify
pnpm verify:shopify
```

Each run adds 10 fake products across 5 collections. Details in [`apps/studio/scripts/seed-shopify/README.md`](apps/studio/scripts/seed-shopify/README.md).

### 6. Sync products into Sanity

Products live in Shopify but the site also needs them in Sanity, or product pages return 404. The [Sanity Connect](https://apps.shopify.com/sanity-connect) app copies them across:

1. Install Sanity Connect in your Shopify store admin
2. Point it at your Sanity project and `production` dataset
3. Choose **Start synchronizing now**

Product data is read-only in the Studio. Edit prices and variants in Shopify; edit the surrounding content in Sanity.

### 7. Start development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the Next.js app and [http://localhost:3333](http://localhost:3333) for Sanity Studio.

## Environment Variables Reference

### Web App (`apps/web/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Your Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Sanity dataset name (e.g. `production`) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Yes | API version date (default: `2025-08-29`) |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | Yes | Studio URL (`http://localhost:3333` for dev) |
| `SANITY_API_READ_TOKEN` | Yes | Sanity API token with read access |
| `SANITY_API_WRITE_TOKEN` | Yes | Sanity API token with write access |
| `SHOPIFY_STORE_DOMAIN` | Yes | Your Shopify store domain (e.g. `your-store.myshopify.com`) |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Yes | Shopify Storefront API public access token |
| `SHOPIFY_API_VERSION` | No | Storefront API version (default: `2025-01`) |
| `NEXT_PUBLIC_STORE_CURRENCY` | No | ISO 4217 code used to format prices (default: `GBP`) |
| `NEXT_PUBLIC_SITE_URL` | Off Vercel | Canonical origin, no trailing slash (e.g. `https://example.com`). On Vercel it is inferred; anywhere else, canonicals and the sitemap fall back to `localhost:3000` without it |

### Sanity Studio (`apps/studio/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SANITY_STUDIO_PROJECT_ID` | Yes | Same Sanity project ID as web |
| `SANITY_STUDIO_DATASET` | Yes | Same dataset name as web |
| `SANITY_STUDIO_TITLE` | Yes | Display title for the Studio |
| `SANITY_STUDIO_PRESENTATION_URL` | Prod | Frontend URL for live preview (auto-detects `localhost:3000` in dev) |
| `SANITY_STUDIO_PRODUCTION_HOSTNAME` | Deploy | Hostname for deployed Studio (e.g. `my-project` → `my-project.sanity.studio`) |
| `SANITY_STUDIO_API_VERSION` | No | Sanity API version |
| `SHOPIFY_STORE_DOMAIN` | Seeds | Your Shopify store domain (for seed scripts) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Seeds | 24-hour Admin API token from the client credentials grant in [step 2](#2-set-up-shopify) |

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps (web on :3000, studio on :3333) |
| `pnpm dev:web` | Start Next.js only |
| `pnpm dev:studio` | Start Sanity Studio only |
| `pnpm build` | Build all apps |
| `pnpm build:web` | Build Next.js only |
| `pnpm build:studio` | Build Sanity Studio only |
| `pnpm lint` | Lint with Biome |
| `pnpm format` | Format with Biome |
| `pnpm format:check` | Check formatting without writing |
| `pnpm check-types` | TypeScript type checking across all packages |
| `pnpm seed:shopify` | Seed Shopify with test products |
| `pnpm verify:shopify` | Print Shopify store health report |

## Deployment

### Deploy Next.js to Vercel

1. Push your repo to GitHub
2. Create a new [Vercel](https://vercel.com/) project and connect your repository
3. Set the **Root Directory** to `apps/web`
4. Add all required environment variables from the [web app table](#web-app-appsweb-env) above
5. Deploy

### Deploy Sanity Studio

**Automatic (recommended):** The included GitHub Actions workflow (`.github/workflows/deploy-sanity.yml`) deploys your Studio automatically when changes are pushed to `apps/studio/`.

Add these secrets to your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `SANITY_DEPLOY_TOKEN` | Sanity deploy token |
| `SANITY_STUDIO_PROJECT_ID` | Sanity project ID |
| `SANITY_STUDIO_DATASET` | Dataset name |
| `SANITY_STUDIO_TITLE` | Studio display title |
| `SANITY_STUDIO_PRESENTATION_URL` | Your deployed frontend URL |
| `SANITY_STUDIO_PRODUCTION_HOSTNAME` | Studio hostname (e.g. `my-project` → `my-project.sanity.studio`) |

PR preview builds are created automatically — each PR gets its own Studio at `<branch-name>-<hostname>.sanity.studio`.

> **Note:** When initializing with the Sanity CLI, the `.github` folder may not be included. If missing, copy the workflows from the [template repository](https://github.com/robotostudio/turbo-start-shopify/tree/main/.github).

**Manual:**

```bash
cd apps/studio
npx sanity deploy
```

### Shopify Configuration

Your live store needs the Headless channel too. Do not install the seed app on it.

## Customization

### Adding a New Page Builder Block

1. Create a Sanity schema in `apps/studio/schemaTypes/blocks/`
2. Register it in `apps/studio/schemaTypes/blocks/index.ts`
3. Add a GROQ fragment in `packages/sanity/src/query.ts` and include it in `pageBuilderFragment`
4. Regenerate types: `pnpm --filter studio type`
5. Create a React component in `apps/web/src/components/sections/`
6. Register it in `BLOCK_COMPONENTS` in `apps/web/src/components/pagebuilder.tsx`
7. Add the type to `PageBuilderBlockTypes` in `apps/web/src/types.ts`

### Extending Sanity Schemas

- **Document types:** `apps/studio/schemaTypes/documents/`
- **Object types:** `apps/studio/schemaTypes/objects/`
- Register new types in `apps/studio/schemaTypes/index.ts`
- Always run `pnpm --filter studio type` after schema changes to regenerate types

### Adding Shadcn Components

Components live in `packages/ui/src/components/`. Follow the existing Radix + CVA pattern and import via `@workspace/ui/components/<component-name>`.

### Shopify Seed Scripts

```bash
pnpm seed:shopify                  # Append 10 test products
pnpm seed:shopify -- --batch=50    # Append 50 test products
pnpm seed:shopify -- --clean       # Delete EVERY product, collection and discount in the store
pnpm verify:shopify                # Print store health report
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Module not found" errors** | Run `pnpm install` from the project root. Check path aliases in `tsconfig.json`. |
| **Sanity types out of date** | Run `pnpm --filter studio type` to regenerate. |
| **Visual editing not working** | Enable third-party cookies in your browser. Verify `SANITY_STUDIO_PRESENTATION_URL` is set. |
| **Shopify products not loading** | Verify `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` are correct. |
| **Seed script fails** | Check that `SHOPIFY_ADMIN_ACCESS_TOKEN` has the required Admin API scopes and has not expired (tokens last 24 hours). |
| **Build fails on Vercel** | Ensure all env vars are set and the root directory is `apps/web`. |
| **Draft mode / live preview issues** | Confirm `SANITY_API_READ_TOKEN` is set with correct permissions. |
| **Tailwind styles not applying** | Ensure `@import "tailwindcss"` is in your CSS entry point. Check `@workspace/ui` transpile config. |
| **Redirects not working** | Redirects are fetched from Sanity at build time. Redeploy after creating new redirects. |

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 16 | React framework (App Router, RSC, Turbopack) |
| [React](https://react.dev/) | 19 | UI library |
| [Sanity](https://www.sanity.io/) | 6 | Headless CMS with visual editing |
| [Shopify Storefront API](https://shopify.dev/docs/api/storefront) | 2025-01 | Commerce engine |
| [Turborepo](https://turbo.build/) | 2 | Monorepo build orchestration |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first CSS framework |
| [Shadcn UI](https://ui.shadcn.com/) | — | Accessible component primitives |
| [Biome](https://biomejs.dev/) | 2 | Linter and formatter |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| [Zod](https://zod.dev/) | 4 | Runtime env validation |
| [pnpm](https://pnpm.io/) | 11 | Package manager |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

[MIT](LICENSE) &copy; [Roboto Studio](https://robotostudio.com)
