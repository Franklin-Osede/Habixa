import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Colors';
import apiClient from '../../src/services/api.client';

/** Build profile payload from onboarding params for PUT /identity/profile */
function buildProfilePayload(params: Record<string, string | undefined>) {
  const age = params.age ? Number(params.age) : undefined;
  const weight = params.weight ? Number(params.weight) : undefined;
  const height = params.height ? Number(params.height) : undefined;
  const goals = params.selectedTag ? [params.selectedTag] : [];
  return {
    age,
    weight,
    height,
    goals,
    measurementSystem: (params.unitSystem as 'metric' | 'imperial') || 'metric',
    dietaryPreference: params.dietType,
  };
}

export default function OnboardingStep6() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState(false);

  // Flujo: step5 -> step6 (aquí) -> step-contract (resumen) -> mapa. Sin redirect.

  const finishOnboarding = useCallback(async () => {
    const payload = buildProfilePayload(params as unknown as Record<string, string | undefined>);
    try {
      await apiClient.put('/identity/profile', payload);
    } catch {
      // Ignore errors for now
    }
    router.replace({
      pathname: '/onboarding/step-contract',
      params: { ...params }
    });
  }, [params, router]);

  const handleSync = () => {
    setIsSyncing(true);
    // Simular petición de salud; luego guardar perfil y salir
    setTimeout(() => {
      setIsSyncing(false);
      finishOnboarding();
    }, 1500);
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const FeatureRow = ({ icon, label, sub }: { icon: string, label: string, sub: string }) => (
      <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
              <MaterialIcons name={icon as any} size={24} color={Colors.primary} />
          </View>
          <View style={styles.featureText}>
              <Text style={styles.featureLabel}>{label}</Text>
              <Text style={styles.featureSub}>{sub}</Text>
          </View>
      </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        
        {/* TopAppBar */}
        <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back-ios" size={20} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{t('onboarding.step6.progress')}</Text>
                <View style={styles.progressBarBg}>
                    <View style={styles.progressBarFill} />
                </View>
            </View>

            <View style={styles.spacer} />
        </View>

        <View style={styles.content}>
            <View style={styles.iconContainer}>
                <Ionicons name="heart-circle" size={120} color={Colors.primary} />
                <View style={styles.connectedIcon}>
                     <MaterialIcons name="sync" size={32} color={Colors.backgroundDark} />
                </View>
            </View>

            <Text style={styles.headline}>
                {t('onboarding.step6.headlineStart')} <Text style={styles.headlineAccent}>{t('onboarding.step6.headlineAccent')}</Text>
            </Text>
            
            <Text style={styles.description}>
                {t('onboarding.step6.description')}
            </Text>

            <View style={styles.features}>
                <FeatureRow 
                    icon="directions-walk" 
                    label={t('onboarding.step6.features.steps.title')} 
                    sub={t('onboarding.step6.features.steps.sub')}
                />
                <FeatureRow 
                    icon="nights-stay" 
                    label={t('onboarding.step6.features.sleep.title')} 
                    sub={t('onboarding.step6.features.sleep.sub')}
                />
                 <FeatureRow 
                    icon="local-fire-department" 
                    label={t('onboarding.step6.features.calories.title')} 
                    sub={t('onboarding.step6.features.calories.sub')}
                />
            </View>

        </View>

        <View style={styles.bottomContainer}>
             <TouchableOpacity 
                onPress={handleSync}
                style={styles.syncButton}
                activeOpacity={0.9}
                disabled={isSyncing}
            >
                {isSyncing ? (
                    <>
                        <ActivityIndicator color={Colors.backgroundDark} />
                        <Text style={styles.syncButtonText}>{t('onboarding.step6.syncing')}</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.syncButtonText}>{t('onboarding.step6.syncButton')}</Text>
                        <MaterialIcons name="check-circle" size={24} color={Colors.backgroundDark} />
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>{t('onboarding.step6.skip')}</Text>
            </TouchableOpacity>
        </View>

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
  // TopBar
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
    width: '100%', // 6/6
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
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
     position: 'relative',
     marginBottom: 32,
  },
  connectedIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: Colors.primary,
      borderRadius: 20,
      padding: 4,
  },
  headline: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  headlineAccent: {
    color: Colors.primary,
    fontStyle: 'italic',
  },
  description: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
  },
  features: {
      width: '100%',
      gap: 16,
  },
  featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      padding: 16,
      borderRadius: 16,
  },
  featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(13, 242, 89, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
  featureText: {
      flex: 1,
  },
  featureLabel: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  featureSub: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 12,
  },
  bottomContainer: {
    padding: 32,
    paddingBottom: 16,
    width: '100%',
  },
  syncButton: {
    width: '100%',
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 12,
    marginBottom: 16,
  },
  syncButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.backgroundDark,
  },
  skipButton: {
      alignItems: 'center',
      padding: 12,
  },
  skipText: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 16,
      fontWeight: '600',
  },
});
