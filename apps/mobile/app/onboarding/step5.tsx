import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';

// const { width } = Dimensions.get('window');

// Helper to get days in month
const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper to get first day of month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (month: number, year: number) => {
  return new Date(year, month, 1).getDay();
};

export default function OnboardingStep5() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string | undefined>>();
  const { t } = useTranslation();
  
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  
  // Calendar State
  // We want to show months from current month to Dec 2026 (or just current year end)
  const monthsList = useMemo(() => {
      const list = [];
      const startMonth = today.getMonth();
      for (let i = startMonth; i < 12; i++) {
          list.push(new Date(currentYear, i, 1));
      }
      return list;
  }, [currentYear, today]);

  // Horizontal Month Selection State
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0); // Index in monthsList

  // Range Selection State
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  
  // Goals State
  const [goals, setGoals] = useState<{ id: string; text: string; start: Date; end: Date }[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [tempGoalText, setTempGoalText] = useState('');

  const handleDatePress = (date: Date) => {
      // Logic for range selection
      setRange((prev: { start: Date | null; end: Date | null }) => {
          if (!prev.start || (prev.start && prev.end)) {
              // Start new selection
              return { start: date, end: null };
          } else {
              // Complete selection or restart if earlier
              if (date < prev.start) {
                  return { start: date, end: null };
              } else {
                  // Valid range
                   // Open modal after a short delay to let visual update
                  setTimeout(() => setIsAddingGoal(true), 100);
                  return { ...prev, end: date };
              }
          }
      });
  };

  const addGoal = (text: string = tempGoalText) => {
    if (text.trim() && range.start) {
        setGoals([...goals, {
            id: Date.now().toString(),
            text: text,
            start: range.start,
            end: range.end || range.start // Fallback to single day if end is null
        }]);
        setTempGoalText('');
        setIsAddingGoal(false);
        setRange({ start: null, end: null });
    }
  };

  const handleFinish = () => {
    // Flujo: step5 -> step6 (sincronizar) -> step-contract (resumen) -> mapa
    const entries = Object.entries(params).filter(
      (entry): entry is [string, string] =>
        entry[1] != null && typeof entry[1] === 'string'
    );
    const query = new URLSearchParams(entries).toString();
    const path = query ? `/onboarding/step6?${query}` : '/onboarding/step6';
    router.replace(path as import('expo-router').Href);
  };

  // Helper check for styling days
  const getDayStyle = (date: Date) => {
      const time = date.getTime();
      const start = range.start?.getTime();
      const end = range.end?.getTime();
      
      const isSelected = time === start || time === end;
      const inRange = start && end && time > start && time < end;
      const isToday = date.toDateString() === today.toDateString();
      const hasGoal = goals.some((g: { start: Date; end: Date }) => time >= g.start.getTime() && time <= g.end.getTime());

      return { isSelected, inRange, isToday, hasGoal };
  };

  const renderMonthGrid = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = getDaysInMonth(month, year);
      const firstDay = getFirstDayOfMonth(month, year);
      const startOffset = (firstDay === 0 ? 6 : firstDay - 1); // Mon layout

      const days = [];
      for (let i = 0; i < startOffset; i++) {
          days.push(<View key={`empty-${month}-${i}`} style={styles.dayCellEmpty} />);
      }

      for (let i = 1; i <= daysInMonth; i++) {
          const d = new Date(year, month, i);
          const { isSelected, inRange, isToday, hasGoal } = getDayStyle(d);
          
          days.push(
              <TouchableOpacity 
                  key={`day-${month}-${i}`} 
                  style={[
                      styles.dayCell, 
                      !!isToday && styles.dayCellToday,
                      !!inRange && styles.dayCellInRange,
                      !!isSelected && styles.dayCellSelected,
                      !!(hasGoal && !inRange && !isSelected) && styles.dayCellHasGoal
                  ]}
                  onPress={() => handleDatePress(d)}
                  activeOpacity={0.7}
              >
                  <Text style={[
                      styles.dayText, 
                      !!isToday && styles.dayTextToday,
                      !!(isSelected || inRange) && styles.dayTextSelected
                  ]}>{i}</Text>
                   {/* Optional Marker dots */}
                   {hasGoal && !isSelected && !inRange && <View style={styles.goalDot} />}
              </TouchableOpacity>
          );
      }
      return days;
  };

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const exampleGoals = [
      "💪 Ganar masa muscular",
      "🚶‍♂️ Andar 1 hora diaria",
      "🥗 Comer comida real",
      "🏃‍♂️ Correr 5km semanales",
      "📚 Leer 20 págs al día",
      "💧 Beber 2L de agua diarios"
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* TopAppBar */}
        <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back-ios" size={20} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>PASO 5 DE 6</Text>
                <View style={styles.progressBarBg}>
                    <View style={styles.progressBarFill} />
                </View>
            </View>

            <View style={styles.spacer} />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
             {/* Headline */}
            <View style={styles.headlineSection}>
              <Text style={styles.headline}>
                {t('onboarding.step5.headlineStart')} <Text style={styles.headlineAccent}>{t('onboarding.step5.headlineAccent')}</Text>
              </Text>
              <Text style={styles.subtitle}>{t('onboarding.step5.subtitle')}</Text>
            </View>
            
            {/* Horizontal Month Selector & Calendar */}
            <View style={styles.calendarSection}>
                {/* Month Tabs */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.monthSelectorContent}
                    style={styles.monthSelectorScroll}
                >
                    {monthsList.map((mDate: Date, index: number) => {
                        const isSelected = selectedMonthIndex === index;
                        return (
                            <TouchableOpacity 
                                key={mDate.toString()}
                                onPress={() => setSelectedMonthIndex(index)}
                                style={[styles.monthTab, isSelected && styles.monthTabSelected]}
                            >
                                <Text style={[styles.monthTabText, isSelected && styles.monthTabTextSelected]}>
                                    {mDate.toLocaleString('default', { month: 'short' }).toUpperCase()}
                                </Text>
                                {isSelected && <View style={styles.monthIndicator} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Selected Month View */}
                <View style={styles.activeMonthContainer}>
                    <View style={styles.weekRowMain}>
                        {weekDays.map(d => (
                            <Text key={d} style={styles.weekDayText}>{d}</Text>
                        ))}
                    </View>
                    
                    <View style={styles.activeMonthGrid}>
                        {/* Show Year/Month Title for context */}
                        <Text style={styles.activeMonthTitle}>
                            {monthsList[selectedMonthIndex].toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
                        </Text>
                        <View style={styles.daysGrid}>
                            {renderMonthGrid(monthsList[selectedMonthIndex])}
                        </View>
                    </View>
                </View>
            </View>

            {/* Goals List (keep existing) */} 
            {/* ... */}

            {/* Goals List */}
            <View style={styles.goalsSection}>
                <Text style={styles.sectionTitle}>TUS HITOS</Text>
                {goals.length === 0 ? (
                     <View style={styles.emptyState}>
                         <MaterialIcons name="event-note" size={48} color="rgba(255,255,255,0.1)" />
                         <Text style={styles.emptyStateText}>Selecciona un rango para añadir un hito</Text>
                     </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12}}>
                        {goals.sort((a: { start: Date }, b: { start: Date }) => a.start.getTime() - b.start.getTime()).map((g: { id: string; text: string; start: Date; end: Date }) => (
                            <View key={g.id} style={styles.glassCard}>
                                <View style={styles.cardIconBox}>
                                     <MaterialIcons name="emoji-flags" size={24} color={Colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.cardCategory}>GOAL</Text>
                                    <Text style={styles.cardTitle}>{g.text}</Text>
                                    <Text style={styles.cardDate}>
                                        {g.start.getDate()}/{g.start.getMonth()+1} - {g.end.getDate()}/{g.end.getMonth()+1}
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    style={{position:'absolute', top:8, right:8}}
                                    onPress={() => setGoals((prev) => prev.filter((item: { id: string }) => item.id !== g.id))}
                                >
                                    <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.3)" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Bottom Button (Now inline) */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity 
                    onPress={handleFinish}
                    style={styles.finishButton}
                    activeOpacity={0.9}
                >
                    <Text style={styles.finishButtonText}>
                         {t('onboarding.step5.complete')}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={24} color={Colors.backgroundDark} />
                </TouchableOpacity>
            </View>
        </ScrollView>

        {/* Range Modal */}
        <Modal visible={isAddingGoal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Nuevo Hito</Text>
                            <Text style={styles.modalSubtitle}>
                                {range.start ? `${range.start.getDate()} ${range.start.toLocaleString('default',{month:'short'})}` : ''} 
                                {range.end ? ` - ${range.end.getDate()} ${range.end.toLocaleString('default',{month:'short'})}` : ''}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsAddingGoal(false)}>
                            <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.glowingInputContainer}>
                        <TextInput 
                            style={styles.modalInput}
                            placeholder="ej. Correr una Maratón..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={tempGoalText}
                            onChangeText={setTempGoalText}
                            autoFocus
                        />
                    </View>

                    <Text style={styles.suggestionTitle}>Sugerencias:</Text>
                    <View style={styles.chipContainer}>
                        {exampleGoals.map((ex) => (
                            <TouchableOpacity 
                                key={ex} 
                                style={styles.chip}
                                onPress={() => addGoal(ex)}
                            >
                                <Text style={styles.chipText}>{ex}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{marginTop: 24}}>
                         <TouchableOpacity 
                            onPress={() => addGoal()} 
                            style={[styles.modalConfirm, !tempGoalText.trim() && {opacity: 0.5}]}
                            disabled={!tempGoalText.trim()}
                        >
                            <Text style={[styles.modalButtonText, { color: Colors.backgroundDark }]}>Añadir Hito</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  safeArea: {
    flex: 1,
  },
  // Header
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  spacer: {
    width: 40,
    height: 40,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 4,
    width: 80,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '83%', // 5/6
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  backButton: {
      height: 40,
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Content
  scrollView: {
      flex: 1,
  },
  scrollContent: {
      padding: 24,
      paddingTop: 10,
  },
  headlineSection: {
      marginBottom: 32,
  },
  headline: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headlineAccent: {
    color: Colors.primary,
    fontStyle: 'italic',
  },
  subtitle: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 14,
      marginTop: 8,
  },
  // Calendar
  calendarSection: {
      marginBottom: 32,
  },
  weekRowMain: {
      flexDirection: 'row',
      marginBottom: 16,
      backgroundColor: 'rgba(255,255,255,0.03)',
      paddingVertical: 12,
      borderRadius: 12,
  },
  weekDayText: {
      flex: 1,
      textAlign: 'center',
      color: 'rgba(255,255,255,0.3)',
      fontSize: 12,
      fontWeight: 'bold',
  },
  // Horizontal Month Selector
  monthSelectorScroll: {
      marginBottom: 20,
  },
  monthSelectorContent: {
      gap: 12,
      paddingHorizontal: 4,
  },
  monthTab: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
  },
  monthTabSelected: {
      // maybe bg? keep simple with text and indicator
  },
  monthTabText: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 14,
      fontWeight: '600',
  },
  monthTabTextSelected: {
      color: '#fff',
      fontWeight: 'bold',
  },
  monthIndicator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.primary,
      marginTop: 4,
  },
  activeMonthContainer: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
  },
  activeMonthGrid: {
      marginTop: 8,
  },
  activeMonthTitle: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      letterSpacing: 1,
  },
  daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
  },
  dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginBottom: 4,
  },
  dayCellEmpty: {
     width: '14.28%',
     aspectRatio: 1, 
  },
  dayCellToday: {
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
  },
  dayCellSelected: {
      backgroundColor: Colors.primary,
  },
  dayCellInRange: {
      backgroundColor: 'rgba(57, 255, 20, 0.3)', // Semi-transparent neon green
  },
  dayCellHasGoal: {
      // Maybe a subtle border or dot is enough if not selected range
  },
  dayText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
  },
  dayTextToday: {
      fontWeight: 'bold',
      color: Colors.primary,
  },
  dayTextSelected: {
      color: Colors.backgroundDark,
      fontWeight: 'bold',
  },
  goalDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.primary,
      position: 'absolute',
      bottom: 6,
  },
  // Goals
  goalsSection: {
      marginBottom: 32,
  },
  sectionTitle: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 2,
      marginBottom: 16,
      textTransform: 'uppercase',
  },
  emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderStyle: 'dashed',
      borderRadius: 16,
  },
  emptyStateText: {
      color: 'rgba(255,255,255,0.3)',
      marginTop: 8,
      fontSize: 12,
  },
  glassCard: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 16,
      padding: 16,
      width: 150,
      height: 140,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
  },
  cardIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: 'rgba(57, 255, 20, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
  },
  cardCategory: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 10,
      fontWeight: 'bold',
      marginBottom: 2,
  },
  cardTitle: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  cardDate: {
      color: Colors.primary,
      fontSize: 10,
      opacity: 0.8,
  },
  // Modal
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'flex-end',
  },
  modalContent: {
      backgroundColor: '#111A15', // Darker forest
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      paddingBottom: 48,
      borderTopWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
  },
  modalTitle: {
      color: '#fff',
      fontSize: 24,
      fontWeight: 'bold',
  },
  modalSubtitle: {
      color: Colors.primary,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  glowingInputContainer: {
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      marginBottom: 24,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
  },
  modalInput: {
      padding: 16,
      color: '#fff',
      fontSize: 18,
  },
  suggestionTitle: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 11,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
  },
  chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'space-between', // Distribute space
  },
  chip: {
      width: '48%', // allow 2 per row with gap
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  chipText: {
      color: '#fff',
      fontSize: 13, // Slightly smaller to fit lines
      fontWeight: '600',
      textAlign: 'center',
  },
  modalConfirm: {
      backgroundColor: Colors.primary,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
  },
  modalButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
  },
  // Bottom
  bottomContainer: {
      padding: 0,
      paddingTop: 32,
      paddingBottom: 40,
  },
  finishButton: {
      backgroundColor: Colors.primary,
      height: 56,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
  },
  finishButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.backgroundDark,
  },
});
