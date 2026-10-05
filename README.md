# CreatorForge

CreatorForge is a Next.js App Router workspace for generating creator assets:
content ideas, AI coding prompts, Roblox game plans, and 30-day content calendars.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Fraunces + Source Sans 3
- localStorage persistence
- Mock or OpenAI generation providers

## Stages 1–10

1. **Scaffold & brand** — landing composition, fonts, CSS variables, dashboard shell
2. **Tools catalog** — available tools with dedicated routes
3. **Content Idea Generator** — form, API generation, copy/save/regenerate
4. **Persistence** — projects + content repositories, migrate, hooks
5. **Coding Prompt Builder** — structured prompt sections + fullPrompt
6. **Generation service** — provider registry, validation, `/api/generate`
7. **Roblox Game Builder** — full plan contract + UI
8. **OpenAI provider** — `json_schema` structured outputs for all tools
9. **30-Day Content Planner** — month calendar, save/export polish, dashboard recent saves
10. **Real AI Generation Engine** — shared provider pipeline, enum validation, result normalization

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing |
| `/dashboard` | Overview + recent saves |
| `/dashboard/tools` | Tool catalog |
| `/dashboard/tools/content-idea-generator` | Content ideas |
| `/dashboard/tools/ai-coding-prompt-builder` | Coding prompts |
| `/dashboard/tools/roblox-game-builder` | Roblox plans |
| `/dashboard/tools/thirty-day-content-planner` | 30-day calendar |
| `/dashboard/tools/[slug]` | Soon tools (roadmap placeholders) |
| `/dashboard/projects` | Project list |
| `/dashboard/projects/[id]` | Project detail + save preview |
| `/dashboard/settings` | Backup/export/import + clear |
| `POST /api/generate` | Server-only generation |

## AI generation engine

Shared server pipeline used by every tool:

`User Input → validate → AI Provider (mock|openai) → structured result → normalize → UI → Save`

- Providers register in `src/lib/generation/server-register.ts`
- Contracts/schemas live in `src/lib/generation/schemas.ts`
- Input allowlists live in `src/lib/generation/catalog.ts`
- Output normalization lives in `src/lib/generation/normalize.ts`
- Tools keep calling `generateViaApi` / `POST /api/generate` (no client-side OpenAI)

## Environment

Copy `.env.example` to `.env.local`:

```bash
AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_MS=30000
```

Secrets are server-only. Never use `NEXT_PUBLIC_` for provider keys.

## Deploy to Vercel

### One-time setup (phone or desktop)

1. Open [vercel.com/new](https://vercel.com/new) and sign in (GitHub is easiest).
2. **Import** `8c5t79tg6h-arch/CreatorForge`.
3. Leave Framework Preset as **Next.js**. Root directory stays `.`.
4. Add environment variables (checklist below), then **Deploy**.
5. When it finishes, open the `*.vercel.app` URL — landing + dashboard should load.

### Environment variable checklist

| Name | Required? | Suggested value | Notes |
| --- | --- | --- | --- |
| `AI_PROVIDER` | Recommended | `mock` | Use `mock` for first deploy (no API key needed). |
| `OPENAI_API_KEY` | Only if `AI_PROVIDER=openai` | your key | Server-only. Do **not** use `NEXT_PUBLIC_`. |
| `OPENAI_MODEL` | Optional | `gpt-4o-mini` | Used only with OpenAI. |
| `OPENAI_TIMEOUT_MS` | Optional | `30000` | Used only with OpenAI. |

Apply vars to **Production** (and **Preview** if you want preview deploys to match).

### Switch mock → OpenAI later

1. Vercel → Project → **Settings** → **Environment Variables**
2. Set `AI_PROVIDER` = `openai`
3. Set `OPENAI_API_KEY` = your key
4. Redeploy (**Deployments** → ⋯ → Redeploy)

### CLI (optional)

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.local   # after vars exist in the project
npx vercel --prod
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit

# Stage verifiers (expect app on localhost:3000)
npm run verify:stage3
npm run verify:stage4
npm run verify:stage5
npm run verify:stage6
npm run verify:stage7
npm run verify:stage8
npm run verify:stage9
npm run verify:stage10
```

## Architecture notes

- Browser clients call `generateViaApi` → `POST /api/generate`
- Node/tests call `runGeneration` / `runGenerationFromUnknown` after `registerServerProviders()`
- Engine pipeline: validate input → provider → normalize result
- Mock provider reuses domain generators for deterministic local output
- OpenAI provider uses shared JSON schemas + structured outputs; imported only on the server
