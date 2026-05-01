import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/services/api.client';

type HydratedIngredient = {
  quantityGrams: number;
  unit: string;
  notes: string | null;
  ingredient: {
    id: string;
    name: string;
    category: string;
    caloriesPer100g: number;
    isVegan: boolean;
  };
};

type Recipe = {
  id: string;
  title: string;
  instructions: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  imageUrl: string | null;
  prepTimeMin: number;
  isVegan: boolean;
  isGlutenFree: boolean;
  ingredients: HydratedIngredient[];
};

const COLORS = {
  bgDark: '#15241a',
  surface: 'rgba(255,255,255,0.05)',
  brand: '#0df259',
  textPrimary: '#fff',
  textMuted: 'rgba(255,255,255,0.6)',
  danger: '#ff4444',
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const res = await api.get<Recipe>(`/recipes/${id}`);
        if (!cancelled) setRecipe(res.data);
      } catch (err: any) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setError('Esta receta no se encuentra en el catálogo.');
        } else {
          setError('No se pudo cargar la receta.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchRecipe();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>{error || 'Receta no encontrada'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.backChevron}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Ionicons
              name="restaurant-outline"
              size={64}
              color={COLORS.brand}
            />
          </View>
        )}

        <Text style={styles.title}>{recipe.title}</Text>

        <View style={styles.metaRow}>
          <MetaPill icon="time-outline" label={`${recipe.prepTimeMin} min`} />
          <MetaPill icon="flame-outline" label={`${recipe.calories} kcal`} />
          {recipe.isVegan ? (
            <MetaPill icon="leaf-outline" label="Vegano" />
          ) : null}
          {recipe.isGlutenFree ? (
            <MetaPill icon="checkmark-circle-outline" label="Sin gluten" />
          ) : null}
        </View>

        <View style={styles.macroRow}>
          <MacroCell label="Proteína" value={`${recipe.protein} g`} />
          <MacroCell label="Carbs" value={`${recipe.carbs} g`} />
          <MacroCell label="Grasas" value={`${recipe.fats} g`} />
        </View>

        <Section title="Ingredientes">
          {recipe.ingredients.length === 0 ? (
            <Text style={styles.bodyMuted}>
              Esta receta aún no tiene ingredientes registrados.
            </Text>
          ) : (
            recipe.ingredients.map((item, idx) => (
              <View
                key={`${item.ingredient.id}-${idx}`}
                style={styles.ingredientRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingredientName}>
                    {item.ingredient.name}
                  </Text>
                  <Text style={styles.ingredientMeta}>
                    {item.ingredient.category}
                    {item.ingredient.isVegan ? ' · Vegano' : ''}
                  </Text>
                </View>
                <Text style={styles.ingredientQty}>
                  {formatQty(item.quantityGrams, item.unit)}
                </Text>
              </View>
            ))
          )}
        </Section>

        <Section title="Preparación">
          <Text style={styles.body}>{recipe.instructions}</Text>
        </Section>

        <TouchableOpacity style={styles.shoppingBtn} disabled>
          <Ionicons name="cart-outline" size={20} color={COLORS.bgDark} />
          <Text style={styles.shoppingBtnText}>
            Añadir a la lista de la compra (próximamente)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MetaPill({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={14} color={COLORS.brand} />
      <Text style={styles.metaPillText}>{label}</Text>
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

function formatQty(quantity: number, unit: string): string {
  if (unit === 'unit') return `${quantity}`;
  if (unit === 'ml') return `${quantity} ml`;
  return `${quantity} g`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { paddingBottom: 64 },
  backChevron: {
    position: 'absolute',
    top: 16,
    left: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: { width: '100%', height: 220, backgroundColor: COLORS.surface },
  coverFallback: { justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  metaPillText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '600' },
  macroRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  macroCell: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  macroValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  macroLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    color: COLORS.brand,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  ingredientName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  ingredientMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  ingredientQty: { color: COLORS.brand, fontSize: 15, fontWeight: 'bold' },
  body: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22 },
  bodyMuted: { color: COLORS.textMuted, fontSize: 14 },
  shoppingBtn: {
    marginTop: 32,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.6,
  },
  shoppingBtnText: { color: COLORS.bgDark, fontWeight: 'bold', fontSize: 14 },
  errorText: {
    color: COLORS.danger,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  backBtn: {
    backgroundColor: COLORS.brand,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  backBtnText: { color: COLORS.bgDark, fontWeight: 'bold' },
});
