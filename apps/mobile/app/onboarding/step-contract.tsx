import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

export default function StepContract() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  
  // Animation for the "Analysis" effect
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Simulate analysis delay
    const timer = setTimeout(() => {
      setAnalysisComplete(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }, 1500);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim]);

  const rawTag = params.selectedTag;
  const selectedTagStr = Array.isArray(rawTag) ? rawTag[0] : rawTag;
  const displayTag = selectedTagStr ? selectedTagStr.toUpperCase() : 'GENERAL FITNESS';

  // Calculate BMI and select projection
  const weight = params.weight ? Number(params.weight) : undefined;
  const height = params.height ? Number(params.height) : undefined;
  
  const calculateBMI = (w?: number, h?: number) => {
      if (!w || !h) return null;
      // Assume metric (kg/cm) for simplicity or convert if passed unit system
      // If height is in cm, convert to m
      const hM = h > 3 ? h / 100 : h; 
      return (w / (hM * hM)).toFixed(1);
  };

  const bmi = calculateBMI(weight, height);

  const getProjectionText = () => {
      const tag = displayTag; // e.g. "LOSE WEIGHT", "BUILD MUSCLE"
      
      if (tag.includes('MUSCLE')) {
          return t('onboarding.contract.projection.muscle', { bmi: bmi || '24.5', defaultValue: '...' });
      }
      if (tag.includes('WEIGHT') || tag.includes('FAT')) {
           return t('onboarding.contract.projection.weight');
      }
      if (tag.includes('ENERGY')) {
          return t('onboarding.contract.projection.energy');
      }
      if (tag.includes('MIND') || tag.includes('STRESS')) {
          return t('onboarding.contract.projection.mindfulness');
      }
      return t('onboarding.contract.projection.default');
  };

  // Helper to parse styled text from translation (simple replacement for <bold>/<highlight>)
  const StyledText = ({ text }: { text: string }) => {
      // Split by tags and render Text components
      // This is a naive implementation. For robust HTML-like parsing in RN, consider a library or recursive split.
      // Here we will just handle <bold> and <highlight> simple cases.
      
      // Regex to split by <tag>content</tag>
      const parts = text.split(/(<(?:bold|highlight)>.*?<\/(?:bold|highlight)>)/g);

      return (
          <Text style={styles.projectionText}>
              {parts.map((part, index) => {
                  if (part.startsWith('<bold>')) {
                      return <Text key={index} style={{fontWeight:'bold', color: '#fff'}}>{part.replace(/<\/?bold>/g, '')}</Text>;
                  }
                  if (part.startsWith('<highlight>')) {
                      return <Text key={index} style={{fontWeight:'bold', color: Colors.primary}}>{part.replace(/<\/?highlight>/g, '')}</Text>;
                  }
                  return <Text key={index}>{part}</Text>;
              })}
          </Text>
      );
  };

  const handleContinue = () => {
    router.push({
      pathname: '/challenge/selection',
      params: { 
        recommendedDuration: 30,
        trackId: displayTag.includes('MUSCLE') ? 'MUSCLE_GAIN' : 'WEIGHT_LOSS'
      }
    });
  };

  const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <View style={styles.glassCard} className={className}>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Mesh Gradient Simulation */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
            colors={['rgba(13, 242, 89, 0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
        />
        <LinearGradient
            colors={['rgba(13, 242, 89, 0.05)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
        />
        <LinearGradient
            colors={['rgba(13, 242, 89, 0.1)', 'transparent']}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                 <MaterialIcons name="arrow-back-ios" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('onboarding.contract.screenTitle', 'STRATEGY REPORT')}</Text>
            <View style={{ width: 40 }} />
        </View>

        {!analysisComplete ? (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingIconContainer}>
                    <View style={[styles.glow, { opacity: 0.3 }]} />
                    <Ionicons name="scan-outline" size={60} color={Colors.primary} />
                </View>
                <Text style={styles.loadingText}>{t('onboarding.contract.analyzing', 'Analyzing your profile...')}</Text>
                <Text style={styles.loadingSubText}>{t('onboarding.contract.pleaseWait', 'Building your personalized plan')}</Text>
            </View>
        ) : (
            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        
                        {/* Title Section */}
                        <View style={styles.titleSection}>
                            <View style={styles.verifiedIconContainer}>
                                <View style={[styles.glow, { opacity: 0.2 }]} />
                                <View style={styles.verifiedBadge}>
                                    <MaterialIcons name="verified" size={40} color={Colors.primary} />
                                </View>
                            </View>
                            <Text style={styles.mainTitle}>
                                {t('onboarding.contract.mainTitle', 'Your Strategy\nis Ready')}
                            </Text>
                            <Text style={styles.subTitle}>
                                {t('onboarding.contract.subTitle', "We've engineered a path optimized for your unique metabolic profile.")}
                            </Text>
                        </View>

                        {/* Grid Stats */}
                        <View style={styles.gridContainer}>
                            {/* BMI Analysis */}
                            <GlassCard>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>{t('onboarding.contract.bmiTitle', 'BMI ANALYSIS')}</Text>
                                    <MaterialIcons name="analytics" size={20} color={Colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.startValue}>24.5</Text>
                                    <Text style={styles.statSub}>{t('onboarding.contract.bmiStatus', 'Healthy Index')}</Text>
                                </View>
                            </GlassCard>

                            {/* Physical Age */}
                            <GlassCard>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>{t('onboarding.contract.ageTitle', 'PHYSICAL AGE')}</Text>
                                    <MaterialIcons name="calendar-today" size={20} color={Colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.startValue}>
                                        24 <Text style={{ fontSize: 14, fontWeight: '400', color: '#64748b' }}>{t('onboarding.contract.ageVs', 'vs')} 28</Text>
                                    </Text>
                                    <Text style={styles.statSub}>{t('onboarding.contract.ageEff', 'Age Efficiency')}</Text>
                                </View>
                            </GlassCard>

                            {/* Target Goal */}
                            <GlassCard>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>{t('onboarding.contract.targetTitle', 'TARGET GOAL')}</Text>
                                    <MaterialIcons name="trending-up" size={20} color={Colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.startValue, { fontSize: 18, lineHeight: 22 }]}>
                                        {t(`onboarding.tags.${displayTag}`, displayTag)}
                                    </Text>
                                    <Text style={[styles.statSub, { color: '#64748b' }]}>{t('onboarding.contract.targetMode', 'Strength Mode')}</Text>
                                </View>
                            </GlassCard>

                            {/* Initial Focus */}
                            <GlassCard>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>{t('onboarding.contract.focusTitle', 'INITIAL FOCUS')}</Text>
                                    <MaterialIcons name="bolt" size={20} color={Colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.startValue, { fontSize: 15, lineHeight: 20 }]}>
                                        {t('onboarding.contract.metabolism', 'Metabolism Reset')}
                                    </Text>
                                    <Text style={[styles.statSub, { color: '#64748b' }]}>{t('onboarding.contract.focusSubtitle', 'First 14 Days')}</Text>
                                </View>
                            </GlassCard>
                        </View>

                        {/* AI Projection */}
                        <View style={styles.aiProjectionContainer}>
                           <GlassCard>
                                <LinearGradient
                                    colors={['rgba(13, 242, 89, 0.05)', 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 1}}
                                />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <MaterialIcons name="stars" size={20} color={Colors.primary} />
                                    <Text style={styles.aiLabel}>{t('onboarding.contract.projectionTitle', 'AI PROJECTION')}</Text>
                                </View>
                                
                                    <StyledText text={getProjectionText()} />

                                <View style={styles.matchSection}>
                                    <View style={styles.avatars}>
                                        <View style={[styles.avatarRing, { zIndex: 3 }]}>
                                             <View style={styles.avatarPlaceholder} />
                                        </View>
                                        <View style={[styles.avatarRing, { zIndex: 2, marginLeft: -10 }]}>
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: '#334155'}]} />
                                        </View>
                                        <View style={[styles.avatarRing, { zIndex: 1, marginLeft: -10 }]}>
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: '#1e293b', justifyContent:'center', alignItems: 'center'}]}>
                                                <Text style={{color:'#fff', fontSize:8, fontWeight:'bold'}}>+12k</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.matchPercent}>89% {t('onboarding.contract.match', 'Match')}</Text>
                                        <Text style={styles.matchLabel}>{t('onboarding.contract.historical', 'Historical data analysis')}</Text>
                                    </View>
                                </View>
                           </GlassCard>
                        </View>

                    </Animated.View>
                </ScrollView>

                {/* Bottom Action */}
                <View style={styles.bottomContainer}>
                    <LinearGradient
                        colors={['rgba(21, 36, 26, 0.0)', 'rgba(21, 36, 26, 0.95)', '#15241a']}
                        style={StyleSheet.absoluteFill}
                    />
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.9}>
                        <View style={[styles.glow, { opacity: 0.4 }]} />
                        <Text style={styles.continueButtonText}>{t('onboarding.contract.continueBtn', 'CONTINUE TO CHOOSE YOUR PLAN')}</Text>
                        <MaterialIcons name="arrow-forward-ios" size={16} color={Colors.backgroundDark} style={{ fontWeight: 'bold' }} />
                    </TouchableOpacity>
                    <View style={styles.indicator} />
                </View>
            </View>
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15241a', // forest color
  },
  safeArea: {
    flex: 1,
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
  },
  backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
      color: 'rgba(13, 242, 89, 0.6)',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2,
      textTransform: 'uppercase',
  },
  loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
  },
  loadingIconContainer: {
      marginBottom: 24,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      width: 100,
      height: 100,
  },
  glow: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: Colors.primary,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 25,
  },
  loadingText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
  },
  loadingSubText: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 14,
  },
  content: {
      paddingHorizontal: 24,
      paddingBottom: 140, 
  },
  titleSection: {
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 40,
  },
  verifiedIconContainer: {
      position: 'relative',
      marginBottom: 24,
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
  },
  verifiedBadge: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.03)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(13, 242, 89, 0.3)',
  },
  mainTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: '#fff',
      textAlign: 'center',
      letterSpacing: -0.5,
      lineHeight: 40,
  },
  subTitle: {
      fontSize: 15,
      color: '#94a3b8',
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 24,
      fontWeight: '500',
      maxWidth: 300,
  },
  gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 32,
  },
  glassCard: {
      width: '48%', // Approx 2 columns
      minHeight: 120,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(13, 242, 89, 0.2)', // neon-border
      justifyContent: 'space-between',
      flexGrow: 1,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
  },
  cardLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: 'rgba(148, 163, 184, 0.8)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      maxWidth: '70%',
  },
  startValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      letterSpacing: -0.5,
  },
  statSub: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(13, 242, 89, 0.8)',
      marginTop: 2,
  },
  aiProjectionContainer: {
      marginTop: 16,
      marginBottom: 24,
  },
  aiLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: Colors.primary,
      letterSpacing: 2,
  },
  projectionText: {
      fontSize: 15,
      lineHeight: 24,
      color: '#e2e8f0',
      fontWeight: '300',
      marginBottom: 20,
  },
  matchSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.05)',
      paddingTop: 20,
  },
  avatars: {
      flexDirection: 'row',
  },
  avatarRing: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#15241a',
      overflow: 'hidden',
  },
  avatarPlaceholder: {
      flex: 1,
      backgroundColor: '#475569',
  },
  matchPercent: {
      fontSize: 11,
      fontWeight: 'bold',
      color: Colors.primary,
      textAlign: 'right',
  },
  matchLabel: {
      fontSize: 10,
      color: '#64748b',
      fontStyle: 'italic',
      textAlign: 'right',
  },
  bottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 32,
      paddingBottom: 40,
      paddingTop: 64,
      zIndex: 20,
  },
  continueButton: {
      backgroundColor: Colors.primary,
      height: 64,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
  },
  continueButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#15241a',
      letterSpacing: -0.5,
      fontFamily: 'System', // Fallback
      textTransform: 'uppercase',
  },
  indicator: {
      width: 120,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 24,
  },
});

