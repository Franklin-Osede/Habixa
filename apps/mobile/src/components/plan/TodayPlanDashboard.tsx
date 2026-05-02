import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api.client';

const SKIP_REASONS: Array<{ id: string; label: string }> = [
  { id: 'illness', label: 'Estoy enfermo' },
  { id: 'time', label: 'No tengo tiempo hoy' },
  { id: 'mood', label: 'No me siento con ánimo' },
  { id: 'travel', label: 'Estoy de viaje' },
  { id: 'injury', label: 'Lesión / molestia' },
  { id: 'other', label: 'Otro' },
];

function promptSkipReason(
  activityLabel: string,
  onPick: (reason: string) => void,
) {
  Alert.alert(
    `Saltar: ${activityLabel}`,
    'Esto no rompe tu racha pero cuenta como no completado. ¿Por qué saltas?',
    [
      ...SKIP_REASONS.map((r) => ({
        text: r.label,
        onPress: () => onPick(r.id),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ],
  );
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  snack: 'Snack',
  dinner: 'Cena',
};

type HydratedMeal = {
  id: string;
  mealType: string;
  recipe: {
    id: string;
    title: string;
    calories: number;
    imageUrl: string | null;
  } | null;
};

type LifestyleTodayResponse =
  | { status: 'NOT_STARTED' }
  | { status: 'GENERATING'; jobId: string | null; progress: number }
  | { status: 'FAILED'; errorMessage: string | null; canRetry: boolean }
  | {
      status: 'READY';
      lifestylePlanId: string;
      planWeekId: string;
      weekIndex: number;
      dayIndex: number;
      date: string;
      source: string;
      schemaVersion: string;
      day: {
        workout?: { id: string; title?: string };
        nutrition?: { meals?: HydratedMeal[] };
        habits?: Array<{ id: string; title?: string; target?: string }>;
      };
      completion: Array<{
        activityId: string | null;
        activityType: string | null;
        title: string;
        completedAt: string | null;
      }>;
    };

const COLORS = {
  bgDark: '#15241a',
  surface: 'rgba(255,255,255,0.05)',
  brand: '#0df259',
  textPrimary: '#fff',
  textMuted: 'rgba(255,255,255,0.6)',
  danger: '#ff4444',
};

export function TodayPlanDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LifestyleTodayResponse | null>(null);
  const [error, setError] = useState('');

  const fetchTodayPlan = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get<LifestyleTodayResponse>(
        '/planning/lifestyle/today/detailed',
      );
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch today plan', err);
      setError('No se pudo cargar el plan de hoy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTodayPlan();
  }, []);

  if (loading) return <CenteredSpinner />;

  if (error) return <ErrorState message={error} onRetry={fetchTodayPlan} />;

  if (!data) return null;

  switch (data.status) {
    case 'NOT_STARTED':
      return <NotStartedState />;
    case 'GENERATING':
      return <GeneratingState progress={data.progress} />;
    case 'FAILED':
      return (
        <ErrorState
          message={data.errorMessage ?? 'No pudimos generar tu plan.'}
          onRetry={fetchTodayPlan}
        />
      );
    case 'READY':
      return <ReadyState data={data} onRefresh={fetchTodayPlan} />;
  }
}

function CenteredSpinner() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={COLORS.brand} />
    </View>
  );
}

function NotStartedState() {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="rocket-outline" size={48} color={COLORS.brand} />
      <Text style={styles.headerTitle}>Configura tu plan</Text>
      <Text style={styles.bodyMuted}>
        Aún no has generado tu primer plan. Completa el onboarding para empezar.
      </Text>
    </View>
  );
}

function GeneratingState({ progress }: { progress: number }) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={COLORS.brand} />
      <Text style={styles.headerTitle}>Generando tu plan…</Text>
      <Text style={styles.bodyMuted}>
        Estamos creando tu plan personalizado. Esto puede tardar unos
        segundos.
      </Text>
      <Text style={styles.bodyMuted}>{progress}%</Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

function ReadyState({
  data,
  onRefresh,
}: {
  data: Extract<LifestyleTodayResponse, { status: 'READY' }>;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const { day, completion, planWeekId, date } = data;
  const meals = day?.nutrition?.meals ?? [];
  const habits = day?.habits ?? [];
  const workout = day?.workout;

  const isCompleted = (activityId: string | undefined) =>
    Boolean(
      activityId && completion.some((item) => item.activityId === activityId),
    );

  const markCompleted = async (
    activityId: string,
    type: string,
    title: string,
  ) => {
    try {
      await api.post('/planning/lifestyle/activity', {
        activityId,
        activityType: type,
        title,
        planWeekId,
      });
      onRefresh();
    } catch (err) {
      console.error('Error marking completed', err);
    }
  };

  const skipActivity = (
    activityId: string,
    type: string,
    title: string,
    label: string,
  ) => {
    promptSkipReason(label, async (reason) => {
      try {
        await api.post('/planning/lifestyle/activity/skip', {
          activityId,
          activityType: type,
          title,
          planWeekId,
          reason,
        });
        onRefresh();
      } catch (err) {
        console.error('Error skipping activity', err);
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.dateLabel}>{formatHumanDate(date)}</Text>
        <Text style={styles.headerTitle}>Tu Plan de Hoy</Text>

        {workout && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="barbell-outline"
                size={24}
                color={COLORS.brand}
              />
              <Text style={styles.cardTitle}>Entrenamiento</Text>
            </View>
            <Text style={styles.itemTitle}>
              {workout.title ?? 'Entrenamiento del día'}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.completeBtn,
                  styles.completeBtnFlex,
                  isCompleted(workout.id) && styles.completedBtn,
                ]}
                onPress={() =>
                  router.push(
                    `/workouts/run/${workout.id ?? 'workout_1'}` as never,
                  )
                }
              >
                <Text style={styles.completeBtnText}>
                  {isCompleted(workout.id)
                    ? 'Repetir entreno'
                    : 'Comenzar entreno'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() =>
                  skipActivity(
                    workout.id ?? 'workout_1',
                    'workout',
                    workout.title ?? 'Entrenamiento',
                    workout.title ?? 'Entrenamiento',
                  )
                }
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={18}
                  color={COLORS.textMuted}
                />
                <Text style={styles.skipBtnText}>Saltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {meals.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="restaurant-outline"
                size={24}
                color={COLORS.brand}
              />
              <Text style={styles.cardTitle}>Nutrición</Text>
            </View>
            {meals.map((meal, index) => {
              const mealLabel =
                MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType;
              const recipeTitle = meal.recipe?.title ?? 'Receta no disponible';
              return (
                <View key={meal.id ?? index} style={styles.mealItem}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.7}
                    disabled={!meal.recipe}
                    onPress={() =>
                      meal.recipe &&
                      router.push(`/nutrition/recipe/${meal.recipe.id}`)
                    }
                    onLongPress={() =>
                      skipActivity(
                        meal.id ?? `meal_${index}`,
                        'meal',
                        meal.mealType,
                        `${mealLabel}: ${recipeTitle}`,
                      )
                    }
                  >
                    <Text style={styles.mealLabel}>{mealLabel}</Text>
                    <Text style={styles.itemTitle}>{recipeTitle}</Text>
                    {meal.recipe ? (
                      <Text style={styles.mealMeta}>
                        {meal.recipe.calories} kcal · Ver ingredientes ›
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.completeBtnSmall,
                      isCompleted(meal.id) && styles.completedBtn,
                    ]}
                    disabled={isCompleted(meal.id)}
                    onPress={() =>
                      markCompleted(
                        meal.id ?? `meal_${index}`,
                        'meal',
                        meal.mealType,
                      )
                    }
                  >
                    <Ionicons
                      name="checkmark-outline"
                      size={20}
                      color={COLORS.bgDark}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {habits.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="water-outline" size={24} color={COLORS.brand} />
              <Text style={styles.cardTitle}>Hábitos</Text>
            </View>
            {habits.map((habit: any, index: number) => (
              <View key={habit.id ?? index} style={styles.mealItem}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.7}
                  onLongPress={() =>
                    skipActivity(
                      habit.id ?? `habit_${index}`,
                      'habit',
                      habit.title ?? 'Hábito',
                      habit.title ?? 'Hábito',
                    )
                  }
                >
                  <Text style={styles.itemTitle}>
                    {habit.title ?? habit.target}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.completeBtnSmall,
                    isCompleted(habit.id) && styles.completedBtn,
                  ]}
                  disabled={isCompleted(habit.id)}
                  onPress={() =>
                    markCompleted(
                      habit.id ?? `habit_${index}`,
                      'habit',
                      habit.title ?? 'Hábito',
                    )
                  }
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={20}
                    color={COLORS.bgDark}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatHumanDate(isoDate: string): string {
  // isoDate is YYYY-MM-DD in UTC; rendering with es-ES locale.
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date
    .toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    })
    .toUpperCase();
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: { color: COLORS.danger, fontSize: 16, textAlign: 'center' },
  retryBtn: {
    backgroundColor: COLORS.brand,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: { color: COLORS.bgDark, fontWeight: 'bold' },
  bodyMuted: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  scroll: { padding: 20 },
  dateLabel: {
    fontSize: 12,
    color: COLORS.brand,
    letterSpacing: 1.5,
    marginBottom: 4,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.brand,
    marginLeft: 8,
  },
  itemTitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 12,
    flex: 1,
  },
  completeBtn: {
    backgroundColor: COLORS.brand,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeBtnFlex: { flex: 1 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  skipBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  completeBtnText: {
    color: COLORS.bgDark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealLabel: {
    fontSize: 11,
    color: COLORS.brand,
    letterSpacing: 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  mealMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  completeBtnSmall: {
    backgroundColor: COLORS.brand,
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  completedBtn: { opacity: 0.5 },
});
