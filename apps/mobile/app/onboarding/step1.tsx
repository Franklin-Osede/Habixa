import React, { useState } from 'react';
import { View, Text, TouchableOpacity, PanResponder, ScrollView, StyleSheet, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

export default function OnboardingStep1() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // State
  const [mainQuest, setMainQuest] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>('Lose Weight');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  
  // Values
  const [age, setAge] = useState(18);
  const [weight, setWeight] = useState(30); // Min
  const [height, setHeight] = useState(100); // Min

  // Custom Tags Logic
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  const tags = [
    { id: 'loseWeight', label: t('onboarding.tags.loseWeight') },
    { id: 'buildMuscle', label: t('onboarding.tags.buildMuscle') },
    { id: 'energy', label: t('onboarding.tags.energy') },
    { id: 'mindfulness', label: t('onboarding.tags.mindfulness') }
  ];

  const handleToggleTag = (tagLabel: string) => {
      // Logic to toggle selection
      if (selectedTag === tagLabel) setSelectedTag(null);
      else setSelectedTag(tagLabel);
  };
  
  const handleAddTag = () => {
    if (newTagText.trim() && !customTags.includes(newTagText.trim())) {
        const newTag = newTagText.trim();
        setCustomTags([...customTags, newTag]);
        setSelectedTag(newTag); // Auto Select
    }
    setNewTagText('');
    setIsAddingTag(false);
  };

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/step2',
      params: { 
        mainQuest,
        selectedTag, 
        unitSystem, 
        age, 
        weight, 
        height 
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
                activeOpacity={0.7}
              >
                <MaterialIcons name="arrow-back-ios" size={20} color={Colors.text} />
              </TouchableOpacity>
              
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {t('onboarding.step1.progress')}
                </Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressBarFill} />
                </View>
              </View>
              
              <View style={styles.spacer} />
            </View>

            {/* Headline */}
            <View style={styles.headlineContainer}>
              <Text style={styles.headline}>
                {t('onboarding.step1.headlineStart')} {'\n'}
                <Text style={styles.headlineAccent}>{t('onboarding.step1.headlineAccent')}</Text>
              </Text>
            </View>

            {/* Text Field */}
            <View style={styles.section}>
              <Text style={styles.label}>
                {t('onboarding.step1.definePurpose')}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={[
                    styles.textInput,
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                  ]}
                  placeholder={t('onboarding.step1.placeholder')}
                  placeholderTextColor={`${Colors.primary}66`}
                  value={mainQuest}
                  onChangeText={setMainQuest}
                />
                <MaterialIcons name="flare" size={24} color={Colors.primary} />
              </View>
            </View>

            {/* Chips */}
            <View style={styles.chipsContainer}>
              {[...tags, ...customTags.map(ct => ({ id: ct, label: ct }))].map((tag, index) => {
                 const isLabelMatch = selectedTag === tag.label;
                 return (
                  <TouchableOpacity 
                    key={tag.id}
                    onPress={() => handleToggleTag(tag.label)}
                    style={[
                      styles.chip,
                      isLabelMatch ? styles.chipSelected : styles.chipUnselected,
                      styles.chipMargin
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.chipText,
                      isLabelMatch ? styles.chipTextSelected : styles.chipTextUnselected
                    ]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {/* Add Custom Tag Logic */}
               {customTags.length < 4 && (
                   isAddingTag ? (
                       <View style={[styles.chip, styles.chipUnselected, styles.chipMargin, { minWidth: 100, paddingHorizontal: 12 }]}>
                           <TextInput
                                autoFocus
                                style={[
                                    styles.chipText, 
                                    styles.chipTextUnselected, 
                                    Platform.OS === 'web' ? { outlineStyle: 'none', width: '100%' } : { width: '100%' } as any 
                                ]}
                                placeholder="Tag..."
                                placeholderTextColor={Colors.textDim}
                                value={newTagText}
                                onChangeText={setNewTagText}
                                onSubmitEditing={handleAddTag}
                                onBlur={() => {
                                    if (newTagText.trim()) handleAddTag();
                                    else setIsAddingTag(false);
                                }}
                           />
                       </View>
                   ) : (
                    <TouchableOpacity
                        onPress={() => setIsAddingTag(true)}
                        style={[
                        styles.chip,
                        styles.chipUnselected,
                        styles.chipMargin,
                        { borderStyle: 'dashed' }
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialIcons name="add" size={16} color={Colors.text} />
                            <Text style={[styles.chipText, styles.chipTextUnselected]}>
                                Add
                            </Text>
                        </View>
                    </TouchableOpacity>
                   )
               )}
            </View>

            {/* Biometrics */}
            <View style={styles.biometricsContainer}>
              {/* Units Toggle */}
              <View style={styles.unitsContainer}>
                <Text style={styles.label}>
                  {t('onboarding.step1.units')}
                </Text>
                <View style={styles.unitsToggle}>
                  <TouchableOpacity 
                    onPress={() => setUnitSystem('metric')}
                    style={[
                      styles.unitButton,
                      unitSystem === 'metric' && styles.unitButtonSelected
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.unitButtonText,
                      unitSystem === 'metric' && styles.unitButtonTextSelected
                    ]}>
                       {t('onboarding.step1.metric')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setUnitSystem('imperial')}
                    style={[
                      styles.unitButton,
                      unitSystem === 'imperial' && styles.unitButtonSelected
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.unitButtonText,
                      unitSystem === 'imperial' && styles.unitButtonTextSelected
                    ]}>
                       {t('onboarding.step1.imperial')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Age Slider */}
              <View style={styles.rulerSection}>
                <View style={styles.rulerHeader}>
                  <Text style={styles.label}>{t('onboarding.step1.age')}</Text>
                  <Text style={styles.rulerValue}>
                    {Math.round(age)} <Text style={styles.rulerUnit}>{t('onboarding.step1.years')}</Text>
                  </Text>
                </View>
                <InteractiveSlider value={age} min={18} max={90} onChange={setAge} />
              </View>

              {/* Weight Slider */}
              <View style={styles.rulerSection}>
                <View style={styles.rulerHeader}>
                  <Text style={styles.label}>{t('onboarding.step1.weight')}</Text>
                  <Text style={styles.rulerValue}>
                    {Math.round(weight)} <Text style={styles.rulerUnit}>kg</Text>
                  </Text>
                </View>
                <InteractiveSlider value={weight} min={30} max={200} onChange={setWeight} />
              </View>

              {/* Height Slider */}
              <View style={styles.rulerSection}>
                <View style={styles.rulerHeader}>
                  <Text style={styles.label}>{t('onboarding.step1.height')}</Text>
                  <Text style={styles.rulerValue}>
                    {Math.round(height)} <Text style={styles.rulerUnit}>cm</Text>
                  </Text>
                </View>
                <InteractiveSlider value={height} min={100} max={250} onChange={setHeight} />
              </View>
            </View>
            
            {/* Moved Button Here (Inside standard flow) */}
            <TouchableOpacity 
                onPress={handleNext}
                style={styles.nextButtonInline}
                activeOpacity={0.9}
            >
                <Text style={styles.nextButtonText}>
                {t('onboarding.step1.nextSimple')}
                </Text>
                <MaterialIcons name="arrow-forward" size={24} color={Colors.backgroundDark} />
            </TouchableOpacity>
            
          </View>
          <View style={{ height: 40 }} /> 
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const InteractiveSlider = ({ 
  value, 
  min, 
  max, 
  onChange, 
}: { 
  value: number; 
  min: number; 
  max: number; 
  onChange: (val: number) => void; 
}) => {
  const [width, setWidth] = useState(0);

  const handleGesture = (x: number) => {
    if (width === 0) return;
    const percentage = Math.max(0, Math.min(1, x / width));
    const newValue = Math.round(min + percentage * (max - min));
    if (newValue !== value) {
        onChange(newValue);
    }
  };

  // Use a ref to keep the latest handleGesture accessible to PanResponder without recreating it
  const handleGestureRef = React.useRef(handleGesture);
  handleGestureRef.current = handleGesture;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        handleGestureRef.current(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt, gestureState) => {
         // Using locationX from the native event for tap/drag tracking relative to the view
         handleGestureRef.current(evt.nativeEvent.locationX);
      },
    })
  ).current;

  return (
    <View style={styles.numberControl}>
      <TouchableOpacity 
        onPress={() => onChange(Math.max(min, value - 1))} 
        style={styles.controlBtn}
      >
        <MaterialIcons name="remove" size={24} color={Colors.text} />
      </TouchableOpacity>
      
      {/* Expanded Touch Area */}
      <View 
        style={styles.touchArea}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderTrack}>
            <View 
              style={[
                styles.sliderFill, 
                { width: `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%` }
              ]} 
            />
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => onChange(Math.min(max, value + 1))} 
        style={styles.controlBtn}
      >
        <MaterialIcons name="add" size={24} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // New Styles for controls
  numberControl: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      height: 48,
  },
  controlBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: `${Colors.primary}33`,
  },
  touchArea: {
      flex: 1,
      height: 48, // Large touch target
      justifyContent: 'center',
  },
  sliderTrack: {
      height: 8,
      backgroundColor: Colors.surfaceHighlight,
      borderRadius: 4,
      overflow: 'hidden',
      width: '100%',
  },
  sliderFill: {
      height: '100%',
      backgroundColor: Colors.primary,
  },
  nextButtonInline: {
    marginHorizontal: 24, // Matches padding of other sections
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content
    gap: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    marginTop: 32,
    marginBottom: 20,
  },
  // Existing styles...
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollContent: {
    paddingBottom: 40, // Reduced padding
  },
  content: {
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: `${Colors.backgroundDark}CC`,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.surfaceHighlight,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 4,
  },
  progressBar: {
    width: 96,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${Colors.primary}33`,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '33.3%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  spacer: {
    width: 40,
    height: 40,
  },
  headlineContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  headline: {
    color: Colors.text,
    fontSize: 32, // Reduced from 40 for better fit
    fontWeight: '700',
    lineHeight: 38,
  },
  headlineAccent: {
    color: Colors.primary,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  label: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  textInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '500',
    height: '100%',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  chip: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingHorizontal: 20,
  },
  chipMargin: {
    marginLeft: 8,
    marginTop: 8,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  chipUnselected: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
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
    color: Colors.text,
  },
  biometricsContainer: {
    paddingHorizontal: 24,
  },
  unitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  unitsToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceHighlight,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.text}1A`,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unitButtonSelected: {
    backgroundColor: Colors.primary,
  },
  unitButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDim,
    cursor: 'pointer',
  },
  unitButtonTextSelected: {
    color: Colors.backgroundDark,
  },
  rulerSection: {
    marginBottom: 32,
  },
  rulerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  rulerValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  rulerUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.backgroundDark,
  },
} as const);
