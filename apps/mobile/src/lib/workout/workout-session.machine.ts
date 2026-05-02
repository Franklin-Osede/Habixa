/**
 * Pure reducer driving a guided workout session.
 *
 * The state machine is intentionally I/O-free: timers, navigation and
 * persistence live in the screen layer. Tests fully exercise this module
 * without React or expo-router. See workout-session.machine.spec.ts.
 *
 * State transitions (high level):
 *
 *   idle ── START ──► exercising
 *   exercising ── COMPLETE_SET (more sets/exercises) ──► resting
 *   exercising ── COMPLETE_SET (last set of last ex.) ──► completed
 *   resting ── TICK (elapsed < total) ──► resting (countdown)
 *   resting ── TICK (elapsed >= total) ──► exercising (auto-advance)
 *   resting ── SKIP_REST ──► exercising
 *   any non-terminal ── ABORT ──► aborted
 */

export interface WorkoutSessionExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSec: number;
}

export interface WorkoutSessionPlan {
  workoutId: string;
  title: string;
  exercises: WorkoutSessionExercise[];
}

export type WorkoutSessionState =
  | { kind: 'idle' }
  | {
      kind: 'exercising';
      exerciseIndex: number;
      setIndex: number;
      startedAtMs: number;
    }
  | {
      kind: 'resting';
      exerciseIndex: number;
      nextSetIndex: number;
      restTotalSec: number;
      restRemainingSec: number;
      startedAtMs: number;
    }
  | { kind: 'completed'; completedAtMs: number }
  | { kind: 'aborted'; abortedAtMs: number };

export type WorkoutSessionEvent =
  | { type: 'START'; nowMs: number }
  | { type: 'COMPLETE_SET'; nowMs: number }
  | { type: 'TICK'; nowMs: number }
  | { type: 'SKIP_REST'; nowMs: number }
  | { type: 'ABORT'; nowMs: number };

export function initialState(): WorkoutSessionState {
  return { kind: 'idle' };
}

export function reduceSession(
  plan: WorkoutSessionPlan,
  state: WorkoutSessionState,
  event: WorkoutSessionEvent,
): WorkoutSessionState {
  switch (event.type) {
    case 'START':
      if (state.kind !== 'idle') return state;
      return {
        kind: 'exercising',
        exerciseIndex: 0,
        setIndex: 0,
        startedAtMs: event.nowMs,
      };

    case 'COMPLETE_SET': {
      if (state.kind !== 'exercising') return state;
      const exercise = plan.exercises[state.exerciseIndex];
      if (!exercise) return state;
      const nextSetIndex = state.setIndex + 1;

      // Still sets remaining in the current exercise: rest, then same exercise.
      if (nextSetIndex < exercise.sets) {
        return {
          kind: 'resting',
          exerciseIndex: state.exerciseIndex,
          nextSetIndex,
          restTotalSec: exercise.restSec,
          restRemainingSec: exercise.restSec,
          startedAtMs: event.nowMs,
        };
      }

      // Finished the last set of this exercise.
      const nextExerciseIndex = state.exerciseIndex + 1;
      if (nextExerciseIndex < plan.exercises.length) {
        // Transition rest before next exercise (use just-finished exercise's restSec).
        return {
          kind: 'resting',
          exerciseIndex: nextExerciseIndex,
          nextSetIndex: 0,
          restTotalSec: exercise.restSec,
          restRemainingSec: exercise.restSec,
          startedAtMs: event.nowMs,
        };
      }

      // Last set of last exercise → done.
      return { kind: 'completed', completedAtMs: event.nowMs };
    }

    case 'TICK': {
      if (state.kind !== 'resting') return state;
      const elapsedSec = Math.floor(
        (event.nowMs - state.startedAtMs) / 1000,
      );
      const remaining = Math.max(0, state.restTotalSec - elapsedSec);
      if (remaining <= 0) {
        return {
          kind: 'exercising',
          exerciseIndex: state.exerciseIndex,
          setIndex: state.nextSetIndex,
          startedAtMs: event.nowMs,
        };
      }
      // Avoid spurious re-renders: only return a new object if the
      // remaining count actually changed.
      if (remaining === state.restRemainingSec) return state;
      return { ...state, restRemainingSec: remaining };
    }

    case 'SKIP_REST':
      if (state.kind !== 'resting') return state;
      return {
        kind: 'exercising',
        exerciseIndex: state.exerciseIndex,
        setIndex: state.nextSetIndex,
        startedAtMs: event.nowMs,
      };

    case 'ABORT':
      if (state.kind === 'completed' || state.kind === 'aborted') return state;
      return { kind: 'aborted', abortedAtMs: event.nowMs };
  }
}

/**
 * Helper: total number of sets across the plan. Used by the screen layer
 * to render an overall progress bar without needing to peek into the
 * machine's internals.
 */
export function totalSets(plan: WorkoutSessionPlan): number {
  return plan.exercises.reduce((acc, ex) => acc + ex.sets, 0);
}

/**
 * Helper: how many sets have been completed at any given state. Used to
 * derive `completed / total` for the progress bar.
 */
export function completedSets(
  plan: WorkoutSessionPlan,
  state: WorkoutSessionState,
): number {
  switch (state.kind) {
    case 'idle':
      return 0;
    case 'completed':
    case 'aborted':
      return totalSets(plan);
    case 'exercising': {
      let acc = state.setIndex;
      for (let i = 0; i < state.exerciseIndex; i++) {
        acc += plan.exercises[i].sets;
      }
      return acc;
    }
    case 'resting': {
      // The "next" set has not started yet; whatever we are about to do
      // counts as the boundary. The completed count is everything strictly
      // before nextSetIndex in the current exercise plus all prior exercises.
      let acc = state.nextSetIndex;
      for (let i = 0; i < state.exerciseIndex; i++) {
        acc += plan.exercises[i].sets;
      }
      return acc;
    }
  }
}
