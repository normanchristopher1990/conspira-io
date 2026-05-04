# AGENTS.md — Conspira.io

Conventions for any AI coding agent (Claude, Cursor, Copilot, etc.) working in this repo. Read this first before making changes. The rules here come from the existing code — they describe what's already there, not aspirations.

## Project shape

- **Frontend**: Vite + React 18 + TypeScript (strict) + Tailwind. SPA, react-router-dom v6.
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions).
- **AI**: Anthropic Claude API, called only from Supabase Edge Functions — never from the browser. Used for analysis, translation, and review — never for content generation displayed as user content.
- **Hosting**: Vercel (frontend), Supabase (everything else).
- **Languages**: UI ships in English and German via in-code dictionaries.

The product spec lives in `Conspira_io_Concept_v2.docx` at the repo root. Treat it as the source of truth for product behavior; if code disagrees with the spec, flag it rather than silently changing either.

## Data flow

```
Component / Page  →  hook (lib/hooks.ts)  →  api fn (lib/api.ts)  →  supabase  
                                          ↘  mockData (when supabase unconfigured)
```

Rules:

- All database access goes through `src/lib/api.ts`. Don't call `supabase.from(...)` from a component or page — add a function in `api.ts` and call it.
- Database rows use `snake_case`; the domain model is `camelCase`. `api.ts` has explicit `rowTo*` mappers — follow that pattern when adding new tables.
- Async data fetching in components goes through hooks in `src/lib/hooks.ts`. New hooks compose `useAsync<T>` rather than reimplementing loading/error state.
- `lib/supabase.ts` exposes a nullable client. Code must handle `supabase === null` (the project ships with mock data fallback so the homepage works without env vars).

## Types

- `src/lib/types.ts` is the single source of truth for domain types (`Theory`, `Evidence`, `CategorySlug`, etc.). Put new shared types there.
- Rows from Postgres are typed locally inside `api.ts` (e.g. `TheoryRow`) and immediately mapped to the domain type. Don't leak row types out of `api.ts`.
- `tsconfig` has `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Don't disable these. If something is genuinely unused, remove it; if it's intentionally unused, prefix with `_`.

## i18n

- All UI text goes through `useI18n()` from `src/lib/i18n.tsx`. Don't hardcode user-facing strings.
- `EN` is the canonical shape; `DE` mirrors it key-for-key. When adding a key, add it to **both** dictionaries.
- Pluralization / interpolation uses functions in the dictionary, e.g. `theoryCount: (n: number) => ...`. Stick with that pattern instead of bringing in a library.
- Theory titles/summaries themselves are translated server-side by the `translate-theory` Edge Function and stored as `title_en`/`title_de`/`summary_en`/`summary_de`. Use `localizeTheory(theory, lang)` from `src/lib/localize.ts` to pick the right rendition; never inline that logic.

## Styling

- Tailwind only. No CSS modules, no inline `<style>`, no `styled-components`.
- Use the theme tokens defined in `tailwind.config.js`, not raw colors:
  - Surfaces: `bg-bg` (page), `bg-white` (cards), `border-line` / `ring-line`
  - Text: `text-ink` (primary), `text-muted` (secondary), `text-brand` (accent)
  - Brand scale: `bg-brand`, `bg-brand-50` … `bg-brand-900`
  - Score colors: `text-score-bad`, `text-score-neutral`, `text-score-good`
  - Numbers: `font-mono-num` (Space Mono) for scores and stats
- Container: `mx-auto max-w-6xl px-4` is the standard page wrapper.
- Mobile-first. Default styles target mobile; add `sm:` / `md:` / `lg:` for wider viewports. The bottom nav is mobile-only (`md:pb-0` strips the safe-area padding on desktop).
- Cards: `bg-white rounded-xl shadow-card ring-1 ring-line` is the canonical card surface.

## Components and pages

- One component per file, default export, function component. Props typed inline as `type Props = {...}` directly above the component.
- Page components live in `src/pages/`, leaf UI in `src/components/`. Form widgets in `src/components/form/`.
- Inline icons as small SVG components defined at the bottom of the same file (see `TheoryCard.tsx` `DocIcon`). Don't add an icon library.
- Routes are declared in `src/App.tsx`. Admin routes go inside the `<RequireAuth adminOnly>` block.

## Auth

- `useAuth()` from `src/lib/auth.tsx` is the single source for session/profile/admin state.
- Protected routes wrap with `<RequireAuth>`; admin-only with `<RequireAuth adminOnly>`.
- Don't read `supabase.auth` directly from components — go through the context.
- Email + password and Google/Apple OAuth are supported (`signInWithOAuth(provider)`). Email verification is required before a first submission.

## Scoring (concept §4)

The scoring rules are platform law. Don't redefine them in multiple places.

- Evidence type ceilings live in `src/lib/evidenceTypes.ts` (`EVIDENCE_TYPE_META[type].ceiling`). When adding a new evidence type, update the type union in `lib/types.ts`, the meta in `evidenceTypes.ts`, the migration that constrains the DB enum, and the AI rubric in `supabase/functions/review-submission/index.ts`.
- The weighted formula (50% highest / 30% average / 20% independence bonus, plus thematic analysis of neutral 3/5 evidence) is documented in the AI rubric and ultimately authored there. Never duplicate the calculation client-side as a "preview" without flagging it as advisory.
- Score color mapping (`evidenceColor`) is in `evidenceTypes.ts`; theory score → red/grey/green is in `ScoreBar`. Use those — don't recompute.

## Ranks

- `src/lib/ranks.ts` defines the 9-rank ladder, derivation rule, and badge styles. Use `deriveRank(acceptedCount, expertLevel, storedRank)` instead of recomputing.
- Higher tiers (Hauptmann and above) are admin-assigned; the derivation function never demotes them.

## Edge Functions

- One folder per function under `supabase/functions/`. Each has its own `deno.json` with NPM-style imports.
- Functions require the caller's JWT (set in the function config), then use the **service-role key** (from env) to bypass RLS for legitimate operations.
- Long structured prompts are stored as `const` strings at the top of `index.ts` (see `SCORING_RUBRIC` in `review-submission`). Keep them stable so prompt-cache hits.
- The Anthropic model is `claude-sonnet-4-20250514`. Don't change the model without coordinating with the rubric.
- AI is for analysis only. Do not generate user-facing content (titles, summaries, evidence text) from AI.

## Migrations

- Numbered sequentially: `0001_init.sql`, `0002_ai_review.sql`, … Don't edit a migration once it has been applied to a real database — add a new one.
- Use `if not exists` / `on conflict do nothing` so the file stays idempotent against partial state.
- Top of file: `set check_function_bodies = off;` (matches the existing convention).
- Touching the `theories`, `evidence`, `profiles` schema almost always needs a corresponding update in `lib/api.ts` row types.

## TypeScript strictness

The repo runs `noUnusedLocals` and `noUnusedParameters`. If `tsc -b` (run during `npm run build`) fails because of an unused import, remove the import — don't add `// eslint-disable` or rename it to silence.

## Commits & branches

- Commit messages are short, imperative, lowercase first letter for the body, e.g. *"Homepage improvements - scoring, CTA, ranks"*. Match that style.
- Group related changes into one commit; don't split a feature across many tiny commits.
- The current default branch is `main`. Push directly to `main` for now — there's no PR workflow yet.

## What not to do

- Don't add new dependencies without a clear reason; the dep list is intentionally small (Supabase client, React, react-router, Tailwind, Vite). For UI primitives, hand-roll instead of pulling shadcn/Radix.
- Don't introduce CSS frameworks beyond Tailwind.
- Don't put secrets in client code. The Supabase **anon** key is fine in client code (it's gated by RLS); the **service-role** key only ever lives in Edge Function env vars.
- Don't bypass RLS by calling Postgres functions with elevated privileges from the client.
- Don't store user-submitted evidence text or titles passing through any AI rewrite. Translation of the **submitter's own text** is fine; ghost-writing is not.
- Don't generate AI images / videos for the platform. Per concept §8, no AI-generated media is published as evidence.

## When making changes

1. Read the most relevant 2–3 existing files before writing new code so the new code matches.
2. If a change crosses the schema/UI/Edge-Function boundary (e.g. a new evidence type), update **all** layers in the same commit.
3. Prefer extending an existing function or hook over creating a parallel one with a slightly different name.
4. Keep diffs reviewable. If a change balloons past ~300 lines, propose a split before writing it.

## Open product gaps tracked elsewhere

The concept doc lists features not yet built (witness weight calculation specifics, expert badge rendering, 3-strikes moderation tracking, public takedown timestamping, etc.). When implementing one of these, link the concept section in the commit message, e.g. *"Witness weight calc per concept §5.2"*.
