import React, { useEffect, useMemo, useReducer, useState } from 'react';
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

const COLORS = {
  bgDark: '#15241a',
  surface: 'rgba(255,255,255,0.05)',
  brand: '#0df259',
  textPrimary: '#fff',
  textMuted: 'rgba(255,255,255,0.6)',
  danger: '#ff4444',
  warning: '#f5a524',
};

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<WorkoutSessionPlan | null>(null);
  const [planWeekId, setPlanWeekId] = useState<string | null>(null);
  const [workoutActivityId, setWorkoutActivityId] = useState<string | null>(
    null,
  );
  const [workoutTitle, setWorkoutTitle] = useState<string>('Entrenamiento');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reducer = (s: WorkoutSessionState, e: WorkoutSessionEvent) =>
    plan ? reduceSession(plan, s, e) : s;
  const [state, dispatch] = useReducer(reducer, initialState());

  // Fetch the day plan and shape it for the state machine.
  useEffect(() => {
    let cancelled = false;
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const res = await api.get<ApiTodayDetailedReady>(
          '/planning/lifestyle/today/detailed',
        );
        if (cancelled) return;
        const workout = res.data?.day?.workout;
        if (!workout || res.data.status !== 'READY') {
          setError('No hay un entrenamiento listo para hoy.');
          return;
        }
        const flatExercises = workout.blocks
          .flatMap((b) => b.exercises)
          .filter((item) => !!item.exercise && !!item.sets);

        if (flatExercises.length === 0) {
          setError('Este entrenamiento no tiene ejercicios cargados.');
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
        setError('No se pudo cargar el entrenamiento.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchPlan();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // Tick the rest timer once a second when resting.
  useEffect(() => {
    if (state.kind !== 'resting') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', nowMs: Date.now() });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.kind]);

  // Mark the workout completed in the backend once we hit the completed state.
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
    Alert.alert(
      'Salir del entrenamiento',
      '¿Seguro que quieres salir? El progreso de la sesión actual no se guardará.',
      [
        { text: 'Seguir entrenando', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'ABORT', nowMs: Date.now() });
            router.back();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>{error || 'Sin datos'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state.kind === 'idle') {
    return <IdleStartScreen plan={plan} onStart={() => dispatch({ type: 'START', nowMs: Date.now() })} onAbort={() => router.back()} />;
  }

  if (state.kind === 'completed') {
    return <CompletedScreen plan={plan} onClose={() => router.back()} />;
  }

  if (state.kind === 'aborted') {
    // ABORT is dispatched and we navigate away — this branch is mostly defensive.
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.bodyMuted}>Sesión interrumpida.</Text>
      </View>
    );
  }

  // exercising or resting share the same shell
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
  const total = planTotalSets(plan);
  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onAbort}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {plan.title}
        </Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>
          {plan.exercises.length} ejercicios · {total} series totales
        </Text>
        {plan.exercises.map((ex, idx) => (
          <View key={`${ex.exerciseId}-${idx}`} style={styles.previewRow}>
            <Text style={styles.previewIndex}>{idx + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{ex.name}</Text>
              <Text style={styles.previewMeta}>
                {ex.sets} series × {ex.reps} · descanso {ex.restSec}s
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onStart}>
          <Ionicons name="play" size={20} color={COLORS.bgDark} />
          <Text style={styles.primaryBtnText}>Empezar</Text>
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
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
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
          Ejercicio {exerciseIndex + 1} de {plan.exercises.length}
        </Text>
        <Text style={styles.exerciseTitle}>{exercise.name}</Text>
        <Text style={styles.exerciseMeta}>
          Serie {setIndex + 1} de {exercise.sets} · {exercise.reps} reps
        </Text>
      </ScrollView>

      {state.kind === 'exercising' ? (
        <View style={styles.footer}>
          <Text style={styles.footerHint}>
            Cuando completes la serie, márcala
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              dispatch({ type: 'COMPLETE_SET', nowMs: Date.now() })
            }
          >
            <Ionicons name="checkmark" size={20} color={COLORS.bgDark} />
            <Text style={styles.primaryBtnText}>Serie completada</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footer}>
          <Text style={styles.restLabel}>DESCANSO</Text>
          <Text style={styles.restCountdown}>{state.restRemainingSec}s</Text>
          <Text style={styles.footerHint}>
            Próxima: serie {state.nextSetIndex + 1} de{' '}
            {plan.exercises[state.exerciseIndex].sets}
          </Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => dispatch({ type: 'SKIP_REST', nowMs: Date.now() })}
          >
            <Ionicons name="play-skip-forward" size={18} color={COLORS.brand} />
            <Text style={styles.secondaryBtnText}>Saltar descanso</Text>
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
  const total = planTotalSets(plan);
  return (
    <View style={[styles.container, styles.center]}>
      <Ionicons name="trophy-outline" size={72} color={COLORS.brand} />
      <Text style={styles.celebrateTitle}>¡Entreno completado!</Text>
      <Text style={styles.bodyMuted}>
        {plan.exercises.length} ejercicios · {total} series ·{' '}
        {plan.title}
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
        <Text style={styles.primaryBtnText}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  headerProgress: {
    color: COLORS.brand,
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
  progressFill: { height: '100%', backgroundColor: COLORS.brand },
  scroll: { padding: 24, flexGrow: 1 },
  lead: { color: COLORS.textMuted, fontSize: 14, marginBottom: 18 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  previewIndex: {
    width: 28,
    color: COLORS.brand,
    fontSize: 16,
    fontWeight: '700',
  },
  previewName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  previewMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  exerciseLabel: {
    color: COLORS.brand,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  exerciseTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  exerciseMeta: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 12,
    alignItems: 'center',
  },
  footerHint: { color: COLORS.textMuted, fontSize: 13 },
  primaryBtn: {
    backgroundColor: COLORS.brand,
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
    color: COLORS.bgDark,
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
    borderColor: COLORS.brand,
  },
  secondaryBtnText: {
    color: COLORS.brand,
    fontWeight: 'bold',
  },
  restLabel: {
    color: COLORS.warning,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  restCountdown: {
    color: COLORS.textPrimary,
    fontSize: 64,
    fontWeight: 'bold',
  },
  celebrateTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bodyMuted: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  errorText: {
    color: COLORS.danger,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  retryBtn: {
    backgroundColor: COLORS.brand,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  retryBtnText: { color: COLORS.bgDark, fontWeight: 'bold' },
});
