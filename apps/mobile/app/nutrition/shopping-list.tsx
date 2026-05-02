import React, { useEffect, useMemo, useState } from 'react';
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
import api from '../../src/services/api.client';

type ShoppingItem = {
  ingredient: {
    id: string;
    name: string;
    category: string;
    caloriesPer100g: number;
    isVegan: boolean;
  };
  quantityTotal: number;
  unit: string;
  usageCount: number;
};

type ShoppingListResponse = {
  range: 'week';
  weekIndex: number;
  lifestylePlanId: string;
  planWeekId: string;
  itemCount: number;
  items: ShoppingItem[];
};

const COLORS = {
  bgDark: '#15241a',
  surface: 'rgba(255,255,255,0.05)',
  brand: '#0df259',
  textPrimary: '#fff',
  textMuted: 'rgba(255,255,255,0.6)',
  danger: '#ff4444',
};

const CATEGORY_LABELS: Record<string, string> = {
  Protein: 'Proteínas',
  Carb: 'Hidratos',
  Fat: 'Grasas',
  Veg: 'Verduras',
  Fruit: 'Fruta',
  Dairy: 'Lácteos',
  Pantry: 'Despensa',
};

export default function ShoppingListScreen() {
  const router = useRouter();
  const [data, setData] = useState<ShoppingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchList = async () => {
      try {
        setLoading(true);
        const res = await api.get<ShoppingListResponse>(
          '/planning/lifestyle/shopping-list',
        );
        if (!cancelled) setData(res.data);
      } catch (err: any) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setError('Genera tu plan primero para tener una lista de la compra.');
        } else {
          setError('No se pudo cargar la lista de la compra.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchList();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, ShoppingItem[]>();
    for (const item of data.items) {
      const cat = item.ingredient.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries());
  }, [data]);

  const totalItems = data?.itemCount ?? 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="cart-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Lista de la compra</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {checkedCount} / {totalItems} en el carrito
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: totalItems
                  ? `${Math.round((checkedCount / totalItems) * 100)}%`
                  : '0%',
              },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {grouped.length === 0 ? (
          <Text style={styles.bodyMuted}>
            Tu plan no tiene ingredientes detallados todavía.
          </Text>
        ) : (
          grouped.map(([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {CATEGORY_LABELS[category] ?? category}
              </Text>
              {items.map((item) => {
                const key = `${item.ingredient.id}::${item.unit}`;
                const isChecked = !!checked[key];
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.row}
                    onPress={() => toggle(key)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isChecked && styles.checkboxChecked,
                      ]}
                    >
                      {isChecked ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={COLORS.bgDark}
                        />
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.ingredientName,
                          isChecked && styles.ingredientNameChecked,
                        ]}
                      >
                        {item.ingredient.name}
                      </Text>
                      <Text style={styles.ingredientMeta}>
                        Usado en {item.usageCount}{' '}
                        {item.usageCount === 1 ? 'comida' : 'comidas'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.quantity,
                        isChecked && styles.quantityChecked,
                      ]}
                    >
                      {formatQty(item.quantityTotal, item.unit)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function formatQty(quantity: number, unit: string): string {
  if (unit === 'unit') return `${quantity}`;
  if (unit === 'ml') return `${quantity} ml`;
  if (quantity >= 1000) {
    return `${(quantity / 1000).toFixed(1).replace('.0', '')} kg`;
  }
  return `${quantity} g`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  summary: { paddingHorizontal: 20, paddingBottom: 16 },
  summaryText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.brand },
  scroll: { paddingBottom: 80, paddingHorizontal: 20 },
  section: { marginBottom: 28 },
  sectionTitle: {
    color: COLORS.brand,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.brand,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.brand },
  ingredientName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  ingredientNameChecked: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  ingredientMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  quantity: { color: COLORS.brand, fontSize: 15, fontWeight: 'bold' },
  quantityChecked: { color: COLORS.textMuted },
  bodyMuted: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
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
