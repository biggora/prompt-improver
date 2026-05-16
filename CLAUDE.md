# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (`pnpm-lock.yaml` is the source of truth — do not introduce npm/yarn lockfiles).

```bash
pnpm install              # install dependencies
pnpm run dev              # Next.js dev server with Turbopack (http://localhost:3000)
pnpm run build            # production build (Next.js standalone output)
pnpm run start            # serve the production build
pnpm run lint             # ESLint (flat config, eslint.config.mjs)
pnpm run lint:fix         # ESLint with --fix
pnpm run typecheck        # tsc --noEmit
pnpm run format           # Prettier across ts/tsx/js/jsx/mjs/json/md/yml
pnpm run test             # vitest single run (--no-watch)
pnpm run test:watch       # vitest watch mode
pnpm run kill:app         # Windows-only helper: free port 3000 (kill-app.cmd)
```

Run a single test file or test:

```bash
pnpm exec vitest run __tests__/ai-service.test.ts          # one file
pnpm exec vitest run -t "parses JSON responses"            # by test name
pnpm exec vitest run __tests__/ai-service.test.ts -t "..." # both
```

Docker:

```bash
docker compose up -d --build    # build + run; .env must contain provider API keys
docker compose logs -f
docker compose down
```

## Architecture

Next.js 16 **App Router** application. The user-facing surface is a single page that takes a prompt + domain selection, sends it to a chosen AI provider, and renders structured results (issues / improvements / improved prompt). All persistence is local to the browser.

### Request flow

1. `src/app/[locale]/page.tsx` is a server component. It calls `getConfiguredProviders()` (`src/lib/provider-config.ts`, marked `"server-only"`) which reads `process.env.*_API_KEY` to compute a flag map of which providers are usable. That map is passed as a prop to the client component.
2. `src/components/prompt-improver.tsx` (client) drives the UI. It calls `aiService.improvePrompt(...)` in `src/lib/ai-service.ts`.
3. `aiService` branches by provider:
   - **Cloud providers (anthropic, openai, gemini, zhipu)** → `fetch('/api/improve', ...)` to the server route. API keys never leave the server.
   - **Ollama** → direct `fetch` from the browser to `NEXT_PUBLIC_OLLAMA_BASE_URL` (default `http://localhost:11434`). No server round-trip.
4. `src/app/api/improve/route.ts` resolves a `providerFactories` map (`anthropic | openai | zhipu | gemini`) into a Vercel AI SDK provider instance, then calls `generateText({...})`. `isReasoningModel` (any model id matching `gpt-5`, `o1`, `o3`) suppresses the `temperature` param, which those models reject.
5. Response text is run through `parseAIResponse()` in `src/lib/utils.ts` — strips markdown code fences, finds the first `{`/last `}`, attempts `JSON.parse`, then a fallback that escapes raw control characters before parsing again.
6. The result is rendered, and `savePromptResult()` (`src/lib/database.ts`) persists it to IndexedDB.

`src/app/api/validate/route.ts` mirrors the same factory/key pattern but only issues a 5-token `generateText` call to confirm the configured API key actually works.

### Resilience layers

- `src/lib/retry.ts` — `withRetry()` wraps every cloud API call (3 attempts, exponential backoff with jitter). Retries on network errors and statuses `408/429/500/502/503/504`. Errors thrown by `ai-service.ts` carry a `status` field so `withRetry` can classify them. Ollama uses `maxAttempts: 2`.
- `src/lib/request-queue.ts` — singleton `RequestQueue` persists failed/offline requests to `localStorage`, listens to `online`/`offline` events, and exposes a React hook `useRequestQueue()` for UI integration.

### Internationalisation

- Provider: `next-intl` with locale-prefixed routing (`/[locale]/...`). Supported locales live in `src/i18n/config.ts` (`en`, `ru`, `de`, `fr`, `es`).
- Messages: `src/messages/<locale>.json` loaded by `src/i18n/request.ts` (`getRequestConfig`).
- Middleware: **`src/proxy.ts`** (named `proxy`, not `middleware`) — Next.js 16 picks this file up via the `next-intl/plugin` configured in `next.config.ts`. Editing routing rules means editing `proxy.ts`, not creating a new `middleware.ts`.

### Adding a new AI provider

The cloud-provider plumbing is intentionally duplicated in three places — all must be updated in lockstep:

1. `src/lib/constants.ts` → add an entry to `AI_PROVIDERS` (id, name, models, defaultModel) **and** to `PROVIDER_KEY_NAMES` (env var name).
2. `src/app/api/improve/route.ts` → add the SDK factory to `providerFactories`.
3. `src/app/api/validate/route.ts` → add the same factory to its local `providerFactories` map.
4. Install the SDK with `pnpm add @ai-sdk/<provider>` (or the equivalent community package — see `zhipu-ai-provider`).
5. Update `.env.example` and the locale message files if any UI strings change.

Ollama is the exception: it has no factory entry because it is handled client-side.

### Storage

`src/lib/database.ts` is the only place IndexedDB is touched. The store is `prompt_history` (see `DB_NAME`, `DB_VERSION`, `STORE_NAME` in `constants.ts`). All public functions guard with `isClient()` so they can be imported into server components without crashing. `domains`/`issues`/`improvements` are stored as JSON strings inside records and re-parsed on read — keep that contract if you add new array fields.

## Conventions

- **Path alias**: `@/*` → `./src/*` (see `tsconfig.json` and `vitest.config.ts`). Always import from `@/lib/...`, `@/components/...`.
- **`"use client"`** is required on any module that touches `window`, IndexedDB, `localStorage`, or React state. `database.ts`, `ai-service.ts`, `request-queue.ts`, and all components under `src/components/` are client-only.
- **`"server-only"`** marks modules that must never bundle to the client (`provider-config.ts`). Don't import them from client components.
- **API keys**: never expose a key with `NEXT_PUBLIC_` — only the Ollama URL uses that prefix because it's the public local endpoint.
- **Styling**: Tailwind classes inline; use the `cn()` helper from `src/lib/utils.ts` for conditional/merged class lists (it wraps `clsx` + `tailwind-merge`).
- **Dark theme** is wired through `next-themes` (`ThemeProvider` in `src/app/[locale]/layout.tsx`, default `"dark"`, `suppressHydrationWarning` on `<html>`).

## Tests

Vitest with `jsdom` environment. `vitest.setup.ts` registers `fake-indexeddb/auto` so `database.ts` works in the test environment without a real browser. Tests live in `__tests__/` at the repo root (not co-located). The Vitest config defines the same `@/` alias as `tsconfig.json`.

ESLint relaxes `@typescript-eslint/no-explicit-any` inside `__tests__/**` and `*.test.{ts,tsx}` (see `eslint.config.mjs`).

## Build / Deployment

- `next.config.ts` sets `output: "standalone"`. The Dockerfile relies on this — it copies `.next/standalone` and `.next/static` into a minimal `node:22-alpine` runner image, runs as the non-root `nextjs` user, and starts `node server.js`.
- All API keys are runtime env vars (passed via Docker Compose `env_file` or the host environment). They are read inside the route handlers/`provider-config.ts`, never inlined at build time.
