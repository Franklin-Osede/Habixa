import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

export function ConciergeDashboard() {
  return (
    <View style={styles.container}>
      {/* Background Mesh */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
            colors={['rgba(13, 242, 89, 0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <View>
                <Text style={styles.dateText}>HOY, 28 MARZO</Text>
                <Text style={styles.greetingTitle}>Orquestando tu día</Text>
            </View>
            <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={24} color={Colors.primary} />
            </View>
        </View>

        {/* AI Tip / Insight */}
        <View style={styles.aiTipCard}>
            <MaterialIcons name="auto-awesome" size={20} color={Colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.aiTipText}>
                Tu plan de hoy prioriza el descanso lumbar (reemplazamos sentadillas por prensa). Además, tienes 4 comidas enfocadas en pérdida de grasa.
            </Text>
        </View>

        {/* Workout Section */}
        <Text style={styles.sectionTitle}>Entrenamiento</Text>
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeader}>
                <View style={styles.row}>
                    <MaterialIcons name="fitness-center" size={20} color="#fff" />
                    <Text style={styles.cardTitle}>Full-Body Adaptado</Text>
                </View>
                <Text style={styles.cardTime}>45 min</Text>
            </View>
            <Text style={styles.cardSubtitle}>Fuerza · 5 Ejercicios · Equipamiento de casa</Text>
            <TouchableOpacity style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>INICIAR SESIÓN</Text>
            </TouchableOpacity>
        </TouchableOpacity>

        {/* Nutrition Section */}
        <Text style={styles.sectionTitle}>Nutrición (2100 Kcal)</Text>
        
        <View style={styles.mealRow}>
            <View style={styles.mealCard}>
                <Text style={styles.mealType}>DESAYUNO</Text>
                <Text style={styles.mealName}>Avena con Proteína</Text>
                <Text style={styles.mealMacros}>400 kcal · 30g P</Text>
            </View>
            <View style={styles.mealCard}>
                <Text style={styles.mealType}>ALMUERZO</Text>
                <Text style={styles.mealName}>Pollo con Boniato</Text>
                <Text style={styles.mealMacros}>600 kcal · 45g P</Text>
            </View>
        </View>

        <View style={styles.mealRow}>
            <View style={styles.mealCard}>
                <Text style={styles.mealType}>SNACK</Text>
                <Text style={styles.mealName}>Batido y Nueces</Text>
                <Text style={styles.mealMacros}>350 kcal · 25g P</Text>
            </View>
            <View style={styles.mealCard}>
                <Text style={styles.mealType}>CENA</Text>
                <Text style={styles.mealName}>Salmón a la plancha</Text>
                <Text style={styles.mealMacros}>750 kcal · 40g P</Text>
            </View>
        </View>
        
        {/* Placeholder bottom spacing for tabBar */}
        <View style={{ height: 120 }} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60, // For safe area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  greetingTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(13, 242, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 89, 0.3)',
  },
  aiTipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 242, 89, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 89, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    gap: 12,
  },
  aiTipText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardTime: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 20,
  },
  btnSecondary: {
    backgroundColor: 'rgba(13, 242, 89, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  mealCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  mealType: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mealName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mealMacros: {
    color: '#94a3b8',
    fontSize: 12,
  }
});
