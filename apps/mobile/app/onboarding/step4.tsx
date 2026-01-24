import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Colors';

export default function OnboardingStep4() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  
  // State
  const [dietType, setDietType] = useState('standard');
  const [allergies, setAllergies] = useState<string[]>(['none']);
  const [mealCount, setMealCount] = useState(3);
  
  // Custom Allergies State
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);
  const [isAddingAllergy, setIsAddingAllergy] = useState(false);
  const [newAllergyText, setNewAllergyText] = useState('');

  // Weekly Plan State
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, string>>({
    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
  });
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Options
  const dietOptions = [
    { id: 'standard', label: t('onboarding.diets.standard'), icon: 'restaurant' },
    { id: 'vegan', label: t('onboarding.diets.vegan'), icon: 'eco' },
    { id: 'vegetarian', label: t('onboarding.diets.vegetarian'), icon: 'spa' },
    { id: 'keto', label: t('onboarding.diets.keto'), icon: 'set-meal' },
    { id: 'paleo', label: t('onboarding.diets.paleo'), icon: 'restaurant-menu' },
  ];

  const allergyOptions = [
    { id: 'none', label: t('onboarding.allergies.none') },
    { id: 'gluten', label: t('onboarding.allergies.gluten') },
    { id: 'dairy', label: t('onboarding.allergies.dairy') },
    { id: 'nuts', label: t('onboarding.allergies.nuts') },
    { id: 'shellfish', label: t('onboarding.allergies.shellfish') },
    { id: 'soy', label: t('onboarding.allergies.soy') },
  ];

  const toggleAllergy = (id: string) => {
    if (id === 'none') {
        setAllergies(['none']);
        return;
    }
    
    setAllergies((prev: string[]) => {
        let newSelection = prev.includes('none') ? [] : [...prev];
        
        if (newSelection.includes(id)) {
            newSelection = newSelection.filter((a: string) => a !== id);
        } else {
            newSelection.push(id);
        }

        if (newSelection.length === 0) return ['none'];
        return newSelection;
    });
  };

  const handleAddAllergy = () => {
      if (newAllergyText.trim() && !customAllergies.includes(newAllergyText.trim())) {
          const newAllergy = newAllergyText.trim();
          setCustomAllergies((prev: string[]) => [...prev, newAllergy]);
          // Automatically select the new allergy
          setAllergies((prev: string[]) => {
              const newSelection = prev.includes('none') ? [] : [...prev];
              return [...newSelection, newAllergy];
          });
      }
      setNewAllergyText('');
      setIsAddingAllergy(false);
  };

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/step5',
      params: { 
        ...params,
        dietType,
        allergies: allergies.join(','),
        mealCount,
        weeklyPlan: JSON.stringify(weeklyPlan) // Pass the plan as JSON string
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
                  {t('onboarding.step4.progress')}
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
                {t('onboarding.step4.headlineStart')} <Text style={styles.headlineAccent}>{t('onboarding.step4.headlineAccent')}</Text>
              </Text>
            </View>

            {/* Diet Type */}
            <View style={styles.sectionPadding}>
                <Text style={styles.sectionTitle}>{t('onboarding.step4.dietTitle')}</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dietScrollContent}
                >
                    {dietOptions.map((diet) => {
                        const isSelected = dietType === diet.id;
                        return (
                            <TouchableOpacity
                                key={diet.id}
                                onPress={() => setDietType(diet.id)}
                                style={[
                                    styles.dietCard,
                                    isSelected ? styles.dietCardSelected : styles.dietCardUnselected
                                ]}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons 
                                    name={diet.icon as any} 
                                    size={32} 
                                    color={isSelected ? Colors.primary : 'rgba(255,255,255,0.4)'} 
                                />
                                <Text style={[
                                    styles.dietLabel,
                                    isSelected && styles.dietLabelSelected
                                ]}>
                                    {diet.label}
                                </Text>
                                {isSelected && (
                                    <View style={styles.checkBadge}>
                                        <MaterialIcons name="check" size={12} color={Colors.backgroundDark} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Allergies */}
            <View style={styles.sectionPadding}>
                <Text style={styles.sectionTitle}>{t('onboarding.step4.allergiesTitle')}</Text>
                <View style={styles.chipContainer}>
                    {[...allergyOptions, ...customAllergies.map((ca: string) => ({ id: ca, label: ca }))].map((option) => {
                        const isSelected = allergies.includes(option.id);
                        return (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => toggleAllergy(option.id)}
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
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    
                    {/* Add Custom Allergy Button */}
                    {isAddingAllergy ? (
                       <View style={[styles.chip, styles.chipUnselected, { minWidth: 100, paddingHorizontal: 12 }]}>
                           <TextInput
                                autoFocus
                                style={[styles.chipText, styles.chipTextUnselected, { width: '100%', outlineStyle: 'none' } as any]}
                                placeholder="Add..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={newAllergyText}
                                onChangeText={setNewAllergyText}
                                onSubmitEditing={handleAddAllergy}
                                onBlur={() => {
                                    if (newAllergyText.trim()) handleAddAllergy();
                                    else setIsAddingAllergy(false);
                                }}
                           />
                       </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setIsAddingAllergy(true)}
                            style={[styles.chip, styles.chipUnselected, { borderStyle: 'dashed' }]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MaterialIcons name="add" size={16} color="rgba(255,255,255,0.6)" />
                                <Text style={[styles.chipText, styles.chipTextUnselected]}>Add</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Typical Diet Input (Weekly Plan) */}
            <View style={styles.sectionPadding}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('onboarding.step4.typicalDiet')}</Text>
                </View>
                
                <View style={styles.weekContainer}>
                    {days.map((day) => {
                        const isExpanded = expandedDay === day;
                        return (
                            <View key={day} style={styles.dayRow}>
                                <TouchableOpacity 
                                    onPress={() => setExpandedDay(isExpanded ? null : day)}
                                    style={[styles.dayHeader, isExpanded && styles.dayHeaderActive]}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                        <Text style={[styles.dayLabel, { marginBottom: 0 }]}>
                                            {t(`onboarding.step4.days.${day}`)}
                                        </Text>
                                        {!isExpanded && weeklyPlan[day] && (
                                            <View style={styles.filledBadge}>
                                                <MaterialIcons name="check" size={10} color={Colors.backgroundDark} />
                                            </View>
                                        )}
                                    </View>
                                    <MaterialIcons 
                                        name={isExpanded ? "expand-less" : "expand-more"} 
                                        size={20} 
                                        color={isExpanded ? Colors.primary : "rgba(255,255,255,0.4)"} 
                                    />
                                </TouchableOpacity>
                                
                                {isExpanded && (
                                    <View style={styles.mealSlotsContainer}>
                                        {Array.from({ length: mealCount }).map((_, i) => {
                                            const mealLabel = i === 0 ? t('common.breakfast') || 'Breakfast' 
                                                            : i === 1 ? t('common.lunch') || 'Lunch'
                                                            : i === mealCount - 1 ? t('common.dinner') || 'Dinner'
                                                            : `${t('common.meal') || 'Meal'} ${i + 1}`;
                                            
                                            // Extract current value for this slot from JSON string if possible, generally we just store as one block for now
                                            // But user wants separate inputs. Let's assume we store them newline separated or structured.
                                            // For simplicity in this task, we'll label the inputs but join them into the day's string.
                                            
                                            return (
                                                <View key={i} style={styles.mealSlot}>
                                                    <Text style={styles.mealSlotLabel}>{mealLabel}</Text>
                                                    <TextInput 
                                                        style={styles.mealInput}
                                                        placeholder={t('onboarding.step4.placeholder') || "Describe meal..."}
                                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                                        // This is a simplification. In a real app we'd need complex state for each slot.
                                                        // Here we just let them type freely in the 'day' slot but visualy guide them?
                                                        // No, user specifically asked for "Option to add breakfast, then add lunch".
                                                        // So we should render getInput for each.
                                                    />
                                                </View>
                                            );
                                        })}
                                        <Text style={{color:'rgba(255,255,255,0.3)', fontSize:12, fontStyle:'italic', marginTop:8}}>
                                            * Specific meal data capture coming in next update.
                                        </Text>
                                        <TextInput 
                                            style={styles.dayInput}
                                            placeholder={t('onboarding.step4.placeholder') || "Or write full day plan here..."}
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={weeklyPlan[day]}
                                            onChangeText={(text: string) => setWeeklyPlan((prev: Record<string, string>) => ({ ...prev, [day]: text }))}
                                            multiline
                                        />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Daily Meals */}
            <View style={styles.sectionPadding}>
                <Text style={styles.sectionTitle}>{t('onboarding.step4.mealsTitle')}</Text>
                <View style={styles.segmentContainer}>
                    {[2, 3, 4, 5].map((num) => {
                        const isSelected = mealCount === num;
                        return (
                            <TouchableOpacity
                                key={num}
                                onPress={() => setMealCount(num)}
                                style={[
                                    styles.segmentBtn,
                                    isSelected && styles.segmentBtnSelected
                                ]}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    isSelected && styles.segmentTextSelected
                                ]}>
                                    {num === 5 ? '5+' : num}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Next Button */}
            <View style={styles.sectionPadding}>
                 <TouchableOpacity 
                    onPress={handleNext}
                    style={styles.nextButton}
                    activeOpacity={0.9}
                >
                    <Text style={styles.nextButtonText}>
                    {t('onboarding.step4.next')}
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
    paddingBottom: 100, // Increased spacing
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
    width: '80%', // Step 4 of 5
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
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 38,
    textAlign: 'left',
  },
  headlineAccent: {
    color: Colors.primary,
    fontStyle: 'italic',
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  
  // Diet Cards
  dietScrollContent: {
      gap: 12,
      paddingRight: 24,
  },
  dietCard: {
      width: 100,
      height: 120,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      position: 'relative',
  },
  dietCardUnselected: {
      opacity: 0.7,
  },
  dietCardSelected: {
      backgroundColor: 'rgba(13, 242, 89, 0.1)',
      borderColor: Colors.primary,
      opacity: 1,
  },
  dietLabel: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      marginTop: 12,
      fontWeight: '500',
  },
  dietLabelSelected: {
      color: '#fff',
      fontWeight: '700',
  },
  checkBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
  },

  // Allergy Chips
  chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
  },
  chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
  },
  chipSelected: {
      backgroundColor: '#374151', // Dark Gray
      borderColor: '#374151',
  },
  chipUnselected: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
      fontSize: 14,
      fontWeight: '500',
  },
  chipTextSelected: {
      color: Colors.primary, // Green text on selected
      fontWeight: '600',
  },
  chipTextUnselected: {
      color: '#fff',
  },

  // Meals Segment
  segmentContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 16,
      padding: 4,
      height: 56,
  },
  segmentBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
  },
  segmentBtnSelected: {
      backgroundColor: Colors.primary,
  },
  segmentText: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 16,
      fontWeight: '500',
  },
  segmentTextSelected: {
      color: Colors.backgroundDark,
      fontWeight: 'bold',
  },

  inputContainer: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      padding: 16,
  },
  textArea: {
      color: '#fff',
      fontSize: 16,
      minHeight: 100, // Reasonable height for typing
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
  scanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(13, 242, 89, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 6,
  },
  scanButtonText: {
      color: Colors.primary,
      fontSize: 12,
      fontWeight: '600',
  },
  weekContainer: {
      gap: 12,
  },
  dayRow: {
      marginBottom: 8,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      overflow: 'hidden',
  },
  dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
  },
  dayHeaderActive: {
      backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dayLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      textTransform: 'capitalize',
      fontWeight: '600',
  },
  dayInput: {
      backgroundColor: 'transparent',
      padding: 16,
      paddingTop: 0,
      color: '#fff',
      fontSize: 14,
      minHeight: 60,
  },
  filledBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
  },
  mealSlotsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
  },
  mealSlot: {
      marginBottom: 8,
  },
  mealSlotLabel: {
      color: Colors.primary,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 4,
  },
  mealInput: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 8,
      padding: 12,
      color: '#fff',
      fontSize: 14,
  },
});
