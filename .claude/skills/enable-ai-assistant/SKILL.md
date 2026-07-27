---
name: enable-ai-assistant
description: Use when adding the turbo-start-aisle AI shopping assistant to a turbo-start-shopify project — vendors packages/ai-commerce, wires the chat route and widget, adds the Sanity Agent Context schema, and guides the Sanity and AI Gateway setup. Use when the user says "add the AI assistant", "add the shopping assistant", "add aisle", or "add the chat widget".
---

# Enable the AI Shopping Assistant

## Overview

Ports the AI shopping assistant from [`robotostudio/turbo-start-aisle`](https://github.com/robotostudio/turbo-start-aisle) into a `turbo-start-shopify` project: a floating chat widget with page-context awareness, AI-driven collection filters, and inline product cards that add to the real Shopify cart.

The assistant reaches Sanity through **MCP (Agent Context)**, which is schema-aware at runtime. It does *not* query product data through `packages/sanity/src/query.ts`, so it does not drift against local GROQ fragments.

**Fallback behaviour is the point.** `AI_GATEWAY_API_KEY` and `SANITY_CONTEXT_MCP_URL` both default to an empty string, and `/api/chat` returns 503 until both are set. A project that ports the assistant but never finishes setup must still install, typecheck, build and serve normally. Never make these variables required.

## Source of truth

Aisle was reset to `turbo-start-shopify@9eb2555` in commit `f90fc3c`, then the AI layer was applied on top. **The delta is exactly `aisle@f90fc3c..e7af3e5`.** Treat that range as definitive — do not invent an integration, and do not copy from an older aisle commit.

Fetch files from `https://raw.githubusercontent.com/robotostudio/turbo-start-aisle/main/<path>`.

## Prerequisites

**STOP and check these before proceeding:**

1. **This is a `turbo-start-shopify` project.** `packages/sanity`, `packages/ui`, `packages/env` and `apps/studio` must exist. If not, stop.
2. **Working tree is clean.** `git status --short` must be empty. This skill edits shared files; the user needs a clean diff to review. If dirty, **STOP** and ask them to commit or stash.
3. **On a branch, not `main`.** If on the default branch, create one first.

## Before you start

Ask all of these and **wait for the user to answer before proceeding**:

1. **Do you have a Vercel AI Gateway account?** Free credits on signup at https://vercel.com/dashboard/ai-gateway. Needed for local dev; Vercel deployments authenticate via OIDC.
2. **Is your Sanity Studio deployed?** An Agent Context document cannot be created until it is. If not, Part D step 1 handles it.
3. **Which model and failover chain?** Default: Gemini 3 Flash → Claude Haiku 4.5 → GPT-5 Mini.
4. **Gate the widget behind `NEXT_PUBLIC_ENABLE_AI_ASSISTANT`?** Aisle itself does not — it ships the widget always and degrades to a 503. Recommend the flag here, so a user who ports but never configures doesn't get a dead chat bubble. Their call.
5. **How far has this project diverged from `turbo-start-shopify@9eb2555`?** Run `git log --oneline 9eb2555..HEAD -- apps/web/src/lib/markdown apps/web/src/lib/seo.ts apps/web/src/app/layout.tsx 2>/dev/null | head`. If those files have local changes, warn that Part B needs manual reconciliation rather than wholesale replacement.

## Process

```
Part A  →  new files          (pure additions, low risk)
Part B  →  edits to existing  (the risky half — extend, never replace)
Part C  →  install + typegen
Part D  →  guided manual setup (stop at each gate)
Part E  →  verify
```

---

## Part A: New files

Pure additions. Nothing here can break existing behaviour.

**1. Vendor the package.** Copy `packages/ai-commerce/` from aisle in full:

```
packages/ai-commerce/
  package.json
  tsconfig.json
  src/
    index.ts          system-prompt.ts    types.ts
    context/  lib/  mcp/  tools/  ui/
```

`src/ui/` is 7 components: `chat-panel`, `chat-widget`, `empty-state`, `message-input`, `message-list`, `product`, `text-part`.

**2. Record the source SHA.** Create `packages/ai-commerce/README.md` stating which aisle commit this was ported from and the date. Without it there is no way to ever diff or update the vendored copy. Get the SHA with:

```bash
curl -s https://api.github.com/repos/robotostudio/turbo-start-aisle/commits/main | grep '"sha"' | head -1
```

**3. Add the `textarea` primitive.** It is the one shadcn component `packages/ui` lacks and `src/ui/message-input.tsx` needs:

```bash
pnpm dlx shadcn@latest add textarea -c packages/ui
```

Use the CLI. Do not hand-write it.

**4. New app files** — copy from aisle:

| Path | Purpose |
|---|---|
| `apps/web/src/app/api/chat/route.ts` | AI Gateway handler, MCP client, failover chain |
| `apps/web/src/components/page-context-tracker.tsx` | Keeps the chat aware of the current route |
| `apps/web/src/components/ai-cart-bridge.tsx` | Bridges chat "add to cart" into `CartProvider` |
| `apps/studio/schemaTypes/documents/ai-assistant-settings.ts` | Agent Context settings document |
| `apps/studio/scripts/seed-ai-assistant.ts` | Creates the Agent Context document programmatically — saves the user doing it by hand in Part D |

---

## Part B: Edits to existing files

**This is the risky half.** Every file below already exists and is in use. **Extend it; never replace it wholesale.** Read the local file first, read aisle's version second, and apply only the delta.

**1. `apps/web/src/app/layout.tsx`** — mount the three components **inside `<Providers>`**, after `{modal}`:

```tsx
<PageContextTracker />
<AiCartBridge />
<ChatWidget currencyCode={env.NEXT_PUBLIC_STORE_CURRENCY} />
```

Ordering is not cosmetic — `PageContextTracker` needs `QueryClientProvider`, `AiCartBridge` needs `CartProvider`, and `ChatWidget` queries Sanity through react-query. All three are supplied by `Providers`. Mounting them outside it throws at runtime.

Also offset the existing `<Toaster>` so it doesn't sit under the fixed chat launcher — aisle uses `bottom: 5.5rem, right: 1rem`.

If the user chose the feature flag, wrap all three in the `env.NEXT_PUBLIC_ENABLE_AI_ASSISTANT` check.

**2. `apps/web/src/lib/markdown/{documents,page-builder,portable-text,shared}.ts`** — extended for assistant context capture.

**These have tests in `apps/web/src/lib/markdown/__tests__/`.** This is the highest-risk edit in the port. They are also shared with the `llms.txt` and `/api/markdown` surfaces that already ship in this repo. Run `pnpm --filter web test` immediately after editing, before moving on.

**3. `apps/web/src/app/api/markdown/route.ts` and `apps/web/src/app/llms.txt/route.ts`** — assistant-aware surfaces. Small deltas.

**4. `apps/web/src/lib/seo.ts`** — assistant metadata.

**5. `packages/sanity/src/query.ts`** — add the `aiAssistantSettings` fetch (~8 lines). This is the *only* GROQ the assistant needs. Do not add product fragments for it; product data comes through MCP.

**6. Studio wiring:**
- `apps/studio/schemaTypes/documents/index.ts` — register `aiAssistantSettings`
- `apps/studio/structure.ts` — add the Agent Context entry
- `apps/studio/sanity.config.ts` — plugin registration

**7. `packages/env/src/server.ts`** — both **optional**, empty-string defaults:

```ts
AI_GATEWAY_API_KEY: z.string().default(""),
SANITY_CONTEXT_MCP_URL: z.string().default(""),
```

If the user chose the flag, add `NEXT_PUBLIC_ENABLE_AI_ASSISTANT` to `packages/env/src/client.ts` — remembering the `experimental__runtimeEnv` entry, which client vars require and server vars don't.

**8. `turbo.json`** — add the new variables to `globalEnv`.

**9. `apps/web/.env.example`** — document them, including that the gateway key is local-dev-only because Vercel uses OIDC.

**10. `packages/ui/src/styles/globals.css`** — one line from aisle.

**11. `package.json` files**

`apps/web` gains `@workspace/ai-commerce`. `@tanstack/react-query` is already present and already wired — **do not add a second `QueryClientProvider`.**

`apps/studio` gains the `@sanity/agent-context` dependency **and four scripts that do not exist in this repo yet** — Part D depends on `schema:deploy`, so this is not optional:

```jsonc
"clean": "rm -rf dist schema.json",
"predeploy": "pnpm run clean",
"schema:deploy": "pnpm run clean && sanity schema extract --enforce-required-fields && sanity schema deploy",
"seed:ai-assistant": "sanity exec scripts/seed-ai-assistant.ts --with-user-token"
```

Note `sanity schema deploy` is a different command from `sanity deploy` — the first publishes the schema so Agent Context can read it, the second publishes the Studio. Both are needed.

---

## Part C: Install and generate

```bash
pnpm install
pnpm --filter studio type    # regenerates packages/sanity/src/sanity.types.ts
pnpm check-types
pnpm lint
pnpm --filter web test
```

All five must pass before Part D. If typegen reports schema errors, the `ai-assistant-settings` document is registered wrong — fix that before continuing.

---

## Part D: Guided manual setup

These steps need a human. **Stop at each gate and wait — do not guess values.**

**1. Deploy the Studio**

```bash
pnpm --filter studio run schema:deploy
pnpm --filter studio run deploy
```

Needs a Sanity account with `sanity.project/deployStudio` permission. If this fails with a login error, have the user run `pnpm --filter studio exec sanity logout` then `login`.

**2. Create the Agent Context document**

Fastest path — the seed script added in Part B:

```bash
pnpm --filter studio seed:ai-assistant
```

Or by hand, in the deployed Studio (`https://<hostname>.sanity.studio`):
1. **Agent Context → + Create new**
2. Enter a name, a slug (e.g. `shop-assistant`), and instructions for the assistant
3. **Publish** — an unpublished document will not resolve

Either way, confirm with the user what instructions the assistant should carry. They shape its tone and what it will and won't answer, and are worth getting right rather than defaulting.

**3. Copy the MCP URL**

```
https://api.sanity.io/v2026-04-30/agent-context/<projectId>/<dataset>/<slug>
```

**4. Get an AI Gateway key** from https://vercel.com/dashboard/ai-gateway.

**5. Write both into `apps/web/.env.local`**

```bash
SANITY_CONTEXT_MCP_URL=https://api.sanity.io/v2026-04-30/agent-context/<projectId>/<dataset>/<slug>
AI_GATEWAY_API_KEY=<key>
```

**`.env.local`, not `.env`.** Next.js precedence means `.env` will be shadowed and the user will get a confusing 503. Confirm `.env.local` is gitignored.

---

## Part E: Verify

Run these in order. Step 2 is the one that matters most.

1. `pnpm install && pnpm check-types && pnpm lint && pnpm --filter web test` — all clean.
2. **Negative test — do this before the happy path.** With no AI env vars set (and the flag off, if used): `pnpm build` succeeds and the site serves with no chat bubble. A user who ignores the assistant must not end up with a broken project. If this fails, the env vars were made required — go back to Part B step 7.
3. `pnpm dev` → open http://localhost:3000, click the chat bubble, ask *"show me products under $50"*. Expect real products from the Sanity dataset.
4. Ask it to filter a collection. Confirm it actually drives `apps/web/src/components/collection/filter-panel.tsx`.
5. Add to cart from an inline product card. Confirm the line reaches the real Shopify cart, not a local mock.
6. Visit `/llms.txt` and a `/api/markdown` URL — both were modified in Part B and must still render.
7. Check https://vercel.com/dashboard/ai-gateway → Logs for the request. To test failover, set a bogus primary model and confirm it falls through.
8. Confirm `packages/ai-commerce/README.md` records the aisle SHA.

---

## Common Mistakes

- **Mounting the AI components outside `<Providers>`.** Throws at runtime — they need `QueryClientProvider` and `CartProvider`.
- **Adding a second `QueryClientProvider`.** `apps/web/src/components/providers.tsx` already has one.
- **Making the env vars required.** Breaks the build for everyone who hasn't set up the assistant. They default to `""`; the route returns 503.
- **Writing to `.env` instead of `.env.local`.** Next.js precedence silently shadows it.
- **Replacing the markdown lib files wholesale.** They are shared with `llms.txt` and `/api/markdown`. Extend only, then run the tests.
- **Hand-editing `packages/sanity/src/sanity.types.ts`.** Generated — run `pnpm --filter studio type`.
- **Hand-writing `textarea.tsx`.** Use the shadcn CLI.
- **Adding GROQ fragments for product data.** Products come through MCP. `query.ts` changes only for the settings document.
- **Copying `SHOPIFY_API_VERSION` from aisle.** Aisle defaults to `2026-04`, this repo to `2025-01`. Not part of the AI layer — leave it alone.
- **Forgetting to publish the Agent Context document.** A draft will not resolve, and the failure looks like a bad MCP URL.

## Red Flags — STOP If You Notice These

- **You are about to commit `.env.local` or paste a key into source.** Never. Both belong in `.env.local` only.
- **You are about to echo a raw error from `/api/chat` to the client.** The route deliberately does not — raw errors can leak `SANITY_API_READ_TOKEN` or `AI_GATEWAY_API_KEY`.
- **You are removing the 4MB request cap or the 8-step tool ceiling.** Both exist to bound spend on an endpoint that costs real money per call. Keep them.
- **The user is about to deploy this publicly.** `/api/chat` is **unauthenticated and consumes paid AI Gateway and MCP resources** — aisle's own source carries this warning. Tell the user plainly, before they deploy, that they need auth and rate limiting first. Do not bury it in a summary.
- **`pnpm --filter web test` fails after Part B.** You broke the markdown lib. Fix it before continuing; do not proceed and hope.
- **The project has diverged far from `9eb2555`.** The Part B files have local changes. Reconcile by hand and tell the user which files needed judgement calls.
