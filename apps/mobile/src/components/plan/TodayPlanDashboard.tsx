import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Brand } from '../../../constants/theme';
import api from '../../services/api.client';

const SKIP_REASON_KEYS = [
  'illness',
  'time',
  'mood',
  'travel',
  'injury',
  'other',
] as const;

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

export function TodayPlanDashboard() {
  const { t, i18n } = useTranslation();
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
      setError(t('plan.errors.todayLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTodayPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const renderBody = () => {
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
            message={data.errorMessage ?? t('plan.errors.generic')}
            onRetry={fetchTodayPlan}
          />
        );
      case 'READY':
        return <ReadyState data={data} onRefresh={fetchTodayPlan} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Brand.bgDark }}>
      <UserStatsHeader />
      {renderBody()}
    </View>
  );
}

type IdentityMe = {
  id: string;
  email: string;
  level: number;
  xp: number;
  currentStreak: number;
  currentDayIndex: number;
  gems: number;
};

function UserStatsHeader() {
  const [me, setMe] = useState<IdentityMe | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<IdentityMe>('/identity/me')
      .then((res) => {
        if (!cancelled) setMe(res.data);
      })
      .catch(() => {
        /* silent — header is decorative */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!me) return null;

  return (
    <View style={styles.statsHeader}>
      <View style={styles.statsCell}>
        <Ionicons name="flame" size={16} color={Brand.accent} />
        <Text style={styles.statsValue}>{me.currentStreak}</Text>
      </View>
      <View style={styles.statsCell}>
        <Text style={styles.statsValue}>L{me.level}</Text>
        <Text style={styles.statsMuted}>{me.xp.toLocaleString()} XP</Text>
      </View>
      <View style={styles.statsCell}>
        <Ionicons name="diamond-outline" size={14} color={Brand.accent} />
        <Text style={styles.statsValue}>{me.gems}</Text>
      </View>
    </View>
  );
}

function CenteredSpinner() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={Brand.accent} />
    </View>
  );
}

function NotStartedState() {
  const { t } = useTranslation();
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="rocket-outline" size={48} color={Brand.accent} />
      <Text style={styles.headerTitle}>{t('plan.states.configure')}</Text>
      <Text style={styles.bodyMuted}>{t('plan.states.configureBody')}</Text>
    </View>
  );
}

function GeneratingState({ progress }: { progress: number }) {
  const { t } = useTranslation();
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={Brand.accent} />
      <Text style={styles.headerTitle}>{t('plan.states.generating')}</Text>
      <Text style={styles.bodyMuted}>{t('plan.states.generatingBody')}</Text>
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
  const { t } = useTranslation();
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={Brand.danger} />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>{t('common.retry')}</Text>
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
  const { t, i18n } = useTranslation();
  const { day, completion, planWeekId, date } = data;
  const meals = day?.nutrition?.meals ?? [];
  const habits = day?.habits ?? [];
  const workout = day?.workout;

  const isCompleted = (activityId: string | undefined | null) =>
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

  const promptSkipReason = (
    activityLabel: string,
    onPick: (reason: string) => void,
  ) => {
    Alert.alert(
      t('plan.skipReasonTitle', { label: activityLabel }),
      t('plan.skipReasonBody'),
      [
        ...SKIP_REASON_KEYS.map((id) => ({
          text: t(`plan.skipReasons.${id}`),
          onPress: () => onPick(id),
        })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ],
    );
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
        <Text style={styles.dateLabel}>
          {formatHumanDate(date, i18n.language)}
        </Text>
        <Text style={styles.headerTitle}>{t('plan.todayTitle')}</Text>

        {workout && workout.id ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="barbell-outline"
                size={24}
                color={Brand.accent}
              />
              <Text style={styles.cardTitle}>{t('plan.workout')}</Text>
              <TouchableOpacity
                style={styles.moreBtn}
                onPress={() =>
                  skipActivity(
                    workout.id,
                    'workout',
                    workout.title ?? t('plan.workout'),
                    workout.title ?? t('plan.workout'),
                  )
                }
                accessibilityLabel={t('common.skip')}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color={Brand.textMuted}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTitle}>
              {workout.title ?? t('plan.workoutOfTheDay')}
            </Text>
            <TouchableOpacity
              style={[
                styles.completeBtn,
                isCompleted(workout.id) && styles.completedBtn,
              ]}
              onPress={() =>
                router.push(`/workouts/run/${workout.id}` as never)
              }
            >
              <Text style={styles.completeBtnText}>
                {isCompleted(workout.id)
                  ? t('plan.repeatWorkout')
                  : t('plan.startWorkout')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {meals.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="restaurant-outline"
                size={24}
                color={Brand.accent}
              />
              <Text style={styles.cardTitle}>{t('plan.nutrition')}</Text>
            </View>
            {meals.map((meal, index) => {
              const mealLabel = t(
                `plan.mealTypes.${meal.mealType}`,
                meal.mealType,
              );
              const recipeTitle = meal.recipe?.title ?? '—';
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
                        {meal.recipe.calories} {t('nutrition.kcal')} ·{' '}
                        {t('nutrition.viewRecipe')} ›
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
                      color={Brand.bgDark}
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
              <Ionicons name="water-outline" size={24} color={Brand.accent} />
              <Text style={styles.cardTitle}>{t('plan.habits')}</Text>
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
                      habit.title ?? t('plan.habits'),
                      habit.title ?? t('plan.habits'),
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
                      habit.title ?? t('plan.habits'),
                    )
                  }
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={20}
                    color={Brand.bgDark}
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

function formatHumanDate(isoDate: string, locale: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date
    .toLocaleDateString(locale || 'es-ES', {
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
    backgroundColor: Brand.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: { color: Brand.danger, fontSize: 16, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Brand.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: { color: Brand.bgDark, fontWeight: 'bold' },
  bodyMuted: { color: Brand.textMuted, fontSize: 14, textAlign: 'center' },
  container: { flex: 1, backgroundColor: Brand.bgDark },
  scroll: { padding: 20 },
  dateLabel: {
    fontSize: 12,
    color: Brand.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Brand.textPrimary,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Brand.accent,
    marginLeft: 8,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 18,
    color: Brand.textPrimary,
    marginBottom: 16,
    fontWeight: '600',
  },
  completeBtn: {
    backgroundColor: Brand.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeBtnText: {
    color: Brand.bgDark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  completedBtn: { opacity: 0.5 },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealLabel: {
    fontSize: 11,
    color: Brand.accent,
    letterSpacing: 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  mealMeta: {
    fontSize: 12,
    color: Brand.textMuted,
    marginTop: 2,
  },
  completeBtnSmall: {
    backgroundColor: Brand.accent,
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  statsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 16,
    backgroundColor: Brand.bgDark,
  },
  statsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsValue: {
    color: Brand.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  statsMuted: {
    color: Brand.textMuted,
    fontSize: 12,
  },
});
