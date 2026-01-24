import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

// Helper to get day of year, etc.
const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export default function OnboardingStep5() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Goals State
  const [goals, setGoals] = useState<{ id: string; text: string; start: Date; end: Date }[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [tempGoalText, setTempGoalText] = useState('');
  
  // Drag Selection State
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const months = useMemo(() => [
    t('common.months.jan') || 'Ene', t('common.months.feb') || 'Feb', 
    t('common.months.mar') || 'Mar', t('common.months.apr') || 'Abr', 
    t('common.months.may') || 'May', t('common.months.jun') || 'Jun', 
    t('common.months.jul') || 'Jul', t('common.months.aug') || 'Ago', 
    t('common.months.sep') || 'Sep', t('common.months.oct') || 'Oct', 
    t('common.months.nov') || 'Nov', t('common.months.dec') || 'Dic'
  ], [t]);

  const handleMonthPress = (index: number) => {
    // Current month or future only
    const currentMonth = today.getMonth();
    // Allow past selection if needed? User said "calendar real". Let's restrict to current year forward.
    if (index < currentMonth) return;

    if (selectionStart === null || (selectionStart !== null && selectionEnd !== null)) {
      setSelectionStart(index);
      setSelectionEnd(null);
    } else {
      if (index < selectionStart) {
        setSelectionStart(index);
        setSelectionEnd(selectionStart);
      } else {
        setSelectionEnd(index);
      }
      setTimeout(() => setIsAddingGoal(true), 150);
    }
  };

  const addGoal = () => {
    if (tempGoalText.trim() && selectionStart !== null) {
        const end = selectionEnd !== null ? selectionEnd : selectionStart;
        setGoals([...goals, {
            id: Date.now().toString(),
            text: tempGoalText,
            start: new Date(currentYear, selectionStart, 1),
            end: new Date(currentYear, end + 1, 0)
        }]);
        setTempGoalText('');
        setSelectionStart(null);
        setSelectionEnd(null);
        setIsAddingGoal(false);
    }
  };

  const handleFinish = () => {
    router.push('/onboarding/step6');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* Header - Fixed Step 6 Logic */}
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back-ios" size={20} color="#fff" />
            </TouchableOpacity>
            
            <View style={{alignItems: 'center'}}>
                <Text style={styles.headerTitle}>
                    {t('onboarding.step5.headlineStart')}
                </Text> 
                 <Text style={[styles.headerTitle, {fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4}]}>
                    {t('onboarding.step5.step')} 5/6
                </Text>
            </View>

            <View style={{ width: 40 }} /> 
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
            {/* Calendar Grid */}
            <View style={styles.timelineSection}>
                <Text style={styles.sectionTitle}>
                    {currentYear} - {t('onboarding.step5.subtitle')}
                </Text>
                
                <View style={styles.monthsGrid}>
                    {months.map((m, index) => {
                         const currentMonth = today.getMonth();
                         const isPast = index < currentMonth;
                         const isCurrent = index === currentMonth;
                         
                         // Selection Logic
                         const isSelected = (selectionStart !== null && index === selectionStart) || 
                                           (selectionEnd !== null && index === selectionEnd) ||
                                           (selectionStart !== null && selectionEnd !== null && index > selectionStart && index < selectionEnd);

                         return (
                            <TouchableOpacity 
                                key={m}
                                onPress={() => handleMonthPress(index)}
                                activeOpacity={0.7}
                                disabled={isPast}
                                style={[
                                    styles.monthBox,
                                    isPast && styles.monthPast,
                                    isCurrent && styles.monthCurrent,
                                    isSelected && styles.monthSelected
                                ]}
                            >
                                <Text style={[
                                    styles.monthText,
                                    isPast && styles.monthTextPast,
                                    isSelected && styles.monthTextSelected
                                ]}>{m}</Text>
                                
                                {isCurrent && <View style={styles.currentDot} />}
                            </TouchableOpacity>
                         );
                    })}
                </View>
                <Text style={styles.hintText}>
                    {t('onboarding.step5.hint')}
                </Text>
            </View>

            {/* Goals List */}
            <View style={styles.goalsSection}>
                {goals.map((g) => (
                    <View key={g.id} style={styles.goalCard}>
                        <View style={styles.goalTimeline}>
                             <View style={[styles.timelineDot, {backgroundColor: Colors.primary}]} />
                             <View style={styles.timelineLine} />
                        </View>
                        <View style={styles.goalContent}>
                            <Text style={styles.goalDates}>
                                {months[g.start.getMonth()]} - {months[g.end.getMonth()]}
                            </Text>
                            <Text style={styles.goalText}>{g.text}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setGoals(prev => prev.filter(item => item.id !== g.id))}>
                            <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Fixed Button */}
        <View style={styles.bottomContainer}>
            <TouchableOpacity 
                onPress={handleFinish}
                style={styles.finishButton}
                activeOpacity={0.9}
            >
                <Text style={styles.finishButtonText}>
                     {t('onboarding.step5.complete')} (Step 6)
                </Text>
                <MaterialIcons name="arrow-forward" size={24} color={Colors.backgroundDark} />
            </TouchableOpacity>
        </View>

        {/* Modal */}
        <Modal visible={isAddingGoal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{t('onboarding.step5.modalTitle')}</Text>
                     <Text style={styles.modalSubtitle}>
                         {selectionStart !== null ? months[selectionStart] : ''} - {selectionEnd !== null ? months[selectionEnd] : ''}
                    </Text>
                    <TextInput 
                        style={styles.modalInput}
                        placeholder={t('onboarding.step5.modalPlaceholder') || "Enter goal..."}
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={tempGoalText}
                        onChangeText={setTempGoalText}
                        autoFocus
                    />
                    <View style={styles.modalButtons}>
                         <TouchableOpacity onPress={() => { setIsAddingGoal(false); setSelectionStart(null); }} style={styles.modalCancel}>
                            <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={addGoal} style={styles.modalConfirm}>
                            <Text style={[styles.modalButtonText, { color: Colors.backgroundDark }]}>{t('common.save')}</Text>
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
  headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
      padding: 8,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 20,
  },
  headerTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
  },
  headerAccent: {
      color: Colors.primary,
      fontStyle: 'italic',
  },
  scrollView: {
      flex: 1,
  },
  scrollContent: {
      padding: 24,
  },
  progressSection: {
      marginBottom: 32,
  },
  yearText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
  },
  barContainer: {
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 4,
      marginBottom: 8,
      overflow: 'hidden',
  },
  barFill: {
      height: '100%',
      backgroundColor: Colors.primary,
      borderRadius: 4,
  },
  progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  progressLabel: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 12,
  },
  timelineSection: {
      marginBottom: 32,
  },
  sectionTitle: {
      color: '#fff',
      fontSize: 16,
      marginBottom: 16,
      lineHeight: 24,
  },
  monthsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
  },
  monthBox: {
      width: (width - 48 - 24) / 4, // 4 cols
      aspectRatio: 1.5,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
  },
  monthPast: {
      opacity: 0.3,
  },
  monthCurrent: {
      borderColor: Colors.primary,
      backgroundColor: 'rgba(13, 242, 89, 0.1)',
  },
  monthSelected: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
  },
  monthText: {
      color: 'rgba(255,255,255,0.6)',
      fontWeight: '600',
  },
  monthTextPast: {
      color: 'rgba(255,255,255,0.3)',
  },
  monthTextCurrent: {
      color: '#fff',
      fontWeight: 'bold',
  },
  monthTextSelected: {
      color: Colors.backgroundDark,
      fontWeight: 'bold',
  },
  currentDot: {
      width: 4,
      height: 4,
      backgroundColor: Colors.primary,
      borderRadius: 2,
      position: 'absolute',
      bottom: 6,
  },
  hintText: {
      color: 'rgba(255,255,255,0.3)',
      fontSize: 12,
      marginTop: 12,
      fontStyle: 'italic',
  },
  goalsSection: {
      marginBottom: 32,
  },
  goalCard: {
      flexDirection: 'row',
      marginBottom: 16,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
  },
  goalTimeline: {
      marginRight: 12,
      alignItems: 'center',
      width: 16,
  },
  timelineLine: {
      width: 2,
      height: '100%',
      backgroundColor: 'rgba(255,255,255,0.1)',
      position: 'absolute',
  },
  timelineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: Colors.primary,
      marginTop: 6,
  },
  goalContent: {
      flex: 1,
  },
  goalDates: {
      color: Colors.primary,
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  goalText: {
      color: '#fff',
      fontSize: 14,
  },
  bottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 24,
      paddingBottom: 40,
      backgroundColor: Colors.backgroundDark,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.05)',
  },
  finishButton: {
      backgroundColor: Colors.primary,
      height: 56,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
  },
  finishButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.backgroundDark,
  },
  // Modal
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
  },
  modalContent: {
      width: '100%',
      backgroundColor: '#1c1c1e',
      borderRadius: 24,
      padding: 24,
  },
  modalTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
  },
  modalSubtitle: {
      color: Colors.primary,
      fontSize: 14,
      marginBottom: 24,
  },
  modalInput: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      padding: 16,
      color: '#fff',
      fontSize: 16,
      marginBottom: 24,
  },
  modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
  },
  modalCancel: {
      padding: 12,
  },
  modalConfirm: {
      backgroundColor: Colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
  },
  modalButtonText: {
      color: '#fff',
      fontWeight: 'bold',
  },
});
