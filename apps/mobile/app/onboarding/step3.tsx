import React, { useState, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, PanResponder } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Colors';

// Helper functions
const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const DualRangeSlider = ({ 
  startTime, 
  endTime, 
  onChange 
}: { 
  startTime: string; 
  endTime: string; 
  onChange: (start: string, end: string) => void;
}) => {
  const [width, setWidth] = useState(0);
  const startMin = useMemo(() => timeToMinutes(startTime), [startTime]);
  const endMin = useMemo(() => timeToMinutes(endTime), [endTime]);

  // Use refs to track latest values for PanResponder to access avoiding stale closures
  const widthRef = useRef(0);
  const startMinRef = useRef(startMin);
  const endMinRef = useRef(endMin);
  const onChangeRef = useRef(onChange);

  // Update refs on render
  widthRef.current = width;
  startMinRef.current = startMin;
  endMinRef.current = endMin;
  onChangeRef.current = onChange;

  const handleStartDrag = (dx: number, initialStart: number) => {
    if (widthRef.current === 0) return;
    const minutesPerPixel = 1440 / widthRef.current;
    const deltaMinutes = dx * minutesPerPixel;
    let newStart = Math.round((initialStart + deltaMinutes) / 15) * 15; // Snap to 15m
    
    // Constraints: 0 <= newStart <= endMin
    newStart = Math.max(0, Math.min(newStart, endMinRef.current - 15)); // Keep at least 15m gap
    
    if (newStart !== startMinRef.current) {
      onChangeRef.current(minutesToTime(newStart), endTime); // Use prop endTime, but effectively it's the same
    }
  };

  const handleEndDrag = (dx: number, initialEnd: number) => {
    if (widthRef.current === 0) return;
    const minutesPerPixel = 1440 / widthRef.current;
    const deltaMinutes = dx * minutesPerPixel;
    let newEnd = Math.round((initialEnd + deltaMinutes) / 15) * 15; // Snap to 15m
    
    // Constraints: startMin <= newEnd <= 1440
    newEnd = Math.max(startMinRef.current + 15, Math.min(newEnd, 1440)); // Keep at least 15m gap
    
    if (newEnd !== endMinRef.current) {
      onChangeRef.current(startTime, minutesToTime(newEnd));
    }
  };

  // Refs to track initial gesture values
  const gestureState = useRef({ start: 0, end: 0 });

  const leftResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { gestureState.current.start = startMinRef.current; },
      onPanResponderMove: (evt: any, gs: any) => handleStartDrag(gs.dx, gestureState.current.start),
    })
  ).current;

  const rightResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { gestureState.current.end = endMinRef.current; },
      onPanResponderMove: (evt: any, gs: any) => handleEndDrag(gs.dx, gestureState.current.end),
    })
  ).current;

  // Calculate percentage positions based on 1440 minutes (24 hours)
  const leftPos = (startMin / 1440) * 100;
  const rightPos = (endMin / 1440) * 100;

  return (
    <View style={styles.sliderContainer} onLayout={(e: any) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.sliderTrackBg} />
      <View 
        style={[
          styles.sliderActiveFill, 
          { left: `${leftPos}%`, width: `${rightPos - leftPos}%` }
        ]} 
      />
      
      {/* Left Thumb */}
      <View 
        style={[styles.thumbTouchArea, { left: `${leftPos}%` }]} 
        {...leftResponder.panHandlers}
      >
        <View style={styles.realThumb} />
      </View>

      {/* Right Thumb */}
      <View 
        style={[styles.thumbTouchArea, { left: `${rightPos}%` }]} // Removed negative margin logic adjustment here, handled by style
        {...rightResponder.panHandlers}
      >
        <View style={styles.realThumb} />
      </View>
    </View>
  );
};

// Simple Time Picker Modal Component
const TimePickerModal = ({ 
  visible, 
  onClose, 
  onSelect, 
  title 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSelect: (time: string) => void;
  title: string;
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const [selectedHour, setSelectedHour] = useState('09');
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.pickerContainer}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Hour</Text>
              <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
                {hours.map(h => (
                  <TouchableOpacity 
                    key={h} 
                    onPress={() => setSelectedHour(h)}
                    style={[styles.timeItem, selectedHour === h && styles.selectedTimeItem]}
                  >
                    <Text style={[styles.timeText, selectedHour === h && styles.selectedTimeText]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.divider} />
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Minute</Text>
              <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
                {minutes.map(m => (
                  <TouchableOpacity 
                    key={m} 
                    onPress={() => {
                      onSelect(`${selectedHour}:${m}`);
                      onClose();
                    }}
                    style={styles.timeItem}
                  >
                    <Text style={styles.timeText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function OnboardingStep3() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  
  // State
  const [wakeTime, setWakeTime] = useState('07:00');
  const [bedTime, setBedTime] = useState('23:00');
  const [activeSleepCard, setActiveSleepCard] = useState<'wake' | 'bed'>('wake'); // Track active focus
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [freeBlocks, setFreeBlocks] = useState<string[]>([]);

  // Picker State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'wake' | 'bed' | 'workStart' | 'workEnd' | null>(null);

  const openPicker = (target: 'wake' | 'bed' | 'workStart' | 'workEnd') => {
    setPickerTarget(target);
    setPickerVisible(true);
    if (target === 'wake' || target === 'bed') setActiveSleepCard(target);
  };

  const handleTimeSelect = (time: string) => {
    if (pickerTarget === 'wake') setWakeTime(time);
    if (pickerTarget === 'bed') setBedTime(time);
    if (pickerTarget === 'workStart') setWorkStart(time);
    if (pickerTarget === 'workEnd') setWorkEnd(time);
  };

  const freeTimeOptions = [
    { id: 'morning', label: t('onboarding.step3.morning'), icon: 'wb-twilight' },
    { id: 'afternoon', label: t('onboarding.step3.afternoon'), icon: 'wb-sunny' },
    { id: 'evening', label: t('onboarding.step3.evening'), icon: 'nights-stay' },
  ];

  const toggleFreeBlock = (blockId: string) => {
    setFreeBlocks((prev: string[]) => 
      prev.includes(blockId) 
        ? prev.filter((b: string) => b !== blockId)
        : [...prev, blockId]
    );
  };

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/step4',
      params: { 
        ...params,
        wakeTime,
        bedTime,
        workStart,
        workEnd,
        freeBlocks: freeBlocks.join(',')
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
                  {t('onboarding.step3.progress')}
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
                {t('onboarding.step3.headlineStart')} <Text style={styles.headlineAccent}>{t('onboarding.step3.headlineAccent')}</Text>
              </Text>
            </View>

            {/* Sleep Schedule */}
            <View style={styles.sectionPadding}>
                <Text style={styles.sectionTitle}>{t('onboarding.step3.sleepTitle')}</Text>
                <View style={styles.row}>
                    <TouchableOpacity 
                        style={[
                          styles.timeCard,
                          activeSleepCard === 'wake' ? styles.timeCardActive : styles.timeCardInactive
                        ]} 
                        onPress={() => openPicker('wake')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <MaterialIcons 
                              name="wb-sunny" 
                              size={24} 
                              color={activeSleepCard === 'wake' ? Colors.primary : 'rgba(255,255,255,0.4)'} 
                            />
                        </View>
                        <Text style={[
                          styles.cardLabel,
                          activeSleepCard === 'wake' && { color: Colors.primary }
                        ]}>{t('onboarding.step3.wakeUp')}</Text>
                        <Text style={styles.timeValue}>{wakeTime}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                          styles.timeCard,
                          activeSleepCard === 'bed' ? styles.timeCardActive : styles.timeCardInactive
                        ]} 
                        onPress={() => openPicker('bed')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <MaterialIcons 
                              name="bedtime" 
                              size={24} 
                              color={activeSleepCard === 'bed' ? Colors.primary : 'rgba(255,255,255,0.4)'}
                            />
                        </View>
                        <Text style={[
                          styles.cardLabel,
                          activeSleepCard === 'bed' && { color: Colors.primary }
                        ]}>{t('onboarding.step3.bedtime')}</Text>
                        <Text style={styles.timeValue}>{bedTime}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Work Hours */}
            <View style={styles.sectionPadding}>
                <Text style={styles.sectionTitle}>{t('onboarding.step3.workTitle')}</Text>
                <View style={styles.workCard}>
                    <View style={styles.workRow}>
                        <View>
                            <Text style={styles.workLabel}>{t('onboarding.step3.workStart')}</Text>
                            <TouchableOpacity onPress={() => openPicker('workStart')}>
                                <Text style={styles.workTime}>{workStart}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.connector} />
                        <View>
                            <Text style={[styles.workLabel, { textAlign: 'right' }]}>{t('onboarding.step3.workEnd')}</Text>
                            <TouchableOpacity onPress={() => openPicker('workEnd')}>
                                <Text style={[styles.workTime, { textAlign: 'right' }]}>{workEnd}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Interactive Dual Slider */}
                    <DualRangeSlider 
                        startTime={workStart} 
                        endTime={workEnd} 
                        onChange={(s, e) => {
                            setWorkStart(s);
                            setWorkEnd(e);
                        }} 
                    />
                </View>
            </View>

            {/* Free Time Blocks */}
            <View style={styles.sectionPadding}>
                <Text style={styles.sectionTitle}>{t('onboarding.step3.freeTimeTitle')}</Text>
                <View style={styles.chipContainer}>
                    {freeTimeOptions.map((option) => {
                        const isSelected = freeBlocks.includes(option.id);
                        return (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => toggleFreeBlock(option.id)}
                                style={[
                                    styles.blockChip,
                                    isSelected ? styles.chipSelected : styles.chipUnselected
                                ]}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons 
                                    name={option.icon as any} 
                                    size={20} 
                                    color={isSelected ? Colors.backgroundDark : '#ffffff'} 
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={[
                                    styles.chipText,
                                    isSelected ? styles.chipTextSelected : styles.chipTextUnselected
                                ]}>
                                    {option.label}
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
                    {t('onboarding.step3.next')}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={24} color={Colors.backgroundDark} />
                </TouchableOpacity>
            </View>

          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      <TimePickerModal 
        visible={pickerVisible} 
        onClose={() => setPickerVisible(false)} 
        onSelect={handleTimeSelect}
        title="Select Time"
      />
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
    paddingBottom: 40,
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
    width: '60%', // Step 3 of 5
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
  row: {
      flexDirection: 'row',
      gap: 12,
  },
  timeCard: {
      flex: 1,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      alignItems: 'center',
  },
  timeCardActive: {
      borderColor: Colors.primary,
      backgroundColor: 'rgba(13, 242, 89, 0.1)',
  },
  timeCardInactive: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
  },
  cardLabel: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
  },
  timeValue: {
      color: '#fff',
      fontSize: 24,
      fontWeight: 'bold',
  },
  workCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
  },
  connector: {
      flex: 1,
      height: 2,
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginHorizontal: 16,
  },
  workLabel: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
  },
  workTime: {
      color: '#fff',
      fontSize: 24,
      fontWeight: 'bold',
  },
  sliderContainer: {
      height: 48, // Taller touch area
      justifyContent: 'center',
      marginHorizontal: 12, // Make room for thumbs at edges
  },
  sliderTrackBg: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 3,
      position: 'absolute',
      width: '100%',
  },
  sliderActiveFill: {
      height: 6,
      backgroundColor: Colors.primary,
      borderRadius: 3,
      position: 'absolute',
  },
  thumbTouchArea: {
      position: 'absolute',
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -30, // Center on position
      zIndex: 10,
  },
  realThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4,
  },
  chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'flex-start',
  },
  blockChip: {
      flexDirection: 'row',
      height: 48, // Reduced height
      alignItems: 'center',
      paddingHorizontal: 16, // Reduced padding
      borderRadius: 24,
      borderWidth: 1,
      flexGrow: 1, // Allow growing to fill space but sharing row
      justifyContent: 'center',
  },
  chipSelected: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
  },
  chipUnselected: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
      fontSize: 14,
      fontWeight: '600',
  },
  chipTextSelected: {
      color: Colors.backgroundDark,
  },
  chipTextUnselected: {
      color: '#fff',
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
  // Modal Styles
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  modalContent: {
      width: 320,
      backgroundColor: '#1c1c1e',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
  },
  modalTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 24,
  },
  pickerContainer: {
      flexDirection: 'row',
      height: 300, // Increased from 200 to allow easier scrolling
      width: '100%',
      marginBottom: 24,
  },
  column: {
      flex: 1,
      alignItems: 'center',
  },
  scrollColumn: {
      width: '100%',
  },
  columnLabel: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 12,
      textTransform: 'uppercase',
      marginBottom: 8,
  },
  timeItem: {
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
  },
  selectedTimeItem: {
      backgroundColor: 'rgba(13, 242, 89, 0.1)',
      borderRadius: 8,
      width: '80%',
  },
  timeText: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 20,
  },
  selectedTimeText: {
      color: Colors.primary,
      fontWeight: 'bold',
      fontSize: 24,
  },
  divider: {
      width: 1,
      height: '100%',
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginHorizontal: 8,
  },
  closeButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
  },
  closeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
});
