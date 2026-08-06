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

Aisle periodically resets its base to a `turbo-start-shopify` commit, then re-applies the AI layer on top. **Never hardcode that commit** — it goes stale within weeks. Derive it every run.

Clone aisle and find its sync point:

```bash
git clone --depth 50 https://github.com/robotostudio/turbo-start-aisle.git /tmp/aisle-src
git -C /tmp/aisle-src log --oneline -15   # look for "sync upstream <sha>" or "Reset foundation to <sha>"
git -C /tmp/aisle-src rev-parse HEAD      # record this — it goes in the vendored README
```

Then diff aisle against the local project **file by file** and apply only what is genuinely the AI layer. A full clone beats fetching raw files one at a time.

### Not every difference is the AI layer

This is the trap. The diff between aisle and this project contains three kinds of change, and only the first should be ported:

| Kind | Example | Action |
|---|---|---|
| **AI layer** | `structure.ts` AI Assistant list, `server.ts` env vars | port |
| **Aisle's branding** | `seo.ts` title/keywords/Twitter handle, `llms.txt` `SITE_TITLE` | **never port — it overwrites the user's site identity** |
| **Unrelated upstream work** | `client.ts` URL validation, `SHOPIFY_API_VERSION` bumps | don't port here; mention it to the user as a separate cherry-pick |

Before copying any shared file wholesale, read the diff and classify it. If a hunk does not mention AI, chat, agent, or the assistant, it is not this skill's business.

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
5. **How far has this project diverged from aisle's sync point?** With `<sync-sha>` from the step above, run:

   ```bash
   git log --oneline <sync-sha>..HEAD -- apps/web/src/app/layout.tsx apps/studio/structure.ts packages/sanity/src/query.ts
   ```

   Empty means the shared files can be taken wholesale. Any output means reconcile those files by hand instead.

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
pnpm dlx shadcn@latest add textarea -c packages/ui --yes
```

Use the CLI. Do not hand-write it. (Check first — a later `turbo-start-shopify` may already ship it.)

**3b. Install dependencies now — before any other edit.**

Nothing below will typecheck or even load until these exist. Doing this late is the single most common way to get stuck.

```bash
pnpm --filter studio add "@sanity/agent-context@^0.1.0"
pnpm --filter web add "ai@^6.0.0" "@ai-sdk/gateway@^3.0.112" "@ai-sdk/react@^3.0.0"
```

Why each matters:
- `@sanity/agent-context` — `sanity.config.ts` imports `agentContextPlugin`. Without it the Studio config throws, **`sanity schema extract` fails, and typegen dies with a misleading "Failed to load configuration file"**.
- `ai`, `@ai-sdk/*` — `apps/web/src/app/api/chat/route.ts` imports them directly. They are dependencies of `packages/ai-commerce`, and pnpm's strict `node_modules` will **not** hoist them to `apps/web`. Symptom: `Cannot find module 'ai'`.

Also add the workspace link in `apps/web/package.json`:

```jsonc
"@workspace/ai-commerce": "workspace:*"
```

Then `pnpm install`.

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

If the user chose the feature flag, wrap all three in the `env.NEXT_PUBLIC_ENABLE_AI_ASSISTANT` check.

Also offset the existing `<Toaster>` so it doesn't sit under the fixed chat launcher. Aisle uses `bottom: 5.5rem, right: 1rem`.

**Make that offset conditional on the same flag.** Aisle has no flag, so its offset is unconditional and porting it verbatim leaves toasts floating above an empty corner whenever the assistant is off. Tie the offset to the flag, not to the port.

**2. `packages/sanity/src/query.ts`** — add the `aiAssistantSettings` fetch (~8 lines). This is the *only* GROQ the assistant needs. Do not add product fragments for it; product data comes through MCP.

**3. Studio wiring:**
- `apps/studio/schemaTypes/documents/index.ts` — register `aiAssistantSettings`
- `apps/studio/structure.ts` — add the AI Assistant list (`aiAssistantSettings` singleton + `sanity.agentContext` list)
- `apps/studio/sanity.config.ts` — `agentContextPlugin()` + add `aiAssistantSettings` to the singleton list

**4. `packages/ui/src/styles/globals.css`** — add the Tailwind source glob for the vendored package:

```css
@source "../../../ai-commerce/**/*.{ts,tsx}";
```

Without it Tailwind never scans `ai-commerce`, and **the entire chat UI renders unstyled** — no error, no warning, just a broken-looking widget.

### Files that look like they need editing but do not

Verified by diffing a synced aisle against this project. Check each before assuming:

| File | Reality |
|---|---|
| `apps/web/src/lib/markdown/*.ts` | **Zero delta.** These came *from* turbo-start-shopify; once aisle syncs upstream they are identical. Do not touch them, and do not budget risk for them |
| `apps/web/src/app/api/markdown/route.ts` | Zero delta, same reason |
| `apps/web/src/lib/seo.ts` | Delta is **aisle's branding** — title, description, `@akintola4`, aisle keywords. **Porting it overwrites the user's site identity.** Skip |
| `apps/web/src/app/llms.txt/route.ts` | Delta is one line: `SITE_TITLE`. Branding. Skip |
| `packages/env/src/client.ts` | Delta is unrelated upstream work (API-version regex, Studio-URL trailing-slash strip). Not the AI layer — mention it as a separate cherry-pick. Only touch this file if the user chose the feature flag |
| `packages/env/src/server.ts` → `SHOPIFY_API_VERSION` | Aisle bumps it. Not the AI layer. **Leave the local value alone** |

If a diff in this table is non-zero in your run, re-read it before acting — aisle may have genuinely changed something. The rule is classify-then-port, not copy-then-hope.

**5. `packages/env/src/server.ts`** — add these two, and **only** these two. Both **optional**, empty-string defaults:

```ts
AI_GATEWAY_API_KEY: z.string().default(""),
SANITY_CONTEXT_MCP_URL: z.string().default(""),
```

Optional is load-bearing: `/api/chat` returns 503 until both are set, so an unconfigured project still installs, typechecks and builds. Making them required breaks the build for everyone who ports but doesn't configure.

If the user chose the flag, add `NEXT_PUBLIC_ENABLE_AI_ASSISTANT` to `packages/env/src/client.ts`:

```ts
NEXT_PUBLIC_ENABLE_AI_ASSISTANT: z
  .enum(["true", "false", ""])
  .default("false")
  .transform((value) => value === "true"),
```

Two details that both bite:
- Client vars need an `experimental__runtimeEnv` entry. Server vars don't. Omitting it means the value is always `undefined` at runtime.
- The `""` member is deliberate. Without it a bare `NEXT_PUBLIC_ENABLE_AI_ASSISTANT=` line in an env file fails the build.

**6. `turbo.json`** — add all three to `globalEnv`: `AI_GATEWAY_API_KEY`, `SANITY_CONTEXT_MCP_URL`, and the flag if used.

**7. `apps/web/.env.example`** — document them, including that the gateway key is local-dev-only because Vercel uses OIDC.

**8. `apps/studio/package.json` scripts.** Four scripts that do not exist in this repo — Part D depends on `schema:deploy`, so this is not optional:

```jsonc
"clean": "rm -rf dist schema.json",
"predeploy": "pnpm run clean",
"schema:deploy": "pnpm run clean && sanity schema extract --enforce-required-fields && sanity schema deploy",
"seed:ai-assistant": "sanity exec scripts/seed-ai-assistant.ts --with-user-token"
```

Note `sanity schema deploy` is a different command from `sanity deploy` — the first publishes the schema so Agent Context can read it, the second publishes the Studio. Both are needed.

---

## Part C: Generate and check

Dependencies were installed in Part A step 3b. If you skipped that, go back — the first two commands here will fail.

```bash
pnpm --filter studio type    # regenerates packages/sanity/src/sanity.types.ts
pnpm check-types
pnpm lint
pnpm --filter web test
```

**Two failures seen in a real run, both with misleading messages:**

| Symptom | Real cause |
|---|---|
| `Cannot find module 'ai'` in `api/chat/route.ts` | `ai` / `@ai-sdk/*` are deps of `packages/ai-commerce`, not `apps/web`. pnpm won't hoist them |

### `SchemaExtractionError: Failed to load configuration file`

**This message names no cause and has more than one.** Do not guess — unmask it first:

```bash
cd apps/studio && pnpm exec tsx -e 'import("./sanity.config.ts").catch(e => console.log(e.message))'
```

1. **`@sanity/agent-context` not installed** — the config imports `agentContextPlugin` and throws on load. This is the cause this skill actually introduces, and installing the dep before typegen is why step 3b orders it that way.
2. **Missing env file** — a fresh clone ships only `.env.example`. Extraction reaches the Sanity API to validate the project, so it needs a real `SANITY_STUDIO_PROJECT_ID`; the failure reads `Configuration must contain projectId`, and a placeholder ID gives `CorsOriginError`. Both `apps/studio` and `apps/web` need a real env file. Either `.env` or `.env.local` works.

If unmasking points at neither, bisect: stash the entire port and re-run `pnpm --filter studio type` on clean `HEAD`. If it still fails, the cause is pre-existing and has nothing to do with this skill.

**Do not blame module resolution without evidence.** `require.resolve("lucide-react/dynamic")` does fail — lucide-react 0.562.0 ships no `exports` map — and that looks like a convincing cause. It is not one: the Sanity CLI does not resolve the config through CJS `require`, and typegen passes without any `.mjs` specifier on Node 24 and Node 26. We chased this once and shipped a fix for it before finding the env cause underneath.

Do not read `roboto-shopify.sanity.studio` in the CLI output as proof the Studio is deployed. That is `getStudioHost()`'s fallback for an empty project ID.

`ai-commerce` will also fail `check-types` with *"`@workspace/sanity/types` has no exported member `QueryAiAssistantSettingsResult`"* until typegen has run. That one is ordering, not a missing dep — run typegen first and it resolves.

Expected clean state: `check-types` passes, `lint` passes with a handful of warnings, tests pass (112 at time of writing).

All four must pass before Part D.

**Then the test that matters most — run it before the happy path:**

```bash
pnpm build     # with NO AI env vars set
```

It must succeed, and the site must serve normally. A user who ports the assistant and never configures it must not end up with a broken project. If this fails, the env vars were made required — go back to Part B step 5.

Note the widget still *renders* when unconfigured; it just 503s on use. That is aisle's own behaviour and why the feature flag in gating question 4 is worth recommending.

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

**This step is manual. There is no script for it.**

`pnpm --filter studio seed:ai-assistant` seeds the `aiAssistantSettings` singleton, which holds the widget's welcome copy and suggested prompts. That is a **different document** and it does not produce an MCP URL. Run it if you want the welcome state populated, but it is not a substitute for this step.

In the deployed Studio (`https://<hostname>.sanity.studio`):
1. **AI Assistant → Agent Context → + Create new**
2. Enter a name, a slug (e.g. `shop-assistant`), and instructions for the assistant
3. **Publish** — an unpublished document will not resolve

Confirm with the user what instructions the assistant should carry. They shape its tone and what it will and won't answer, and are worth getting right rather than defaulting.

**2b. Create and publish `aiAssistantSettings` too.** Separate document, separate failure. Studio → **AI Assistant → Welcome & Suggestions**, or run `pnpm --filter studio seed:ai-assistant`. Either way it must be **published** — left as a draft, the chat opens with a bare welcome panel and no suggested prompts, which reads like a broken widget rather than missing content.

Verify both exist and neither is a draft (a `drafts.` prefix on `_id` means unpublished):

```groq
{
  "agentContexts": *[_type == "sanity.agentContext"]{_id, name, "slug": slug.current},
  "settings": *[_id == "aiAssistantSettings"][0]
}
```

**3. Copy the MCP URL**

```
https://api.sanity.io/v2026-04-30/agent-context/<projectId>/<dataset>/<slug>
```

**4. Get an AI Gateway key** from https://vercel.com/dashboard/ai-gateway.

**5. Write both into the web app's env file**

```bash
SANITY_CONTEXT_MCP_URL=https://api.sanity.io/v2026-04-30/agent-context/<projectId>/<dataset>/<slug>
AI_GATEWAY_API_KEY=<key>
```

**Use whichever file the project already has, and never create both.** `CLAUDE.md` documents `apps/web/.env` as this repo's convention, and `.env` works fine on its own. The hazard is precedence: Next.js ranks `.env.local` above `.env`, so if values go in `.env` and someone later adds a `.env.local`, the assistant silently 503s with no obvious cause.

Check first with `ls apps/web/.env*`, write to the one that exists, and confirm it is gitignored:

```bash
git check-ignore -v apps/web/.env apps/studio/.env
```

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
- **Creating a second env file.** `.env` and `.env.local` both work; having both means `.env.local` silently wins and the assistant 503s for no visible reason.
- **Editing the markdown lib at all.** Its delta against a synced aisle is zero. Leave it alone.
- **Installing dependencies late.** `@sanity/agent-context` and `ai`/`@ai-sdk/*` must land before typegen, or you get two misleading errors. See Part A step 3b.
- **Skipping the `globals.css` `@source` line.** Tailwind never scans the vendored package and the chat UI renders unstyled, with no error explaining it.
- **Hardcoding aisle commit SHAs.** They go stale in weeks. Derive the sync point each run.
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
- **You are about to copy `seo.ts` or `llms.txt/route.ts` from aisle.** Those diffs are aisle's branding — site title, description, `@akintola4`, aisle keywords. Porting them silently replaces the user's site identity. **This is the most damaging mistake available in this skill.** Verified in a real dry run.
- **You are copying a shared file wholesale without reading its diff.** Classify every hunk first: AI layer, aisle branding, or unrelated upstream work. Only the first gets ported.
- **`pnpm build` fails with no AI env vars set.** The variables were made required. Fix that before anything else — it breaks every user who ports but doesn't configure.
- **`pnpm --filter web test` fails.** Nothing in this port should touch tested code. If tests break, you edited something you shouldn't have.
- **The project has diverged from aisle's sync point.** The shared files have local changes. Reconcile by hand and tell the user which files needed judgement calls.
- **You are about to blame this port for a build failure without bisecting.** Stash the whole port and re-run the failing command on clean `HEAD` first. A masked error like `Failed to load configuration file` may be pre-existing and have nothing to do with the assistant. Check the lockfile too, to rule out an install having bumped a version.
- **You are porting a layout tweak that assumes the assistant is always on.** Aisle has no feature flag, so anything positional it does (the `Toaster` offset, spacing around the launcher) is unconditional. Under a flag, tie it to the flag.
