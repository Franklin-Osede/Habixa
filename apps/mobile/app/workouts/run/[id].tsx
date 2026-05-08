import React, { useEffect, useReducer, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Brand } from '../../../constants/theme';
import api from '../../../src/services/api.client';
import {
  WorkoutSessionPlan,
  WorkoutSessionState,
  WorkoutSessionEvent,
  initialState,
  reduceSession,
  totalSets as planTotalSets,
  completedSets as planCompletedSets,
} from '../../../src/lib/workout/workout-session.machine';
import { useVoiceCue } from '../../../src/lib/workout/use-voice-cue';

type HydratedExercise = {
  id: string;
  name: string;
  description: string | null;
  expertCues: string | null;
  difficulty: string;
  muscleGroup: string;
  equipment: string | null;
  movementPattern: string | null;
} | null;

type ApiPlanItem = {
  exercise: HydratedExercise;
  sets: number;
  reps: string;
  restSec: number;
};

type ApiBlock = {
  id: string;
  type: string;
  exercises: ApiPlanItem[];
};

type ApiTodayDetailedReady = {
  status: 'READY';
  planWeekId: string;
  day: {
    workout?: {
      id: string;
      title: string;
      blocks: ApiBlock[];
    };
  };
};

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<WorkoutSessionPlan | null>(null);
  const [planWeekId, setPlanWeekId] = useState<string | null>(null);
  const [workoutActivityId, setWorkoutActivityId] = useState<string | null>(
    null,
  );
  const [workoutTitle, setWorkoutTitle] = useState<string>(t('workout.title'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reducer = (s: WorkoutSessionState, e: WorkoutSessionEvent) =>
    plan ? reduceSession(plan, s, e) : s;
  const [state, dispatch] = useReducer(reducer, initialState());

  const { playCue } = useVoiceCue();

  // Fetch the day plan and shape it for the state machine.
  // The route [id] is the today's-workout id; we fetch /today/detailed
  // and verify the workout we get back matches. If not (stale link or
  // user navigated to a different day's workout), we still try today.
  useEffect(() => {
    let cancelled = false;
    const fetchPlan = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get<ApiTodayDetailedReady>(
          '/planning/lifestyle/today/detailed',
        );
        if (cancelled) return;
        if (res.data?.status !== 'READY') {
          setError(t('workout.noWorkoutToday'));
          return;
        }
        const workout = res.data.day?.workout;
        if (!workout || !workout.id) {
          setError(t('workout.noWorkoutToday'));
          return;
        }

        const flatExercises = (workout.blocks ?? [])
          .flatMap((b) => b?.exercises ?? [])
          .filter((item) => item && !!item.exercise && !!item.sets);

        if (flatExercises.length === 0) {
          setError(t('workout.noExercises'));
          return;
        }

        setPlan({
          workoutId: workout.id,
          title: workout.title,
          exercises: flatExercises.map((item) => ({
            exerciseId: item.exercise!.id,
            name: item.exercise!.name,
            sets: item.sets,
            reps: item.reps,
            restSec: item.restSec,
          })),
        });
        setWorkoutTitle(workout.title);
        setWorkoutActivityId(workout.id);
        setPlanWeekId(res.data.planWeekId);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load workout', err);
        setError(t('workout.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchPlan();
    return () => {
      cancelled = true;
    };
  }, [params.id, t]);

  // Tick the rest timer once a second when resting.
  useEffect(() => {
    if (state.kind !== 'resting') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', nowMs: Date.now() });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.kind]);

  useEffect(() => {
    if (!plan) return;
    if (state.kind === 'exercising' && state.setIndex === 0) {
      const exercise = plan.exercises[state.exerciseIndex];
      if (exercise) {
        void playCue({ kind: 'intro', exerciseId: exercise.exerciseId });
      }
      return;
    }
    if (state.kind === 'resting') {
      void playCue({ kind: 'rest_start' });
    }
  }, [
    plan,
    state.kind,
    state.kind === 'exercising' ? state.exerciseIndex : null,
    state.kind === 'exercising' ? state.setIndex : null,
    state.kind === 'resting' ? state.exerciseIndex : null,
    playCue,
  ]);

  useEffect(() => {
    if (state.kind !== 'completed' || !workoutActivityId || !planWeekId) return;
    void api
      .post('/planning/lifestyle/activity', {
        activityId: workoutActivityId,
        activityType: 'workout',
        title: workoutTitle,
        planWeekId,
      })
      .catch((err) => {
        console.error('Failed to mark workout complete', err);
      });
  }, [state.kind, workoutActivityId, planWeekId, workoutTitle]);

  const onAbort = () => {
    Alert.alert(t('workout.abortTitle'), t('workout.abortBody'), [
      { text: t('workout.keepGoing'), style: 'cancel' },
      {
        text: t('workout.exit'),
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'ABORT', nowMs: Date.now() });
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Brand.accent} />
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={Brand.danger} />
        <Text style={styles.errorText}>{error || t('workout.noData')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state.kind === 'idle') {
    return (
      <IdleStartScreen
        plan={plan}
        onStart={() => dispatch({ type: 'START', nowMs: Date.now() })}
        onAbort={() => router.back()}
      />
    );
  }

  if (state.kind === 'completed') {
    return <CompletedScreen plan={plan} onClose={() => router.back()} />;
  }

  if (state.kind === 'aborted') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.bodyMuted}>{t('workout.interrupted')}</Text>
      </View>
    );
  }

  return (
    <ActiveSessionScreen
      plan={plan}
      state={state}
      dispatch={dispatch}
      onAbort={onAbort}
    />
  );
}

function IdleStartScreen({
  plan,
  onStart,
  onAbort,
}: {
  plan: WorkoutSessionPlan;
  onStart: () => void;
  onAbort: () => void;
}) {
  const { t } = useTranslation();
  const total = planTotalSets(plan);
  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onAbort}>
          <Ionicons name="close" size={28} color={Brand.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {plan.title}
        </Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>
          {t('workout.exercisesAndSets', {
            exercises: plan.exercises.length,
            sets: total,
          })}
        </Text>
        {plan.exercises.map((ex, idx) => (
          <View key={`${ex.exerciseId}-${idx}`} style={styles.previewRow}>
            <Text style={styles.previewIndex}>{idx + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{ex.name}</Text>
              <Text style={styles.previewMeta}>
                {ex.sets} × {ex.reps} · {ex.restSec}s
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onStart}>
          <Ionicons name="play" size={20} color={Brand.bgDark} />
          <Text style={styles.primaryBtnText}>{t('common.start')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ActiveSessionScreen({
  plan,
  state,
  dispatch,
  onAbort,
}: {
  plan: WorkoutSessionPlan;
  state: Extract<WorkoutSessionState, { kind: 'exercising' | 'resting' }>;
  dispatch: React.Dispatch<WorkoutSessionEvent>;
  onAbort: () => void;
}) {
  const { t } = useTranslation();
  const total = planTotalSets(plan);
  const completed = planCompletedSets(plan, state);
  const exerciseIndex =
    state.kind === 'exercising' ? state.exerciseIndex : state.exerciseIndex;
  const exercise = plan.exercises[exerciseIndex];
  const setIndex =
    state.kind === 'exercising' ? state.setIndex : state.nextSetIndex;
  const progressPct = Math.round((completed / total) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onAbort}>
          <Ionicons name="close" size={28} color={Brand.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {plan.title}
        </Text>
        <Text style={styles.headerProgress}>
          {completed}/{total}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.exerciseLabel}>
          {t('workout.exerciseOf', {
            current: exerciseIndex + 1,
            total: plan.exercises.length,
          })}
        </Text>
        <Text style={styles.exerciseTitle}>{exercise.name}</Text>
        <Text style={styles.exerciseMeta}>
          {t('workout.setOf', {
            current: setIndex + 1,
            total: exercise.sets,
            reps: exercise.reps,
          })}
        </Text>
      </ScrollView>

      {state.kind === 'exercising' ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              dispatch({ type: 'COMPLETE_SET', nowMs: Date.now() })
            }
          >
            <Ionicons name="checkmark" size={20} color={Brand.bgDark} />
            <Text style={styles.primaryBtnText}>
              {t('workout.completedSet')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footer}>
          <Text style={styles.restLabel}>{t('workout.rest')}</Text>
          <Text style={styles.restCountdown}>{state.restRemainingSec}s</Text>
          <Text style={styles.footerHint}>
            {t('workout.nextSet', {
              current: state.nextSetIndex + 1,
              total: plan.exercises[state.exerciseIndex].sets,
            })}
          </Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => dispatch({ type: 'SKIP_REST', nowMs: Date.now() })}
          >
            <Ionicons
              name="play-skip-forward"
              size={18}
              color={Brand.accent}
            />
            <Text style={styles.secondaryBtnText}>
              {t('workout.skipRest')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function CompletedScreen({
  plan,
  onClose,
}: {
  plan: WorkoutSessionPlan;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const total = planTotalSets(plan);
  return (
    <View style={[styles.container, styles.center]}>
      <Ionicons name="trophy-outline" size={72} color={Brand.accent} />
      <Text style={styles.celebrateTitle}>{t('workout.completed')}</Text>
      <Text style={styles.bodyMuted}>
        {t('workout.completedBody', {
          exercises: plan.exercises.length,
          sets: total,
          title: plan.title,
        })}
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
        <Text style={styles.primaryBtnText}>{t('common.close')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bgDark },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: {
    color: Brand.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  headerProgress: {
    color: Brand.accent,
    fontSize: 14,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Brand.accent },
  scroll: { padding: 24, flexGrow: 1 },
  lead: { color: Brand.textMuted, fontSize: 14, marginBottom: 18 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  previewIndex: {
    width: 28,
    color: Brand.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  previewName: {
    color: Brand.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  previewMeta: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  exerciseLabel: {
    color: Brand.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  exerciseTitle: {
    color: Brand.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  exerciseMeta: {
    color: Brand.textMuted,
    fontSize: 16,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 12,
    alignItems: 'center',
  },
  footerHint: { color: Brand.textMuted, fontSize: 13 },
  primaryBtn: {
    backgroundColor: Brand.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: Brand.bgDark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.accent,
  },
  secondaryBtnText: {
    color: Brand.accent,
    fontWeight: 'bold',
  },
  restLabel: {
    color: Brand.warning,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  restCountdown: {
    color: Brand.textPrimary,
    fontSize: 64,
    fontWeight: 'bold',
  },
  celebrateTitle: {
    color: Brand.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bodyMuted: { color: Brand.textMuted, fontSize: 14, textAlign: 'center' },
  errorText: {
    color: Brand.danger,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  retryBtn: {
    backgroundColor: Brand.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  retryBtnText: { color: Brand.bgDark, fontWeight: 'bold' },
});
