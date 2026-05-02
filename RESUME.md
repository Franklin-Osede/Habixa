# Habixa — session resume

> Living snapshot of where the codebase is and where to pick up next.
> Update at the end of each working session.

Last updated: **2026-05-02** (commit `09d79040`)

---

## TL;DR — exact next step

Phase 4 (workout session) is **shipped end-to-end** — guided session screen,
state-machine reducer with 11 unit tests, hydrated workout exercises in
the API. The next high-leverage move is **Phase 5: real adherence** so
streak / consistency stop being placeholder values. Concrete first action:
write a failing E2E test for `GET /v1/me/adherence?range=week` (real
streak from `DailyUserTask` rows) and a failing test for the
`POST /v1/planning/lifestyle/activity/skip` endpoint (skip with reason).

---

## Status by phase

| Phase | What | State |
| ----- | ---- | ----- |
| 0 | TDD infra (Jest, configureApp, env example) | done |
| 1 | Plan lifecycle observable (NOT_STARTED / GENERATING / FAILED / READY) under `/v1` | done |
| 2 | Deterministic kcal/macros (TdeeService) + RecipeIngredient schema + `/today/detailed` | done |
| 3 | Recipe detail screen + weekly shopping list | done |
| 3.5 | Real recipe catalog (50 AI-generated) + real exercise catalog (30 AI-generated) | done |
| 4 | Workout session screen + state machine + workout exercise hydration | **done** |
| 5 | Adherence (skip / streak from real `completion`) | not started |
| 6 | AI Coach (chat with tool use) | not started |
| 7 | Voice (TTS cues, morning agent) | not started |

---

## What's shipped (recent commits)

```
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

## Phase 5 — adherence (next)

Goal: replace the hardcoded streak / consistency on the profile screen
with real values derived from `DailyUserTask`. Add a "skip" pathway so
the user can opt out of a meal or workout without it counting against
adherence — but log the reason so we can learn from it.

Concrete steps:

1. **Backend (TDD)**: `GET /v1/me/adherence?range=week`
   - returns `{ streakDays, consistency: { workoutPct, nutritionPct, habitsPct }, recentSkips }`
   - streak = consecutive days with at least one completed activity
   - consistency = completed / scheduled per category
   - 5–6 e2e cases covering edge bands (no plan, full streak, broken streak, skipped vs missed)
2. **Backend (TDD)**: `POST /v1/planning/lifestyle/activity/skip`
   - body: `{ activityId, activityType, reason: 'illness' | 'time' | 'mood' | 'other', notes? }`
   - persists a `DailyUserTask` row with `isCompleted: false` plus a new
     `skipReason` column (Prisma migration needed)
   - test that skipped activity does *not* break the streak
3. **Mobile**: replace the hardcoded `12` streak and `85%` consistency in
   [profile.tsx](apps/mobile/app/(tabs)/profile.tsx#L42-L51) with values
   from `/v1/me/adherence`.
4. **Mobile**: add a "Saltar" affordance next to each meal/workout/habit
   complete CTA in `<TodayPlanDashboard />` that opens a small reason
   picker before posting.
5. **Backend cron (optional, end of phase)**: weekly adjuster job that
   nudges TDEE ±5% if reported weight diverges from projected by >5%
   over 14 days.

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
