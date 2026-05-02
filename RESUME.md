# Habixa — session resume

> Living snapshot of where the codebase is and where to pick up next.
> Update at the end of each working session.

Last updated: **2026-05-02** (commit `d81c7df4`)

---

## TL;DR — exact next step

Open `apps/mobile/src/lib/workout/workout-session.machine.spec.ts` (already
in your working tree, **uncommitted on purpose**). It is a complete RED test
suite for a pure reducer that drives the workout-session screen. Implement
`workout-session.machine.ts` next to it until 11/11 cases pass, then build
the mobile screen.

---

## Status by phase

| Phase | What | State |
| ----- | ---- | ----- |
| 0 | TDD infra (Jest, configureApp, env example) | done |
| 1 | Plan lifecycle observable (NOT_STARTED / GENERATING / FAILED / READY) under `/v1` | done |
| 2 | Deterministic kcal/macros (TdeeService) + RecipeIngredient schema + `/today/detailed` | done |
| 3 | Recipe detail screen + weekly shopping list (aggregator + screen) | done |
| 3.5 | Real recipe catalog (50 AI-generated) + real exercise catalog (30 AI-generated) | done |
| 4 | Workout session screen + state machine | **in progress** |
| 5 | Adherence (skip / streak from real `completion`) | not started |
| 6 | AI Coach (chat with tool use) | not started |
| 7 | Voice (TTS cues, morning agent) | not started |

---

## What's shipped (recent commits)

```
d81c7df4 feat(seed): generate 30 exercises with OpenAI structured outputs
407cfa8f feat(seed): generate 50 recipes with OpenAI structured outputs
3b9756ff feat(planning): aggregate weekly shopping list from RecipeIngredient
8e03e814 feat(recipes): add recipe detail screen with hydrated ingredients
6411e74d feat(planning): hydrate today's plan with recipe + ingredient quantities
ae3ad78d feat(planning): compute deterministic kcal/macro targets via TdeeService
b971fd13 chore(mobile): remove dead ConciergeDashboard placeholder
40c98eae feat(planning): replace binary plan status with typed discriminated union under /v1
```

## Test state (excluding pre-existing flakes)

API unit + e2e green except 4 pre-existing failures (unrelated to current work):

- `daily-plan.entity.spec.ts` — `addItem` 5-cap rule returns false on 6th
- `register-user.use-case.spec.ts` — `MockUserRepository` missing `findProfileForMe`
- `admin.{controller,service}.spec.ts` — providers misconfigured in test module
- `gamification.e2e-spec.ts` — `currentStreak` stays at 0 after habit completion

Total green: **82 tests** across 11 suites that we own.

---

## In-progress work — Phase 4 (workout session)

### Done in this phase

- 30 exercises seeded (`apps/api/scripts/seed-exercises-ai.ts`, run with
  `pnpm tsx scripts/seed-exercises-ai.ts` from `apps/api/`).
- AI seed schema + 10 passing unit tests
  ([exercise-seed.schema.ts](apps/api/src/modules/planning/application/exercise-seed/exercise-seed.schema.ts)).

### Sitting in working tree (intentionally uncommitted)

- [`apps/mobile/src/lib/workout/workout-session.machine.spec.ts`](apps/mobile/src/lib/workout/workout-session.machine.spec.ts)
  — RED tests for a pure reducer:
  - `IDLE` + `START` → `exercising`
  - `exercising` + `COMPLETE_SET` → `resting` (with restSec from current exercise)
  - `resting` + `TICK` → decrement, clamp to 0, auto-advance when 0
  - `resting` + `SKIP_REST` → next set immediately
  - last set of last exercise → `completed`
  - any non-terminal state + `ABORT` → `aborted`
  - `ABORT` is a no-op once `completed`

### What still needs to ship (in order)

1. **Add Jest to mobile.** No runner is configured there yet. Minimal:
   `pnpm add -D jest ts-jest @types/jest`, then a `jest.config.js` with
   `testEnvironment: 'node'` (no jsdom needed — the machine has no React).
2. **Implement `workout-session.machine.ts`** until the 11 spec cases pass.
   Pure reducer, immutable transitions, no I/O.
3. **Hydrate workout exercises in `/v1/planning/lifestyle/today/detailed`**
   (mirror the recipe hydration in [planning.controller.ts](apps/api/src/modules/planning/planning.controller.ts):
   each `block.exercises[]` should include `name`, `description`,
   `expertCues`, `difficulty`, `equipment` from the Exercise table — leave
   `recipe: null` style fallback if exerciseId is unknown).
4. **Build `apps/mobile/app/workouts/run/[id].tsx`** consuming the machine:
   header (current exercise X of N), card with name + cues, set counter,
   rest timer with progress ring, "Done with set" CTA, "Skip rest" CTA,
   summary screen on `completed`. Use the same theme tokens as
   [TodayPlanDashboard.tsx](apps/mobile/src/components/plan/TodayPlanDashboard.tsx).
5. **Wire the "Comenzar entreno" button** in
   [TodayPlanDashboard.tsx](apps/mobile/src/components/plan/TodayPlanDashboard.tsx)
   to `router.push('/workouts/run/' + workout.id)` instead of the current
   inline `markCompleted` call. The session screen should call
   `markCompleted` on the `completed` state.

---

## Open security items

The OpenAI key pasted in chat earlier is in `apps/api/.env` and was used
by the recipe + exercise seeds. **Rotate it once this Phase 4 work lands**
at https://platform.openai.com/api-keys — replace in `.env`, no other
change required.

The Supabase `sb_secret_*` pasted earlier in the same chat should also be
rotated if not already done.

---

## Quick commands

```sh
# api dir is the working dir for almost every backend command
cd apps/api

# bring up local stack (postgres on 5436, redis on 6380)
# (use whatever script the user has — dev-start.sh in repo root)

# run unit tests
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
```

---

## Repo conventions to keep

- `feat(scope):`, `chore(scope):`, `fix(scope):` conventional commits.
- Each commit should compile and pass tests on its own.
- Backend tests live in `apps/api/src/**/*.spec.ts` (unit) and
  `apps/api/test/**/*.e2e-spec.ts` (e2e).
- TDD: write the failing test first, then the smallest implementation that
  passes, then refactor. The recent commits demonstrate this rhythm.
- Mobile API client base URL is already `/v1`, so screens call
  `/planning/lifestyle/today` and the version prefix is added implicitly.
- `.env` files are gitignored. `.env.example` documents the keys but never
  the values.
