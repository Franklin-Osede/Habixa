import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';

export default function OnboardingStep2() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  
  // Parse params
  const weight = Number(params.weight) || 70;
  const height = Number(params.height) || 170;
  const unitSystem = params.unitSystem || 'metric';

  // Calculate BMI
  const bmi = useMemo(() => {
    if (unitSystem === 'imperial') {
      // Imperial: 703 * weight (lbs) / height (in)^2
      return (703 * weight) / (height * height);
    } else {
      // Metric: weight (kg) / height (m)^2
      // height is in cm
      const hM = height / 100;
      return weight / (hM * hM);
    }
  }, [weight, height, unitSystem]);

  const bmiCategory = useMemo(() => {
    if (bmi < 18.5) return t('onboarding.step2.underweight');
    if (bmi < 25) return t('onboarding.step2.normal');
    if (bmi < 30) return t('onboarding.step2.overweight');
    return t('onboarding.step2.obese');
  }, [bmi, t]);

  const getBmiColor = () => {
    if (bmi < 18.5) return '#fbbf24'; // Yellow
    if (bmi < 25) return '#0df259';   // Green
    if (bmi < 30) return '#fbbf24';   // Yellow
    return '#ef4444';                 // Red
  };

  // State
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [equipment, setEquipment] = useState('Gym');
  
  const habitOptions = [
    { id: 'exercise', label: t('onboarding.habits.exercise') },
    { id: 'meditation', label: t('onboarding.habits.meditation') },
    { id: 'reading', label: t('onboarding.habits.reading') },
    { id: 'water', label: t('onboarding.habits.water') },
    { id: 'sleep', label: t('onboarding.habits.sleep') },
    { id: 'diet', label: t('onboarding.habits.diet') },
  ].sort((a, b) => b.label.length - a.label.length);

  const goalOptions = [
    { id: 'weight', label: t('onboarding.goals.weight') },
    { id: 'mental', label: t('onboarding.goals.mental') },
    { id: 'sleep', label: t('onboarding.goals.sleep') },
    { id: 'energy', label: t('onboarding.goals.energy') },
    { id: 'stress', label: t('onboarding.goals.stress') },
    { id: 'productivity', label: t('onboarding.goals.productivity') },
  ];

  const toggleHabit = (habitId: string) => {
    setSelectedHabits((prev: string[]) => 
      prev.includes(habitId) 
        ? prev.filter((h: string) => h !== habitId)
        : [...prev, habitId]
    );
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev: string[]) => 
      prev.includes(goalId) 
        ? prev.filter((g: string) => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/step3',
      params: { 
        ...params, // Pass through previous params
        selectedHabits: selectedHabits.join(','),
        selectedGoals: selectedGoals.join(',')
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            
            {/* TopAppBar */}
            <View style={styles.topBar}>
              <TouchableOpacity 
                onPress={() => router.back()} 
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back-ios" size={20} color="#ffffff" />
              </TouchableOpacity>
              
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {t('onboarding.step2.progress')}
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={styles.progressBarFill} />
                </View>
              </View>
              
              <View style={styles.spacer} />
            </View>

            {/* Headline */}
            <View style={styles.sectionPadding}>
              <Text style={styles.headline}>
                {t('onboarding.step2.headlineStart')} {'\n'}
                <Text style={styles.headlineAccent}>{t('onboarding.step2.headlineAccent')}</Text>
              </Text>
            </View>

            {/* BMI Card */}
            <View style={styles.sectionPadding}>
               <View style={styles.bmiCard}>
                  <View style={styles.bmiHeader}>
                     <Text style={styles.bmiTitle}>{t('onboarding.step2.bmiResult')}</Text>
                     <View style={[styles.bmiBadge, { backgroundColor: getBmiColor() }]}>
                        <Text style={styles.bmiBadgeText}>{bmiCategory}</Text>
                     </View>
                  </View>
                  <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
                  <Text style={styles.bmiLabel}>{t('onboarding.step2.bmiLabel')}</Text>
                  
                  {/* BMI Scale Indicator */}
                  <View style={styles.scaleContainer}>
                      <View style={styles.scaleBar}>
                          <View style={[styles.scaleSegment, { backgroundColor: '#fbbf24', flex: 1.85 }]} /> {/* <18.5 */}
                          <View style={[styles.scaleSegment, { backgroundColor: '#0df259', flex: 6.4 }]} /> {/* 18.5-24.9 */}
                          <View style={[styles.scaleSegment, { backgroundColor: '#fbbf24', flex: 5 }]} />   {/* 25-29.9 */}
                          <View style={[styles.scaleSegment, { backgroundColor: '#ef4444', flex: 10 }]} />  {/* >30 */}
                      </View>
                      {/* Marker position: (BMI - 15) / (40 - 15) * 100% roughly */}
                      <View style={[
                          styles.scaleMarker, 
                          { left: `${Math.max(0, Math.min(100, ((bmi - 15) / (40 - 15)) * 100))}%` }
                      ]}>
                          <View style={styles.markerArrow} />
                      </View>
                  </View>

                  <Text style={styles.bmiFormula}>{t('onboarding.step2.bmiFormula')}</Text>
               </View>
            </View>

            {/* Habit Preferences */}
            <View style={styles.sectionPadding}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  {t('onboarding.step2.habitsTitle')}
                </Text>
                <View style={styles.chipContainer}>
                  {habitOptions.map((habit) => {
                    const isSelected = selectedHabits.includes(habit.id);
                    return (
                      <TouchableOpacity 
                        key={habit.id}
                        onPress={() => toggleHabit(habit.id)}
                        style={[
                          styles.chip,
                          isSelected ? styles.chipSelected : styles.chipUnselected
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.chipText,
                          isSelected ? styles.chipTextSelected : styles.chipTextUnselected
                        ]}>
                          {habit.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Experience Level */}
            <View style={styles.sectionPadding}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  {t('onboarding.step2.experienceTitle')}
                </Text>
                <View style={styles.chipContainer}>
                  {[
                    { id: 'beginner', label: t('onboarding.step2.experience.beginner') },
                    { id: 'intermediate', label: t('onboarding.step2.experience.intermediate') },
                    { id: 'advanced', label: t('onboarding.step2.experience.advanced') }
                  ].map((level) => (
                    <TouchableOpacity 
                      key={level.id}
                      onPress={() => setExperienceLevel(level.id)}
                      style={[
                        styles.chip,
                        experienceLevel === level.id ? styles.chipSelected : styles.chipUnselected
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.chipText,
                        experienceLevel === level.id ? styles.chipTextSelected : styles.chipTextUnselected
                      ]}>
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Equipment Access */}
            <View style={styles.sectionPadding}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  {t('onboarding.step2.equipmentTitle')}
                </Text>
                <View style={styles.chipContainer}>
                  {[
                    { id: 'gym', label: t('onboarding.step2.equipment.gym') },
                    { id: 'homeDumbbells', label: t('onboarding.step2.equipment.homeDumbbells') },
                    { id: 'bodyweight', label: t('onboarding.step2.equipment.bodyweight') }
                  ].map((eq) => (
                    <TouchableOpacity 
                      key={eq.id}
                      onPress={() => setEquipment(eq.id)}
                      style={[
                        styles.chip,
                        equipment === eq.id ? styles.chipSelected : styles.chipUnselected
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.chipText,
                        equipment === eq.id ? styles.chipTextSelected : styles.chipTextUnselected
                      ]}>
                        {eq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Goal Preferences */}
            <View style={styles.sectionPadding}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  {t('onboarding.step2.goalsTitle')}
                </Text>
                <View style={styles.chipContainer}>
                  {goalOptions.map((goal) => {
                    const isSelected = selectedGoals.includes(goal.id);
                    return (
                      <TouchableOpacity 
                        key={goal.id}
                        onPress={() => toggleGoal(goal.id)}
                        style={[
                          styles.chip,
                          isSelected ? styles.chipSelected : styles.chipUnselected
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.chipText,
                          isSelected ? styles.chipTextSelected : styles.chipTextUnselected
                        ]}>
                          {goal.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.sectionPadding}>
              <View style={styles.infoCard}>
                <View style={{ marginRight: 12, marginTop: 2 }}>
                  <MaterialIcons name="info" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.infoText}>
                  {t('onboarding.step2.info')}
                </Text>
              </View>
            </View>

            {/* Inline Next Button */}
            <View style={styles.sectionPadding}>
                 <TouchableOpacity 
                    onPress={handleNext}
                    disabled={selectedHabits.length === 0}
                    style={[styles.nextButton, selectedHabits.length === 0 && { opacity: 0.5 }]}
                    activeOpacity={0.9}
                >
                    <Text style={styles.nextButtonText}>
                    {t('onboarding.step2.next')}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={24} color={Colors.backgroundDark} />
                </TouchableOpacity>
            </View>

          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  content: {
    position: 'relative',
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 4,
    width: 96,
    borderRadius: 2,
    backgroundColor: 'rgba(13, 242, 89, 0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '66.6%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  spacer: {
    width: 40,
    height: 40,
  },
  sectionPadding: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  headline: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 44,
    textAlign: 'left',
  },
  headlineAccent: {
    color: Colors.primary,
    fontStyle: 'italic',
  },
  bmiCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bmiHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  bmiTitle: {
      color: Colors.textMuted,
      fontSize: 14,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '600',
  },
  bmiBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
  },
  bmiBadgeText: {
      color: Colors.backgroundDark,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
  },
  bmiValue: {
      color: Colors.text,
      fontSize: 48,
      fontWeight: 'bold',
      lineHeight: 48,
  },
  bmiLabel: {
      color: Colors.textMuted,
      fontSize: 14,
      marginTop: 4,
  },
  scaleContainer: {
      marginTop: 24,
      marginBottom: 8,
      width: '100%',
  },
  scaleBar: {
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 4,
      flexDirection: 'row',
      overflow: 'hidden',
  },
  scaleSegment: {
      height: '100%',
  },
  scaleMarker: {
      position: 'absolute',
      top: -6,
      width: 12,
      height: 12,
      marginLeft: -6, // Center marker
      alignItems: 'center',
  },
  markerArrow: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#ffffff',
  },
  bmiFormula: {
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: 12,
      marginTop: 16,
      textAlign: 'center',
  },
  sectionContainer: {
      width: '100%',
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  chip: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingHorizontal: 20,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  chipUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 89, 0.3)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.backgroundDark,
    fontWeight: '700',
  },
  chipTextUnselected: {
    color: '#ffffff',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(13, 242, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 89, 0.3)',
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 48,
    backgroundColor: Colors.backgroundDark, // Gradient effect usually, but flat color for simplicity
  },
  nextButton: {
    width: '100%',
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    color: Colors.backgroundDark,
  },
});
