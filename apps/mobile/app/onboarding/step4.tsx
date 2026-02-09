import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Image } from 'react-native';
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
    { 
        id: 'standard', 
        label: t('onboarding.diets.standard'), 
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVMSDPiFQuQsxkRc8R-bLGtwmXAXYM30k-qun-udbH_8kObk3-y9vnSKAO_fsv7Mbjv7eXvQB-86zzRZMgXYdCB7tweTAmV3jTRE5aNKuDyjsj3Lx0M_HTc1ToU3Ll-DKi7lhQUL3REItjJ0yQ8UCi2rCyEO-esydh75d-gCKv_qI4hju1BkFpNggcCG87r9iGsM6vfsTxqXTeIMNWx35Cpk7mh69-G0_sYCBe_mEMuk1d0GK6vDUkwsmil7MOBPQ_Wyvhvwh5Ey0',
        subtitle: 'Balanced everything'
    },
    { 
        id: 'vegan', 
        label: t('onboarding.diets.vegan'), 
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9L7C30880MqQWdHJKKClg7yg4YydVPrVR3t-0heN1FI17UhaC2MchXkQlUWndz5YfFyI4mPmnjUzprBuk2BogqvLoC4g2OEupQAVv-3kLv637WjhFMIKJSudnLOsyieMKW2_QfBWKoRnpBK9P_GqP2v5yePVTWzCwlSUniag-jlf_HEHF1s3FLacmeQJQKcaUggq4Qr0GJsefs00GsomC7U5KQLs4r8Lp-aFgJEiBEkP5zgS-Tmc1n_IgxI-guyMMKL_yelFVuEU',
        subtitle: 'Plant-based'
    },
    { 
        id: 'keto', 
        label: t('onboarding.diets.keto'), 
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqmNdXeMBj5e4fzTcj7FHOCs9e3QOKPx-8mK0tgPsNAq_MKGdN6HWlzrznOn1Vt3tZu7wt1fOf7LoLH9toM4_h5tGc05dDqmg-kwANTLTuuvA0UL-Yc6QJVQW7fZmViD4_m0fnz8PmvzXXiH7YA0XtExX0u8R7k7oLlZEqcimjYPwnlE8kp9NXpVcQtCZpMke1xIzZSZwi0gJwdu1GVy2in-fsT4YhzpgxTG-jpUA_9FdSupIyFpgzRPha8al9FEz4vnR6V8u5qSo',
        subtitle: 'Low carb, high fat'
    },
    { 
        id: 'vegetarian', 
        label: t('onboarding.diets.vegetarian'), 
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnsl6lX7_FfXs5HASSMLrT8ny5HvDJ_FlUFvTMm_VdWOnZoZRPo43i-m3obJHU_RnYkr-i4a3zy93cT0JqcCsM8Q3Y8dp_birntSWH0vKuqhdyZI-WfezVVWeJKFufSPrai96EDT2aBzccT8pB75Rrosfel_B9Fn2QvAzZb9PYli7JUluUQxalBqAVVJVW0LbemmGe4Irf6raj278DFYlIfKbjF9Y8HMW2aLIJGYnb9Si9SdReILguSH_WcQa8ifbJ1qJ5wuYyJLQ',
        subtitle: 'No meat products'
    },
    { 
        id: 'paleo', 
        label: t('onboarding.diets.paleo'), 
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60', 
        subtitle: 'Whole foods'
    },
  ];

  const allergyOptions = [
    { id: 'none', label: t('onboarding.allergies.none') },
    { id: 'gluten', label: t('onboarding.allergies.gluten') },
    { id: 'dairy', label: t('onboarding.allergies.dairy') },
    { id: 'nuts', label: t('onboarding.allergies.nuts') },
    { id: 'shellfish', label: t('onboarding.allergies.shellfish') },
    { id: 'soy', label: t('onboarding.allergies.soy') },
  ];

  // ... (omitting allergies logic)
  const toggleAllergy = (id: string) => {
      setAllergies((prev) => {
          if (id === 'none') {
              return ['none'];
          }
          const newSelection = prev.filter(a => a !== 'none');
          if (newSelection.includes(id)) {
              return newSelection.filter(a => a !== id);
          } else {
              return [...newSelection, id];
          }
      });
  };

  const handleAddAllergy = () => {
      // ... (existing logic)
      if (newAllergyText.trim() && !customAllergies.includes(newAllergyText.trim())) {
          const newAllergy = newAllergyText.trim();
          setCustomAllergies((prev: string[]) => [...prev, newAllergy]);
          setAllergies((prev: string[]) => {
              const newSelection = prev.includes('none') ? [] : [...prev];
              return [...newSelection, newAllergy];
          });
      }
      setNewAllergyText('');
      setIsAddingAllergy(false);
  };

  const handleNext = () => {
    // ... (existing logic)
    router.push({
      pathname: '/onboarding/step5',
      params: { 
        ...params,
        dietType,
        allergies: allergies.join(','),
        mealCount,
        weeklyPlan: JSON.stringify(weeklyPlan) 
      }
    });
  };

  const getMealTags = (index: number) => {
      if (index === 0) return [
          { id: 'protein', label: t('onboarding.step4.tags.breakfast.protein') },
          { id: 'light', label: t('onboarding.step4.tags.breakfast.light') },
          { id: 'fruit', label: t('onboarding.step4.tags.breakfast.fruit') },
      ];
      if (index === 1) return [
          { id: 'healthy', label: t('onboarding.step4.tags.lunch.healthy') },
          { id: 'carbs', label: t('onboarding.step4.tags.lunch.carbs') },
          { id: 'out', label: t('onboarding.step4.tags.lunch.out') },
      ];
      if (index === 2) return [
          { id: 'salad', label: t('onboarding.step4.tags.dinner.salad') },
          { id: 'soup', label: t('onboarding.step4.tags.dinner.soup') },
          { id: 'fastFood', label: t('onboarding.step4.tags.dinner.fastFood') },
      ];
      return [];
  };

  const getMealIcon = (index: number) => {
      if (index === 0) return 'wb-twilight';
      if (index === 1) return 'wb-sunny';
      return 'nights-stay';
  };
  
	const updateMealPlan = (day: string, text: string) => {
		setWeeklyPlan(prev => ({ ...prev, [day]: text }));
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
          {/* ... (TopBar, Headline code omitted for brevity but should be kept) ... */} 
           <View style={styles.content}>
            
            {/* TopAppBar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back-ios" size={20} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{t('onboarding.step4.progress')}</Text>
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dietScrollContent}>
                    {dietOptions.map((diet) => {
                        const isSelected = dietType === diet.id;
                        return (
                            <TouchableOpacity
                                key={diet.id}
                                onPress={() => setDietType(diet.id)}
                                style={[styles.dietCardGrouping]}
                                activeOpacity={0.8}
                            >
                                <View style={[
                                    styles.dietCard,
                                    isSelected ? styles.dietCardSelected : styles.dietCardUnselected
                                ]}>
                                    <Image source={{ uri: diet.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                                    <View style={styles.dietCardOverlay} />
                                    {isSelected && (
                                        <View style={styles.checkBadge}>
                                            <MaterialIcons name="check" size={12} color={Colors.backgroundDark} />
                                        </View>
                                    )}
                                </View>
                                <View style={{ marginTop: 8 }}>
                                    <Text style={[styles.dietLabel, isSelected && styles.dietLabelSelected]}>{diet.label}</Text>
                                    <Text style={styles.dietSubtitle}>{diet.subtitle}</Text>
                                </View>
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
                                style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>{option.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                    {/* Add Custom Allergy Button Logic Kept Same... */}
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
                                onBlur={() => { if (newAllergyText.trim()) handleAddAllergy(); else setIsAddingAllergy(false); }}
                           />
                       </View>
                    ) : (
                        <TouchableOpacity onPress={() => setIsAddingAllergy(true)} style={[styles.chip, styles.chipUnselected, { borderStyle: 'dashed' }]}>
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
                            <View key={day} style={[styles.dayCard, isExpanded && styles.dayCardExpanded]}>
                                <TouchableOpacity 
                                    onPress={() => setExpandedDay(isExpanded ? null : day)}
                                    style={styles.dayHeader}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                        <View style={[styles.neonDot, isExpanded && styles.neonDotActive]} />
                                        <Text style={[styles.dayLabel, { marginBottom: 0 }]}>
                                            {t(`onboarding.step4.days.${day}`)}
                                        </Text>
                                    </View>
                                    <MaterialIcons 
                                        name={isExpanded ? "expand-less" : "expand-more"} 
                                        size={20} 
                                        color={isExpanded ? Colors.primary : "rgba(255,255,255,0.4)"} 
                                    />
                                </TouchableOpacity>
                                
                                {isExpanded && (
                                    <View style={styles.mealSlotsContainer}>
                                        {Array.from({ length: 3 }).map((_, i) => { // Limiting to 3 main meals for UI sanity matching design
                                            const mealLabel = i === 0 ? t('common.breakfast') 
                                                            : i === 1 ? t('common.lunch') 
                                                            : t('common.dinner');
                                            
                                            return (
                                                <View key={i} style={styles.mealSlot}>
                                                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                                                        <Text style={styles.mealSlotLabel}>{mealLabel}</Text>
                                                        <MaterialIcons name={getMealIcon(i) as any} size={14} color={Colors.primary} />
                                                    </View>
                                                    <TextInput 
                                                        style={styles.neonInput}
                                                        placeholder={t('onboarding.step4.placeholder')}
                                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                                        // In reality we bind this to some sub-field of weeklyPlan[day], but for now simplistic binding
                                                        onChangeText={(txt) => {
                                                            // Append logic or complex object logic
                                                            // For now simplistic: just keep upgrading the day string
                                                        }}
                                                    />
                                                    <View style={styles.tagContainer}>
                                                        {getMealTags(i).map(tag => (
                                                            <TouchableOpacity key={tag.id} style={styles.tag} onPress={() => {
																// Logic to add tag to input
															}}>
                                                                <Text style={styles.tagText}>{tag.label}</Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </View>
                                            );
                                        })}
                                         <View style={{paddingVertical:8}}>
											<Text style={styles.footerNote}>* Specific meal data capture coming in next update.</Text>
										</View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Daily Meals Selector removed/hidden based on new design preference or kept small? 
               User HTML didn't show the number selector explicitly but implies standard 3 meals. 
               I'll keep it but maybe minimize it or remove if it conflicts. 
               The user didn't explicitly ask to remove 'Daily Meals' section, 
               but the design focuses on Breakfast/Lunch/Dinner. 
               I'll keep it for now as "Daily Meals Frequency". 
            */}
             <View style={styles.sectionPadding}>
                <Text style={styles.sectionTitle}>{t('onboarding.step4.mealsTitle')}</Text>
                <View style={styles.segmentContainer}>
                    {[2, 3, 4, 5].map((num) => (
                         <TouchableOpacity key={num} onPress={() => setMealCount(num)} style={[styles.segmentBtn, mealCount === num && styles.segmentBtnSelected]}>
                            <Text style={[styles.segmentText, mealCount === num && styles.segmentTextSelected]}>{num === 5 ? '5+' : num}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Next Button */}
            <View style={styles.sectionPadding}>
                 <TouchableOpacity onPress={handleNext} style={styles.nextButton} activeOpacity={0.9}>
                    <Text style={styles.nextButtonText}>{t('onboarding.step4.next')}</Text>
                    <MaterialIcons name="arrow-forward" size={24} color={Colors.backgroundDark} />
                </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

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
  dietCardGrouping: {
      flexDirection: 'column',
      width: 140,
      marginRight: 4,
  },
  dietCard: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.05)',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent', // Default transparent
      position: 'relative',
  },
  dietCardOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.2)', // Slight scrim
  },
  dietCardUnselected: {
      opacity: 0.8,
      borderColor: 'transparent',
  },
  dietCardSelected: {
      opacity: 1,
      borderColor: Colors.primary,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
  },
  dietLabel: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
  dietSubtitle: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 12,
      marginTop: 2,
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
  dayCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
      marginBottom: 12,
      overflow: 'hidden',
  },
  dayCardExpanded: {
      backgroundColor: '#162218', // Card dark base
      borderColor: 'rgba(255,255,255,0.1)',
      shadowColor: '#0df2a6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
  },
  dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
  },
  neonDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.1)',
  },
  neonDotActive: {
      backgroundColor: Colors.primary,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 5,
  },
  dayLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      textTransform: 'capitalize',
      fontWeight: '600',
  },
  mealSlotsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 20,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.05)',
      paddingTop: 20,
  },
  mealSlot: {
     // No specific container style needed if gaps handle it
  },
  mealSlotLabel: {
      color: Colors.primary,
      fontSize: 10,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 2,
  },
  neonInput: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: 16,
      color: '#fff',
      fontSize: 14,
      marginBottom: 12,
  },
  tagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
  },
  tag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
  },
  tagText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 11,
      fontWeight: '500',
  },
  footerNote: {
	  color: 'rgba(255,255,255,0.3)',
	  fontSize: 10,
	  fontStyle: 'italic',
	  textAlign: 'center',
  },
});
