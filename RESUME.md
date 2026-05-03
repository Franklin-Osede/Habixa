# Habixa — session resume

> Living snapshot of where the codebase is and where to pick up next.
> Update at the end of each working session.

Last updated: **2026-05-03** (commit `271c8eb4`)

---

## TL;DR — exact next step

Phase 6 (AI coach with tool use) is **shipped end-to-end**. Tap the
sparkle FAB on home to open `/coach`, send a message, and the backend
runs a real Anthropic tool-use loop (claude-sonnet-4-6 by default) with
`get_today_plan` and `get_adherence` as grounded read-only tools.
Conversations + messages persist in Postgres and a stub-LLM E2E spec
proves the contract end-to-end without burning Anthropic credits.

The next high-leverage moves, in priority order:

1. **Write tools for the coach** — `swap_meal`, `swap_workout`,
   `add_skip_with_reason`. Currently the coach can only describe state;
   write tools let it actually adapt the plan after a chat. TDD path:
   add one tool at a time with stub-driven E2E asserting the resulting
   DB mutation.
2. **Coach memory across conversations** — summarise old threads into
   a `userProfile.coachContext` JSON the system prompt can include so
   the model has continuity beyond a single chat.
3. **Phase 7 voice** — TTS-cached morning agent + during-workout cues
   (cheap one-time generation per exercise, served from R2/Supabase
   Storage).

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
| 5 | Adherence: streak / consistency / skip with reason | done |
| 6 | AI Coach (chat with tool use, read-only tools) | **done** |
| 7 | Voice (TTS cues, morning agent) | not started |

---

## What's shipped (recent commits)

```
271c8eb4 feat(mobile): add /coach chat screen wired to the home FAB
c37ee6ef feat(coach): ship POST /v1/coach/message backed by tool-use loop
20565c24 feat(coach): add Conversation + Message schema and Anthropic SDK dep
2a971296 docs: refresh RESUME.md with Phase 5 completion + Phase 6 starting plan
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

## Phase 7 — Voice (next)

Goal: voice cues that the user hears at the moments they actually
matter, without paying real-time TTS prices.

Concrete steps:

1. **TTS cache layer** (TDD): a `VoiceCueService` that takes
   `(exerciseId, cueKind, locale)` and returns a public URL. Looks up
   `VoiceCue` row first; if missing, generates via OpenAI tts-1 (or
   ElevenLabs), uploads to Supabase Storage, persists the URL. Cheap
   one-time per (exercise × cue × locale).
2. **Cues seed script**: pre-generate cues for the 30 exercises in the
   catalog × 3 cue kinds (intro, mid-set push, last-rep) × es-ES.
   ~$1 one-shot.
3. **Mobile workout session screen integration**: schedule cue
   playback at the start of each set + at 50% rest remaining.
   `expo-av` for playback.
4. **Morning agent**: nightly cron generates a 30-second audio
   summary of tomorrow's plan + a short motivational angle pulled
   from yesterday's adherence. Posts a push notification with the
   audio.

## Phase 6 follow-ups (already shipped, ideas for next iteration)

- **Write tools**: `swap_meal(dayIndex, mealType, newRecipeId)`,
  `swap_workout(dayIndex, newExerciseIds)`, `mark_skip_with_reason`.
  Each tool mutates the plan content / DailyUserTask. TDD: stub-driven
  E2E asserting DB mutation matches the LLM's tool input.
- **Conversation memory**: summarise old threads via a nightly job
  into `userProfile.coachContext` so the system prompt has continuity.
- **Streaming**: switch the endpoint to SSE so the chat shows tokens
  as they arrive instead of waiting for the full reply.
- **Conversation listing UI**: surface `GET /coach/conversations` in
  a side drawer so users can return to previous threads.

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
