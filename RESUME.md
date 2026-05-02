# Habixa — session resume

> Living snapshot of where the codebase is and where to pick up next.
> Update at the end of each working session.

Last updated: **2026-05-02** (commit `f6b86a53`)

---

## TL;DR — exact next step

Phase 5 (adherence + skip) is **shipped end-to-end**. Streak and per-category
consistency on the profile screen are now real values from
`/v1/me/adherence`; meals/workouts/habits in `<TodayPlanDashboard />` can
be skipped with a reason that preserves the streak.

The next high-leverage move is **Phase 6: AI Coach with tool use**. Concrete
first action: scaffold a `CoachModule` with a `POST /v1/coach/message`
endpoint backed by Anthropic SDK + tool-use, exposing read-only tools
(`getTodayPlan`, `getAdherence`, `getStats`) so the agent can ground every
reply in real user data instead of generic fitness advice.

---

## Status by phase

| Phase | What | State |
| ----- | ---- | ----- |
| 0 | TDD infra (Jest, configureApp, env example) | done |
| 1 | Plan lifecycle observable (NOT_STARTED / GENERATING / FAILED / READY) under `/v1` | done |
| 2 | Deterministic kcal/macros (TdeeService) + RecipeIngredient schema + `/today/detailed` | done |
| 3 | Recipe detail screen + weekly shopping list | done |
| 3.5 | Real recipe catalog (50 AI-generated) + real exercise catalog (30 AI-generated) | done |
| 4 | Workout session screen + state machine + workout exercise hydration | done |
| 5 | Adherence: streak / consistency / skip with reason | **done** |
| 6 | AI Coach (chat with tool use) | not started |
| 7 | Voice (TTS cues, morning agent) | not started |

---

## What's shipped (recent commits)

```
f6b86a53 feat(mobile): real adherence on profile screen + skip CTA on home
a46ee2a7 feat(planning): expose POST /v1/planning/lifestyle/activity/skip
8537d8b3 feat(me): expose GET /v1/me/adherence with deterministic streak + consistency
69966079 feat(planning): add skipReason / skipNotes / skippedAt to DailyUserTask
c9de3165 docs: refresh RESUME.md with Phase 4 completion + Phase 5 starting plan
09d79040 feat(mobile): ship guided workout session screen + wire CTA
07332dbe feat(planning): hydrate workout exercises in /today/detailed
cf4885af feat(workout): implement WorkoutSessionMachine reducer + Jest setup
2ceafe54 chore: persist outstanding work-in-progress across mobile and tooling
ca186841 chore(workout): scaffold WorkoutSessionMachine spec for Phase 4
14560231 feat(mobile): add cross-platform secure storage utility
6b43d2dd feat(planning): add Zod schema + validator service for OpenClaw week responses
26b7d0f5 docs: add RESUME.md snapshot of where the codebase stands
d81c7df4 feat(seed): generate 30 exercises with OpenAI structured outputs
407cfa8f feat(seed): generate 50 recipes with OpenAI structured outputs
3b9756ff feat(planning): aggregate weekly shopping list from RecipeIngredient
8e03e814 feat(recipes): add recipe detail screen with hydrated ingredients
6411e74d feat(planning): hydrate today's plan with recipe + ingredient quantities
ae3ad78d feat(planning): compute deterministic kcal/macro targets via TdeeService
b971fd13 chore(mobile): remove dead ConciergeDashboard placeholder
40c98eae feat(planning): replace binary plan status with typed discriminated union under /v1
```

## Test state

API: 26 e2e green + dozens of unit specs green. Mobile: 11 unit tests green
on the workout machine. Pre-existing failures unchanged (we have not
touched these surfaces):

- `daily-plan.entity.spec.ts` — `addItem` 5-cap rule returns false on 6th
- `register-user.use-case.spec.ts` — `MockUserRepository` missing `findProfileForMe`
- `admin.{controller,service}.spec.ts` — providers misconfigured in test module
- `gamification.e2e-spec.ts` — `currentStreak` stays at 0 after habit completion

---

## End-to-end user flow that now works

1. Open app → home renders today's plan with Spanish locale date and meal
   cards showing real recipe titles + kcal.
2. Tap any meal → `/nutrition/recipe/[id]` shows photo placeholder, prep
   time, macros, ingredient list with grams, instructions.
3. Tap "Ver lista de la compra" on a recipe → `/nutrition/shopping-list`
   aggregates the whole week into category-grouped checklist.
4. Tap "Comenzar entreno" on home → `/workouts/run/[id]` opens guided
   session: idle preview → exercising → resting (countdown auto-advances
   or skip) → next set → next exercise → completed (auto-marks the day's
   workout activity).

---

## Phase 6 — AI Coach with tool use (next)

Goal: a chat surface where the user talks to Habixa and the model has
*real, grounded* context (today's plan, adherence trend, recent skips,
weight history). The differentiator is tool use — generic chatbots can
quote fitness facts; this one can say "I see you skipped 3 leg sessions
in a row, want me to swap Wednesday for an upper-body day?".

Concrete steps:

1. **Backend (TDD)**: `POST /v1/coach/message` with Anthropic SDK
   - Body: `{ conversationId?, message }`
   - Response: streamed assistant reply + any tool calls inspected
   - Tools (start with read-only): `getTodayPlan`, `getAdherence`,
     `getRecentSkips`, `getRecipe`, `getExercise`
   - System prompt: dietitian + S&C coach voice, Spanish-first,
     short responses, redirect on emotional/clinical signals.
2. **Persistence**: `Conversation` and `Message` Prisma models
   (id, userId, role, content, toolCalls, createdAt).
3. **Backend tests**: stub the Anthropic client so unit tests are
   deterministic; assert the right tool was called for prompts like
   "what's my workout today" / "skipped lots, why" / "swap Wed".
4. **Mobile**: new `/coach` route with chat list + input. Streamed
   replies via SSE if the SDK exposes them.
5. **Guardrails**: filter the system response if it strays into
   medical advice; injected disclaimer for clinical questions.
6. **Optional later**: write tools (`swapMeal`, `swapWorkout`,
   `addNoteToToday`) once the read-only flow feels solid.

---

## Open security items

- The OpenAI key pasted in chat earlier is in `apps/api/.env`. **Rotate it**
  at https://platform.openai.com/api-keys before this branch goes anywhere
  near a remote.
- The Supabase `sb_secret_*` pasted earlier in the same chat should also
  be rotated if not already done.

---

## Quick commands

```sh
# api dir is the working dir for almost every backend command
cd apps/api

# bring up local stack (postgres on 5436, redis on 6380)
docker start habixa_postgres habixa_redis

# run unit tests (note: 4 pre-existing suites still fail, see above)
pnpm jest

# run e2e tests (sequential, with forceExit for BullMQ leaks)
pnpm jest --config ./test/jest-e2e.json --runInBand

# regenerate prisma client after schema change
pnpm prisma generate

# apply pending migrations
pnpm prisma migrate deploy

# inspect catalogs
pnpm tsx scripts/diagnose-recipes.ts
pnpm tsx scripts/diagnose-plans.ts

# seed catalogs (idempotent, safe to re-run)
pnpm ts-node -r tsconfig-paths/register scripts/seed-recipes-ai.ts
pnpm ts-node -r tsconfig-paths/register scripts/seed-exercises-ai.ts
```

```sh
# mobile dir
cd apps/mobile

# run mobile unit tests (workout machine, future logic-only suites)
pnpm test

# run e2e tests (playwright web)
pnpm test:e2e

# start dev
pnpm start
```

---

## Repo conventions to keep

- `feat(scope):`, `chore(scope):`, `fix(scope):` conventional commits.
- Each commit should compile and pass tests on its own.
- Backend tests live in `apps/api/src/**/*.spec.ts` (unit) and
  `apps/api/test/**/*.e2e-spec.ts` (e2e).
- Mobile pure-logic tests live in `apps/mobile/src/lib/**/*.spec.ts` (no
  React or Expo imports — those need jest-expo and a separate config).
- TDD: write the failing test first, then the smallest implementation that
  passes, then refactor. The recent commits demonstrate this rhythm.
- Mobile API client base URL is already `/v1`, so screens call
  `/planning/lifestyle/today/detailed` and the version prefix is added
  implicitly.
- `.env` files are gitignored. `.env.example` documents the keys but never
  the values.
- Prisma migrations ARE committed (un-ignored as of `6411e74d`). Always
  generate migrations alongside schema changes so other devs and Supabase
  can replay history.
