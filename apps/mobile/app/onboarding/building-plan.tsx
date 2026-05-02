import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import api from '../../src/services/api.client';
import { getStoredItem, setStoredItem } from '../../src/services/storage';

export default function BuildingPlanScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const steps = [
    "Analizando tu perfil...",
    "Calculando macros perfectos...",
    "Diseñando entrenos adaptados...",
    "Orquestando tus hábitos...",
    "Finalizando tu Life-Style..."
  ];

  useEffect(() => {
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        stepIndex = Math.min(stepIndex + 1, steps.length - 1);
        setCurrentStep(stepIndex);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 2500);

    const generateAndPoll = async () => {
      try {
        let deviceId = await getStoredItem('deviceId');
        if (!deviceId) {
          deviceId = uuidv4();
          await setStoredItem('deviceId', deviceId);
        }

        const generateRes = await api.post('/planning/lifestyle/generate', {}, {
          headers: {
            'X-Device-Id': deviceId as string,
          }
        });

        const { jobId } = generateRes.data;

        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await api.get(`/planning/lifestyle/status?jobId=${jobId}`);
            const { status } = statusRes.data;
            if (status === 'READY') {
              clearInterval(pollInterval);
              clearInterval(stepInterval);
              router.replace('/(tabs)' as any);
            } else if (status === 'FAILED') {
              clearInterval(pollInterval);
              clearInterval(stepInterval);
              alert('Falló la generación del plan.');
            }
          } catch (e: any) {
            console.error('Polling error', e);
            if (e.response?.status === 401) {
              clearInterval(pollInterval);
              clearInterval(stepInterval);
              router.replace('/login' as any);
            }
          }
        }, 2000);
      } catch (err: any) {
        clearInterval(stepInterval);
        console.error('Generate error', err);
        if (err.response?.status === 401) {
          router.replace('/login' as any);
        } else if (err.response?.status === 429) {
          alert('Has superado el límite diario de generación. Inténtalo de nuevo mañana.');
          router.replace('/(tabs)' as any);
        } else {
          const errMsg = err.response?.data?.message || 'Error desconocido';
          alert('Error: ' + JSON.stringify(errMsg));
          router.replace('/(tabs)' as any);
        }
      }
    };

    generateAndPoll();

    return () => clearInterval(stepInterval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
            colors={['rgba(13, 242, 89, 0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
        />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
            <View style={styles.loadingIconContainer}>
                <View style={[styles.glow, { opacity: 0.3 }]} />
                <Ionicons name="cog-outline" size={80} color="#0df259" style={styles.spinningIcon} />
            </View>
            <Text style={styles.mainTitle}>Construyendo tu plan ultra-personalizado</Text>
            <Animated.Text style={[styles.subTitle, { opacity: fadeAnim }]}>
                {steps[currentStep]}
            </Animated.Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#15241a' },
  safeArea: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingIconContainer: { marginBottom: 32, alignItems: 'center', justifyContent: 'center', width: 120, height: 120 },
  spinningIcon: {},
  glow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#0df259', shadowColor: '#0df259', shadowOpacity: 1, shadowRadius: 30 },
  mainTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16, letterSpacing: -0.5 },
  subTitle: { fontSize: 16, color: '#0df259', textAlign: 'center', fontWeight: '600', opacity: 0.9 },
});
