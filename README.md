# CreatorForge

CreatorForge is a Next.js App Router workspace for generating creator assets:
content ideas, AI coding prompts, and Roblox game plans.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Fraunces + Source Sans 3
- localStorage persistence
- Mock or OpenAI generation providers

## Stages 1–8

1. **Scaffold & brand** — landing composition, fonts, CSS variables, dashboard shell
2. **Tools catalog** — available + soon tools with dedicated routes
3. **Content Idea Generator** — form, API generation, copy/save/regenerate
4. **Persistence** — projects + content repositories, migrate, hooks
5. **Coding Prompt Builder** — structured prompt sections + fullPrompt
6. **Generation service** — provider registry, validation, `/api/generate`
7. **Roblox Game Builder** — full plan contract + UI
8. **OpenAI provider** — `json_schema` structured outputs for all three tools

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing |
| `/dashboard` | Overview |
| `/dashboard/tools` | Tool catalog |
| `/dashboard/tools/content-idea-generator` | Content ideas |
| `/dashboard/tools/ai-coding-prompt-builder` | Coding prompts |
| `/dashboard/tools/roblox-game-builder` | Roblox plans |
| `/dashboard/tools/[slug]` | Soon tools |
| `/dashboard/projects` | Project list |
| `/dashboard/projects/[id]` | Project detail |
| `/dashboard/settings` | Local workspace settings |
| `POST /api/generate` | Server-only generation |

## Environment

Copy `.env.example` to `.env.local`:

```bash
AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_MS=30000
```

Secrets are server-only. Never use `NEXT_PUBLIC_` for provider keys.

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
```

## Architecture notes

- Browser clients call `generateViaApi` → `POST /api/generate`
- Node/tests call `runGeneration` after `registerServerProviders()`
- Mock provider reuses domain generators for deterministic local output
- OpenAI provider is imported only through server registration
