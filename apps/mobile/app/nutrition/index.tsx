import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Brand } from '../../constants/theme';
import api from '../../src/services/api.client';

type Meal = {
  id: string;
  mealType: string;
  recipe: {
    id: string;
    title: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    imageUrl: string | null;
    prepTimeMin: number;
  } | null;
};

type LifestyleTodayDetailed =
  | { status: 'NOT_STARTED' | 'GENERATING' | 'FAILED' }
  | {
      status: 'READY';
      day: { nutrition?: { meals?: Meal[] } };
    };

type Totals = { kcal: number; protein: number; carbs: number; fats: number };

export default function NutritionHubScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get<LifestyleTodayDetailed>(
          '/planning/lifestyle/today/detailed',
        );
        if (cancelled) return;
        if (res.data?.status === 'READY') {
          setMeals(res.data.day?.nutrition?.meals ?? []);
        } else {
          setMeals([]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load nutrition', err);
        setError(t('nutrition.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetch();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const totals: Totals = meals.reduce<Totals>(
    (acc, m) => {
      if (!m.recipe) return acc;
      return {
        kcal: acc.kcal + (m.recipe.calories ?? 0),
        protein: acc.protein + (m.recipe.protein ?? 0),
        carbs: acc.carbs + (m.recipe.carbs ?? 0),
        fats: acc.fats + (m.recipe.fats ?? 0),
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fats: 0 },
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Brand.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>{t('nutrition.title')}</Text>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{t('nutrition.macrosToday')}</Text>
            <View style={styles.macroRow}>
              <MacroCell
                value={totals.kcal.toFixed(0)}
                label={t('nutrition.kcal')}
              />
              <MacroCell
                value={`${totals.protein.toFixed(0)} g`}
                label={t('nutrition.protein')}
              />
              <MacroCell
                value={`${totals.carbs.toFixed(0)} g`}
                label={t('nutrition.carbs')}
              />
              <MacroCell
                value={`${totals.fats.toFixed(0)} g`}
                label={t('nutrition.fats')}
              />
            </View>

            <Text style={styles.sectionLabel}>{t('nutrition.todayMeals')}</Text>
            {meals.length === 0 ? (
              <Text style={styles.muted}>{t('nutrition.noPlan')}</Text>
            ) : (
              meals.map((meal, idx) => {
                const mealLabel = t(
                  `plan.mealTypes.${meal.mealType}`,
                  meal.mealType,
                );
                return (
                  <TouchableOpacity
                    key={meal.id ?? idx}
                    style={styles.mealCard}
                    activeOpacity={0.85}
                    disabled={!meal.recipe}
                    onPress={() =>
                      meal.recipe &&
                      router.push(`/nutrition/recipe/${meal.recipe.id}`)
                    }
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealLabel}>{mealLabel}</Text>
                      <Text style={styles.mealTitle} numberOfLines={2}>
                        {meal.recipe?.title ?? '—'}
                      </Text>
                      {meal.recipe ? (
                        <Text style={styles.mealMeta}>
                          {meal.recipe.calories} {t('nutrition.kcal')} ·{' '}
                          {meal.recipe.prepTimeMin} {t('nutrition.min')}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={22}
                      color={Brand.textMuted}
                    />
                  </TouchableOpacity>
                );
              })
            )}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/nutrition/shopping-list')}
            >
              <Ionicons name="cart-outline" size={20} color={Brand.bgDark} />
              <Text style={styles.primaryBtnText}>
                {t('nutrition.viewShoppingList')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function MacroCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroCell}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bgDark },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 120 },
  h1: {
    color: Brand.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionLabel: {
    color: Brand.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 10,
  },
  macroRow: { flexDirection: 'row', gap: 8 },
  macroCell: {
    flex: 1,
    backgroundColor: Brand.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  macroValue: {
    color: Brand.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroLabel: { color: Brand.textMuted, fontSize: 11, marginTop: 4 },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  mealLabel: {
    color: Brand.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  mealTitle: {
    color: Brand.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  mealMeta: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
  muted: { color: Brand.textMuted, fontSize: 14 },
  primaryBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Brand.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: Brand.bgDark, fontWeight: 'bold', fontSize: 14 },
  error: { color: Brand.danger, fontSize: 14 },
});
