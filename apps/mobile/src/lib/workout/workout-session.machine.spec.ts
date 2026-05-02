import {
  reduceSession,
  initialState,
  WorkoutSessionPlan,
} from './workout-session.machine';

const plan: WorkoutSessionPlan = {
  workoutId: 'w1',
  title: 'Full Body',
  exercises: [
    {
      exerciseId: 'e1',
      name: 'Goblet Squat',
      sets: 3,
      reps: '10',
      restSec: 60,
    },
    {
      exerciseId: 'e2',
      name: 'Push-Up',
      sets: 2,
      reps: '12',
      restSec: 45,
    },
  ],
};

describe('reduceSession', () => {
  describe('initialState + START', () => {
    it('boots into "exercising" at exercise 0, set 0', () => {
      const next = reduceSession(plan, initialState(), {
        type: 'START',
        nowMs: 1000,
      });
      expect(next.kind).toBe('exercising');
      if (next.kind !== 'exercising') return;
      expect(next.exerciseIndex).toBe(0);
      expect(next.setIndex).toBe(0);
      expect(next.startedAtMs).toBe(1000);
    });

    it('rejects START on non-idle state (returns previous)', () => {
      const after = reduceSession(plan, initialState(), {
        type: 'START',
        nowMs: 1000,
      });
      const reapplied = reduceSession(plan, after, { type: 'START', nowMs: 2000 });
      expect(reapplied).toBe(after);
    });
  });

  describe('COMPLETE_SET while exercising (more sets in current exercise)', () => {
    it('transitions to "resting" with the exercise restSec countdown', () => {
      const exercising = reduceSession(plan, initialState(), {
        type: 'START',
        nowMs: 1000,
      });
      const next = reduceSession(plan, exercising, {
        type: 'COMPLETE_SET',
        nowMs: 2000,
      });
      expect(next.kind).toBe('resting');
      if (next.kind !== 'resting') return;
      expect(next.exerciseIndex).toBe(0);
      expect(next.nextSetIndex).toBe(1);
      expect(next.restTotalSec).toBe(60);
      expect(next.restRemainingSec).toBe(60);
    });
  });

  describe('TICK during rest', () => {
    it('decrements remaining seconds based on elapsed real time', () => {
      const start = reduceSession(plan, initialState(), {
        type: 'START',
        nowMs: 0,
      });
      const resting = reduceSession(plan, start, {
        type: 'COMPLETE_SET',
        nowMs: 0,
      });
      const after10s = reduceSession(plan, resting, {
        type: 'TICK',
        nowMs: 10_000,
      });
      expect(after10s.kind).toBe('resting');
      if (after10s.kind !== 'resting') return;
      expect(after10s.restRemainingSec).toBe(50);
    });

    it('clamps to 0 when elapsed >= total', () => {
      const start = reduceSession(plan, initialState(), {
        type: 'START',
        nowMs: 0,
      });
      const resting = reduceSession(plan, start, {
        type: 'COMPLETE_SET',
        nowMs: 0,
      });
      const after120s = reduceSession(plan, resting, {
        type: 'TICK',
        nowMs: 120_000,
      });
      // Rest auto-advances to next set when timer hits 0.
      expect(after120s.kind).toBe('exercising');
      if (after120s.kind !== 'exercising') return;
      expect(after120s.setIndex).toBe(1);
    });
  });

  describe('SKIP_REST', () => {
    it('skips remaining rest and goes to the next set', () => {
      const start = reduceSession(plan, initialState(), {
        type: 'START',
        nowMs: 0,
      });
      const resting = reduceSession(plan, start, {
        type: 'COMPLETE_SET',
        nowMs: 0,
      });
      const next = reduceSession(plan, resting, {
        type: 'SKIP_REST',
        nowMs: 10_000,
      });
      expect(next.kind).toBe('exercising');
      if (next.kind !== 'exercising') return;
      expect(next.exerciseIndex).toBe(0);
      expect(next.setIndex).toBe(1);
      expect(next.startedAtMs).toBe(10_000);
    });
  });

  describe('Exercise transition (last set of an exercise)', () => {
    it('advances to next exercise set 0 after rest', () => {
      let s = reduceSession(plan, initialState(), { type: 'START', nowMs: 0 });
      // Complete sets 1, 2, 3 of exercise 0
      for (let i = 0; i < 3; i++) {
        s = reduceSession(plan, s, { type: 'COMPLETE_SET', nowMs: 0 });
        if (s.kind === 'resting')
          s = reduceSession(plan, s, { type: 'SKIP_REST', nowMs: 0 });
      }
      expect(s.kind).toBe('exercising');
      if (s.kind !== 'exercising') return;
      expect(s.exerciseIndex).toBe(1);
      expect(s.setIndex).toBe(0);
    });
  });

  describe('Workout completion (last set of last exercise)', () => {
    it('transitions to "completed" after the last set is done', () => {
      let s = reduceSession(plan, initialState(), { type: 'START', nowMs: 0 });
      for (let ex = 0; ex < plan.exercises.length; ex++) {
        for (let st = 0; st < plan.exercises[ex].sets; st++) {
          s = reduceSession(plan, s, {
            type: 'COMPLETE_SET',
            nowMs: 0,
          });
          if (s.kind === 'resting')
            s = reduceSession(plan, s, { type: 'SKIP_REST', nowMs: 0 });
        }
      }
      expect(s.kind).toBe('completed');
      if (s.kind !== 'completed') return;
      expect(s.completedAtMs).toBe(0);
    });
  });

  describe('ABORT', () => {
    it('moves to "aborted" from any non-terminal state', () => {
      const exercising = reduceSession(plan, initialState(), {
        type: 'START',
        nowMs: 0,
      });
      const aborted = reduceSession(plan, exercising, {
        type: 'ABORT',
        nowMs: 5000,
      });
      expect(aborted.kind).toBe('aborted');
      if (aborted.kind !== 'aborted') return;
      expect(aborted.abortedAtMs).toBe(5000);
    });

    it('is a no-op once already completed', () => {
      let s = reduceSession(plan, initialState(), { type: 'START', nowMs: 0 });
      for (let ex = 0; ex < plan.exercises.length; ex++) {
        for (let st = 0; st < plan.exercises[ex].sets; st++) {
          s = reduceSession(plan, s, { type: 'COMPLETE_SET', nowMs: 0 });
          if (s.kind === 'resting')
            s = reduceSession(plan, s, { type: 'SKIP_REST', nowMs: 0 });
        }
      }
      const after = reduceSession(plan, s, { type: 'ABORT', nowMs: 9000 });
      expect(after).toBe(s);
    });
  });

  describe('progress derivation', () => {
    it('total sets equals sum of exercise sets', () => {
      // helper to be exposed alongside reducer
      // 3 + 2 = 5
      expect(plan.exercises.reduce((acc, e) => acc + e.sets, 0)).toBe(5);
    });
  });
});
